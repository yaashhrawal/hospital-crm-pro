-- ⚡ URGENT FIX: Update all transaction dates to match patient entry dates
-- Run this SQL in Supabase SQL Editor to fix the dashboard data immediately

-- STEP 1: Update transactions to use patient entry dates
UPDATE patient_transactions 
SET transaction_date = (
    SELECT 
        CASE 
            WHEN p.date_of_entry IS NOT NULL AND p.date_of_entry != '' THEN p.date_of_entry
            ELSE DATE(p.created_at)
        END
    FROM patients p 
    WHERE p.id = patient_transactions.patient_id
)
WHERE transaction_date IS NULL 
   OR transaction_date = '' 
   OR transaction_date = DATE(created_at);

-- STEP 2: Verify the fix worked
SELECT 
    'VERIFICATION RESULTS' as status,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN transaction_date IS NOT NULL THEN 1 END) as transactions_with_date,
    COUNT(CASE WHEN transaction_date != DATE(created_at) THEN 1 END) as backdated_transactions,
    COUNT(CASE WHEN transaction_date = DATE(created_at) THEN 1 END) as same_day_transactions
FROM patient_transactions;

-- STEP 3: Check specific examples
SELECT 
    p.first_name,
    p.last_name,
    p.date_of_entry as patient_entry_date,
    pt.transaction_date,
    DATE(pt.created_at) as created_date,
    pt.transaction_type,
    pt.amount,
    CASE 
        WHEN pt.transaction_date = p.date_of_entry THEN '✅ CORRECT'
        WHEN pt.transaction_date = DATE(pt.created_at) THEN '⚠️ USING CREATED DATE'
        ELSE '❌ MISMATCH'
    END as status
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
WHERE pt.status = 'COMPLETED'
ORDER BY pt.created_at DESC
LIMIT 10;