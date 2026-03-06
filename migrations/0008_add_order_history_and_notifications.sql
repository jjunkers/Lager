-- Migration to add order_history and notifications tables

-- Table for completed orders (archived)
CREATE TABLE IF NOT EXISTS order_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  catalog_id INTEGER,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  region_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  language TEXT,
  ordered_by TEXT,
  ordered_at TIMESTAMP,
  received_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  received_by TEXT,
  comment TEXT
);

-- Table for internal notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL, -- e.g., 'new_order'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
