-- Schema for Lager App

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  name TEXT,
  require_change_password BOOLEAN DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  region TEXT NOT NULL,
  month_key TEXT NOT NULL,
  item_code TEXT NOT NULL,
  skab INTEGER DEFAULT 0,
  lager INTEGER DEFAULT 0,
  total INTEGER DEFAULT 0,
  note TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(region, month_key, item_code)
);

-- Seed default admin user (password: admin123)
INSERT OR IGNORE INTO users (username, password, role, name, require_change_password)
VALUES ('admin', 'admin123', 'admin', 'Administrator', 0);
