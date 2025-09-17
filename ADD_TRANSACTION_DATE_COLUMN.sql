-- Add missing columns to patient_transactions table
-- Run this in your Supabase SQL Editor

-- Add transaction_date column (CRITICAL for proper date handling)
ALTER TABLE patient_transactions
ADD COLUMN IF NOT EXISTS transaction_date DATE;

-- Add transaction_reference column (used for bill/receipt numbers)
ALTER TABLE patient_transactions
ADD COLUMN IF NOT EXISTS transaction_reference TEXT;

-- Add status column (used for bill status tracking)
ALTER TABLE patient_transactions
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'CANCELLED', 'COMPLETED'));

-- Add hospital_id column (used in the code)
ALTER TABLE patient_transactions
ADD COLUMN IF NOT EXISTS hospital_id UUID;

-- Add updated_at column with trigger
ALTER TABLE patient_transactions
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update the existing transaction types to include the ones used in the code
ALTER TABLE patient_transactions
DROP CONSTRAINT IF EXISTS patient_transactions_transaction_type_check;

ALTER TABLE patient_transactions
ADD CONSTRAINT patient_transactions_transaction_type_check
CHECK (transaction_type IN ('entry_fee', 'consultation', 'service', 'admission', 'medicine', 'discount', 'refund', 'SERVICE', 'ADMISSION_FEE', 'DEPOSIT', 'ADVANCE_PAYMENT'));

-- Update payment modes to include the ones used in the code
ALTER TABLE patient_transactions
DROP CONSTRAINT IF EXISTS patient_transactions_payment_mode_check;

ALTER TABLE patient_transactions
ADD CONSTRAINT patient_transactions_payment_mode_check
CHECK (payment_mode IN ('cash', 'online', 'card', 'upi', 'insurance', 'adjustment', 'CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE'));

-- CRITICAL: Update existing records to use created_at date as transaction_date
-- This will fix all existing bills to show the correct dates
UPDATE patient_transactions
SET transaction_date = DATE(created_at)
WHERE transaction_date IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_transactions_transaction_date ON patient_transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_patient_transactions_transaction_reference ON patient_transactions(transaction_reference);
CREATE INDEX IF NOT EXISTS idx_patient_transactions_hospital_id ON patient_transactions(hospital_id);
CREATE INDEX IF NOT EXISTS idx_patient_transactions_status ON patient_transactions(status);

-- Add comments
COMMENT ON COLUMN patient_transactions.transaction_date IS 'Actual date of the transaction (supports backdating for billing)';
COMMENT ON COLUMN patient_transactions.transaction_reference IS 'Bill/Receipt number for tracking';
COMMENT ON COLUMN patient_transactions.status IS 'Payment status of the transaction';

-- Verification queries
SELECT 'patient_transactions table columns updated successfully!' as status;

-- Show the updated table structure
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'patient_transactions'
ORDER BY ordinal_position;

-- Show count of existing records that now have transaction_date
SELECT
    COUNT(*) as total_records,
    COUNT(transaction_date) as records_with_transaction_date,
    COUNT(*) - COUNT(transaction_date) as records_missing_transaction_date
FROM patient_transactions;