-- Remove hardcoded hospital experience text from departments table

-- First, let's see what's currently stored
SELECT 
    name as department_name,
    specialty,
    hospital_experience
FROM departments
WHERE hospital_experience IS NOT NULL 
   OR hospital_experience != '';

-- Update to remove the hardcoded text
UPDATE departments
SET hospital_experience = NULL
WHERE hospital_experience = 'Ex - Sir Gangaram Hospital New Delhi';

-- Alternative: Update all departments to have NULL hospital_experience
-- This will remove any hardcoded hospital experience text
UPDATE departments
SET hospital_experience = NULL;

-- Verify the update
SELECT 
    name as department_name,
    specialty,
    hospital_experience
FROM departments
ORDER BY name;