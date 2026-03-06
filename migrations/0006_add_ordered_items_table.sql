-- Migration to add ordered_items table
CREATE TABLE IF NOT EXISTS ordered_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  catalog_id INTEGER NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  region_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (catalog_id) REFERENCES catalog(id)
);
