const { pool } = require("./connection");
const crypto = require("crypto");

function generateToken() {
  return crypto.randomBytes(16).toString("hex"); // 32 hex chars
}

async function runMigrations() {
  // Create ab_players table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ab_players (
      id SERIAL PRIMARY KEY,
      player VARCHAR(255) NOT NULL,
      team_out VARCHAR(255) NOT NULL,
      age INTEGER NOT NULL,
      ca INTEGER NOT NULL,
      pa INTEGER NOT NULL,
      position VARCHAR(255) NOT NULL,
      secondary_position VARCHAR(255),
      height VARCHAR(255),
      weight VARCHAR(255),
      min_price INTEGER NOT NULL,
      max_price INTEGER NOT NULL,
      current_bid_price INTEGER,
      current_bid_team VARCHAR(255),
      buyout BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Create ab_bid_history table with cascade delete
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ab_bid_history (
      id SERIAL PRIMARY KEY,
      player_id INTEGER NOT NULL REFERENCES ab_players(id) ON DELETE CASCADE,
      bid_team VARCHAR(255) NOT NULL,
      bid_price INTEGER NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Create index on player_id for faster lookups
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_bid_history_player_id ON ab_bid_history(player_id);
  `);

  // Create unique index on player name to prevent duplicates
  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_players_player_unique ON ab_players(player);
  `);

  // Shared token table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lb_team_tokens (
      team_id INTEGER PRIMARY KEY REFERENCES lb_teams(id) ON DELETE CASCADE,
      token TEXT UNIQUE NOT NULL,
      active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Alert table for token mismatch notifications
  await pool.query(`
    CREATE TABLE IF NOT EXISTS lb_token_alerts (
      id SERIAL PRIMARY KEY,
      team_id INTEGER REFERENCES lb_teams(id) ON DELETE SET NULL,
      token TEXT,
      module TEXT NOT NULL,
      payload JSONB,
      message TEXT,
      resolved BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  // Seed tokens for teams that do not yet have one
  const { rows: teams } = await pool.query("SELECT id FROM lb_teams");
  for (const t of teams) {
    const { rows: existing } = await pool.query(
      "SELECT token FROM lb_team_tokens WHERE team_id=$1",
      [t.id]
    );
    if (existing.length === 0) {
      const token = generateToken();
      await pool.query(
        "INSERT INTO lb_team_tokens (team_id, token) VALUES ($1, $2)",
        [t.id, token]
      );
    }
  }

  console.log("✓ Database migrations completed");
}

module.exports = { runMigrations };
