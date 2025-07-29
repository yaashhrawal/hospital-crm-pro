-- Check if doctors table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'doctors'
) as doctors_table_exists;

-- Check doctors table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'doctors'
ORDER BY ordinal_position;

-- Check if there are any doctors
SELECT COUNT(*) as doctor_count FROM doctors;

-- Get sample doctors data
SELECT * FROM doctors LIMIT 5;