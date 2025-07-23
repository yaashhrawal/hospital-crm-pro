-- Add missing reference columns to patients table (if they don't exist)
-- Only run this if has_reference and reference_details columns are missing

ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS has_reference BOOLEAN DEFAULT FALSE;

ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS reference_details TEXT;

-- Update existing patients to have default reference values
UPDATE patients 
SET has_reference = FALSE
WHERE has_reference IS NULL;