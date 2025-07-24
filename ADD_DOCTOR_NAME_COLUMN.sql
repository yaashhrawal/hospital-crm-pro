-- Add doctor_name column to patient_transactions table
-- This column is needed by the application code

ALTER TABLE patient_transactions ADD COLUMN IF NOT EXISTS doctor_name TEXT;

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'patient_transactions' 
ORDER BY ordinal_position;