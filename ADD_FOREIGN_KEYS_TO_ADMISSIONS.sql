-- Add foreign key columns to patient_admissions table to link with departments and doctors tables

-- Add department_id column if it doesn't exist
ALTER TABLE patient_admissions 
ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- Add doctor_id column if it doesn't exist  
ALTER TABLE patient_admissions 
ADD COLUMN IF NOT EXISTS doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_admissions_department_id ON patient_admissions(department_id);
CREATE INDEX IF NOT EXISTS idx_patient_admissions_doctor_id ON patient_admissions(doctor_id);

-- Verify the columns were added
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'patient_admissions' 
AND column_name IN ('department_id', 'doctor_id', 'department', 'doctor_name')
ORDER BY column_name;