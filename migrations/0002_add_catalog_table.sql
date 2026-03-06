-- Migration to add catalog table
CREATE TABLE IF NOT EXISTS catalog (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT UNIQUE NOT NULL,
  name_da TEXT,
  name_no TEXT,
  name_sv TEXT,
  quantity_da INTEGER DEFAULT 0,
  quantity_no INTEGER DEFAULT 0,
  quantity_sv INTEGER DEFAULT 0,
  section TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_catalog_sort_order ON catalog(sort_order);
