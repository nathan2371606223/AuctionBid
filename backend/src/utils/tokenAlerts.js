async function createTokenAlert(pool, { id: teamId, token }, moduleName, payload, message) {
  try {
    await pool.query(
      `INSERT INTO lb_token_alerts (team_id, token, module, payload, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [teamId || null, token || null, moduleName, payload || null, message || null]
    );
  } catch (err) {
    console.error("Failed to create token alert:", err);
  }
}

module.exports = { createTokenAlert };
