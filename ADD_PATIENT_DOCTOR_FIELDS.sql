-- Add missing doctor and department fields to patients table
-- This migration ensures all necessary columns exist for tracking patient's doctor and department

-- Add primary_doctor column (main doctor assigned to patient)
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS primary_doctor VARCHAR(255);

-- Add department column (department of the patient)
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS department VARCHAR(100);

-- Add columns for tracking last visit information
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS last_visit_doctor VARCHAR(255);

ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS last_visit_department VARCHAR(100);

ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS last_visit_date TIMESTAMP;

-- Add updated_at column if it doesn't exist
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_patients_primary_doctor ON patients(primary_doctor);
CREATE INDEX IF NOT EXISTS idx_patients_department ON patients(department);
CREATE INDEX IF NOT EXISTS idx_patients_last_visit_doctor ON patients(last_visit_doctor);
CREATE INDEX IF NOT EXISTS idx_patients_updated_at ON patients(updated_at);

-- Add comments to describe the columns
COMMENT ON COLUMN patients.primary_doctor IS 'Primary doctor currently assigned to the patient';
COMMENT ON COLUMN patients.department IS 'Current department of the patient';
COMMENT ON COLUMN patients.last_visit_doctor IS 'Doctor seen in the last visit';
COMMENT ON COLUMN patients.last_visit_department IS 'Department visited in the last visit';
COMMENT ON COLUMN patients.last_visit_date IS 'Date of the last visit';
COMMENT ON COLUMN patients.updated_at IS 'Last update timestamp for the patient record';

-- Update existing patients with default values if needed
UPDATE patients 
SET department = 'GENERAL PHYSICIAN'
WHERE department IS NULL;

-- Verify the columns were added successfully
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name IN ('primary_doctor', 'department', 'last_visit_doctor', 'last_visit_department', 'last_visit_date', 'updated_at')
ORDER BY column_name;