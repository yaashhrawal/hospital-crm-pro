-- UPDATE EXISTING AGES - Optional cleanup script
-- Run this in Supabase SQL Editor if you have existing patients with missing ages

-- Check current age values
SELECT id, patient_id, first_name, last_name, age, date_of_birth 
FROM patients 
WHERE age IS NULL OR age = '' OR age = '0'
ORDER BY created_at DESC;

-- If you want to set default ages for patients without age data:
-- UPDATE patients 
-- SET age = 'N/A', updated_at = NOW()
-- WHERE age IS NULL OR age = '' OR age = '0';

-- To verify the update:
-- SELECT id, patient_id, first_name, last_name, age 
-- FROM patients 
-- WHERE age = 'N/A';