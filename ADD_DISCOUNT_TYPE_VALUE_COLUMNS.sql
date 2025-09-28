-- Add missing discount_type and discount_value columns to patient_transactions table
-- Run this query directly in Supabase SQL Editor

-- Step 1: Add discount_type column if it doesn't exist
ALTER TABLE patient_transactions
ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IN ('PERCENTAGE', 'AMOUNT'));

-- Step 2: Add discount_value column if it doesn't exist
ALTER TABLE patient_transactions
ADD COLUMN IF NOT EXISTS discount_value NUMERIC(10,2) DEFAULT 0 CHECK (discount_value >= 0);

-- Step 3: Add online_payment_method column if it doesn't exist
ALTER TABLE patient_transactions
ADD COLUMN IF NOT EXISTS online_payment_method TEXT;

-- Step 4: Add comments to document the columns
COMMENT ON COLUMN patient_transactions.discount_type IS 'Type of discount: PERCENTAGE or AMOUNT';
COMMENT ON COLUMN patient_transactions.discount_value IS 'Value of discount (percentage number or amount)';
COMMENT ON COLUMN patient_transactions.online_payment_method IS 'Method used for online payments (UPI, etc.)';

-- Step 5: Verify the columns were added successfully
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'patient_transactions'
AND column_name IN ('discount_type', 'discount_value', 'online_payment_method')
ORDER BY column_name;

-- Expected output should show all three columns with their data types