-- =====================================================
-- FIX SEPT 1-17 TRANSACTIONS - POPULATE MISSING TRANSACTION_DATE
-- =====================================================
-- This script fixes transactions from Sept 1-17 that are missing transaction_date
-- These transactions will use the patient's date_of_entry or created_at as fallback

-- Step 1: Check current state of Sept 1-17 transactions
SELECT
    COUNT(*) as total_sept_transactions,
    COUNT(CASE WHEN transaction_date IS NULL THEN 1 END) as missing_transaction_date,
    COUNT(CASE WHEN transaction_date IS NOT NULL THEN 1 END) as has_transaction_date,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created
FROM patient_transactions
WHERE created_at >= '2025-09-01T00:00:00'
  AND created_at <= '2025-09-17T23:59:59'
  AND status = 'COMPLETED';

-- Step 2: Show sample transactions missing transaction_date
SELECT
    pt.id,
    pt.created_at,
    pt.transaction_date,
    pt.amount,
    pt.description,
    p.date_of_entry as patient_date_of_entry,
    p.first_name || ' ' || p.last_name as patient_name
FROM patient_transactions pt
LEFT JOIN patients p ON p.id = pt.patient_id
WHERE pt.created_at >= '2025-09-01T00:00:00'
  AND pt.created_at <= '2025-09-17T23:59:59'
  AND pt.status = 'COMPLETED'
  AND pt.transaction_date IS NULL
ORDER BY pt.created_at
LIMIT 10;

-- Step 3: Fix transactions - use patient's date_of_entry first
UPDATE patient_transactions
SET transaction_date = (
    SELECT date_of_entry
    FROM patients
    WHERE patients.id = patient_transactions.patient_id
)
WHERE (transaction_date IS NULL OR transaction_date::text = '')
  AND created_at >= '2025-09-01T00:00:00'
  AND created_at <= '2025-09-17T23:59:59'
  AND status = 'COMPLETED'
  AND patient_id IN (
    SELECT id FROM patients WHERE date_of_entry IS NOT NULL AND date_of_entry != ''
  );

-- Step 4: For transactions where patient has no date_of_entry, use created_at date
UPDATE patient_transactions
SET transaction_date = DATE(created_at)::text
WHERE (transaction_date IS NULL OR transaction_date::text = '')
  AND created_at >= '2025-09-01T00:00:00'
  AND created_at <= '2025-09-17T23:59:59'
  AND status = 'COMPLETED';

-- Step 5: Verify the fix worked
SELECT
    COUNT(*) as total_sept_transactions,
    COUNT(CASE WHEN transaction_date IS NULL THEN 1 END) as missing_transaction_date,
    COUNT(CASE WHEN transaction_date IS NOT NULL THEN 1 END) as has_transaction_date,
    SUM(amount) as total_revenue
FROM patient_transactions
WHERE created_at >= '2025-09-01T00:00:00'
  AND created_at <= '2025-09-17T23:59:59'
  AND status = 'COMPLETED';

-- Step 6: Show sample fixed transactions
SELECT
    pt.id,
    pt.created_at::date as created_date,
    pt.transaction_date,
    pt.amount,
    pt.description,
    p.first_name || ' ' || p.last_name as patient_name
FROM patient_transactions pt
LEFT JOIN patients p ON p.id = pt.patient_id
WHERE pt.created_at >= '2025-09-01T00:00:00'
  AND pt.created_at <= '2025-09-17T23:59:59'
  AND pt.status = 'COMPLETED'
ORDER BY pt.transaction_date, pt.created_at
LIMIT 20;