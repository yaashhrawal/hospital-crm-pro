-- Migration: Replace date_of_birth with age column
-- Date: 2025-07-24

-- Step 1: Add age column to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INTEGER;

-- Step 2: Update existing records to calculate age from date_of_birth
UPDATE patients 
SET age = EXTRACT(YEAR FROM age(CURRENT_DATE, date_of_birth))
WHERE date_of_birth IS NOT NULL;

-- Step 3: Make age column NOT NULL after data migration
ALTER TABLE patients ALTER COLUMN age SET NOT NULL;

-- Step 4: Drop the date_of_birth column
ALTER TABLE patients DROP COLUMN date_of_birth;

-- Step 5: Add check constraint for reasonable age values
ALTER TABLE patients ADD CONSTRAINT age_check CHECK (age >= 0 AND age <= 150);

-- Step 6: Update the updated_at timestamp
UPDATE patients SET updated_at = NOW();