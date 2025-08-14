-- COMPLETE BACKDATE FIX SQL SCRIPT
-- Run this to fix all existing transactions and ensure proper backdating

-- 1. First, ensure transaction_date column exists
ALTER TABLE patient_transactions
ADD COLUMN IF NOT EXISTS transaction_date DATE;

-- 2. Update ALL existing transactions to use their patient's date_of_entry
-- This links transaction history with the patient's actual entry date
UPDATE patient_transactions 
SET transaction_date = (
    SELECT COALESCE(date_of_entry, DATE(created_at))
    FROM patients 
    WHERE patients.id = patient_transactions.patient_id
)
WHERE transaction_date IS NULL;

-- 3. For any remaining NULL transaction_dates, use created_at date
UPDATE patient_transactions 
SET transaction_date = DATE(created_at)
WHERE transaction_date IS NULL;

-- 4. Verify the fix - check if transactions now have proper dates
SELECT 
    'Fix Status' as info,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN transaction_date IS NOT NULL THEN 1 END) as transactions_with_date,
    COUNT(CASE WHEN transaction_date != DATE(created_at) THEN 1 END) as backdated_transactions,
    COUNT(CASE WHEN transaction_date = DATE(created_at) THEN 1 END) as same_day_transactions
FROM patient_transactions;

-- 5. Show sample of fixed transactions
SELECT 
    pt.id,
    p.first_name,
    p.last_name,
    p.date_of_entry as patient_entry_date,
    pt.transaction_date,
    DATE(pt.created_at) as created_date,
    pt.transaction_type,
    pt.amount,
    CASE 
        WHEN pt.transaction_date = p.date_of_entry THEN 'LINKED TO PATIENT ENTRY'
        WHEN pt.transaction_date = DATE(pt.created_at) THEN 'SAME DAY'
        ELSE 'OTHER'
    END as date_source
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
ORDER BY pt.created_at DESC
LIMIT 10;