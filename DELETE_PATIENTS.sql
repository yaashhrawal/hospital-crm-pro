-- BULK PATIENT DELETION SCRIPT
-- WARNING: This will permanently delete patients and all their related data
-- Make sure to backup your database before running this script

-- List of patient IDs to delete
-- P000046, P000045, P000001, P000043, P000042, P000041, P000040, P000039, P000038, P000037
-- P000036, P000035, P000034, P000033, P000032, P000031, P000030, P000029, P000028, P000027
-- P000026, P000025, P000024, P000023, P000022, P000021, P000020, P000019, P000018, P000017
-- P000016, P000015, P000014, P000013, P000012, P000011, P000010, P000009, P000008, P000007
-- P000006, P0003, P0005, P0002, P0001, P0004

BEGIN;

-- Step 1: Get the actual database IDs (UUID) for the patient_ids
WITH patients_to_delete AS (
  SELECT id, patient_id FROM patients 
  WHERE patient_id IN (
    'P000046', 'P000045', 'P000001', 'P000043', 'P000042', 'P000041', 'P000040', 'P000039', 'P000038', 'P000037',
    'P000036', 'P000035', 'P000034', 'P000033', 'P000032', 'P000031', 'P000030', 'P000029', 'P000028', 'P000027',
    'P000026', 'P000025', 'P000024', 'P000023', 'P000022', 'P000021', 'P000020', 'P000019', 'P000018', 'P000017',
    'P000016', 'P000015', 'P000014', 'P000013', 'P000012', 'P000011', 'P000010', 'P000009', 'P000008', 'P000007',
    'P000006', 'P0003', 'P0005', 'P0002', 'P0001', 'P0004'
  )
)

-- Step 2: Delete related data first (due to foreign key constraints)

-- Delete patient transactions
, delete_transactions AS (
  DELETE FROM patient_transactions 
  WHERE patient_id IN (SELECT id FROM patients_to_delete)
  RETURNING patient_id
)

-- Delete patient admissions
, delete_admissions AS (
  DELETE FROM patient_admissions 
  WHERE patient_id IN (SELECT id FROM patients_to_delete)
  RETURNING patient_id
)

-- Delete future appointments
, delete_appointments AS (
  DELETE FROM future_appointments 
  WHERE patient_id IN (SELECT id FROM patients_to_delete)
  RETURNING patient_id
)

-- Step 3: Delete the patients themselves
, delete_patients AS (
  DELETE FROM patients 
  WHERE id IN (SELECT id FROM patients_to_delete)
  RETURNING id, patient_id, first_name, last_name
)

-- Step 4: Show summary of deleted records
SELECT 
  (SELECT COUNT(*) FROM delete_transactions) as transactions_deleted,
  (SELECT COUNT(*) FROM delete_admissions) as admissions_deleted,
  (SELECT COUNT(*) FROM delete_appointments) as appointments_deleted,
  (SELECT COUNT(*) FROM delete_patients) as patients_deleted,
  (SELECT string_agg(patient_id || ' (' || first_name || ' ' || last_name || ')', ', ') FROM delete_patients) as deleted_patients;

COMMIT;

-- Verification query - Run this after the deletion to verify
-- SELECT patient_id, first_name, last_name FROM patients 
-- WHERE patient_id IN (
--   'P000046', 'P000045', 'P000001', 'P000043', 'P000042', 'P000041', 'P000040', 'P000039', 'P000038', 'P000037',
--   'P000036', 'P000035', 'P000034', 'P000033', 'P000032', 'P000031', 'P000030', 'P000029', 'P000028', 'P000027',
--   'P000026', 'P000025', 'P000024', 'P000023', 'P000022', 'P000021', 'P000020', 'P000019', 'P000018', 'P000017',
--   'P000016', 'P000015', 'P000014', 'P000013', 'P000012', 'P000011', 'P000010', 'P000009', 'P000008', 'P000007',
--   'P000006', 'P0003', 'P0005', 'P0002', 'P0001', 'P0004'
-- );
-- This should return 0 rows if deletion was successful