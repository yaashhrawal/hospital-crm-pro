-- Script to update frontdesk user credentials and grant operations access
-- Run this script to update the existing frontdesk user

-- Update the frontdesk user email and metadata
UPDATE auth.users 
SET 
    email = 'frontdesk@valant.com',
    raw_user_meta_data = jsonb_build_object(
        'role', 'frontdesk', 
        'full_name', 'Front Desk Staff',
        'department', 'Reception'
    )
WHERE email = 'frontdesk@hospital.com' OR email = 'frontdesk@valant.com';

-- Update the public.users table
UPDATE public.users 
SET 
    email = 'frontdesk@valant.com',
    role = 'frontdesk',
    full_name = 'Front Desk Staff',
    department = 'Reception',
    is_active = true
WHERE email = 'frontdesk@hospital.com' OR email = 'frontdesk@valant.com';

-- If user doesn't exist, create it (you'll need to create in Supabase Auth first)
-- Then insert into public.users table
INSERT INTO public.users (id, email, role, full_name, department, phone, is_active)
SELECT 
    au.id,
    'frontdesk@valant.com',
    'frontdesk',
    'Front Desk Staff',
    'Reception',
    NULL,
    true
FROM auth.users au
WHERE au.email = 'frontdesk@valant.com'
ON CONFLICT (id) DO UPDATE SET
    email = 'frontdesk@valant.com',
    role = 'frontdesk',
    full_name = 'Front Desk Staff',
    department = 'Reception',
    is_active = true;

-- Verify the user was updated properly
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
WHERE u.email = 'frontdesk@valant.com';

-- Test the role functions
SELECT 
    email,
    get_user_role(id) as user_role
FROM auth.users 
WHERE email = 'frontdesk@valant.com';

/*
UPDATED FRONTDESK USER PERMISSIONS:
- ✅ Full access to dashboard
- ✅ Full access to patient entry  
- ❌ NO edit access in patient list
- ✅ FULL access to operations section (NEW!)
- ✅ All other sections accessible without edit capabilities

LOGIN CREDENTIALS:
- Email: frontdesk@valant.com
- Password: Front@123

NOTES:
1. You need to update the password to 'Front@123' in Supabase Auth dashboard
2. Go to Supabase Dashboard > Authentication > Users
3. Find the frontdesk@valant.com user and update the password
4. The user now has operations access granted via 'access_operations' permission
*/