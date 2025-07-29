-- Debug queries to check discharge tables and data

-- 1. Check if discharge_summaries table exists
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'discharge_summaries'
ORDER BY ordinal_position;

-- 2. Check if discharge_bills table exists  
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'discharge_bills'
ORDER BY ordinal_position;

-- 3. Check existing discharge summaries (if any)
SELECT id, admission_id, patient_id, final_diagnosis, primary_consultant, created_at
FROM discharge_summaries
ORDER BY created_at DESC
LIMIT 5;

-- 4. Check patient_admissions with DISCHARGED status
SELECT id, patient_id, status, admission_date, discharge_date, created_at
FROM patient_admissions 
WHERE status = 'DISCHARGED'
ORDER BY created_at DESC
LIMIT 5;

-- 5. Check if there are any foreign key constraint issues
SELECT 
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='discharge_summaries';