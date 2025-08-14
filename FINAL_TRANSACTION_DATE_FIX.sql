-- FINAL FIX: Force all transactions to use patient's date_of_entry
-- This will fix the TEST patient and all others

-- 1. Update ALL transactions to use their patient's date_of_entry
UPDATE patient_transactions 
SET transaction_date = (
    SELECT date_of_entry 
    FROM patients 
    WHERE patients.id = patient_transactions.patient_id
    AND patients.date_of_entry IS NOT NULL
)
WHERE EXISTS (
    SELECT 1 FROM patients 
    WHERE patients.id = patient_transactions.patient_id 
    AND patients.date_of_entry IS NOT NULL
);

-- 2. For patients without date_of_entry, use their created_at date
UPDATE patient_transactions 
SET transaction_date = (
    SELECT DATE(created_at)
    FROM patients 
    WHERE patients.id = patient_transactions.patient_id
)
WHERE transaction_date IS NULL;

-- 3. Verify the fix specifically for recent patients
SELECT 
    p.first_name,
    p.last_name,
    p.date_of_entry as patient_entry_date,
    pt.transaction_type,
    pt.amount,
    pt.transaction_date as transaction_date,
    DATE(pt.created_at) as transaction_created_date,
    CASE 
        WHEN pt.transaction_date = p.date_of_entry THEN '✅ FIXED'
        ELSE '❌ STILL WRONG'
    END as status
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
WHERE p.first_name = 'TEST' 
   OR p.created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY pt.created_at DESC
LIMIT 10;