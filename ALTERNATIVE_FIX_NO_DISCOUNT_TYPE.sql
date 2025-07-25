-- ALTERNATIVE APPROACH: Just check current constraint without DISCOUNT type
-- This approach modifies the code to not create separate DISCOUNT transactions

-- Check what transaction types are currently allowed
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'patient_transactions'::regclass 
  AND contype = 'c'
  AND conname LIKE '%transaction_type%';

-- List current allowed types based on existing data
SELECT DISTINCT transaction_type, COUNT(*) as count
FROM patient_transactions 
GROUP BY transaction_type 
ORDER BY transaction_type;

-- No database changes needed - we'll modify the code instead