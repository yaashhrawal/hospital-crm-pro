-- Add missing doctor and department columns to patients table
-- This migration adds the missing assigned_doctor and assigned_department columns

-- Add the assigned_doctor column to the patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS assigned_doctor VARCHAR(100);

-- Add the assigned_department column to the patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS assigned_department VARCHAR(100);

-- Add reference columns that might also be missing
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS has_reference BOOLEAN DEFAULT FALSE;

ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS reference_details TEXT;

-- Add comments to describe the columns
COMMENT ON COLUMN patients.assigned_doctor IS 'Doctor assigned to the patient (e.g., DR. BATUL PEEPAWALA)';
COMMENT ON COLUMN patients.assigned_department IS 'Department assigned to the patient (e.g., ORTHOPAEDIC, GASTRO, GENERAL PHYSICIAN)';
COMMENT ON COLUMN patients.has_reference IS 'Whether the patient has a reference';
COMMENT ON COLUMN patients.reference_details IS 'Reference details if patient has reference';

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_assigned_doctor ON patients(assigned_doctor);
CREATE INDEX IF NOT EXISTS idx_patients_assigned_department ON patients(assigned_department);

-- Update existing patients to have default values if they don't have them
UPDATE patients 
SET assigned_department = 'GENERAL PHYSICIAN', 
    assigned_doctor = 'DR. BATUL PEEPAWALA',
    has_reference = FALSE
WHERE assigned_department IS NULL OR assigned_doctor IS NULL;

-- Verify the columns were added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name IN ('assigned_doctor', 'assigned_department', 'has_reference', 'reference_details')
ORDER BY column_name;