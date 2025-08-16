-- Script to create frontdesk user in the hospital system
-- This script should be run after the user roles schema has been created

-- Step 1: First, the user needs to be created in Supabase Auth dashboard
-- Go to Supabase Dashboard > Authentication > Users > Add User
-- Email: frontdesk@hospital.com
-- Password: frontdesk123
-- Make sure to save the user ID after creation

-- Step 2: Get the user ID from auth.users and set role metadata
-- Update auth.users to set the role in metadata
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object(
    'role', 'frontdesk', 
    'full_name', 'Front Desk Staff',
    'department', 'Reception'
)
WHERE email = 'frontdesk@hospital.com';

-- Step 3: Insert into public.users table (this should happen automatically via trigger)
-- But we can ensure it exists with this upsert:
INSERT INTO public.users (id, email, role, full_name, department, phone, is_active)
SELECT 
    au.id,
    'frontdesk@hospital.com',
    'frontdesk',
    'Front Desk Staff',
    'Reception',
    NULL,
    true
FROM auth.users au
WHERE au.email = 'frontdesk@hospital.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'frontdesk',
    full_name = 'Front Desk Staff',
    department = 'Reception',
    is_active = true;

-- Step 4: Verify the user was created properly
SELECT 
    u.id,
    u.email,
    u.role,
    u.full_name,
    u.department,
    u.is_active,
    au.raw_user_meta_data->>'role' as auth_role
FROM public.users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email = 'frontdesk@hospital.com';

-- Step 5: Test the role functions
SELECT 
    email,
    get_user_role(id) as user_role
FROM auth.users 
WHERE email = 'frontdesk@hospital.com';

-- Step 6: Create an admin user as well for testing (if doesn't exist)
-- First create in Supabase Auth dashboard:
-- Email: admin@hospital.com  
-- Password: admin123

-- Then run this to set admin role:
UPDATE auth.users 
SET raw_user_meta_data = jsonb_build_object(
    'role', 'admin', 
    'full_name', 'System Administrator',
    'department', 'Administration'
)
WHERE email = 'admin@hospital.com';

INSERT INTO public.users (id, email, role, full_name, department, is_active)
SELECT 
    au.id,
    'admin@hospital.com',
    'admin',
    'System Administrator',
    'Administration',
    true
FROM auth.users au
WHERE au.email = 'admin@hospital.com'
ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    full_name = 'System Administrator',
    department = 'Administration',
    is_active = true;

-- Final verification
SELECT 
    u.email,
    u.role,
    u.full_name,
    u.department,
    u.is_active
FROM public.users u
WHERE u.email IN ('frontdesk@hospital.com', 'admin@hospital.com')
ORDER BY u.role;

/*
IMPORTANT NOTES:
1. Make sure to first run CREATE_USER_ROLES.sql to set up the schema
2. Create both users through Supabase Auth dashboard first
3. Then run this script to set their roles and metadata
4. Test login with both accounts to verify role-based access

Frontdesk User Permissions:
- ✅ Full access to dashboard
- ✅ Full access to patient entry  
- ❌ NO edit access in patient list
- ❌ NO access to operations section
- ✅ All other sections accessible without edit capabilities

Admin User Permissions:
- ✅ Full access to everything
*/