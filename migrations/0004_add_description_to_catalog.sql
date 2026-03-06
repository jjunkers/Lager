-- Migration to add description column to catalog
ALTER TABLE catalog ADD COLUMN description TEXT;
