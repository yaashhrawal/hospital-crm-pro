-- Check if transaction_date column exists in patient_transactions table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'patient_transactions' 
AND column_name = 'transaction_date';

-- Show all columns in patient_transactions table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'patient_transactions' 
ORDER BY ordinal_position;