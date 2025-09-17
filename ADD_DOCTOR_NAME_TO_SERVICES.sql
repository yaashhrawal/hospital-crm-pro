-- Add assigned doctor name to each service of patients
-- This script adds doctorName field to ipd_services table and populates it from patients.assigned_doctor

-- Step 1: Add doctorName column to ipd_services table
ALTER TABLE ipd_services
ADD COLUMN IF NOT EXISTS doctor_name TEXT;

-- Step 2: Update all existing services with doctorName from their patient's assigned_doctor
UPDATE ipd_services
SET doctor_name = patients.assigned_doctor
FROM patients
WHERE ipd_services.patient_id = patients.id
AND patients.assigned_doctor IS NOT NULL;

-- Step 3: Set a default value for services where patient doesn't have assigned_doctor
UPDATE ipd_services
SET doctor_name = 'Not Assigned'
WHERE doctor_name IS NULL;

-- Step 4: Add index for better performance on doctorName queries
CREATE INDEX IF NOT EXISTS idx_ipd_services_doctor_name ON ipd_services(doctor_name);

-- Step 5: Add comment to explain the column
COMMENT ON COLUMN ipd_services.doctor_name IS 'Name of the doctor assigned to the patient (copied from patients.assigned_doctor)';

-- Step 6: Create a function to automatically set doctorName when inserting new services
CREATE OR REPLACE FUNCTION set_service_doctor_name()
RETURNS TRIGGER AS $$
BEGIN
    -- Get the assigned doctor from the patient record
    SELECT assigned_doctor INTO NEW.doctor_name
    FROM patients
    WHERE id = NEW.patient_id;

    -- Set default if no assigned doctor found
    IF NEW.doctor_name IS NULL THEN
        NEW.doctor_name := 'Not Assigned';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create trigger to automatically set doctorName for new service records
DROP TRIGGER IF EXISTS trigger_set_service_doctor_name ON ipd_services;
CREATE TRIGGER trigger_set_service_doctor_name
    BEFORE INSERT ON ipd_services
    FOR EACH ROW
    EXECUTE FUNCTION set_service_doctor_name();

-- Step 8: Verification query - Show updated services with doctorName
SELECT
    s.id as service_id,
    s.service_name,
    s.service_type,
    s.doctor_name,
    p.patient_id,
    p.first_name,
    p.last_name,
    p.assigned_doctor as patient_assigned_doctor
FROM ipd_services s
JOIN patients p ON s.patient_id = p.id
ORDER BY p.patient_id, s.created_at
LIMIT 20;

-- Step 9: Summary of the update
SELECT
    COUNT(*) as total_services,
    COUNT(CASE WHEN doctor_name IS NOT NULL AND doctor_name != 'Not Assigned' THEN 1 END) as services_with_doctor,
    COUNT(CASE WHEN doctor_name = 'Not Assigned' THEN 1 END) as services_without_doctor
FROM ipd_services;

SELECT 'Doctor names successfully added to all patient services!' as result;