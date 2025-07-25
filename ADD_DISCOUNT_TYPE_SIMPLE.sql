-- SIMPLE FIX FOR TRANSACTION TYPE ERROR
-- Run this in Supabase SQL Editor to add DISCOUNT transaction type

-- Drop and recreate the check constraint with DISCOUNT type
ALTER TABLE patient_transactions 
DROP CONSTRAINT IF EXISTS patient_transactions_transaction_type_ch;

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
  'DISCOUNT'
));

-- Verify the fix worked
SELECT 'DISCOUNT transaction type added successfully' as result;