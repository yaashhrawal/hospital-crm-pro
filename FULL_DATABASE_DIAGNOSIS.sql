-- FULL DATABASE DIAGNOSIS - Run this in Supabase SQL Editor

-- 1. Check exact table structure
\d patients

-- 2. Check all triggers on patients table
SELECT 
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement,
    action_condition
FROM information_schema.triggers
WHERE event_object_table = 'patients'
ORDER BY trigger_name;

-- 3. Check all functions that might be called by triggers
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines
WHERE routine_name LIKE '%patient%' OR routine_name LIKE '%age%'
ORDER BY routine_name;

-- 4. Try a very simple update to see what happens
UPDATE patients 
SET age = 'test123'
WHERE id = 'd7de920b-0fff-409d-b313-5db5c2918cde'
RETURNING id, age, updated_at;

-- 5. Check if there are any check constraints on age column
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(c.oid) as constraint_definition
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
WHERE t.relname = 'patients' AND conname LIKE '%age%';

-- 6. Check the current value after our test update
SELECT id, patient_id, first_name, age, updated_at
FROM patients 
WHERE id = 'd7de920b-0fff-409d-b313-5db5c2918cde';