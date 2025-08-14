-- Fix assigned_doctors column type safely from TEXT[] to JSONB

-- First check what type it currently is
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name = 'assigned_doctors';

-- Step 1: Drop the column and recreate it as JSONB
ALTER TABLE patients DROP COLUMN IF EXISTS assigned_doctors;
ALTER TABLE patients ADD COLUMN assigned_doctors JSONB DEFAULT '[]'::jsonb;

-- Step 2: Also fix consultation_fees if needed
ALTER TABLE patients ALTER COLUMN consultation_fees TYPE NUMERIC(10,2) USING 
  CASE 
    WHEN consultation_fees IS NULL THEN 0
    ELSE COALESCE(consultation_fees, 0)
  END;

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name IN ('assigned_doctors', 'consultation_fees')
ORDER BY column_name;