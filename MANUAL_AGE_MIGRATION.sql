-- ========================================
-- MANUAL AGE COLUMN MIGRATION
-- Run these commands in Supabase SQL Editor
-- ========================================

-- Step 1: Add age column to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INTEGER;

-- Step 2: Update existing records to calculate age from date_of_birth
UPDATE patients 
SET age = EXTRACT(YEAR FROM age(CURRENT_DATE, date_of_birth))
WHERE date_of_birth IS NOT NULL AND age IS NULL;

-- Step 3: Make age column NOT NULL (after data migration)
ALTER TABLE patients ALTER COLUMN age SET NOT NULL;

-- Step 4: Add check constraint for reasonable age values
ALTER TABLE patients ADD CONSTRAINT IF NOT EXISTS age_check CHECK (age >= 0 AND age <= 150);

-- Step 5: Drop the date_of_birth column (CAREFUL: This is irreversible!)
ALTER TABLE patients DROP COLUMN IF EXISTS date_of_birth;

-- Step 6: Update the updated_at timestamp for all patients
UPDATE patients SET updated_at = NOW();

-- Verification: Check the new structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'patients' 
ORDER BY ordinal_position;

-- Sample query to verify age data
SELECT patient_id, first_name, last_name, age, gender 
FROM patients 
LIMIT 5;