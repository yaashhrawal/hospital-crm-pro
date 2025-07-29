-- Check if discharge_date column exists in patient_admissions table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'patient_admissions' 
AND column_name = 'discharge_date'
ORDER BY column_name;

-- Check the full structure of patient_admissions table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'patient_admissions'
ORDER BY ordinal_position;

-- Check if discharge_summaries table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'discharge_summaries'
) as discharge_summaries_exists;