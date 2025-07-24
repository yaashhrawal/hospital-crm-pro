-- CHECK RLS POLICIES - Run this in Supabase SQL Editor

-- Check if RLS is enabled on patients table
SELECT schemaname, tablename, rowsecurity, hasrls
FROM pg_tables t
JOIN pg_class c ON c.relname = t.tablename
WHERE t.tablename = 'patients';

-- Check RLS policies on patients table
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'patients';

-- Check current user and roles
SELECT current_user, current_role;