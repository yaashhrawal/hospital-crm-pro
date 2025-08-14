-- Add transaction_date column to patient_transactions table
-- This allows backdated transactions to show the correct date

-- Add the transaction_date column
ALTER TABLE patient_transactions
ADD COLUMN IF NOT EXISTS transaction_date DATE;

-- Update existing records to use created_at date as transaction_date
UPDATE patient_transactions 
SET transaction_date = DATE(created_at) 
WHERE transaction_date IS NULL;

-- Add comment
COMMENT ON COLUMN patient_transactions.transaction_date IS 'Actual date of the transaction (supports backdating)';

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'patient_transactions' AND column_name = 'transaction_date';