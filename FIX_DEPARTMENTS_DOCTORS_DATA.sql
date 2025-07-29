-- Fix departments and doctors data to be consistent across the application

-- First, clear existing data
DELETE FROM doctors;
DELETE FROM departments;

-- Insert departments (matching what the application expects)
INSERT INTO departments (name, description, is_active) VALUES
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
    ('NEPHROLOGY', 'Kidney and Renal System', true),
    ('PULMONOLOGY', 'Lungs and Respiratory System', true),
    ('DERMATOLOGY', 'Skin and Hair Care', true),
    ('RADIOLOGY', 'Imaging and Diagnostics', true),
    ('PATHOLOGY', 'Laboratory and Disease Study', true),
    ('GENERAL SURGERY', 'General Surgical Procedures', true),
    ('MEDICINE', 'Internal Medicine', true),
    ('GENERAL', 'General Medicine and OPD', true)
ON CONFLICT (name) DO UPDATE SET 
    description = EXCLUDED.description,
    is_active = EXCLUDED.is_active;

-- Insert doctors (matching department names exactly)
INSERT INTO doctors (name, department, specialization, fee, is_active) VALUES
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
    ('DR. JASDEV AHLUWALIA', 'GENERAL SURGERY', 'General Surgeon', 1100.00, true),
    ('DR. PANKAJ NAVADIYA', 'GENERAL SURGERY', 'General Surgeon', 1100.00, true),
    ('DR. ANUBHAV SHARMA', 'GENERAL SURGERY', 'General Surgeon', 1100.00, true),
    ('DR. ASHISH RANJAN', 'CHEST PHYSICIAN', 'Pulmonologist', 950.00, true),
    ('DR. MUKESH GARG', 'PHYSICIAN', 'General Physician', 600.00, true),
    ('DR. MAHESH GOKLANI', 'PHYSICIAN', 'General Physician', 600.00, true),
    ('DR. JYOTSNA JHAWAR', 'GYN.', 'Gynecologist', 900.00, true),
    ('DR. RAKESH YADAV', 'GENERAL', 'General Practitioner', 400.00, true),
    ('DR. SONIA MEHTA', 'GENERAL', 'General Practitioner', 400.00, true),
    ('DR. VIKAS KUMAR', 'MEDICINE', 'Internal Medicine', 700.00, true),
    ('DR. PRIYA SINGH', 'DERMATOLOGY', 'Dermatologist', 800.00, true),
    ('DR. AMIT VERMA', 'ENDOCRINOLOGY', 'Endocrinologist', 1100.00, true),
    ('DR. NEHA SHARMA', 'NEPHROLOGY', 'Nephrologist', 1000.00, true),
    ('DR. RAJESH GUPTA', 'PULMONOLOGY', 'Pulmonologist', 950.00, true),
    ('DR. SUNIL PATHAK', 'RADIOLOGY', 'Radiologist', 1200.00, true),
    ('DR. MEERA JAIN', 'PATHOLOGY', 'Pathologist', 700.00, true)
ON CONFLICT DO NOTHING;

-- Verify the data
SELECT 'Departments:' as info;
SELECT name, description FROM departments ORDER BY name;

SELECT 'Doctors:' as info;
SELECT name, department, specialization, fee FROM doctors ORDER BY department, name;