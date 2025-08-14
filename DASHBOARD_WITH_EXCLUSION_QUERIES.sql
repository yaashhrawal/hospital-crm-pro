-- 📊 DASHBOARD VERIFICATION WITH DR. HEMANT & ORTHO EXCLUSION
-- These queries exclude patients with Doctor "DR. HEMANT" and Department "ORTHO" from revenue

-- =============================================================================
-- 1. TODAY'S REVENUE (excluding DR. HEMANT & ORTHO patients)
-- =============================================================================
SELECT 
    'TODAY_REVENUE_EXCLUDING_ORTHO_HEMANT' as metric,
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
-- 2. COMPARISON: Revenue WITH vs WITHOUT exclusion
-- =============================================================================
SELECT 
    'WITH_EXCLUSION' as category,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_revenue
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
WHERE pt.status = 'COMPLETED'
  AND COALESCE(p.date_of_entry, pt.transaction_date, DATE(pt.created_at)) = CURRENT_DATE
  AND (p.assigned_department IS NULL OR p.assigned_department != 'ORTHO')
  AND (p.assigned_doctor IS NULL OR p.assigned_doctor != 'DR. HEMANT')

UNION ALL

SELECT 
    'WITHOUT_EXCLUSION' as category,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_revenue
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
WHERE pt.status = 'COMPLETED'
  AND COALESCE(p.date_of_entry, pt.transaction_date, DATE(pt.created_at)) = CURRENT_DATE

UNION ALL

SELECT 
    'EXCLUDED_ONLY' as category,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_revenue
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
WHERE pt.status = 'COMPLETED'
  AND COALESCE(p.date_of_entry, pt.transaction_date, DATE(pt.created_at)) = CURRENT_DATE
  AND (p.assigned_department = 'ORTHO' OR p.assigned_doctor = 'DR. HEMANT');

-- =============================================================================
-- 3. PERIOD COMPARISON WITH EXCLUSION (Today vs Week vs Month)
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
-- 4. EXCLUDED PATIENTS LIST (DR. HEMANT & ORTHO)
-- =============================================================================
SELECT 
    'EXCLUDED_PATIENTS' as category,
    p.first_name || ' ' || p.last_name as patient_name,
    p.assigned_department,
    p.assigned_doctor,
    p.date_of_entry,
    COUNT(pt.id) as transaction_count,
    SUM(pt.amount) as excluded_revenue
FROM patients p
LEFT JOIN patient_transactions pt ON pt.patient_id = p.id AND pt.status = 'COMPLETED'
WHERE (p.assigned_department = 'ORTHO' OR p.assigned_doctor = 'DR. HEMANT')
  AND COALESCE(p.date_of_entry, pt.transaction_date, DATE(pt.created_at)) >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY p.id, p.first_name, p.last_name, p.assigned_department, p.assigned_doctor, p.date_of_entry
ORDER BY excluded_revenue DESC;

-- =============================================================================
-- 5. SAMPLE TODAY'S DATA (showing inclusion/exclusion status)
-- =============================================================================
SELECT 
    p.first_name || ' ' || p.last_name as patient_name,
    p.assigned_department,
    p.assigned_doctor,
    p.date_of_entry,
    pt.amount,
    pt.transaction_type,
    CASE 
        WHEN p.assigned_department = 'ORTHO' OR p.assigned_doctor = 'DR. HEMANT' 
        THEN '🚫 EXCLUDED FROM REVENUE'
        ELSE '✅ INCLUDED IN REVENUE'
    END as revenue_status
FROM patients p
LEFT JOIN patient_transactions pt ON pt.patient_id = p.id AND pt.status = 'COMPLETED'
WHERE COALESCE(p.date_of_entry, pt.transaction_date, DATE(pt.created_at)) = CURRENT_DATE
ORDER BY 
    CASE WHEN p.assigned_department = 'ORTHO' OR p.assigned_doctor = 'DR. HEMANT' THEN 1 ELSE 0 END,
    pt.amount DESC
LIMIT 15;

-- =============================================================================
-- 6. DASHBOARD SUMMARY WITH EXCLUSION
-- =============================================================================
SELECT 
    'FINAL_DASHBOARD_TODAY' as summary,
    
    -- Patient count (usually includes all patients, not affected by doctor/dept)
    (SELECT COUNT(*) FROM patients WHERE COALESCE(date_of_entry, DATE(created_at)) = CURRENT_DATE) as total_patients_today,
    
    -- Revenue (excluding DR. HEMANT & ORTHO)
    (SELECT COALESCE(SUM(pt.amount), 0) 
     FROM patient_transactions pt
     JOIN patients p ON p.id = pt.patient_id
     WHERE pt.status = 'COMPLETED'
       AND COALESCE(p.date_of_entry, pt.transaction_date, DATE(pt.created_at)) = CURRENT_DATE
       AND (p.assigned_department IS NULL OR p.assigned_department != 'ORTHO')
       AND (p.assigned_doctor IS NULL OR p.assigned_doctor != 'DR. HEMANT')
    ) as revenue_excluding_ortho_hemant,
    
    -- Excluded revenue amount
    (SELECT COALESCE(SUM(pt.amount), 0) 
     FROM patient_transactions pt
     JOIN patients p ON p.id = pt.patient_id
     WHERE pt.status = 'COMPLETED'
       AND COALESCE(p.date_of_entry, pt.transaction_date, DATE(pt.created_at)) = CURRENT_DATE
       AND (p.assigned_department = 'ORTHO' OR p.assigned_doctor = 'DR. HEMANT')
    ) as excluded_revenue;