-- RESET SUPABASE SCHEMA CACHE
-- This forces Supabase to refresh its internal schema cache

-- Step 1: Show current schema state
SELECT 
    'CURRENT TABLES' as info,
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name NOT LIKE 'pg_%'
ORDER BY table_name;

-- Step 2: Show foreign key relationships
SELECT 
    'CURRENT FOREIGN KEYS' as info,
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- Step 3: Confirm patient_admissions table is gone
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patient_admissions')
        THEN 'patient_admissions table STILL EXISTS'
        ELSE 'patient_admissions table REMOVED'
    END as patient_admissions_status;

-- Step 4: Force schema refresh by making a small schema change
-- Add a temporary comment to a table to force schema cache refresh
COMMENT ON TABLE patients IS 'Patient records - cache refresh trigger';

-- Step 5: Remove the comment 
COMMENT ON TABLE patients IS NULL;

-- Step 6: Test basic queries that should work
SELECT 'BASIC QUERY TEST' as test;
SELECT COUNT(*) as patient_count FROM patients;
SELECT COUNT(*) as transaction_count FROM patient_transactions;

-- Step 7: Test the specific query pattern that was failing
SELECT 
    'PATIENT WITH TRANSACTIONS TEST' as test,
    p.id,
    p.first_name,
    p.last_name,
    (SELECT COUNT(*) FROM patient_transactions pt WHERE pt.patient_id = p.id) as transaction_count
FROM patients p
WHERE p.hospital_id = '550e8400-e29b-41d4-a716-446655440000'
LIMIT 3;

-- Step 8: Final confirmation
SELECT 'SCHEMA CACHE RESET' as status, 'COMPLETED' as result;