-- Remove test patients with specific names
-- Run this in your Supabase SQL Editor

-- First, let's see what patients we're about to delete
SELECT id, first_name, last_name, patient_id, phone, created_at 
FROM patients 
WHERE LOWER(first_name) IN ('testst', 'divyansh', 'testing')
   OR LOWER(last_name) IN ('testst', 'divyansh', 'testing')
   OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%testst%'
   OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%divyansh%'
   OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%testing%';

-- Delete related records first to avoid foreign key constraints

-- Delete patient transactions
DELETE FROM patient_transactions 
WHERE patient_id IN (
    SELECT id FROM patients 
    WHERE LOWER(first_name) IN ('testst', 'divyansh', 'testing')
       OR LOWER(last_name) IN ('testst', 'divyansh', 'testing')
       OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%testst%'
       OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%divyansh%'
       OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%testing%'
);

-- Delete patient admissions
DELETE FROM patient_admissions 
WHERE patient_id IN (
    SELECT id FROM patients 
    WHERE LOWER(first_name) IN ('testst', 'divyansh', 'testing')
       OR LOWER(last_name) IN ('testst', 'divyansh', 'testing')
       OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%testst%'
       OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%divyansh%'
       OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%testing%'
);

-- Delete appointments
DELETE FROM appointments 
WHERE patient_id IN (
    SELECT id FROM patients 
    WHERE LOWER(first_name) IN ('testst', 'divyansh', 'testing')
       OR LOWER(last_name) IN ('testst', 'divyansh', 'testing')
       OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%testst%'
       OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%divyansh%'
       OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%testing%'
);

-- Finally, delete the patients themselves
DELETE FROM patients 
WHERE LOWER(first_name) IN ('testst', 'divyansh', 'testing')
   OR LOWER(last_name) IN ('testst', 'divyansh', 'testing')
   OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%testst%'
   OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%divyansh%'
   OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%testing%';

-- Verify deletion
SELECT COUNT(*) as remaining_test_patients 
FROM patients 
WHERE LOWER(first_name) IN ('testst', 'divyansh', 'testing')
   OR LOWER(last_name) IN ('testst', 'divyansh', 'testing')
   OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%testst%'
   OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%divyansh%'
   OR LOWER(CONCAT(first_name, ' ', last_name)) LIKE '%testing%';