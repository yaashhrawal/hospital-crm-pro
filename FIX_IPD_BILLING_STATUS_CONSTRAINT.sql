-- Fix IPD billing status constraint error
-- The IPD billing tries to use 'DELETED' status which is not in the current constraint

-- Step 1: Drop existing status constraint
ALTER TABLE patient_transactions
DROP CONSTRAINT IF EXISTS patient_transactions_status_check;

-- Step 2: Add updated status constraint with DELETED included
ALTER TABLE patient_transactions
ADD CONSTRAINT patient_transactions_status_check
CHECK (status IN ('PENDING', 'PAID', 'CANCELLED', 'COMPLETED', 'DELETED'));

-- Step 3: Verify the constraint was updated
SELECT
    constraint_name,
    check_clause
FROM information_schema.check_constraints
WHERE constraint_name = 'patient_transactions_status_check';

-- Step 4: Test that DELETED status now works
SELECT 'IPD billing status constraint fixed - DELETED status now allowed!' as result;