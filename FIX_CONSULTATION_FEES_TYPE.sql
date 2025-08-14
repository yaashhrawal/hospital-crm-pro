-- Fix consultation_fees column to handle the data being sent
-- The error shows JSON array is being sent to consultation_fees instead of numeric

-- Option 1: Make consultation_fees JSONB to store the doctors array
-- (This might be what the form is actually trying to do)
ALTER TABLE patients ALTER COLUMN consultation_fees TYPE JSONB USING 
  CASE 
    WHEN consultation_fees IS NULL THEN NULL
    WHEN consultation_fees::text ~ '^[0-9]+\.?[0-9]*$' THEN consultation_fees::text::jsonb
    ELSE consultation_fees::text::jsonb
  END;

-- Verify what we have now
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name IN ('assigned_doctors', 'consultation_fees')
ORDER BY column_name;