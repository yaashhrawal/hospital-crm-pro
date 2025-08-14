-- DEBUG PATIENT LIST STILL BLANK ISSUE
-- This tests the exact query that should be working

-- Step 1: Check if we have any patients at all
SELECT 'TOTAL PATIENTS CHECK' as test, COUNT(*) as count FROM patients;

-- Step 2: Check patients with the specific hospital_id
SELECT 'HOSPITAL PATIENTS CHECK' as test, COUNT(*) as count 
FROM patients 
WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';

-- Step 3: Check if hospital_id values are what we expect
SELECT 'HOSPITAL_ID VALUES' as test, hospital_id, COUNT(*) as count
FROM patients 
GROUP BY hospital_id;

-- Step 4: Show actual patient data to see what's there
SELECT 
    'SAMPLE PATIENT DATA' as test,
    id,
    patient_id,
    first_name,
    last_name,
    hospital_id,
    is_active,
    created_at
FROM patients 
ORDER BY created_at DESC 
LIMIT 5;

-- Step 5: Test the exact HospitalService.getPatients() query
-- This is what ComprehensivePatientList component calls
SELECT 
    'HOSPITAL SERVICE QUERY SIMULATION' as test,
    p.*
FROM patients p
WHERE p.hospital_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY p.created_at DESC
LIMIT 5;

-- Step 6: Test with patient_transactions join (the working query)
SELECT 
    'PATIENTS WITH TRANSACTIONS JOIN' as test,
    p.id,
    p.patient_id,
    p.first_name,
    p.last_name,
    COUNT(pt.id) as transaction_count
FROM patients p
LEFT JOIN patient_transactions pt ON pt.patient_id = p.id
WHERE p.hospital_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY p.id, p.patient_id, p.first_name, p.last_name
ORDER BY p.created_at DESC
LIMIT 5;

-- Step 7: Check if there are any JavaScript/browser caching issues
-- Show most recently created patient
SELECT 
    'MOST RECENT PATIENT' as test,
    id,
    patient_id,
    first_name,
    last_name,
    hospital_id,
    created_at,
    is_active
FROM patients 
ORDER BY created_at DESC 
LIMIT 1;

-- Step 8: Check for any data type issues
SELECT 
    'DATA TYPE CHECK' as test,
    pg_typeof(id) as id_type,
    pg_typeof(hospital_id) as hospital_id_type,
    pg_typeof(is_active) as is_active_type
FROM patients 
LIMIT 1;