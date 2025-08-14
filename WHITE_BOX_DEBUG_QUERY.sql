-- 🔍 WHITE-BOX TESTING: Deep analysis of dashboard data
-- Run this to understand the exact data structure and identify issues

-- STEP 1: Check transaction_date field status
SELECT 
    'TRANSACTION_DATE_ANALYSIS' as analysis,
    COUNT(*) as total_transactions,
    COUNT(transaction_date) as has_transaction_date,
    COUNT(*) - COUNT(transaction_date) as missing_transaction_date,
    COUNT(CASE WHEN transaction_date IS NULL THEN 1 END) as null_transaction_date,
    COUNT(CASE WHEN transaction_date = DATE(created_at) THEN 1 END) as same_as_created_date,
    COUNT(CASE WHEN transaction_date != DATE(created_at) THEN 1 END) as different_from_created_date
FROM patient_transactions
WHERE status = 'COMPLETED';

-- STEP 2: Check patient date_of_entry field status
SELECT 
    'PATIENT_DATE_OF_ENTRY_ANALYSIS' as analysis,
    COUNT(*) as total_patients,
    COUNT(date_of_entry) as has_date_of_entry,
    COUNT(*) - COUNT(date_of_entry) as missing_date_of_entry,
    COUNT(CASE WHEN date_of_entry IS NULL THEN 1 END) as null_date_of_entry,
    COUNT(CASE WHEN date_of_entry = DATE(created_at) THEN 1 END) as same_as_created_date,
    COUNT(CASE WHEN date_of_entry != DATE(created_at) THEN 1 END) as different_from_created_date
FROM patients;

-- STEP 3: Sample actual data to see what we're working with
SELECT 
    'SAMPLE_TRANSACTION_DATA' as sample_type,
    pt.id,
    pt.transaction_date,
    pt.created_at,
    DATE(pt.created_at) as created_date_only,
    p.date_of_entry as patient_date_of_entry,
    p.first_name,
    p.last_name,
    pt.amount,
    pt.transaction_type,
    CASE 
        WHEN pt.transaction_date IS NOT NULL THEN pt.transaction_date
        ELSE DATE(pt.created_at)
    END as effective_date
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
WHERE pt.status = 'COMPLETED'
ORDER BY pt.created_at DESC
LIMIT 10;

-- STEP 4: TODAY'S DATA SPECIFICALLY
SELECT 
    'TODAY_TRANSACTIONS' as analysis,
    COUNT(*) as count,
    SUM(pt.amount) as total_amount,
    CURRENT_DATE as today_date
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
WHERE pt.status = 'COMPLETED'
  AND COALESCE(pt.transaction_date, DATE(pt.created_at)) = CURRENT_DATE
  AND (p.assigned_department IS NULL OR p.assigned_department != 'ORTHO')
  AND (p.assigned_doctor IS NULL OR p.assigned_doctor != 'DR. HEMANT');

-- STEP 5: PERIOD BREAKDOWN ANALYSIS
SELECT 
    'PERIOD_BREAKDOWN' as analysis,
    COALESCE(pt.transaction_date, DATE(pt.created_at)) as effective_date,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount,
    CASE 
        WHEN COALESCE(pt.transaction_date, DATE(pt.created_at)) = CURRENT_DATE THEN 'TODAY'
        WHEN COALESCE(pt.transaction_date, DATE(pt.created_at)) >= CURRENT_DATE - INTERVAL '6 days' THEN 'THIS_WEEK'
        WHEN COALESCE(pt.transaction_date, DATE(pt.created_at)) >= DATE_TRUNC('month', CURRENT_DATE) THEN 'THIS_MONTH'
        ELSE 'OLDER'
    END as period
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
WHERE pt.status = 'COMPLETED'
  AND (p.assigned_department IS NULL OR p.assigned_department != 'ORTHO')
  AND (p.assigned_doctor IS NULL OR p.assigned_doctor != 'DR. HEMANT')
GROUP BY effective_date
ORDER BY effective_date DESC;