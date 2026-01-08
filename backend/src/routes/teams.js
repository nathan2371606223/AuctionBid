const express = require("express");
const { pool } = require("../db/connection");

const router = express.Router();

// Get teams grouped by level from lb_teams table
router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT id, level, team_name, position_order FROM lb_teams ORDER BY level ASC, position_order ASC"
    );
    
    // Group teams by level
    const grouped = {};
    rows.forEach((team) => {
      const level = team.level;
      if (!grouped[level]) {
        grouped[level] = [];
      }
      grouped[level].push({
        id: team.id,
        name: team.team_name,
        position_order: team.position_order
      });
    });
    
    res.json(grouped);
  } catch (err) {
    console.error("Error fetching teams:", err);
    res.status(500).json({ message: "获取球队列表失败" });
  }
});

module.exports = router;
