-- Add missing columns to patients table that are referenced in the application

-- Add current_medications column
ALTER TABLE patients ADD COLUMN IF NOT EXISTS current_medications TEXT;

-- Add any other columns that might be missing but referenced in the code
ALTER TABLE patients ADD COLUMN IF NOT EXISTS notes TEXT;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name IN ('current_medications', 'notes')
ORDER BY column_name;