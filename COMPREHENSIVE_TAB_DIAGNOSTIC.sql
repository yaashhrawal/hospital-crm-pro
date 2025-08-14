-- COMPREHENSIVE DIAGNOSTIC FOR ALL APPLICATION TABS
-- This tests all the main queries used by different tabs

-- ===== BASIC DATA CHECKS =====
SELECT '=== BASIC DATA COUNTS ===' as section;

SELECT 
    'PATIENTS' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN hospital_id = '550e8400-e29b-41d4-a716-446655440000' THEN 1 END) as hospital_records
FROM patients

UNION ALL

SELECT 
    'PATIENT_TRANSACTIONS' as table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN hospital_id = '550e8400-e29b-41d4-a716-446655440000' THEN 1 END) as hospital_records
FROM patient_transactions

UNION ALL

SELECT 
    'DOCTORS' as table_name,
    COUNT(*) as total_records,
    0 as hospital_records
FROM doctors

UNION ALL

SELECT 
    'DEPARTMENTS' as table_name,
    COUNT(*) as total_records,
    0 as hospital_records
FROM departments;

-- ===== PATIENT LIST TAB TEST =====
SELECT '=== PATIENT LIST TAB TEST ===' as section;

-- Test the exact query from getPatients() method
SELECT 
    'PATIENT LIST QUERY' as test_name,
    COUNT(*) as result_count
FROM patients p
WHERE p.hospital_id = '550e8400-e29b-41d4-a716-446655440000';

-- Test with transactions join
SELECT 
    'PATIENT LIST WITH TRANSACTIONS' as test_name,
    COUNT(*) as result_count
FROM patients p
LEFT JOIN patient_transactions pt ON pt.patient_id = p.id
WHERE p.hospital_id = '550e8400-e29b-41d4-a716-446655440000';

-- Sample patient data
SELECT 
    'SAMPLE PATIENTS' as test_name,
    p.id,
    p.patient_id,
    p.first_name,
    p.last_name,
    p.hospital_id,
    p.created_at,
    COUNT(pt.id) as transaction_count
FROM patients p
LEFT JOIN patient_transactions pt ON pt.patient_id = p.id
WHERE p.hospital_id = '550e8400-e29b-41d4-a716-446655440000'
GROUP BY p.id, p.patient_id, p.first_name, p.last_name, p.hospital_id, p.created_at
ORDER BY p.created_at DESC
LIMIT 5;

-- ===== OPERATIONS TAB TEST =====
SELECT '=== OPERATIONS TAB TEST ===' as section;

-- Test transactions for operations/dashboard
SELECT 
    'RECENT TRANSACTIONS' as test_name,
    pt.id,
    pt.patient_id,
    pt.transaction_type,
    pt.amount,
    pt.description,
    pt.created_at,
    p.first_name,
    p.last_name
FROM patient_transactions pt
LEFT JOIN patients p ON p.id = pt.patient_id
WHERE pt.hospital_id = '550e8400-e29b-41d4-a716-446655440000'
   OR pt.hospital_id IS NULL  -- Handle cases where hospital_id might be null
ORDER BY pt.created_at DESC
LIMIT 5;

-- Test daily operations summary
SELECT 
    'DAILY OPERATIONS SUMMARY' as test_name,
    DATE(pt.created_at) as date,
    COUNT(*) as transaction_count,
    SUM(pt.amount) as total_amount
FROM patient_transactions pt
WHERE pt.created_at >= CURRENT_DATE - INTERVAL '7 days'
  AND (pt.hospital_id = '550e8400-e29b-41d4-a716-446655440000' OR pt.hospital_id IS NULL)
GROUP BY DATE(pt.created_at)
ORDER BY date DESC;

-- ===== DASHBOARD TAB TEST =====
SELECT '=== DASHBOARD TAB TEST ===' as section;

-- Test dashboard metrics
SELECT 
    'DASHBOARD METRICS' as test_name,
    (SELECT COUNT(*) FROM patients WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000' AND is_active = true) as active_patients,
    (SELECT COUNT(*) FROM patient_transactions WHERE DATE(created_at) = CURRENT_DATE AND (hospital_id = '550e8400-e29b-41d4-a716-446655440000' OR hospital_id IS NULL)) as today_transactions,
    (SELECT COALESCE(SUM(amount), 0) FROM patient_transactions WHERE DATE(created_at) = CURRENT_DATE AND (hospital_id = '550e8400-e29b-41d4-a716-446655440000' OR hospital_id IS NULL)) as today_revenue,
    (SELECT COUNT(*) FROM doctors WHERE is_active = true) as active_doctors;

-- ===== DATA INTEGRITY CHECKS =====
SELECT '=== DATA INTEGRITY CHECKS ===' as section;

-- Check for orphaned transactions
SELECT 
    'ORPHANED TRANSACTIONS' as check_name,
    COUNT(*) as count
FROM patient_transactions pt
WHERE pt.patient_id IS NOT NULL 
  AND pt.patient_id NOT IN (SELECT id FROM patients WHERE id IS NOT NULL);

-- Check for null IDs
SELECT 
    'NULL ID CHECKS' as check_name,
    (SELECT COUNT(*) FROM patients WHERE id IS NULL) as patients_null_ids,
    (SELECT COUNT(*) FROM patient_transactions WHERE id IS NULL) as transactions_null_ids;

-- Check hospital_id consistency
SELECT 
    'HOSPITAL_ID CONSISTENCY' as check_name,
    COUNT(DISTINCT hospital_id) as unique_hospital_ids
FROM patients;

-- ===== FOREIGN KEY RELATIONSHIPS =====
SELECT '=== FOREIGN KEY RELATIONSHIPS ===' as section;

SELECT 
    'ACTIVE FOREIGN KEYS' as info,
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS references_table,
    ccu.column_name AS references_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name IN ('patients', 'patient_transactions', 'doctors', 'departments', 'patient_admissions')
ORDER BY tc.table_name;

-- ===== FINAL SUMMARY =====
SELECT '=== DIAGNOSTIC SUMMARY ===' as section;

SELECT 
    'SYSTEM STATUS' as status,
    CASE 
        WHEN (SELECT COUNT(*) FROM patients WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000') > 0 
        THEN 'PATIENTS EXIST'
        ELSE 'NO PATIENTS FOUND'
    END as patient_status,
    CASE 
        WHEN (SELECT COUNT(*) FROM patient_transactions) > 0 
        THEN 'TRANSACTIONS EXIST'
        ELSE 'NO TRANSACTIONS FOUND'
    END as transaction_status,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE table_name = 'patient_transactions' 
            AND constraint_type = 'FOREIGN KEY'
        ) 
        THEN 'FOREIGN KEYS ACTIVE'
        ELSE 'FOREIGN KEYS MISSING'
    END as relationship_status;