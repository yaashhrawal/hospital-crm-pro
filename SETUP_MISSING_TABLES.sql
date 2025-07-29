-- Setup script to create missing tables and data
-- Run this in your Supabase SQL Editor

-- 1. Create departments table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create doctors table
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    department TEXT NOT NULL,
    specialization TEXT,
    fee NUMERIC(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Insert departments
INSERT INTO departments (name, description, is_active) 
SELECT * FROM (VALUES
    ('ORTHOPEDIC', 'Orthopedic Surgery and Bone Care', true),
    ('DIETICIAN', 'Nutrition and Diet Planning', true),
    ('GASTRO', 'Gastroenterology and Digestive System', true),
    ('GYN.', 'Gynecology and Women Health', true),
    ('NEUROLOGY', 'Neurology and Nervous System', true),
    ('UROLOGY', 'Urology and Urinary System', true),
    ('SURGICAL ONCOLOGY', 'Surgical Cancer Treatment', true),
    ('MEDICAL ONCOLOGY', 'Medical Cancer Treatment', true),
    ('NEUROSURGERY', 'Brain and Spine Surgery', true),
    ('ENDOCRINOLOGY', 'Hormones and Metabolism', true),
    ('GENERAL PHYSICIAN', 'General Medicine and Primary Care', true),
    ('GENERAL', 'General Department', true)
) AS dept_data(name, description, is_active)
ON CONFLICT (name) DO NOTHING;

-- 4. Insert doctors
INSERT INTO doctors (name, department, specialization, fee, is_active) 
SELECT * FROM (VALUES
    ('DR. HEMANT KHAJJA', 'ORTHOPEDIC', 'Orthopedic Surgeon', 800.00, true),
    ('DR. LALITA SUWALKA', 'DIETICIAN', 'Clinical Dietician', 500.00, true),
    ('DR. MILIND KIRIT AKHANI', 'GASTRO', 'Gastroenterologist', 1000.00, true),
    ('DR MEETU BABLE', 'GYN.', 'Gynecologist', 900.00, true),
    ('DR. AMIT PATANVADIYA', 'NEUROLOGY', 'Neurologist', 1200.00, true),
    ('DR. KISHAN PATEL', 'UROLOGY', 'Urologist', 1000.00, true),
    ('DR. PARTH SHAH', 'SURGICAL ONCOLOGY', 'Surgical Oncologist', 1500.00, true),
    ('DR.RAJEEDP GUPTA', 'MEDICAL ONCOLOGY', 'Medical Oncologist', 1500.00, true),
    ('DR. KULDDEP VALA', 'NEUROSURGERY', 'Neurosurgeon', 2000.00, true),
    ('DR. KURNAL PATEL', 'UROLOGY', 'Urologist', 1000.00, true),
    ('DR. SAURABH GUPTA', 'ENDOCRINOLOGY', 'Endocrinologist', 800.00, true),
    ('DR. BATUL PEEPAWALA', 'GENERAL PHYSICIAN', 'General Physician', 600.00, true)
) AS doctors_data(name, department, specialization, fee, is_active)
ON CONFLICT DO NOTHING;

-- 5. Verify setup
SELECT 'Departments created:' as info, COUNT(*) as count FROM departments
UNION ALL
SELECT 'Doctors created:' as info, COUNT(*) as count FROM doctors;

-- Show sample data
SELECT 'Sample doctors:' as section, '' as data, '' as extra
UNION ALL
SELECT name, department, fee::text FROM doctors LIMIT 5;