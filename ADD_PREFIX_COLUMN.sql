-- Add prefix column to patients table
-- Run this in your Supabase SQL Editor

-- Add prefix column to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS prefix TEXT CHECK (prefix IN ('Mr', 'Mrs', 'Ms', 'Dr', 'Prof'));

-- Set default prefix based on gender for existing patients
UPDATE patients 
SET prefix = CASE 
    WHEN gender = 'MALE' THEN 'Mr'
    WHEN gender = 'FEMALE' THEN 'Ms'
    ELSE 'Mr'
END
WHERE prefix IS NULL;

-- Show the updated table structure
SELECT 
    'PATIENTS TABLE STRUCTURE WITH PREFIX' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'patients'
AND column_name IN ('prefix', 'first_name', 'last_name', 'gender')
ORDER BY ordinal_position;

-- Show sample data with prefix
SELECT 
    'SAMPLE PATIENTS WITH PREFIX' as info,
    prefix,
    first_name,
    last_name,
    gender,
    patient_id
FROM patients 
ORDER BY created_at DESC
LIMIT 5;

SELECT '✅ PREFIX COLUMN ADDED SUCCESSFULLY' as result;