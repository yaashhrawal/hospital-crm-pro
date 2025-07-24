-- Add missing hospital_id column to beds table

ALTER TABLE beds ADD COLUMN IF NOT EXISTS hospital_id TEXT DEFAULT 'default-hospital';

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'beds' 
AND column_name = 'hospital_id';