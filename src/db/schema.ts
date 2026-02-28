import Database from "better-sqlite3";

const MIGRATIONS = [
  `CREATE TABLE IF NOT EXISTS channels (
    channel_id TEXT PRIMARY KEY,
    guild_id TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS stocks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ticker TEXT NOT NULL UNIQUE,
    name TEXT
  )`,
  `CREATE TABLE IF NOT EXISTS channel_stocks (
    channel_id TEXT NOT NULL REFERENCES channels(channel_id) ON DELETE CASCADE,
    stock_id INTEGER NOT NULL REFERENCES stocks(id),
    added_by TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (channel_id, stock_id)
  )`,
  `CREATE TABLE IF NOT EXISTS schedules (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    channel_id TEXT NOT NULL REFERENCES channels(channel_id) ON DELETE CASCADE,
    cron_expression TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS idx_channels_guild_id ON channels(guild_id)`,
  `CREATE INDEX IF NOT EXISTS idx_schedules_channel_id ON schedules(channel_id)`,
];

export function migrate(db: Database.Database): void {
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  db.transaction(() => {
    for (const sql of MIGRATIONS) {
      db.exec(sql);
    }
  })();

  console.log("DB migration completed");
}
