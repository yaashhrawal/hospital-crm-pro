-- VERIFY DASHBOARD TRANSACTION DATES ARE CORRECT
-- Run this to check if transaction dates are properly set for backdated entries

-- Check recent transactions and their dates
SELECT 
    pt.id,
    p.first_name,
    p.last_name,
    p.date_of_entry as patient_entry_date,
    pt.transaction_date,
    pt.created_at,
    pt.transaction_type,
    pt.amount,
    CASE 
        WHEN pt.transaction_date IS NOT NULL THEN pt.transaction_date
        ELSE DATE(pt.created_at)
    END as displayed_date,
    CASE 
        WHEN pt.transaction_date = p.date_of_entry THEN '✅ MATCHES PATIENT ENTRY'
        WHEN pt.transaction_date = DATE(pt.created_at) THEN '⚠️ USING CREATED DATE'
        ELSE '❌ INCONSISTENT'
    END as status
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
WHERE pt.status = 'COMPLETED'
ORDER BY pt.created_at DESC
LIMIT 20;

-- Check if any backdated entries (e.g., August 7-8) are showing up correctly
SELECT 
    DATE(pt.transaction_date) as transaction_date,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_revenue
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
WHERE pt.status = 'COMPLETED'
    AND (p.assigned_department != 'ORTHO' OR p.assigned_department IS NULL)
    AND (p.assigned_doctor != 'DR. HEMANT' OR p.assigned_doctor IS NULL)
    AND pt.transaction_date >= '2024-08-01'
GROUP BY DATE(pt.transaction_date)
ORDER BY transaction_date DESC;

-- Today's revenue specifically
SELECT 
    COUNT(*) as today_transaction_count,
    SUM(pt.amount) as today_revenue,
    CURRENT_DATE as today_date
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
WHERE pt.status = 'COMPLETED'
    AND DATE(pt.transaction_date) = CURRENT_DATE
    AND (p.assigned_department != 'ORTHO' OR p.assigned_department IS NULL)
    AND (p.assigned_doctor != 'DR. HEMANT' OR p.assigned_doctor IS NULL);