-- FIX AGE COLUMN - Run this in Supabase SQL Editor
-- This will allow flexible age input as text instead of integer

-- Step 1: Remove the age check constraint
ALTER TABLE patients DROP CONSTRAINT IF EXISTS age_check;

-- Step 2: Change age column from INTEGER to TEXT and make it nullable
ALTER TABLE patients ALTER COLUMN age TYPE TEXT USING age::TEXT;
ALTER TABLE patients ALTER COLUMN age DROP NOT NULL;

-- Step 3: Update timestamp
UPDATE patients SET updated_at = NOW();

-- Verification (should show data_type as 'text' and is_nullable as 'YES')
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'patients' AND column_name = 'age';