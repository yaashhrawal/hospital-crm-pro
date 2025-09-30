-- Check if Sept 1-17 revenue transactions are being excluded by ORTHO/HEMANT filter
SELECT
    pt.transaction_date,
    COUNT(*) as total_transactions,
    COUNT(CASE WHEN p.assigned_department = 'ORTHO'
                AND p.assigned_doctor LIKE '%HEMANT%' THEN 1 END) as ortho_hemant_count,
    SUM(pt.amount) as total_amount,
    SUM(CASE WHEN p.assigned_department = 'ORTHO'
             AND p.assigned_doctor LIKE '%HEMANT%'
             THEN pt.amount ELSE 0 END) as ortho_hemant_amount
FROM patient_transactions pt
LEFT JOIN patients p ON p.id = pt.patient_id
WHERE pt.transaction_date >= '2025-09-01'
  AND pt.transaction_date <= '2025-09-17'
  AND pt.status = 'COMPLETED'
  AND pt.amount > 0
GROUP BY pt.transaction_date
ORDER BY pt.transaction_date;

-- Show sample Sept transactions with patient details
SELECT
    pt.transaction_date,
    pt.amount,
    pt.description,
    p.first_name || ' ' || p.last_name as patient_name,
    p.assigned_department,
    p.assigned_doctor
FROM patient_transactions pt
LEFT JOIN patients p ON p.id = pt.patient_id
WHERE pt.transaction_date >= '2025-09-01'
  AND pt.transaction_date <= '2025-09-17'
  AND pt.status = 'COMPLETED'
  AND pt.amount > 0
ORDER BY pt.transaction_date, pt.created_at
LIMIT 20;