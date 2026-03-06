-- Migration to add min_stock and max_stock columns to catalog
ALTER TABLE catalog ADD COLUMN min_stock INTEGER DEFAULT 0;
ALTER TABLE catalog ADD COLUMN max_stock INTEGER DEFAULT 0;
