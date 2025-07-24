-- FIX AGE TRIGGER - Run this in Supabase SQL Editor
-- This will disable the automatic age calculation trigger

-- Option 1: DROP the trigger completely (RECOMMENDED)
-- This allows manual age entry without interference
DROP TRIGGER IF EXISTS trigger_calculate_age ON patients;

-- Option 2: If you want to see the trigger function first, run this:
-- SELECT routine_definition FROM information_schema.routines WHERE routine_name = 'calculate_age';

-- After dropping the trigger, test that manual age setting works:
UPDATE patients 
SET age = '25 years'
WHERE id = 'd7de920b-0fff-409d-b313-5db5c2918cde';

-- Verify the fix worked:
SELECT id, patient_id, first_name, last_name, age, date_of_birth
FROM patients 
WHERE id = 'd7de920b-0fff-409d-b313-5db5c2918cde';