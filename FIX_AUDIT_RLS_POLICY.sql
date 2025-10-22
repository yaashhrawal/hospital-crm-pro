-- =============================================================================
-- FIX AUDIT LOG RLS POLICY
-- =============================================================================
-- This script fixes the Row Level Security policy that's blocking audit log inserts
-- =============================================================================

-- 1. Drop existing policies (if any)
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON audit_logs;
DROP POLICY IF EXISTS "Audit logs are immutable" ON audit_logs;
DROP POLICY IF EXISTS "Audit logs cannot be deleted" ON audit_logs;

-- 2. Disable RLS temporarily to clean up
ALTER TABLE audit_logs DISABLE ROW LEVEL SECURITY;

-- 3. Re-enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create FIXED policies

-- Policy: Anyone authenticated can insert audit logs (no restrictions)
CREATE POLICY "Anyone can insert audit logs"
    ON audit_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
    ON audit_logs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('ADMIN', 'admin')
        )
    );

-- Policy: No one can update audit logs (immutable)
CREATE POLICY "Audit logs are immutable"
    ON audit_logs
    FOR UPDATE
    TO authenticated
    USING (false);

-- Policy: No one can delete audit logs
CREATE POLICY "Audit logs cannot be deleted"
    ON audit_logs
    FOR DELETE
    TO authenticated
    USING (false);

-- 5. Grant necessary permissions
GRANT SELECT, INSERT ON audit_logs TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Check if policies are created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'audit_logs'
ORDER BY cmd, policyname;

-- Test insert (this should work now)
INSERT INTO audit_logs (
    user_email,
    user_role,
    user_name,
    action_type,
    table_name,
    record_id,
    section_name,
    description
) VALUES (
    'test@rls-fix.com',
    'frontdesk',
    'RLS Test User',
    'UPDATE',
    'patients',
    gen_random_uuid(),
    'Patient List',
    'Test after RLS policy fix'
) RETURNING id, user_email, created_at;

-- Verify the test insert
SELECT
    id,
    user_email,
    user_role,
    action_type,
    section_name,
    description,
    created_at
FROM audit_logs
WHERE user_email = 'test@rls-fix.com';

-- Clean up test data
DELETE FROM audit_logs WHERE user_email = 'test@rls-fix.com';

-- =============================================================================
-- DONE!
-- =============================================================================
-- The audit_logs table should now accept inserts from any authenticated user
-- =============================================================================
