-- Run this SQL to ensure all transactions have proper transaction_date values
UPDATE patient_transactions 
SET transaction_date = (
    SELECT COALESCE(p.date_of_entry, DATE(p.created_at))
    FROM patients p 
    WHERE p.id = patient_transactions.patient_id
)
WHERE transaction_date IS NULL OR transaction_date = '';

-- Verify the update
SELECT 
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN transaction_date IS NOT NULL THEN 1 END) as transactions_with_date,
    COUNT(CASE WHEN transaction_date = DATE(created_at) THEN 1 END) as using_created_date,
    COUNT(CASE WHEN transaction_date != DATE(created_at) THEN 1 END) as backdated_transactions
FROM patient_transactions;
