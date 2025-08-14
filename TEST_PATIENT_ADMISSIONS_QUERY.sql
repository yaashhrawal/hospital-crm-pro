-- TEST PATIENT_ADMISSIONS RELATIONSHIP QUERY
-- This tests the exact query that getPatients() is running

-- Step 1: Check if patient_admissions table exists and has data
SELECT 
    'PATIENT_ADMISSIONS TABLE CHECK' as info,
    COUNT(*) as record_count
FROM patient_admissions;

-- Step 2: Check if the foreign key relationship exists
SELECT 
    'PATIENT_ADMISSIONS FOREIGN KEY' as info,
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
  AND tc.table_name = 'patient_admissions'
  AND kcu.column_name = 'patient_id';

-- Step 3: Test the exact query from getPatients() method
-- This is the query that's causing the white screen
SELECT 
    p.*,
    -- Test patient_transactions relationship
    (SELECT json_agg(pt.*) FROM patient_transactions pt WHERE pt.patient_id = p.id) as transactions,
    -- Test patient_admissions relationship (this might be failing)
    (SELECT json_agg(pa.*) FROM patient_admissions pa WHERE pa.patient_id = p.id) as admissions
FROM patients p
WHERE p.hospital_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY p.created_at DESC
LIMIT 5;

-- Step 4: Try simpler query without relationships
SELECT 
    'SIMPLE PATIENTS QUERY' as info,
    COUNT(*) as patient_count
FROM patients 
WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';

-- Step 5: Check if there are any patients without proper IDs
SELECT 
    'PATIENTS WITH NULL IDS' as info,
    COUNT(*) as null_id_count
FROM patients 
WHERE id IS NULL OR hospital_id IS NULL;

-- Step 6: Check sample patient data structure
SELECT 
    'SAMPLE PATIENT DATA' as info,
    id,
    patient_id,
    first_name,
    last_name,
    hospital_id,
    created_at
FROM patients 
WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000'
LIMIT 3;