-- Migration: Extend User Profile with Full Name, Phone, and Activation Status
ALTER TABLE users ADD COLUMN full_name TEXT;
ALTER TABLE users ADD COLUMN phone_number TEXT;
ALTER TABLE users ADD COLUMN is_active INTEGER DEFAULT 1;

-- Migration: Copy existing 'name' to 'full_name' for backward compatibility
UPDATE users SET full_name = name;
