-- Add date_of_entry column to patients table
-- This column will store when the patient was registered/entered into the system

-- Add the date_of_entry column to the patients table
ALTER TABLE patients 
ADD COLUMN date_of_entry DATE;

-- Update existing records to use created_at date as date_of_entry
UPDATE patients 
SET date_of_entry = DATE(created_at) 
WHERE date_of_entry IS NULL;

-- Set the column to NOT NULL after updating existing records
-- ALTER TABLE patients 
-- ALTER COLUMN date_of_entry SET NOT NULL;

-- Add a comment to document the column purpose
COMMENT ON COLUMN patients.date_of_entry IS 'Date when the patient was registered/entered into the system';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'patients' AND column_name = 'date_of_entry';