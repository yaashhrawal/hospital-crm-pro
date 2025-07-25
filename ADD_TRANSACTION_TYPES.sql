-- ADD MISSING TRANSACTION TYPES TO DATABASE
-- This script adds the DISCOUNT transaction type and updates the check constraint

-- Step 1: Check current constraint
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'patient_transactions_transaction_type_ch';

-- Step 2: Drop the existing check constraint
ALTER TABLE patient_transactions 
DROP CONSTRAINT IF EXISTS patient_transactions_transaction_type_ch;

-- Step 3: Add the new check constraint with DISCOUNT type included
ALTER TABLE patient_transactions 
ADD CONSTRAINT patient_transactions_transaction_type_ch 
CHECK (transaction_type IN (
  'ENTRY_FEE', 
  'CONSULTATION', 
  'LAB_TEST', 
  'XRAY', 
  'MEDICINE', 
  'PROCEDURE', 
  'ADMISSION_FEE', 
  'DAILY_CHARGE', 
  'SERVICE', 
  'REFUND',
  'DISCOUNT'  -- New transaction type for discounts
));

-- Step 4: Verify the constraint was updated
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conname = 'patient_transactions_transaction_type_ch';

-- Optional: Check if there are any existing invalid transaction types
SELECT DISTINCT transaction_type, COUNT(*) 
FROM patient_transactions 
GROUP BY transaction_type 
ORDER BY transaction_type;