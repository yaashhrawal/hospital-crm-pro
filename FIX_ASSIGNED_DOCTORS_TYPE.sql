-- Fix assigned_doctors column type to handle JSON arrays properly
-- The error shows JSON array data being stored in wrong column type

-- Check current column types
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name IN ('assigned_doctors', 'consultation_fees')
ORDER BY column_name;

-- Fix assigned_doctors to store JSON properly  
ALTER TABLE patients ALTER COLUMN assigned_doctors TYPE JSONB USING assigned_doctors::jsonb;

-- Also check if consultation_fees is causing issues
-- Make sure it can handle numeric values properly
ALTER TABLE patients ALTER COLUMN consultation_fees TYPE NUMERIC(10,2) USING 
  CASE 
    WHEN consultation_fees ~ '^[0-9]+\.?[0-9]*$' THEN consultation_fees::numeric
    ELSE 0
  END;

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name IN ('assigned_doctors', 'consultation_fees')
ORDER BY column_name;