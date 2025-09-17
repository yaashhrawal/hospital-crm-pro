-- Fix existing deposits that don't have transaction_date set
-- This ensures all old deposits use their created_at date as transaction_date
-- Run this in your Supabase SQL Editor

-- Update all patient_transactions that are deposits/advance payments but don't have transaction_date
UPDATE patient_transactions
SET transaction_date = DATE(created_at)
WHERE transaction_type IN ('ADMISSION_FEE', 'DEPOSIT', 'ADVANCE_PAYMENT')
  AND (transaction_date IS NULL OR transaction_date = '');

-- Verify the update
SELECT
    COUNT(*) as total_deposit_records,
    COUNT(CASE WHEN transaction_date IS NOT NULL THEN 1 END) as records_with_transaction_date,
    COUNT(CASE WHEN transaction_date IS NULL THEN 1 END) as records_without_transaction_date
FROM patient_transactions
WHERE transaction_type IN ('ADMISSION_FEE', 'DEPOSIT', 'ADVANCE_PAYMENT');

-- Show sample of updated records
SELECT
    id,
    transaction_type,
    description,
    amount,
    transaction_date,
    DATE(created_at) as created_date,
    CASE
        WHEN transaction_date = DATE(created_at) THEN '✅ Fixed'
        ELSE '❌ Needs Review'
    END as status
FROM patient_transactions
WHERE transaction_type IN ('ADMISSION_FEE', 'DEPOSIT', 'ADVANCE_PAYMENT')
ORDER BY created_at DESC
LIMIT 10;