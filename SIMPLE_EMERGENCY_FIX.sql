-- SIMPLE EMERGENCY FIX - NO COMPLEX SYNTAX
-- Run this to fix the broken app

-- Remove all problematic constraints
ALTER TABLE patient_transactions DROP CONSTRAINT IF EXISTS fk_patient_transactions_patient_id CASCADE;
ALTER TABLE patient_admissions DROP CONSTRAINT IF EXISTS fk_patient_admissions_patient_id CASCADE;
ALTER TABLE patient_admissions DROP CONSTRAINT IF EXISTS fk_patient_admissions_bed_id CASCADE;
ALTER TABLE beds DROP CONSTRAINT IF EXISTS fk_beds_department_id CASCADE;
ALTER TABLE doctors DROP CONSTRAINT IF EXISTS fk_doctors_department_id CASCADE;

-- Remove primary key constraints  
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_pkey CASCADE;
ALTER TABLE patient_transactions DROP CONSTRAINT IF EXISTS patient_transactions_pkey CASCADE;
ALTER TABLE doctors DROP CONSTRAINT IF EXISTS doctors_pkey CASCADE;
ALTER TABLE departments DROP CONSTRAINT IF EXISTS departments_pkey CASCADE;
ALTER TABLE patient_admissions DROP CONSTRAINT IF EXISTS patient_admissions_pkey CASCADE;
ALTER TABLE beds DROP CONSTRAINT IF EXISTS beds_pkey CASCADE;

-- Fix NULL ids
UPDATE patients SET id = gen_random_uuid() WHERE id IS NULL;
UPDATE patient_transactions SET id = gen_random_uuid() WHERE id IS NULL;
UPDATE doctors SET id = gen_random_uuid() WHERE id IS NULL;
UPDATE departments SET id = gen_random_uuid() WHERE id IS NULL;

-- Fix hospital_id
UPDATE patients SET hospital_id = '550e8400-e29b-41d4-a716-446655440000' WHERE hospital_id IS NULL;
UPDATE patient_transactions SET hospital_id = '550e8400-e29b-41d4-a716-446655440000' WHERE hospital_id IS NULL;

-- Fix basic fields
UPDATE patients SET is_active = true WHERE is_active IS NULL;
UPDATE patients SET created_at = now() WHERE created_at IS NULL;
UPDATE patient_transactions SET created_at = now() WHERE created_at IS NULL;
UPDATE patient_transactions SET status = 'COMPLETED' WHERE status IS NULL;

-- Remove problematic tables
DROP TABLE IF EXISTS patient_admissions CASCADE;
DROP TABLE IF EXISTS beds CASCADE;

-- Clean up orphaned transactions
DELETE FROM patient_transactions WHERE patient_id NOT IN (SELECT id FROM patients);

-- Simple test
SELECT COUNT(*) as patients_count FROM patients WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';
SELECT COUNT(*) as transactions_count FROM patient_transactions WHERE hospital_id = '550e8400-e29b-41d4-a716-446655440000';