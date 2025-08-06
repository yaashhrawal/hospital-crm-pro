-- =======================================================
-- ADD TREATING_DOCTOR COLUMN TO PATIENT_ADMISSIONS TABLE
-- Run this in Supabase SQL Editor to fix the schema issue
-- =======================================================

-- First check if the column already exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'patient_admissions' 
        AND column_name = 'treating_doctor'
    ) THEN
        -- Add the treating_doctor column to patient_admissions table
        ALTER TABLE patient_admissions 
        ADD COLUMN treating_doctor TEXT DEFAULT 'Not Assigned';
        
        RAISE NOTICE 'Column treating_doctor added successfully to patient_admissions table';
    ELSE
        RAISE NOTICE 'Column treating_doctor already exists in patient_admissions table';
    END IF;
END $$;

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'patient_admissions'
AND column_name = 'treating_doctor';

-- Show all columns in the table for verification
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'patient_admissions'
ORDER BY ordinal_position;