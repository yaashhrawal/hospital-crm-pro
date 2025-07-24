-- Remove specific patient entries from Ravi Kumar to Harmeet Singh
-- Run this in your Supabase SQL Editor to remove only these patients

-- First, show the patients that match the criteria (for verification)
SELECT 
    'PATIENTS TO BE DELETED' as info,
    id,
    patient_id,
    first_name,
    last_name,
    phone,
    created_at
FROM patients 
WHERE first_name ILIKE '%ravi%' AND last_name ILIKE '%kumar%'
   OR first_name ILIKE '%harmeet%' AND last_name ILIKE '%singh%'
   OR (first_name ILIKE '%ravi%' OR first_name ILIKE '%harmeet%')
ORDER BY created_at;

-- Show count before deletion
SELECT 'BEFORE DELETION' as status, COUNT(*) as total_patients FROM patients;

-- Delete related records first (to avoid foreign key constraints)
-- Delete patient transactions for these patients
DELETE FROM patient_transactions 
WHERE patient_id IN (
    SELECT id FROM patients 
    WHERE first_name ILIKE '%ravi%' AND last_name ILIKE '%kumar%'
       OR first_name ILIKE '%harmeet%' AND last_name ILIKE '%singh%'
       OR (first_name || ' ' || COALESCE(last_name, '')) ILIKE '%ravi kumar%'
       OR (first_name || ' ' || COALESCE(last_name, '')) ILIKE '%harmeet singh%'
);

-- Delete patient admissions for these patients
DELETE FROM patient_admissions 
WHERE patient_id IN (
    SELECT id FROM patients 
    WHERE first_name ILIKE '%ravi%' AND last_name ILIKE '%kumar%'
       OR first_name ILIKE '%harmeet%' AND last_name ILIKE '%singh%'
       OR (first_name || ' ' || COALESCE(last_name, '')) ILIKE '%ravi kumar%'
       OR (first_name || ' ' || COALESCE(last_name, '')) ILIKE '%harmeet singh%'
);

-- Delete appointments for these patients (if appointments table exists)
DELETE FROM appointments 
WHERE patient_id IN (
    SELECT id FROM patients 
    WHERE first_name ILIKE '%ravi%' AND last_name ILIKE '%kumar%'
       OR first_name ILIKE '%harmeet%' AND last_name ILIKE '%singh%'
       OR (first_name || ' ' || COALESCE(last_name, '')) ILIKE '%ravi kumar%'
       OR (first_name || ' ' || COALESCE(last_name, '')) ILIKE '%harmeet singh%'
);

-- Now delete the patients themselves
DELETE FROM patients 
WHERE first_name ILIKE '%ravi%' AND last_name ILIKE '%kumar%'
   OR first_name ILIKE '%harmeet%' AND last_name ILIKE '%singh%'
   OR (first_name || ' ' || COALESCE(last_name, '')) ILIKE '%ravi kumar%'
   OR (first_name || ' ' || COALESCE(last_name, '')) ILIKE '%harmeet singh%';

-- Show count after deletion
SELECT 'AFTER DELETION' as status, COUNT(*) as total_patients FROM patients;

-- Show remaining patients (to verify correct ones were kept)
SELECT 
    'REMAINING PATIENTS' as info,
    patient_id,
    first_name,
    last_name,
    phone,
    created_at
FROM patients 
ORDER BY created_at DESC
LIMIT 10;

SELECT '✅ DELETION COMPLETE - Removed Ravi Kumar to Harmeet Singh entries only' as result;