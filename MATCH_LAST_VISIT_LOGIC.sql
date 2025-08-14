-- MATCH TRANSACTION HISTORY WITH LAST VISIT LOGIC
-- Use the SAME table/column priority as "Last Visit" section

-- ====================
-- STEP 1: Update all transactions to use the same date as "Last Visit"
-- ====================

-- This matches the exact logic from ComprehensivePatientList.tsx
UPDATE patient_transactions 
SET transaction_date = (
    SELECT 
        CASE 
            -- Priority 1: Use date_of_entry if it's explicitly set (same as Last Visit)
            WHEN p.date_of_entry IS NOT NULL AND p.date_of_entry::text != '' THEN p.date_of_entry
            -- Priority 2: Use the patient's created_at date as fallback
            ELSE DATE(p.created_at)
        END
    FROM patients p 
    WHERE p.id = patient_transactions.patient_id
);

-- ====================
-- STEP 2: Create view to always show consistent dates
-- ====================

CREATE OR REPLACE VIEW transaction_dates_matching_last_visit AS
SELECT 
    pt.*,
    p.date_of_entry,
    p.created_at as patient_created_at,
    -- Use the same logic as Last Visit section
    CASE 
        WHEN p.date_of_entry IS NOT NULL AND p.date_of_entry::text != '' THEN p.date_of_entry
        ELSE DATE(p.created_at)
    END as display_date,
    p.first_name,
    p.last_name
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id;

-- ====================
-- STEP 3: Verify the fix matches Last Visit dates
-- ====================

-- Check TEST patient specifically
SELECT 
    p.first_name,
    p.last_name,
    p.date_of_entry as patient_date_of_entry,
    pt.transaction_date as transaction_date,
    CASE 
        WHEN p.date_of_entry IS NOT NULL AND p.date_of_entry::text != '' THEN p.date_of_entry
        ELSE DATE(p.created_at)
    END as last_visit_date,
    CASE 
        WHEN pt.transaction_date = p.date_of_entry THEN '✅ MATCHES LAST VISIT'
        ELSE '❌ DOES NOT MATCH'
    END as status
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
WHERE p.first_name ILIKE '%TEST%' 
   OR p.date_of_entry = '2024-08-07'
   OR p.date_of_entry = '2024-08-08'
ORDER BY pt.created_at DESC;

-- Check all recent patients
SELECT 
    p.first_name,
    p.last_name,
    p.date_of_entry,
    pt.transaction_date,
    -- This should match the Last Visit logic exactly
    CASE 
        WHEN p.date_of_entry IS NOT NULL AND p.date_of_entry::text != '' THEN p.date_of_entry
        ELSE DATE(p.created_at)
    END as expected_last_visit_date,
    CASE 
        WHEN pt.transaction_date = (
            CASE 
                WHEN p.date_of_entry IS NOT NULL AND p.date_of_entry::text != '' THEN p.date_of_entry
                ELSE DATE(p.created_at)
            END
        ) THEN '✅ SYNCED'
        ELSE '❌ NOT SYNCED'
    END as sync_status
FROM patient_transactions pt
JOIN patients p ON p.id = pt.patient_id
WHERE pt.created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY pt.created_at DESC
LIMIT 20;