-- =============================================================================
-- ADMIN AUDIT LOG SYSTEM - DATABASE SCHEMA
-- =============================================================================
-- This schema creates a comprehensive audit logging system for tracking
-- all modifications made by frontdesk and other users in the hospital CRM.
-- =============================================================================

-- 1. Create the audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- User information
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    user_email TEXT NOT NULL,
    user_role TEXT NOT NULL,
    user_name TEXT,

    -- Action details
    action_type TEXT NOT NULL CHECK (action_type IN ('CREATE', 'UPDATE', 'DELETE')),
    table_name TEXT NOT NULL,
    record_id UUID NOT NULL,
    section_name TEXT NOT NULL, -- e.g., 'Patient List', 'Billing', 'Services', etc.

    -- Change tracking (detailed field-by-field comparison)
    field_changes JSONB, -- { fieldName: { old: value, new: value } }
    old_values JSONB, -- Complete snapshot of old record
    new_values JSONB, -- Complete snapshot of new record

    -- Additional context
    description TEXT, -- Human-readable description of the change
    ip_address TEXT,
    user_agent TEXT,

    -- Multi-hospital support
    hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000',

    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_email ON audit_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_section_name ON audit_logs(section_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_hospital_id ON audit_logs(hospital_id);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_date ON audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_date ON audit_logs(table_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_section_date ON audit_logs(section_name, created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS Policies

-- Policy: Admins can view all audit logs
CREATE POLICY "Admins can view all audit logs"
    ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('ADMIN', 'admin')
        )
    );

-- Policy: System can insert audit logs (for triggers and application code)
CREATE POLICY "System can insert audit logs"
    ON audit_logs
    FOR INSERT
    WITH CHECK (true);

-- Policy: No one can update or delete audit logs (immutable)
CREATE POLICY "Audit logs are immutable"
    ON audit_logs
    FOR UPDATE
    USING (false);

CREATE POLICY "Audit logs cannot be deleted"
    ON audit_logs
    FOR DELETE
    USING (false);

-- 5. Create helper function to generate field-by-field comparison
CREATE OR REPLACE FUNCTION compare_jsonb_fields(old_data JSONB, new_data JSONB)
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}';
    key TEXT;
    old_value JSONB;
    new_value JSONB;
BEGIN
    -- Compare all fields in old_data
    FOR key IN SELECT jsonb_object_keys(old_data) LOOP
        old_value := old_data -> key;
        new_value := new_data -> key;

        -- Only include fields that changed
        IF old_value IS DISTINCT FROM new_value THEN
            result := result || jsonb_build_object(
                key,
                jsonb_build_object(
                    'old', old_value,
                    'new', new_value
                )
            );
        END IF;
    END LOOP;

    -- Check for new fields in new_data that weren't in old_data
    FOR key IN SELECT jsonb_object_keys(new_data) LOOP
        IF NOT old_data ? key THEN
            result := result || jsonb_build_object(
                key,
                jsonb_build_object(
                    'old', null,
                    'new', new_data -> key
                )
            );
        END IF;
    END LOOP;

    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 6. Create helper function to log audit events
CREATE OR REPLACE FUNCTION log_audit(
    p_user_id UUID,
    p_user_email TEXT,
    p_user_role TEXT,
    p_user_name TEXT,
    p_action_type TEXT,
    p_table_name TEXT,
    p_record_id UUID,
    p_section_name TEXT,
    p_old_values JSONB,
    p_new_values JSONB,
    p_description TEXT DEFAULT NULL,
    p_hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'
)
RETURNS UUID AS $$
DECLARE
    v_field_changes JSONB;
    v_audit_id UUID;
BEGIN
    -- Generate field-by-field comparison
    IF p_old_values IS NOT NULL AND p_new_values IS NOT NULL THEN
        v_field_changes := compare_jsonb_fields(p_old_values, p_new_values);
    ELSE
        v_field_changes := NULL;
    END IF;

    -- Insert audit log
    INSERT INTO audit_logs (
        user_id,
        user_email,
        user_role,
        user_name,
        action_type,
        table_name,
        record_id,
        section_name,
        field_changes,
        old_values,
        new_values,
        description,
        hospital_id
    ) VALUES (
        p_user_id,
        p_user_email,
        p_user_role,
        p_user_name,
        p_action_type,
        p_table_name,
        p_record_id,
        p_section_name,
        v_field_changes,
        p_old_values,
        p_new_values,
        p_description,
        p_hospital_id
    ) RETURNING id INTO v_audit_id;

    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Grant necessary permissions
GRANT SELECT ON audit_logs TO authenticated;
GRANT INSERT ON audit_logs TO authenticated;
GRANT EXECUTE ON FUNCTION log_audit TO authenticated;
GRANT EXECUTE ON FUNCTION compare_jsonb_fields TO authenticated;

-- =============================================================================
-- SETUP COMPLETE
-- =============================================================================
-- Next step: Run CREATE_AUDIT_TRIGGERS.sql to set up automatic audit logging
-- =============================================================================
