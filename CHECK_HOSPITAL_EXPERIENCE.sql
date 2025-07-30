-- Check if hospital_experience data exists in departments table

-- First, let's see all departments and their data
SELECT 
    id,
    name as department_name,
    specialty,
    hospital_experience,
    created_at
FROM departments
ORDER BY name;

-- Check specifically for ORTHOPAEDIC department
SELECT 
    name,
    specialty,
    hospital_experience
FROM departments
WHERE name LIKE '%ORTHO%';

-- If you need to add hospital_experience data, use this:
-- UPDATE departments
-- SET hospital_experience = 'Ex - Sir Gangaram Hospital New Delhi'
-- WHERE name = 'ORTHOPAEDIC';

-- Or update a specific department with specific hospital experience
-- UPDATE departments
-- SET 
--     specialty = 'Knee Specialist',
--     hospital_experience = 'Ex - Sir Gangaram Hospital New Delhi'
-- WHERE name = 'ORTHOPAEDIC';