-- Create departments table if it doesn't exist
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert departments if table is empty
INSERT INTO departments (name, description, is_active) 
SELECT * FROM (VALUES
    ('ORTHOPAEDIC', 'Orthopaedic Surgery and Bone Care', true),
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
WHERE NOT EXISTS (SELECT 1 FROM departments LIMIT 1);

-- Verify the data
SELECT COUNT(*) as total_departments FROM departments;
SELECT * FROM departments ORDER BY name;