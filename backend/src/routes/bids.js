const express = require("express");
const { pool } = require("../db/connection");
const { authMiddleware } = require("../middleware/auth");
const { requireTeamToken } = require("../middleware/teamToken");
const { createTokenAlert } = require("../utils/tokenAlerts");

const router = express.Router();

// Get latest bid for all players (requires token)
router.get("/latest", requireTeamToken, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT p.*, 
              p.current_bid_price as latest_bid_price,
              p.current_bid_team as latest_bid_team
       FROM ab_players p
       ORDER BY p.created_at DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error("Error fetching latest bids:", err);
    return res.status(500).json({ message: "获取最新出价失败" });
  }
});

// Get bid history for a specific player (auth required)
router.get("/history/:playerId", authMiddleware, async (req, res) => {
  const playerId = Number(req.params.playerId);
  const { page = 1, pageSize = 20 } = req.query;
  const pageNum = Number(page);
  const sizeNum = Number(pageSize);
  const offset = (pageNum - 1) * sizeNum;

  try {
    // Get total count
    const { rows: countRows } = await pool.query(
      "SELECT COUNT(*)::int as total FROM ab_bid_history WHERE player_id=$1",
      [playerId]
    );
    const total = countRows[0]?.total || 0;

    // Get paginated history
    const { rows } = await pool.query(
      `SELECT * FROM ab_bid_history 
       WHERE player_id=$1 
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [playerId, sizeNum, offset]
    );

    return res.json({
      data: rows,
      total,
      page: pageNum,
      pageSize: sizeNum
    });
  } catch (err) {
    console.error("Error fetching bid history:", err);
    return res.status(500).json({ message: "获取出价历史失败" });
  }
});

// Submit bid (requires token)
router.post("/:playerId", requireTeamToken, async (req, res) => {
  const playerId = Number(req.params.playerId);
  const { bid_team, bid_price } = req.body || {};

  if (!bid_team || bid_price === undefined) {
    return res.status(400).json({ message: "请提供球队和出价" });
  }

  if (!Number.isInteger(bid_price) || bid_price < 0) {
    return res.status(400).json({ message: "出价必须为非负整数" });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Lock the player row for update to handle concurrency
    const { rows: playerRows } = await client.query(
      "SELECT * FROM ab_players WHERE id=$1 FOR UPDATE",
      [playerId]
    );

    if (playerRows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json({ message: "球员不存在" });
    }

    const player = playerRows[0];

    // Check if buyout is locked
    if (player.buyout) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: "该球员已达到买断价格，出价已锁定" });
    }

    // Validate bid price
    if (bid_price < player.min_price) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: `出价不能低于最低价格 ${player.min_price}` });
    }

    if (bid_price > player.max_price) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: `出价不能超过最高价格 ${player.max_price}` });
    }

    if (player.current_bid_price !== null && bid_price < player.current_bid_price) {
      await client.query("ROLLBACK");
      return res.status(400).json({ message: `出价不能低于当前最高出价 ${player.current_bid_price}` });
    }

    // Update player's current bid
    const isBuyout = bid_price >= player.max_price;
    await client.query(
      `UPDATE ab_players 
       SET current_bid_price=$1, current_bid_team=$2, buyout=$3, updated_at=NOW()
       WHERE id=$4`,
      [bid_price, bid_team, isBuyout, playerId]
    );

    // Insert into bid history
    await client.query(
      "INSERT INTO ab_bid_history (player_id, bid_team, bid_price) VALUES ($1, $2, $3)",
      [playerId, bid_team, bid_price]
    );

    await client.query("COMMIT");

    // Fetch updated player data
    const { rows: updatedPlayer } = await client.query("SELECT * FROM ab_players WHERE id=$1", [playerId]);

    // Create alert if token team not present in payload
    try {
      const tokenTeamName = req.tokenTeam?.name || "";
      const involvedTeams = [
        bid_team,
        updatedPlayer[0]?.team_out
      ].filter(Boolean);
      const matched = involvedTeams.some((t) => t === tokenTeamName);
      if (!matched) {
        await createTokenAlert(
          pool,
          req.tokenTeam,
          "auctionbid",
          { player_id: playerId, bid_team, bid_price },
          "提交中未匹配到与令牌对应的球队"
        );
      }
    } catch (err) {
      console.error("Alert creation failed:", err);
    }

    return res.json({
      success: true,
      message: isBuyout ? "出价成功！已达到买断价格" : "出价成功",
      player: updatedPlayer[0]
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error submitting bid:", err);
    return res.status(500).json({ message: "出价失败" });
  } finally {
    client.release();
  }
});

module.exports = router;
