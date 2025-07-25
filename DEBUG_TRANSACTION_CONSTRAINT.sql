-- COMPREHENSIVE TRANSACTION CONSTRAINT DEBUG AND FIX
-- Run each section step by step to diagnose and fix the issue

-- 🔍 STEP 1: Check current constraint definition
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'patient_transactions'::regclass 
  AND contype = 'c'
  AND conname LIKE '%transaction_type%';

-- 🔍 STEP 2: Check if constraint exists and get exact name
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_name = 'patient_transactions' 
  AND tc.constraint_type = 'CHECK'
  AND cc.check_clause LIKE '%transaction_type%';

-- 🔍 STEP 3: Check table structure to verify column exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'patient_transactions' 
  AND column_name = 'transaction_type';

-- 🔍 STEP 4: Check existing transaction types in the table
SELECT DISTINCT transaction_type, COUNT(*) as count
FROM patient_transactions 
GROUP BY transaction_type 
ORDER BY transaction_type;

-- 🗑️ STEP 5: Drop ALL transaction_type constraints (multiple variations)
DO $$
DECLARE
  constraint_name text;
BEGIN
  FOR constraint_name IN 
    SELECT tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc 
      ON tc.constraint_name = cc.constraint_name
    WHERE tc.table_name = 'patient_transactions' 
      AND tc.constraint_type = 'CHECK'
      AND cc.check_clause LIKE '%transaction_type%'
  LOOP
    EXECUTE 'ALTER TABLE patient_transactions DROP CONSTRAINT IF EXISTS ' || constraint_name;
    RAISE NOTICE 'Dropped constraint: %', constraint_name;
  END LOOP;
END $$;

-- ✅ STEP 6: Add the new comprehensive constraint
ALTER TABLE patient_transactions 
ADD CONSTRAINT patient_transactions_transaction_type_check 
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

-- 🔄 STEP 7: Verify the new constraint
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'patient_transactions'::regclass 
  AND contype = 'c'
  AND conname LIKE '%transaction_type%';

-- ✅ STEP 8: Test the constraint by attempting an insert (will rollback)
BEGIN;
  -- This should work
  INSERT INTO patient_transactions (
    id, patient_id, transaction_type, amount, payment_mode, description, 
    status, hospital_id, created_by, created_at
  ) VALUES (
    gen_random_uuid(), 
    (SELECT id FROM patients LIMIT 1), 
    'DISCOUNT', 
    -100, 
    'CASH', 
    'Test discount transaction', 
    'COMPLETED', 
    '550e8400-e29b-41d4-a716-446655440000', 
    'system', 
    NOW()
  );
  
  -- This should fail
  INSERT INTO patient_transactions (
    id, patient_id, transaction_type, amount, payment_mode, description, 
    status, hospital_id, created_by, created_at
  ) VALUES (
    gen_random_uuid(), 
    (SELECT id FROM patients LIMIT 1), 
    'INVALID_TYPE', 
    100, 
    'CASH', 
    'Test invalid transaction', 
    'COMPLETED', 
    '550e8400-e29b-41d4-a716-446655440000', 
    'system', 
    NOW()
  );
ROLLBACK;

-- ✅ FINAL: Success message
SELECT 'Transaction type constraint updated successfully! DISCOUNT type is now allowed.' as result;