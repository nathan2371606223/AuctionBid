const express = require("express");
const { pool } = require("../db/connection");
const { authMiddleware } = require("../middleware/auth");
const { stringify } = require("csv-stringify/sync");

const router = express.Router();

// Export players with full bid history (auth required)
router.get("/csv", authMiddleware, async (req, res) => {
  try {
    // Get all players - sorted by CA descending
    const { rows: players } = await pool.query("SELECT * FROM ab_players ORDER BY ca DESC");

    // Get all bid history
    const { rows: allBids } = await pool.query(
      "SELECT * FROM ab_bid_history ORDER BY player_id, created_at ASC"
    );

    // Group bids by player_id
    const bidsByPlayer = {};
    allBids.forEach((bid) => {
      if (!bidsByPlayer[bid.player_id]) {
        bidsByPlayer[bid.player_id] = [];
      }
      bidsByPlayer[bid.player_id].push(bid);
    });

    // Build CSV data - one row per player with all their bid history
    const csvData = [];
    players.forEach((player) => {
      const bids = bidsByPlayer[player.id] || [];
      
      if (bids.length === 0) {
        // Player with no bids
        csvData.push({
          球员: player.player,
          转出球队: player.team_out,
          年龄: player.age,
          CA: player.ca,
          PA: player.pa,
          位置: player.position,
          次要位置: player.secondary_position || "",
          身高: player.height || "",
          体重: player.weight || "",
          最低价格: player.min_price,
          最高价格: player.max_price,
          当前出价: player.current_bid_price || "",
          当前出价球队: player.current_bid_team || "",
          买断: player.buyout ? "是" : "否",
          出价历史: "无"
        });
      } else {
        // Player with bids - first row with player info and first bid
        csvData.push({
          球员: player.player,
          转出球队: player.team_out,
          年龄: player.age,
          CA: player.ca,
          PA: player.pa,
          位置: player.position,
          次要位置: player.secondary_position || "",
          身高: player.height || "",
          体重: player.weight || "",
          最低价格: player.min_price,
          最高价格: player.max_price,
          当前出价: player.current_bid_price || "",
          当前出价球队: player.current_bid_team || "",
          买断: player.buyout ? "是" : "否",
          出价历史: `${bids[0].bid_team}: ${bids[0].bid_price} (${new Date(bids[0].created_at).toLocaleString("zh-CN")})`
        });

        // Additional rows for remaining bids
        for (let i = 1; i < bids.length; i++) {
          csvData.push({
            球员: "",
            转出球队: "",
            年龄: "",
            CA: "",
            PA: "",
            位置: "",
            次要位置: "",
            身高: "",
            体重: "",
            最低价格: "",
            最高价格: "",
            当前出价: "",
            当前出价球队: "",
            买断: "",
            出价历史: `${bids[i].bid_team}: ${bids[i].bid_price} (${new Date(bids[i].created_at).toLocaleString("zh-CN")})`
          });
        }
      }
    });

    const csv = stringify(csvData, {
      header: true,
      bom: true
    });

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="auction_players_${new Date().toISOString().split("T")[0]}.csv"`);
    return res.send(csv);
  } catch (err) {
    console.error("Error exporting CSV:", err);
    return res.status(500).json({ message: "导出失败" });
  }
});

module.exports = router;
