-- Create a local admin user for development
-- Password is 'admin123' (inserted as plaintext for simplicity, handled by fallback)
INSERT OR IGNORE INTO users (username, password, role, full_name, is_active, require_change_password)
VALUES ('devadmin', 'admin123', 'admin', 'Udvikler Admin', 1, 0);
