-- DEBUG: Check what's actually in the database

-- 1. Check if transaction_date column exists and has data
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'patient_transactions' 
AND column_name IN ('transaction_date', 'created_at');

-- 2. Check recent patients and their date_of_entry
SELECT 
    id,
    patient_id,
    first_name,
    last_name,
    date_of_entry,
    DATE(created_at) as created_date,
    created_at
FROM patients 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check recent transactions and their dates
SELECT 
    pt.id,
    pt.patient_id,
    pt.transaction_type,
    pt.amount,
    pt.transaction_date,
    DATE(pt.created_at) as created_date,
    pt.created_at,
    p.date_of_entry as patient_entry_date,
    p.first_name,
    p.last_name
FROM patient_transactions pt
LEFT JOIN patients p ON p.id = pt.patient_id
ORDER BY pt.created_at DESC 
LIMIT 10;

-- 4. Check transactions for the specific August 7th patient
SELECT 
    pt.id,
    pt.transaction_type,
    pt.amount,
    pt.transaction_date,
    DATE(pt.created_at) as created_date,
    pt.description,
    p.first_name,
    p.last_name,
    p.date_of_entry
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
WHERE p.date_of_entry = '2024-08-07'
   OR DATE(p.created_at) = '2024-08-07'
ORDER BY pt.created_at DESC;