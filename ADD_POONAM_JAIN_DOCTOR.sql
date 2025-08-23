-- Add Dr. Poonam Jain to doctors table
-- First add PHYSIOTHERAPY department if it doesn't exist
INSERT INTO departments (name, description, is_active) 
SELECT 'PHYSIOTHERAPY', 'Physiotherapy and Rehabilitation', true
WHERE NOT EXISTS (
    SELECT 1 FROM departments WHERE name = 'PHYSIOTHERAPY'
);

-- Add Dr. Poonam Jain if she doesn't exist
INSERT INTO doctors (name, department, specialization, fee, is_active) 
SELECT 'DR. POONAM JAIN', 'PHYSIOTHERAPY', 'Physiotherapist', 600.00, true
WHERE NOT EXISTS (
    SELECT 1 FROM doctors WHERE name = 'DR. POONAM JAIN'
);

-- Verify the additions
SELECT COUNT(*) as total_departments FROM departments;
SELECT * FROM departments WHERE name = 'PHYSIOTHERAPY';

SELECT COUNT(*) as total_doctors FROM doctors;
SELECT * FROM doctors WHERE name = 'DR. POONAM JAIN';