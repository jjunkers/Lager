-- Add received_quantity column to order_history to track difference between ordered and received
ALTER TABLE order_history ADD COLUMN received_quantity INTEGER;
