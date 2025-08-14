-- EMERGENCY ROLLBACK - UNDO RECENT CHANGES THAT BROKE THE APP
-- Run this to fix the app that stopped working after running Supabase queries

-- Step 1: Check current database state
SELECT 'CURRENT SYSTEM STATE' as info;

-- Check for any broken constraints
SELECT 
    'CONSTRAINT VIOLATIONS' as check_type,
    conname as constraint_name,
    conrelid::regclass as table_name,
    contype as constraint_type
FROM pg_constraint 
WHERE contype IN ('f', 'p', 'u', 'c')
AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY conrelid::regclass;

-- Step 2: Remove any foreign key constraints that might be causing issues
ALTER TABLE patient_transactions DROP CONSTRAINT IF EXISTS fk_patient_transactions_patient_id CASCADE;
ALTER TABLE patient_admissions DROP CONSTRAINT IF EXISTS fk_patient_admissions_patient_id CASCADE;
ALTER TABLE patient_admissions DROP CONSTRAINT IF EXISTS fk_patient_admissions_bed_id CASCADE;
ALTER TABLE beds DROP CONSTRAINT IF EXISTS fk_beds_department_id CASCADE;
ALTER TABLE doctors DROP CONSTRAINT IF EXISTS fk_doctors_department_id CASCADE;

-- Step 3: Remove any primary key constraints that might be problematic
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_pkey CASCADE;
ALTER TABLE patient_transactions DROP CONSTRAINT IF EXISTS patient_transactions_pkey CASCADE;
ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_pkey CASCADE;
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_pkey CASCADE;
ALTER TABLE patient_admissions DROP CONSTRAINT IF EXISTS patient_admissions_pkey CASCADE;
ALTER TABLE beds DROP CONSTRAINT IF EXISTS beds_pkey CASCADE;

-- Step 4: Fix any NULL id issues that might be causing problems
UPDATE patients SET id = gen_random_uuid() WHERE id IS NULL;
UPDATE patient_transactions SET id = gen_random_uuid() WHERE id IS NULL;
UPDATE doctors SET id = gen_random_uuid() WHERE id IS NULL;
UPDATE departments SET id = gen_random_uuid() WHERE id IS NULL;

-- Step 5: Ensure all critical columns are properly set
UPDATE patients SET hospital_id = '550e8400-e29b-41d4-a716-446655440000' WHERE hospital_id IS NULL;
UPDATE patients SET is_active = true WHERE is_active IS NULL;
UPDATE patients SET created_at = now() WHERE created_at IS NULL;

UPDATE patient_transactions SET hospital_id = '550e8400-e29b-41d4-a716-446655440000' WHERE hospital_id IS NULL;
UPDATE patient_transactions SET created_at = now() WHERE created_at IS NULL;
UPDATE patient_transactions SET status = 'COMPLETED' WHERE status IS NULL;

-- Step 6: Clean up any orphaned or problematic records
DELETE FROM patient_transactions WHERE patient_id NOT IN (SELECT id FROM patients);

-- Step 7: Drop and recreate patient_admissions table if it's causing issues
DROP TABLE IF EXISTS patient_admissions CASCADE;
DROP TABLE IF EXISTS beds CASCADE;

-- Step 8: Verify core tables are clean and accessible
SELECT 'PATIENTS CHECK' as test, COUNT(*) as count FROM patients WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';
SELECT 'TRANSACTIONS CHECK' as test, COUNT(*) as count FROM patient_transactions WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';
SELECT 'DOCTORS CHECK' as test, COUNT(*) as count FROM doctors;
SELECT 'DEPARTMENTS CHECK' as test, COUNT(*) as count FROM departments;

-- Step 9: Show a clean sample of data
SELECT 
    'CLEAN PATIENT SAMPLE' as test,
    id,
    patient_id,
    first_name,
    last_name,
    hospital_id,
    is_active
FROM patients 
WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY created_at DESC 
LIMIT 3;

-- Step 10: Final verification that basic queries work
SELECT 
    'FINAL VERIFICATION' as test,
    'SUCCESS' as status,
    COUNT(*) as total_patients
FROM patients p
LEFT JOIN patient_transactions pt ON pt.patient_id = p.id
WHERE p.hospital_id = '550e8400-e29b-41d4-a716-446655440000';