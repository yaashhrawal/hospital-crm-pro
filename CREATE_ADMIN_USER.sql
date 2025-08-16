-- Create Admin User with Full Access
-- Credentials: admin@valant.com / Admin@321

-- STEP 1: Create auth user if doesn't exist (replace with actual signup via UI)
-- This must be done through Supabase Auth UI or admin panel first!

-- STEP 2: Force update metadata for existing admin user
UPDATE auth.users 
SET 
  raw_user_meta_data = jsonb_build_object(
    'role', 'admin',
    'first_name', 'Admin',
    'last_name', 'User'
  ),
  email_confirmed_at = COALESCE(email_confirmed_at, now())
WHERE email = 'admin@valant.com';

-- STEP 3: Create role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'frontdesk', 'doctor', 'nurse', 'accountant', 'staff');
    END IF;
END $$;

-- STEP 4: Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY,
  email varchar(255) UNIQUE NOT NULL,
  first_name varchar(100),
  last_name varchar(100),
  role user_role DEFAULT 'frontdesk',
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- STEP 5: Force insert/update admin user in users table
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  created_at,
  updated_at
) 
SELECT 
  id,
  'admin@valant.com',
  'Admin',
  'User',
  'admin'::user_role,
  true,
  now(),
  now()
FROM auth.users 
WHERE email = 'admin@valant.com'
ON CONFLICT (id) 
DO UPDATE SET
  role = 'admin'::user_role,
  first_name = 'Admin',
  last_name = 'User',
  is_active = true,
  updated_at = now();

-- Alternative: Update by email if ID conflict
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  role,
  is_active,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  'admin@valant.com',
  'Admin',
  'User',
  'admin'::user_role,
  true,
  now(),
  now()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@valant.com')
ON CONFLICT (email)
DO UPDATE SET
  role = 'admin'::user_role,
  first_name = 'Admin',
  last_name = 'User',
  is_active = true,
  updated_at = now();

-- STEP 6: Verify the admin user was created correctly
SELECT 
  'AUTH TABLE CHECK' as source,
  au.id,
  au.email,
  au.email_confirmed_at,
  au.raw_user_meta_data->>'role' as metadata_role,
  au.raw_user_meta_data->>'first_name' as metadata_first_name
FROM auth.users au
WHERE au.email = 'admin@valant.com'

UNION ALL

SELECT 
  'USERS TABLE CHECK' as source,
  u.id::text,
  u.email,
  u.created_at::text,
  u.role::text,
  u.first_name
FROM users u
WHERE u.email = 'admin@valant.com';

-- STEP 7: Final verification query
SELECT 
  CASE 
    WHEN au.email IS NOT NULL AND u.email IS NOT NULL AND u.role = 'admin' AND au.raw_user_meta_data->>'role' = 'admin'
    THEN '✅ ADMIN USER FULLY CONFIGURED'
    WHEN au.email IS NULL 
    THEN '❌ ADMIN USER NOT FOUND IN AUTH.USERS - MUST SIGNUP FIRST'
    WHEN u.email IS NULL
    THEN '❌ ADMIN USER NOT FOUND IN USERS TABLE'
    WHEN u.role != 'admin'
    THEN '❌ ADMIN USER ROLE NOT SET TO ADMIN IN USERS TABLE'
    WHEN au.raw_user_meta_data->>'role' != 'admin'
    THEN '❌ ADMIN USER ROLE NOT SET TO ADMIN IN METADATA'
    ELSE '⚠️ UNKNOWN CONFIGURATION ISSUE'
  END as status,
  au.email as auth_email,
  u.email as profile_email,
  u.role as profile_role,
  au.raw_user_meta_data->>'role' as metadata_role
FROM auth.users au
FULL OUTER JOIN users u ON au.id = u.id OR au.email = u.email
WHERE au.email = 'admin@valant.com' OR u.email = 'admin@valant.com';