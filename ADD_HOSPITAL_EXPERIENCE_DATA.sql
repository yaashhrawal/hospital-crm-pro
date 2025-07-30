-- Add hospital_experience data to departments

-- First check current data
SELECT name, specialty, hospital_experience 
FROM departments;

-- Update ORTHOPAEDIC department with hospital experience
UPDATE departments
SET 
    specialty = 'Knee Specialist',
    hospital_experience = 'Ex - Sir Gangaram Hospital New Delhi'
WHERE name = 'ORTHOPAEDIC' OR name = 'Orthopaedics';

-- If the above doesn't work, try case-insensitive
UPDATE departments
SET 
    specialty = 'Knee Specialist',
    hospital_experience = 'Ex - Sir Gangaram Hospital New Delhi'
WHERE UPPER(name) LIKE '%ORTHO%';

-- You can also update other departments if needed
-- UPDATE departments
-- SET hospital_experience = 'Ex - Apollo Hospital'
-- WHERE name = 'Cardiology';

-- Verify the update
SELECT name, specialty, hospital_experience 
FROM departments
ORDER BY name;