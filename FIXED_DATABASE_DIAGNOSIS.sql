-- FIXED DATABASE DIAGNOSIS - Run this in Supabase SQL Editor

-- 1. Check exact table structure (Supabase compatible)
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_name = 'patients'
ORDER BY ordinal_position;

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

-- 4. Try a simple update to see what happens
UPDATE patients 
SET age = 'test123'
WHERE id = 'd7de920b-0fff-409d-b313-5db5c2918cde';

-- 5. Check if the update worked
SELECT id, patient_id, first_name, age, updated_at
FROM patients 
WHERE id = 'd7de920b-0fff-409d-b313-5db5c2918cde';

-- 6. Check if there are any check constraints
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'patients' AND tc.constraint_type = 'CHECK';