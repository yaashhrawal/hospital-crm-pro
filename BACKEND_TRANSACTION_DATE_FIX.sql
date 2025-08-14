-- COMPREHENSIVE BACKEND FIX: Link Transaction Dates with Patient Entry Dates
-- This will fix the issue at the database level for all components

-- ====================
-- STEP 1: UPDATE ALL EXISTING TRANSACTIONS
-- ====================

-- Update all existing transactions to use their patient's date_of_entry
UPDATE patient_transactions 
SET transaction_date = (
    SELECT COALESCE(p.date_of_entry, DATE(p.created_at))
    FROM patients p 
    WHERE p.id = patient_transactions.patient_id
);

-- Verify the update worked
SELECT 
    'After Update - Status Check' as status,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN transaction_date IS NOT NULL THEN 1 END) as transactions_with_date,
    COUNT(CASE WHEN transaction_date != DATE(created_at) THEN 1 END) as backdated_transactions
FROM patient_transactions;

-- ====================
-- STEP 2: CREATE AUTOMATIC TRIGGER
-- ====================

-- Create a function that automatically sets transaction_date based on patient's date_of_entry
CREATE OR REPLACE FUNCTION set_transaction_date_from_patient()
RETURNS TRIGGER AS $$
BEGIN
    -- Get the patient's date_of_entry and use it for transaction_date
    SELECT COALESCE(date_of_entry, DATE(created_at))
    INTO NEW.transaction_date
    FROM patients
    WHERE id = NEW.patient_id;
    
    -- If no patient found, use current date
    IF NEW.transaction_date IS NULL THEN
        NEW.transaction_date = CURRENT_DATE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that runs before INSERT on patient_transactions
DROP TRIGGER IF EXISTS trigger_set_transaction_date ON patient_transactions;
CREATE TRIGGER trigger_set_transaction_date
    BEFORE INSERT ON patient_transactions
    FOR EACH ROW
    EXECUTE FUNCTION set_transaction_date_from_patient();

-- ====================
-- STEP 3: CREATE VIEW FOR CONSISTENT DATE DISPLAY
-- ====================

-- Create a view that always shows the correct transaction date
CREATE OR REPLACE VIEW patient_transactions_with_correct_dates AS
SELECT 
    pt.*,
    COALESCE(pt.transaction_date, p.date_of_entry, DATE(pt.created_at)) as display_date,
    p.first_name,
    p.last_name,
    p.date_of_entry as patient_entry_date
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id;

-- ====================
-- STEP 4: VERIFICATION QUERIES
-- ====================

-- Check specific TEST patient transactions
SELECT 
    p.first_name,
    p.last_name,
    p.date_of_entry as patient_entry_date,
    pt.transaction_type,
    pt.amount,
    pt.transaction_date,
    pt.created_at,
    CASE 
        WHEN pt.transaction_date = p.date_of_entry THEN '✅ CORRECTLY LINKED'
        WHEN pt.transaction_date = DATE(pt.created_at) THEN '⚠️ USING CREATED DATE'
        ELSE '❌ WRONG DATE'
    END as status
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
WHERE p.first_name ILIKE '%TEST%' 
   OR p.date_of_entry = '2024-08-07'
   OR p.date_of_entry = '2024-08-08'
ORDER BY pt.created_at DESC;

-- Check all recent transactions (last 7 days)
SELECT 
    p.first_name,
    p.last_name,
    p.date_of_entry,
    pt.transaction_date,
    DATE(pt.created_at) as created_date,
    pt.transaction_type,
    pt.amount,
    CASE 
        WHEN pt.transaction_date = p.date_of_entry THEN 'LINKED TO PATIENT'
        ELSE 'NOT LINKED'
    END as link_status
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
WHERE pt.created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY pt.created_at DESC
LIMIT 20;

-- Final verification: Count by status
SELECT 
    CASE 
        WHEN pt.transaction_date = p.date_of_entry THEN 'CORRECTLY_LINKED'
        WHEN pt.transaction_date = DATE(pt.created_at) THEN 'USING_CREATED_DATE'
        ELSE 'OTHER'
    END as status,
    COUNT(*) as count
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
GROUP BY 1
ORDER BY count DESC;