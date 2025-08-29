-- Create admin user without pgcrypto (use application-level hashing)
-- Note: Password should be hashed by the application before storing
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
    ('admin@hospital.com', 'temp_password_hash', 'Admin', 'User', 'ADMIN')
ON CONFLICT (email) DO UPDATE 
SET first_name = 'Admin', 
    last_name = 'User', 
    role = 'ADMIN',
    is_active = true;