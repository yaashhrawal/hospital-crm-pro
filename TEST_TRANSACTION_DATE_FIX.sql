-- Test script to verify transaction_date functionality

-- 1. Check if transaction_date column exists
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'patient_transactions' 
AND column_name = 'transaction_date';

-- 2. Check recent transactions and their dates
SELECT 
    id,
    patient_id,
    transaction_type,
    amount,
    transaction_date,
    created_at,
    description
FROM patient_transactions 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. Check if any transactions have transaction_date different from created_at date
SELECT 
    COUNT(*) as total_transactions,
    COUNT(transaction_date) as transactions_with_date,
    COUNT(CASE WHEN DATE(transaction_date) != DATE(created_at) THEN 1 END) as backdated_transactions
FROM patient_transactions;

-- 4. Show transactions grouped by transaction_date vs created_at date
SELECT 
    DATE(transaction_date) as transaction_date,
    DATE(created_at) as created_date,
    COUNT(*) as count
FROM patient_transactions 
WHERE transaction_date IS NOT NULL
GROUP BY DATE(transaction_date), DATE(created_at)
ORDER BY transaction_date DESC;