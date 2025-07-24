-- MANUAL AGE TEST - Run this in Supabase SQL Editor

-- Check the current age value for the test patient
SELECT patient_id, first_name, last_name, age, created_at
FROM patients 
WHERE first_name = 'test' AND last_name = 'tesh'
ORDER BY created_at DESC 
LIMIT 1;

-- Manually set the age for testing
UPDATE patients 
SET age = '25 years', updated_at = NOW()
WHERE first_name = 'test' AND last_name = 'tesh';

-- Verify the update worked
SELECT patient_id, first_name, last_name, age, updated_at
FROM patients 
WHERE first_name = 'test' AND last_name = 'tesh'
ORDER BY created_at DESC 
LIMIT 1;