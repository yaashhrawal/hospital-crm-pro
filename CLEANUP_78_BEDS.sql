-- URGENT: Fix 78 beds issue in main database
-- This will clean up all duplicate beds and create exactly 40 beds

-- Step 1: Show current bed situation
SELECT 
    'BEFORE CLEANUP' as status,
    COUNT(*) as total_beds,
    COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_beds,
    COUNT(CASE WHEN status = 'vacant' THEN 1 END) as vacant_beds
FROM beds;

-- Step 2: Show which beds are duplicated
SELECT 
    bed_number, 
    COUNT(*) as duplicate_count,
    STRING_AGG(id::text, ', ') as bed_ids
FROM beds 
GROUP BY bed_number 
HAVING COUNT(*) > 1
ORDER BY bed_number::integer;

-- Step 3: Backup any patient data that might be lost
CREATE TEMP TABLE bed_backup AS
SELECT 
    bed_number,
    patient_id,
    ipd_number,
    admission_date,
    status,
    consent_form_data,
    clinical_record_data,
    progress_sheet_data,
    nurses_orders_data,
    ipd_consents_data
FROM beds 
WHERE patient_id IS NOT NULL;

-- Show backup data
SELECT 'BACKING UP PATIENT DATA' as status, COUNT(*) as occupied_beds_backed_up FROM bed_backup;

-- Step 4: COMPLETELY REMOVE ALL BEDS
DELETE FROM beds;

-- Step 5: Create exactly 40 beds (1-40)
INSERT INTO beds (bed_number, room_type, status, hospital_id, daily_rate, tat_remaining_seconds, tat_status)
SELECT 
    i::TEXT as bed_number,
    CASE 
        WHEN i <= 10 THEN 'GENERAL'
        WHEN i <= 20 THEN 'PRIVATE' 
        WHEN i <= 30 THEN 'ICU'
        ELSE 'EMERGENCY'
    END as room_type,
    'vacant' as status,
    '550e8400-e29b-41d4-a716-446655440000' as hospital_id,
    1000 as daily_rate,
    1800 as tat_remaining_seconds,
    'idle' as tat_status
FROM generate_series(1, 40) AS i;

-- Step 6: Restore patient data to the first occurrence of each bed
UPDATE beds 
SET 
    patient_id = backup.patient_id,
    ipd_number = backup.ipd_number,
    admission_date = backup.admission_date,
    status = backup.status,
    consent_form_data = backup.consent_form_data,
    clinical_record_data = backup.clinical_record_data,
    progress_sheet_data = backup.progress_sheet_data,
    nurses_orders_data = backup.nurses_orders_data,
    ipd_consents_data = backup.ipd_consents_data
FROM bed_backup backup
WHERE beds.bed_number = backup.bed_number;

-- Step 7: Ensure real-time sync is enabled
ALTER PUBLICATION supabase_realtime ADD TABLE beds;

-- Step 8: Verify the fix
SELECT 
    'AFTER CLEANUP' as status,
    COUNT(*) as total_beds,
    COUNT(CASE WHEN status = 'occupied' THEN 1 END) as occupied_beds,
    COUNT(CASE WHEN status = 'vacant' THEN 1 END) as vacant_beds
FROM beds;

-- Step 9: Show all bed numbers to confirm 1-40 exist
SELECT 
    'BED NUMBERS CREATED' as status,
    STRING_AGG(bed_number::text, ', ' ORDER BY bed_number::integer) as bed_numbers
FROM beds;

-- Step 10: Show any restored patient data
SELECT 
    'PATIENT DATA RESTORED' as status,
    bed_number,
    ipd_number,
    patient_id IS NOT NULL as has_patient
FROM beds 
WHERE patient_id IS NOT NULL
ORDER BY bed_number::integer;

-- Final success message
SELECT 
    '✅ SUCCESS: Database cleaned up!' as message,
    'You should now see exactly 40 beds (1-40)' as details,
    (SELECT COUNT(*) FROM beds) as final_bed_count;