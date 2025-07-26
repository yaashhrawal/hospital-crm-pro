-- Remove patient with name 'fukrey'
-- Run this in your Supabase SQL Editor

-- First, let's find the patient with name 'fukrey'
SELECT 
    id,
    patient_id,
    first_name,
    last_name,
    phone,
    created_at
FROM patients 
WHERE LOWER(first_name) LIKE '%fukrey%' 
   OR LOWER(last_name) LIKE '%fukrey%'
ORDER BY created_at DESC;

-- Delete the patient with name 'fukrey'
DELETE FROM patients WHERE LOWER(first_name) LIKE '%fukrey%' OR LOWER(last_name) LIKE '%fukrey%';

-- Verify deletion
SELECT 'Patient fukrey has been removed' as result;
