-- Tilføj status kolonne til order_history
ALTER TABLE order_history ADD COLUMN status TEXT DEFAULT 'Modtaget';
