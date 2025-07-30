-- Update all ORTHOPEDIC references to ORTHOPAEDIC in the database
-- Run this SQL script in your Supabase SQL Editor

-- Update departments table
UPDATE departments 
SET name = 'ORTHOPAEDIC', 
    description = 'Orthopaedic Surgery and Bone Care'
WHERE name = 'ORTHOPEDIC';

-- Update doctors table - department field
UPDATE doctors 
SET department = 'ORTHOPAEDIC'
WHERE department = 'ORTHOPEDIC';

-- Update doctors table - specialization field
UPDATE doctors 
SET specialization = 'Orthopaedic Surgeon'
WHERE specialization = 'Orthopedic Surgeon';

-- Update patients table - assigned_department field
UPDATE patients 
SET assigned_department = 'ORTHOPAEDIC'
WHERE assigned_department = 'ORTHOPEDIC';

-- Update any other references in other tables if they exist
-- Update patient_transactions table if it has department references
UPDATE patient_transactions 
SET department = 'ORTHOPAEDIC'
WHERE department = 'ORTHOPEDIC';

-- Update patient_admissions table if it has department references
UPDATE patient_admissions 
SET department = 'ORTHOPAEDIC'
WHERE department = 'ORTHOPEDIC';

-- Also check for variations in spelling
UPDATE departments 
SET name = 'ORTHOPAEDIC'
WHERE name ILIKE '%orthopedic%';

UPDATE doctors 
SET department = 'ORTHOPAEDIC'
WHERE department ILIKE '%orthopedic%';

UPDATE doctors 
SET specialization = 'Orthopaedic Surgeon'
WHERE specialization ILIKE '%orthopedic%';

UPDATE patients 
SET assigned_department = 'ORTHOPAEDIC'
WHERE assigned_department ILIKE '%orthopedic%';

-- Verify the changes
SELECT 'Departments with ORTHOPAEDIC:' as info;
SELECT name, description FROM departments WHERE name ILIKE '%orthopaedic%';

SELECT 'Doctors in ORTHOPAEDIC department:' as info;
SELECT name, department, specialization FROM doctors WHERE department ILIKE '%orthopaedic%';

SELECT 'Patients assigned to ORTHOPAEDIC:' as info;
SELECT COUNT(*) as patient_count FROM patients WHERE assigned_department ILIKE '%orthopaedic%';