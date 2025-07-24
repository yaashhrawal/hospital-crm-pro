-- DEBUG AGE COLUMN - Run this in Supabase SQL Editor

-- Check if age column exists and its properties
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'patients' AND column_name = 'age';

-- Check recent patients and their age values
SELECT patient_id, first_name, last_name, age, created_at
FROM patients 
ORDER BY created_at DESC 
LIMIT 10;

-- Check the specific patient that was just created (adjust patient_id as needed)
SELECT patient_id, first_name, last_name, age, date_of_birth, created_at
FROM patients 
WHERE first_name = 'test' AND last_name = 'tesh'
ORDER BY created_at DESC 
LIMIT 1;