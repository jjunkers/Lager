-- Migration to allow NULL catalog_id in ordered_items
-- SQLite does not support ALTER TABLE DROP CONSTRAINT or ALTER COLUMN, 
-- so we recreate the table and copy data.

PRAGMA foreign_keys=OFF;

CREATE TABLE ordered_items_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  catalog_id INTEGER, -- Allowed to be NULL for custom items
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  region_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  ordered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'Bestilling',
  approved INTEGER DEFAULT 1,
  language TEXT DEFAULT 'DA',
  is_extra INTEGER DEFAULT 0,
  comment TEXT,
  ordered_by TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (catalog_id) REFERENCES catalog(id)
);

INSERT INTO ordered_items_new (
  id, catalog_id, code, name, region, region_name, 
  quantity, ordered_at, status, approved, 
  language, is_extra, comment, ordered_by, updated_at
)
SELECT 
  id, catalog_id, code, name, region, region_name, 
  quantity, ordered_at, status, approved, 
  language, is_extra, comment, ordered_by, updated_at 
FROM ordered_items;

DROP TABLE ordered_items;
ALTER TABLE ordered_items_new RENAME TO ordered_items;

PRAGMA foreign_keys=ON;
