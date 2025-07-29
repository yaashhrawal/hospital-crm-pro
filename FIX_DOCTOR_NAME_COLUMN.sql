-- Fix doctor_name column in patient_admissions table

-- Step 1: Add the column if it doesn't exist
ALTER TABLE patient_admissions 
ADD COLUMN IF NOT EXISTS doctor_name TEXT;

-- Step 2: Check if column was added successfully
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'patient_admissions' 
AND column_name = 'doctor_name';

-- Step 3: Check existing admissions to see what data we have
SELECT 
    id,
    patient_id,
    bed_number,
    department,
    doctor_id,
    doctor_name,
    admission_date,
    status
FROM patient_admissions
ORDER BY created_at DESC
LIMIT 10;

-- Step 4: If you have existing admissions without doctor_name but with doctor_id, 
-- you can update them (uncomment if needed):
-- UPDATE patient_admissions pa
-- SET doctor_name = d.name
-- FROM doctors d
-- WHERE pa.doctor_id = d.id
-- AND pa.doctor_name IS NULL;