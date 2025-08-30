-- FIX: Remove the trigger that overwrites transaction_date with patient's date_of_entry
-- This trigger is causing all transactions to show the patient's entry date instead of actual service dates

-- ====================
-- STEP 1: REMOVE THE PROBLEMATIC TRIGGER
-- ====================

-- Remove the trigger that overrides transaction_date
DROP TRIGGER IF EXISTS trigger_set_transaction_date ON patient_transactions;

-- Remove the function as well
DROP FUNCTION IF EXISTS set_transaction_date_from_patient();

-- ====================
-- STEP 2: VERIFICATION
-- ====================

-- Check that trigger is removed
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    trigger_schema
FROM information_schema.triggers 
WHERE event_object_table = 'patient_transactions' 
AND trigger_name = 'trigger_set_transaction_date';

-- This should return no rows if trigger is successfully removed

-- ====================
-- STEP 3: TEST NEW TRANSACTION INSERTION
-- ====================

-- Test that new transactions can now use custom transaction_date
-- This will be verified through the application when adding new services

SELECT 'Trigger removal complete. New transactions will now use the transaction_date provided by the application.' as status;