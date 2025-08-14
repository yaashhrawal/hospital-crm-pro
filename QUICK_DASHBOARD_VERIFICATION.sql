-- 🔍 QUICK DASHBOARD VERIFICATION
-- Run this to see exactly what revenue data should show on dashboard

-- TODAY's transactions (should match dashboard "Today" filter)
SELECT 
    'TODAY_TRANSACTIONS' as category,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount,
    CURRENT_DATE as target_date
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
WHERE pt.status = 'COMPLETED'
  AND (
    -- Priority 1: Use patient date_of_entry if available
    CASE 
      WHEN p.date_of_entry IS NOT NULL AND p.date_of_entry != '' THEN p.date_of_entry
      WHEN pt.transaction_date IS NOT NULL THEN pt.transaction_date
      ELSE DATE(pt.created_at)
    END
  ) = CURRENT_DATE
  AND (p.assigned_department IS NULL OR p.assigned_department != 'ORTHO')
  AND (p.assigned_doctor IS NULL OR p.assigned_doctor != 'DR. HEMANT');

-- Sample transactions to see what dates are being used
SELECT 
    'SAMPLE_TRANSACTIONS' as category,
    pt.id,
    p.first_name,
    p.last_name,
    p.date_of_entry as patient_entry_date,
    pt.transaction_date,
    DATE(pt.created_at) as created_date,
    CASE 
      WHEN p.date_of_entry IS NOT NULL AND p.date_of_entry != '' THEN p.date_of_entry
      WHEN pt.transaction_date IS NOT NULL THEN pt.transaction_date
      ELSE DATE(pt.created_at)
    END as effective_date,
    pt.amount,
    pt.transaction_type
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
WHERE pt.status = 'COMPLETED'
ORDER BY pt.created_at DESC
LIMIT 10;

-- Breakdown by effective date (last 7 days)
SELECT 
    CASE 
      WHEN p.date_of_entry IS NOT NULL AND p.date_of_entry != '' THEN p.date_of_entry
      WHEN pt.transaction_date IS NOT NULL THEN pt.transaction_date
      ELSE DATE(pt.created_at)
    END as effective_date,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
WHERE pt.status = 'COMPLETED'
  AND (
    CASE 
      WHEN p.date_of_entry IS NOT NULL AND p.date_of_entry != '' THEN p.date_of_entry
      WHEN pt.transaction_date IS NOT NULL THEN pt.transaction_date
      ELSE DATE(pt.created_at)
    END
  ) >= CURRENT_DATE - INTERVAL '6 days'
GROUP BY effective_date
ORDER BY effective_date DESC;