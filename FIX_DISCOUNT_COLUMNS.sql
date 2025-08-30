-- Fix missing discount_percentage and discount_reason columns in patient_transactions table
-- Run this query directly in Supabase SQL Editor

-- Step 1: Add discount_percentage column if it doesn't exist
ALTER TABLE patient_transactions 
ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5,2) DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100);

-- Step 2: Add discount_reason column if it doesn't exist
ALTER TABLE patient_transactions 
ADD COLUMN IF NOT EXISTS discount_reason TEXT;

-- Step 3: Add transaction_date column if it doesn't exist (used in many places)
ALTER TABLE patient_transactions 
ADD COLUMN IF NOT EXISTS transaction_date DATE DEFAULT CURRENT_DATE;

-- Step 4: Update existing records to have transaction_date from created_at if null
UPDATE patient_transactions 
SET transaction_date = DATE(created_at) 
WHERE transaction_date IS NULL AND created_at IS NOT NULL;

-- Step 5: Add comments to document the columns
COMMENT ON COLUMN patient_transactions.discount_percentage IS 'Discount percentage applied to transaction (0-100)';
COMMENT ON COLUMN patient_transactions.discount_reason IS 'Reason for discount application';
COMMENT ON COLUMN patient_transactions.transaction_date IS 'Date when transaction occurred (separate from created_at timestamp)';

-- Step 6: Verify the columns were added successfully
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'patient_transactions' 
AND column_name IN ('discount_percentage', 'discount_reason', 'transaction_date')
ORDER BY column_name;

-- Expected output should show all three columns with their data types