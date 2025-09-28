-- Add essential discount columns to patient_transactions table
-- Run this query directly in Supabase SQL Editor

-- Step 1: Add discount_type column if it doesn't exist
ALTER TABLE patient_transactions
ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('PERCENTAGE', 'AMOUNT'));

-- Step 2: Add discount_value column if it doesn't exist
ALTER TABLE patient_transactions
ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10,2) DEFAULT 0 CHECK (discount_value >= 0);

-- Step 3: Verify the columns were added successfully
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'patient_transactions'
AND column_name IN ('discount_type', 'discount_value')
ORDER BY column_name;

-- Test by checking if we can insert with discount fields
SELECT 'Discount columns added successfully' as result;