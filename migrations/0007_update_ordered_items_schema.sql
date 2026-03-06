-- Migration to enhance ordered_items table
ALTER TABLE ordered_items ADD COLUMN status TEXT DEFAULT 'Bestilling';
ALTER TABLE ordered_items ADD COLUMN approved INTEGER DEFAULT 1;
ALTER TABLE ordered_items ADD COLUMN language TEXT DEFAULT 'DA';
ALTER TABLE ordered_items ADD COLUMN is_extra INTEGER DEFAULT 0;
ALTER TABLE ordered_items ADD COLUMN comment TEXT;
ALTER TABLE ordered_items ADD COLUMN ordered_by TEXT;
ALTER TABLE ordered_items ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
