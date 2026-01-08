const express = require("express");
const { pool } = require("../db/connection");
const { authMiddleware } = require("../middleware/auth");

const router = express.Router();

// Get all players with pagination (public)
router.get("/", async (req, res) => {
  const { page = 1, pageSize = 50 } = req.query;
  const pageNum = Number(page);
  const sizeNum = Number(pageSize);
  const offset = (pageNum - 1) * sizeNum;

  try {
    // Get total count
    const { rows: countRows } = await pool.query("SELECT COUNT(*)::int as total FROM ab_players");
    const total = countRows[0]?.total || 0;

    // Get paginated data
    const { rows } = await pool.query(
      `SELECT * FROM ab_players ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
      [sizeNum, offset]
    );

    return res.json({
      data: rows,
      total,
      page: pageNum,
      pageSize: sizeNum
    });
  } catch (err) {
    console.error("Error fetching players:", err);
    return res.status(500).json({ message: "获取球员列表失败" });
  }
});

// Create single player (auth required)
router.post("/", authMiddleware, async (req, res) => {
  const { player, team_out, age, ca, pa, position, secondary_position, height, weight, min_price, max_price } = req.body || {};

  if (!player || !team_out || age === undefined || ca === undefined || pa === undefined || !position || min_price === undefined || max_price === undefined) {
    return res.status(400).json({ message: "缺少必填字段" });
  }

  if (!Number.isInteger(age) || !Number.isInteger(ca) || !Number.isInteger(pa) || !Number.isInteger(min_price) || !Number.isInteger(max_price)) {
    return res.status(400).json({ message: "年龄、CA、PA、价格必须为整数" });
  }

  if (min_price < 0 || max_price < 0 || min_price > max_price) {
    return res.status(400).json({ message: "价格无效" });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO ab_players (player, team_out, age, ca, pa, position, secondary_position, height, weight, min_price, max_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [player, team_out, age, ca, pa, position, secondary_position || null, height || null, weight || null, min_price, max_price]
    );
    return res.json(rows[0]);
  } catch (err) {
    if (err.code === "23505") { // Unique violation
      return res.status(400).json({ message: "球员名已存在" });
    }
    console.error("Error creating player:", err);
    return res.status(500).json({ message: "创建球员失败" });
  }
});

// Batch import/update players (auth required)
router.post("/batch", authMiddleware, async (req, res) => {
  const { players } = req.body || {};
  if (!Array.isArray(players) || players.length === 0) {
    return res.status(400).json({ message: "请提供球员数据数组" });
  }

  const results = { created: 0, updated: 0, errors: [] };
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    for (let i = 0; i < players.length; i++) {
      const p = players[i];
      const { player, team_out, age, ca, pa, position, secondary_position, height, weight, min_price, max_price } = p;

      // Validation
      if (!player || !team_out || age === undefined || ca === undefined || pa === undefined || !position || min_price === undefined || max_price === undefined) {
        results.errors.push({ index: i, reason: "缺少必填字段" });
        continue;
      }

      if (!Number.isInteger(age) || !Number.isInteger(ca) || !Number.isInteger(pa) || !Number.isInteger(min_price) || !Number.isInteger(max_price)) {
        results.errors.push({ index: i, reason: "年龄、CA、PA、价格必须为整数" });
        continue;
      }

      if (min_price < 0 || max_price < 0 || min_price > max_price) {
        results.errors.push({ index: i, reason: "价格无效" });
        continue;
      }

      try {
        // Check if player exists
        const { rows: existing } = await client.query("SELECT id FROM ab_players WHERE player = $1", [player]);

        if (existing.length > 0) {
          // Update existing
          await client.query(
            `UPDATE ab_players 
             SET team_out=$1, age=$2, ca=$3, pa=$4, position=$5, secondary_position=$6, height=$7, weight=$8, min_price=$9, max_price=$10, updated_at=NOW()
             WHERE player=$11`,
            [team_out, age, ca, pa, position, secondary_position || null, height || null, weight || null, min_price, max_price, player]
          );
          results.updated++;
        } else {
          // Create new
          await client.query(
            `INSERT INTO ab_players (player, team_out, age, ca, pa, position, secondary_position, height, weight, min_price, max_price)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [player, team_out, age, ca, pa, position, secondary_position || null, height || null, weight || null, min_price, max_price]
          );
          results.created++;
        }
      } catch (err) {
        results.errors.push({ index: i, reason: err.message });
      }
    }

    await client.query("COMMIT");
    return res.json(results);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Error in batch import:", err);
    return res.status(500).json({ message: "批量导入失败" });
  } finally {
    client.release();
  }
});

