-- Debug: Check if users table exists and create test user profile
-- Run this in your Supabase SQL editor if the user profile is missing

-- 1. First check if users table exists
SELECT * FROM information_schema.tables WHERE table_name = 'users';

-- 2. Check current users in auth.users
SELECT id, email, created_at FROM auth.users;

-- 3. Check users in our custom users table
SELECT * FROM users;

-- 4. Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'STAFF' CHECK (role IN ('ADMIN', 'DOCTOR', 'NURSE', 'STAFF')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- 5. Create a user profile for your test user (replace with actual auth user ID)
-- First get the auth user ID:
SELECT id, email FROM auth.users WHERE email = 'admin@hospital.com';

-- Then insert the profile (replace 'YOUR_AUTH_USER_ID' with the actual ID from above):
INSERT INTO users (id, email, first_name, last_name, role, is_active)
VALUES (
    (SELECT id FROM auth.users WHERE email = 'admin@hospital.com'),
    'admin@hospital.com',
    'Admin',
    'User',
    'ADMIN',
    TRUE
)
ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role,
    is_active = EXCLUDED.is_active;

-- 6. Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 7. Create policy to allow users to read their own profile
CREATE POLICY "Users can read own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- 8. Create policy to allow authenticated users to read other users (for hospital staff)
CREATE POLICY "Authenticated users can read users" ON users
    FOR SELECT USING (auth.role() = 'authenticated');

-- 9. Verify the setup
SELECT 
    au.id,
    au.email,
    u.first_name,
    u.last_name,
    u.role,
    u.is_active
FROM auth.users au
LEFT JOIN users u ON au.id = u.id
WHERE au.email = 'admin@hospital.com';