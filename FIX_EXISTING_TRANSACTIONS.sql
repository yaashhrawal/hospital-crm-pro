-- Fix existing transactions to use patient's date_of_entry for transaction_date
-- This will link transaction history with the patient's actual entry date

UPDATE patient_transactions 
SET transaction_date = (
    SELECT date_of_entry 
    FROM patients 
    WHERE patients.id = patient_transactions.patient_id
)
WHERE transaction_date IS NULL 
   OR transaction_date = DATE(created_at);

-- For transactions where patient doesn't have date_of_entry, use created_at date
UPDATE patient_transactions 
SET transaction_date = DATE(created_at)
WHERE transaction_date IS NULL;

-- Verify the update
SELECT 
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN transaction_date IS NOT NULL THEN 1 END) as transactions_with_date,
    COUNT(CASE WHEN transaction_date != DATE(created_at) THEN 1 END) as backdated_transactions
FROM patient_transactions;