// Update player (auth required)
router.put("/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  const { player, team_out, age, ca, pa, position, secondary_position, height, weight, min_price, max_price } = req.body || {};

  const updates = [];
  const values = [];
  let paramIndex = 1;

  if (player !== undefined) {
    values.push(player);
    updates.push(`player=$${paramIndex++}`);
  }
  if (team_out !== undefined) {
    values.push(team_out);
    updates.push(`team_out=$${paramIndex++}`);
  }
  if (age !== undefined) {
    if (!Number.isInteger(age)) {
      return res.status(400).json({ message: "年龄必须为整数" });
    }
    values.push(age);
    updates.push(`age=$${paramIndex++}`);
  }
  if (ca !== undefined) {
    if (!Number.isInteger(ca)) {
      return res.status(400).json({ message: "CA必须为整数" });
    }
    values.push(ca);
    updates.push(`ca=$${paramIndex++}`);
  }
  if (pa !== undefined) {
    if (!Number.isInteger(pa)) {
      return res.status(400).json({ message: "PA必须为整数" });
    }
    values.push(pa);
    updates.push(`pa=$${paramIndex++}`);
  }
  if (position !== undefined) {
    values.push(position);
    updates.push(`position=$${paramIndex++}`);
  }
  if (secondary_position !== undefined) {
    values.push(secondary_position);
    updates.push(`secondary_position=$${paramIndex++}`);
  }
  if (height !== undefined) {
    values.push(height);
    updates.push(`height=$${paramIndex++}`);
  }
  if (weight !== undefined) {
    values.push(weight);
    updates.push(`weight=$${paramIndex++}`);
  }
  if (min_price !== undefined) {
    if (!Number.isInteger(min_price) || min_price < 0) {
      return res.status(400).json({ message: "最低价格必须为非负整数" });
    }
    values.push(min_price);
    updates.push(`min_price=$${paramIndex++}`);
  }
  if (max_price !== undefined) {
    if (!Number.isInteger(max_price) || max_price < 0) {
      return res.status(400).json({ message: "最高价格必须为非负整数" });
    }
    values.push(max_price);
    updates.push(`max_price=$${paramIndex++}`);
  }

  if (updates.length === 0) {
    const { rows } = await pool.query("SELECT * FROM ab_players WHERE id=$1", [id]);
    return res.json(rows[0] || null);
  }

  values.push(id);
  updates.push(`updated_at=NOW()`);
  const setClause = updates.join(", ");

  try {
    const { rows } = await pool.query(
      `UPDATE ab_players SET ${setClause} WHERE id=$${paramIndex} RETURNING *`,
      values
    );
    return res.json(rows[0] || null);
  } catch (err) {
    console.error("Error updating player:", err);
    return res.status(500).json({ message: "更新失败" });
  }
});

// Unlock buyout (auth required)
router.put("/:id/unlock", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const { rows } = await pool.query(
      "UPDATE ab_players SET buyout=false, updated_at=NOW() WHERE id=$1 RETURNING *",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ message: "球员不存在" });
    }
    return res.json(rows[0]);
  } catch (err) {
    console.error("Error unlocking buyout:", err);
    return res.status(500).json({ message: "解锁失败" });
  }
});

// Delete player (auth required) - cascade deletes bid history
router.delete("/:id", authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  try {
    const { rows } = await pool.query("DELETE FROM ab_players WHERE id=$1 RETURNING *", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "球员不存在" });
    }
    return res.json({ message: "删除成功" });
  } catch (err) {
    console.error("Error deleting player:", err);
    return res.status(500).json({ message: "删除失败" });
  }
});

module.exports = router;
