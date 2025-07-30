-- Create doctors table if it doesn't exist
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

-- Insert sample doctors data if table is empty
INSERT INTO doctors (name, department, specialization, fee, is_active) 
SELECT * FROM (VALUES
    ('DR. HEMANT KHAJJA', 'ORTHOPAEDIC', 'Orthopaedic Surgeon', 800.00, true),
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
WHERE NOT EXISTS (SELECT 1 FROM doctors LIMIT 1);

-- Verify the data
SELECT COUNT(*) as total_doctors FROM doctors;
SELECT * FROM doctors ORDER BY name;