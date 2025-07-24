-- Migration: Update age column to accept flexible text input
-- Date: 2025-07-24
-- Purpose: Allow users to enter age in flexible formats like "25", "30 years", "6 months"

-- Step 1: Remove the existing age check constraint
ALTER TABLE patients DROP CONSTRAINT IF EXISTS age_check;

-- Step 2: Change age column to TEXT and make it nullable
ALTER TABLE patients ALTER COLUMN age TYPE TEXT USING age::TEXT;
ALTER TABLE patients ALTER COLUMN age DROP NOT NULL;

-- Step 3: Update the updated_at timestamp
UPDATE patients SET updated_at = NOW();

-- Verification query (run separately):
-- SELECT column_name, data_type, is_nullable FROM information_schema.columns 
-- WHERE table_name = 'patients' AND column_name = 'age';