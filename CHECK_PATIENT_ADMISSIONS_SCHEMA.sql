-- =======================================================
-- CHECK PATIENT_ADMISSIONS TABLE ACTUAL SCHEMA
-- Copy and paste this into Supabase SQL Editor to see actual columns
-- =======================================================

-- Check if patient_admissions table exists and show its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'patient_admissions'
ORDER BY ordinal_position;

-- Also show sample data to understand the current structure
SELECT 
    'Sample Data from patient_admissions table:' as info;

-- Show first few records to understand data structure
SELECT * FROM patient_admissions LIMIT 3;

-- Show unique status values
SELECT DISTINCT status FROM patient_admissions;

-- Show the table constraints
SELECT 
    constraint_name,
    constraint_type,
    check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public' 
AND tc.table_name = 'patient_admissions';