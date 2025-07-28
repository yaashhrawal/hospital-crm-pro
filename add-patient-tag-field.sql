-- Add TAG field to patients table for community/camp identification
-- This allows filtering patients by community (Jain, Bohara, Corporate) or camp type

-- 1. Add patient_tag field to patients table
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS patient_tag TEXT;

-- 2. Add index for better performance when filtering by tag
CREATE INDEX IF NOT EXISTS idx_patients_patient_tag ON patients(patient_tag);

-- 3. Create a patient_tags reference table for standardized tags (optional for future)
CREATE TABLE IF NOT EXISTS patient_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_name TEXT UNIQUE NOT NULL,
    tag_description TEXT,
    tag_color TEXT DEFAULT '#3B82F6', -- Default blue color for UI
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insert common tags for communities and camps
INSERT INTO patient_tags (tag_name, tag_description, tag_color) VALUES
    ('Jain Community', 'Patients from Jain community', '#10B981'),
    ('Bohara Community', 'Patients from Bohara community', '#F59E0B'),
    ('Corporate Camp', 'Corporate health camp patients', '#8B5CF6'),
    ('Medical Camp', 'General medical camp patients', '#EF4444'),
    ('School Camp', 'School health checkup patients', '#06B6D4'),
    ('Senior Citizen', 'Senior citizen patients', '#84CC16'),
    ('Insurance', 'Insurance covered patients', '#F97316'),
    ('Government Scheme', 'Government scheme patients', '#EC4899'),
    ('VIP', 'VIP patients', '#DC2626'),
    ('Regular', 'Regular walk-in patients', '#6B7280')
ON CONFLICT (tag_name) DO NOTHING;

-- 5. Add comments for documentation
COMMENT ON COLUMN patients.patient_tag IS 'Tag for categorizing patients by community, camp type, or special categories';
COMMENT ON TABLE patient_tags IS 'Reference table for standardized patient tags/categories';

-- 6. Create view for patients with tag information (for easier querying)
-- First, ensure is_active column exists in patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

CREATE OR REPLACE VIEW patients_with_tags AS
SELECT 
    p.*,
    pt.tag_description,
    pt.tag_color,
    pt.is_active as tag_active
FROM patients p
LEFT JOIN patient_tags pt ON p.patient_tag = pt.tag_name;

-- Success message
SELECT 'Patient TAG field added successfully! You can now categorize patients by community, camp type, or other tags.' as status;