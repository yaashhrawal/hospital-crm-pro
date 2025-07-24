-- TEST UPDATE AGE - Run this in Supabase SQL Editor

-- Check the current patient data
SELECT id, patient_id, first_name, last_name, age, updated_at
FROM patients 
WHERE id = 'd7de920b-0fff-409d-b313-5db5c2918cde';

-- Try to manually update the age
UPDATE patients 
SET age = '35 years', updated_at = NOW()
WHERE id = 'd7de920b-0fff-409d-b313-5db5c2918cde';

-- Check if the update worked
SELECT id, patient_id, first_name, last_name, age, updated_at
FROM patients 
WHERE id = 'd7de920b-0fff-409d-b313-5db5c2918cde';

-- Check if there are any triggers on the patients table that might be interfering
SELECT trigger_name, event_manipulation, action_statement
FROM information_schema.triggers
WHERE event_object_table = 'patients';