-- 📊 COMPLETE DASHBOARD VERIFICATION
-- Use these queries to verify both revenue and patient counts are correct

-- =============================================================================
-- 1. TODAY'S REVENUE (should match dashboard "Today" revenue card)
-- =============================================================================
SELECT 
    'TODAY_REVENUE' as metric,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_revenue,
    CURRENT_DATE as target_date
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
WHERE pt.status = 'COMPLETED'
  AND COALESCE(p.date_of_entry, pt.transaction_date, DATE(pt.created_at)) = CURRENT_DATE
  AND (p.assigned_department IS NULL OR p.assigned_department != 'ORTHO')
  AND (p.assigned_doctor IS NULL OR p.assigned_doctor != 'DR. HEMANT');

-- =============================================================================
-- 2. TODAY'S PATIENTS (should match dashboard "Today" patient count)
-- =============================================================================
SELECT 
    'TODAY_PATIENTS' as metric,
    COUNT(*) as patient_count,
    CURRENT_DATE as target_date
FROM patients p
WHERE COALESCE(p.date_of_entry, DATE(p.created_at)) = CURRENT_DATE;

-- =============================================================================
-- 3. PERIOD COMPARISON - REVENUE (Today vs Week vs Month)
-- =============================================================================
WITH revenue_periods AS (
    SELECT 
        pt.amount,
        COALESCE(p.date_of_entry, pt.transaction_date, DATE(pt.created_at)) as effective_date
    FROM patient_transactions pt
    JOIN patients p ON p.id = pt.patient_id
    WHERE pt.status = 'COMPLETED'
      AND (p.assigned_department IS NULL OR p.assigned_department != 'ORTHO')
      AND (p.assigned_doctor IS NULL OR p.assigned_doctor != 'DR. HEMANT')
)
SELECT 
    'TODAY' as period,
    COUNT(*) as count,
    SUM(amount) as total_revenue
FROM revenue_periods
WHERE effective_date = CURRENT_DATE

UNION ALL

SELECT 
    'THIS_WEEK' as period,
    COUNT(*) as count,
    SUM(amount) as total_revenue
FROM revenue_periods
WHERE effective_date >= CURRENT_DATE - INTERVAL '6 days'
  AND effective_date <= CURRENT_DATE

UNION ALL

SELECT 
    'THIS_MONTH' as period,
    COUNT(*) as count,
    SUM(amount) as total_revenue
FROM revenue_periods
WHERE effective_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND effective_date <= CURRENT_DATE;

-- =============================================================================
-- 4. PERIOD COMPARISON - PATIENTS (Today vs Week vs Month)
-- =============================================================================
WITH patient_periods AS (
    SELECT 
        p.*,
        COALESCE(p.date_of_entry, DATE(p.created_at)) as effective_date
    FROM patients p
)
SELECT 
    'TODAY' as period,
    COUNT(*) as patient_count
FROM patient_periods
WHERE effective_date = CURRENT_DATE

UNION ALL

SELECT 
    'THIS_WEEK' as period,
    COUNT(*) as patient_count
FROM patient_periods
WHERE effective_date >= CURRENT_DATE - INTERVAL '6 days'
  AND effective_date <= CURRENT_DATE

UNION ALL

SELECT 
    'THIS_MONTH' as period,
    COUNT(*) as patient_count
FROM patient_periods
WHERE effective_date >= DATE_TRUNC('month', CURRENT_DATE)
  AND effective_date <= CURRENT_DATE;

-- =============================================================================
-- 5. SAMPLE DATA - Show actual patients and transactions for today
-- =============================================================================
SELECT 
    'SAMPLE_TODAY_DATA' as category,
    p.first_name || ' ' || p.last_name as patient_name,
    p.date_of_entry,
    DATE(p.created_at) as created_date,
    COALESCE(p.date_of_entry, DATE(p.created_at)) as effective_date,
    pt.amount,
    pt.transaction_type
FROM patients p
LEFT JOIN patient_transactions pt ON pt.patient_id = p.id AND pt.status = 'COMPLETED'
WHERE COALESCE(p.date_of_entry, DATE(p.created_at)) = CURRENT_DATE
ORDER BY p.created_at DESC
LIMIT 10;

-- =============================================================================
-- 6. BACKDATED ENTRIES CHECK (August 7-8 entries)
-- =============================================================================
SELECT 
    'BACKDATED_ENTRIES' as category,
    p.first_name || ' ' || p.last_name as patient_name,
    p.date_of_entry,
    DATE(p.created_at) as created_date,
    COUNT(pt.id) as transaction_count,
    SUM(pt.amount) as total_revenue
FROM patients p
LEFT JOIN patient_transactions pt ON pt.patient_id = p.id AND pt.status = 'COMPLETED'
WHERE p.date_of_entry IN ('2024-08-07', '2024-08-08')
GROUP BY p.id, p.first_name, p.last_name, p.date_of_entry, p.created_at
ORDER BY p.date_of_entry DESC;

-- =============================================================================
-- 7. SUMMARY - Expected Dashboard Values
-- =============================================================================
SELECT 
    'EXPECTED_DASHBOARD_TODAY' as summary,
    (SELECT COUNT(*) FROM patients WHERE COALESCE(date_of_entry, DATE(created_at)) = CURRENT_DATE) as expected_patient_count,
    (SELECT COALESCE(SUM(pt.amount), 0) 
     FROM patient_transactions pt
     JOIN patients p ON p.id = pt.patient_id
     WHERE pt.status = 'COMPLETED'
       AND COALESCE(p.date_of_entry, pt.transaction_date, DATE(pt.created_at)) = CURRENT_DATE
       AND (p.assigned_department IS NULL OR p.assigned_department != 'ORTHO')
       AND (p.assigned_doctor IS NULL OR p.assigned_doctor != 'DR. HEMANT')
    ) as expected_revenue;