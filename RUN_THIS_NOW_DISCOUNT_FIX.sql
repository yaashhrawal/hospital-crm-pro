-- CRITICAL FIX: Add discount columns to patient_transactions table
-- This MUST be run in Supabase SQL Editor for the discount functionality to work

-- Step 1: Add discount_type column
ALTER TABLE patient_transactions
ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('PERCENTAGE', 'AMOUNT'));

-- Step 2: Add discount_value column
ALTER TABLE patient_transactions
ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10,2) DEFAULT 0 CHECK (discount_value >= 0);

-- Step 3: Add discount_reason column
ALTER TABLE patient_transactions
ADD COLUMN IF NOT EXISTS discount_reason TEXT;

-- Step 4: Verify columns were added
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'patient_transactions'
AND column_name IN ('discount_type', 'discount_value', 'discount_reason')
ORDER BY column_name;

-- Step 5: Test if we can insert discount data
SELECT 'Discount columns added successfully - ready for discount functionality!' as status;