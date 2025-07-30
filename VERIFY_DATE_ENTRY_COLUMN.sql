-- Verify if date_of_entry column exists and check sample data
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patients' 
AND column_name = 'date_of_entry';

-- If the column exists, let's see some sample data
SELECT 
    patient_id,
    first_name,
    last_name,
    date_of_entry,
    created_at
FROM patients 
ORDER BY created_at DESC 
LIMIT 5;