-- ADD MULTIPLE DOCTORS SUPPORT TO PATIENTS TABLE
-- This adds support for multiple doctor assignments while keeping backward compatibility

-- Step 1: Add new column for multiple doctors (as JSONB array)
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS assigned_doctors JSONB DEFAULT '[]'::jsonb;

-- Step 2: Add comment for clarity
COMMENT ON COLUMN patients.assigned_doctors IS 'Array of assigned doctors with their departments: [{"name": "DR. JOHN DOE", "department": "CARDIOLOGY"}, ...]';

-- Step 3: Create index for better performance on JSONB queries
CREATE INDEX IF NOT EXISTS idx_patients_assigned_doctors 
ON patients USING GIN (assigned_doctors);

-- Step 4: Migrate existing single doctor assignments to multiple doctors array
UPDATE patients 
SET assigned_doctors = 
  CASE 
    WHEN assigned_doctor IS NOT NULL AND assigned_department IS NOT NULL THEN
      jsonb_build_array(
        jsonb_build_object(
          'name', assigned_doctor,
          'department', assigned_department,
          'isPrimary', true
        )
      )
    WHEN assigned_doctor IS NOT NULL THEN
      jsonb_build_array(
        jsonb_build_object(
          'name', assigned_doctor,
          'department', 'GENERAL',
          'isPrimary', true
        )
      )
    ELSE '[]'::jsonb
  END
WHERE assigned_doctors = '[]'::jsonb;

-- Step 5: Verify the migration
SELECT 
  patient_id,
  first_name,
  last_name,
  assigned_doctor,
  assigned_department,
  assigned_doctors
FROM patients 
WHERE assigned_doctor IS NOT NULL 
LIMIT 5;

-- Step 6: Check the structure
SELECT 
  COUNT(*) as total_patients,
  COUNT(CASE WHEN assigned_doctors != '[]'::jsonb THEN 1 END) as patients_with_doctors,
  COUNT(CASE WHEN jsonb_array_length(assigned_doctors) > 1 THEN 1 END) as patients_with_multiple_doctors
FROM patients;

SELECT 'Multiple doctors support added successfully!' as result;