const { pool } = require("./connection");

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

  console.log("✓ Database migrations completed");
}

module.exports = { runMigrations };
