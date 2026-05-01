const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./bills.db');

db.serialize(() => {
  // Ensure basic table exists
  db.run(`
    CREATE TABLE IF NOT EXISTS bills (
      id INTEGER PRIMARY KEY,
      lr_no TEXT,
      file_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Add missing columns if they don't exist (using error ignoring for idempotency)
  db.run("ALTER TABLE bills ADD COLUMN consignee TEXT", (err) => {});
  db.run("ALTER TABLE bills ADD COLUMN consignor TEXT", (err) => {});
  db.run("ALTER TABLE bills ADD COLUMN total_amount TEXT", (err) => {});

  // Settings table for incremental LR numbers
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    )
  `, () => {
    // Initialize default LR settings if not present
    db.run("INSERT OR IGNORE INTO settings (key, value) VALUES ('lr_prefix', 'VR')");
    db.run("INSERT OR IGNORE INTO settings (key, value) VALUES ('lr_next_val', '1001')");
  });
});

module.exports = db;
