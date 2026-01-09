const express = require("express");
const { pool } = require("../db/connection");
const { authMiddleware } = require("../middleware/auth");
const { optionalAuth } = require("../middleware/teamToken");

const router = express.Router();

// Get deadline - public (accepts JWT or team token)
router.get("/", optionalAuth, async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT deadline FROM ab_auction_deadline ORDER BY id DESC LIMIT 1");
    if (rows.length === 0 || !rows[0].deadline) {
      return res.json({ deadline: null });
    }
    return res.json({ deadline: rows[0].deadline });
  } catch (err) {
    console.error("Error fetching deadline:", err);
    return res.status(500).json({ message: "获取截止时间失败" });
  }
});

// Set deadline - requires auth (editor only)
router.put("/", authMiddleware, async (req, res) => {
  const { deadline } = req.body || {};
  
  // Validate deadline
  if (!deadline) {
    // Clear deadline
    try {
      const { rows: existing } = await pool.query("SELECT id FROM ab_auction_deadline ORDER BY id DESC LIMIT 1");
      if (existing.length > 0) {
        await pool.query("UPDATE ab_auction_deadline SET deadline=NULL, updated_at=NOW() WHERE id=$1", [existing[0].id]);
      } else {
        await pool.query("INSERT INTO ab_auction_deadline (deadline) VALUES (NULL)");
      }
      return res.json({ message: "截止时间已清除", deadline: null });
    } catch (err) {
      console.error("Error clearing deadline:", err);
      return res.status(500).json({ message: "清除截止时间失败" });
    }
  }

  // Validate deadline is within 24 hours
  const deadlineTime = new Date(deadline);
  const now = new Date();
  const diffMs = deadlineTime.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  if (isNaN(deadlineTime.getTime())) {
    return res.status(400).json({ message: "无效的截止时间格式" });
  }

  if (deadlineTime <= now) {
    return res.status(400).json({ message: "截止时间必须晚于当前时间" });
  }

  if (diffHours > 24) {
    return res.status(400).json({ message: "截止时间必须在24小时内" });
  }

  try {
    // Update or insert
    const { rows: existing } = await pool.query("SELECT id FROM ab_auction_deadline ORDER BY id DESC LIMIT 1");
    if (existing.length > 0) {
      await pool.query(
        "UPDATE ab_auction_deadline SET deadline=$1, updated_at=NOW() WHERE id=$2",
        [deadlineTime.toISOString(), existing[0].id]
      );
    } else {
      await pool.query("INSERT INTO ab_auction_deadline (deadline) VALUES ($1)", [deadlineTime.toISOString()]);
    }
    return res.json({ message: "截止时间已设置", deadline: deadlineTime.toISOString() });
  } catch (err) {
    console.error("Error setting deadline:", err);
    return res.status(500).json({ message: "设置截止时间失败" });
  }
});

module.exports = router;
