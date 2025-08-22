-- Medicines table for storing medicine names and allowing custom entries
CREATE TABLE IF NOT EXISTS medicines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL,
    generic_name TEXT,
    brand_name TEXT,
    category TEXT DEFAULT 'general',
    dosage_form TEXT, -- tablet, syrup, injection, etc.
    strength TEXT,
    manufacturer TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_custom BOOLEAN DEFAULT FALSE, -- Track if this was a custom entry
    usage_count INTEGER DEFAULT 0, -- Track how often it's used for sorting
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_medicines_name ON medicines(name);
CREATE INDEX IF NOT EXISTS idx_medicines_is_active ON medicines(is_active);
CREATE INDEX IF NOT EXISTS idx_medicines_usage_count ON medicines(usage_count DESC);
CREATE INDEX IF NOT EXISTS idx_medicines_category ON medicines(category);

-- RLS Policies for medicines table
ALTER TABLE medicines ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all medicines
CREATE POLICY "Allow authenticated users to read medicines"
    ON medicines FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow authenticated users to insert medicines
CREATE POLICY "Allow authenticated users to insert medicines"
    ON medicines FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Allow authenticated users to update medicines
CREATE POLICY "Allow authenticated users to update medicines"
    ON medicines FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Allow authenticated users to delete medicines (admin only)
CREATE POLICY "Allow admin users to delete medicines"
    ON medicines FOR DELETE
    TO authenticated
    USING (auth.jwt() ->> 'role' = 'admin');

-- Insert initial medicine data (commonly used medicines)
INSERT INTO medicines (name, category, dosage_form, strength) VALUES
-- Antibiotics
('Amoxicillin', 'antibiotic', 'tablet', '500mg'),
('Azithromycin', 'antibiotic', 'tablet', '250mg'),
('Ciprofloxacin', 'antibiotic', 'tablet', '500mg'),
('Doxycycline', 'antibiotic', 'tablet', '100mg'),
('Metronidazole', 'antibiotic', 'tablet', '400mg'),

-- Pain Relief
('Paracetamol', 'analgesic', 'tablet', '500mg'),
('Ibuprofen', 'analgesic', 'tablet', '400mg'),
('Diclofenac', 'analgesic', 'tablet', '50mg'),
('Aspirin', 'analgesic', 'tablet', '75mg'),
('Tramadol', 'analgesic', 'tablet', '50mg'),

-- Antacids & Digestive
('Omeprazole', 'antacid', 'tablet', '20mg'),
('Pantoprazole', 'antacid', 'tablet', '40mg'),
('Ranitidine', 'antacid', 'tablet', '150mg'),
('Domperidone', 'digestive', 'tablet', '10mg'),
('Ondansetron', 'antiemetic', 'tablet', '4mg'),

-- Vitamins & Supplements
('Vitamin D3', 'vitamin', 'tablet', '60000 IU'),
('Vitamin B12', 'vitamin', 'tablet', '500mcg'),
('Folic Acid', 'vitamin', 'tablet', '5mg'),
('Iron + Folic Acid', 'supplement', 'tablet', '100mg+1.5mg'),
('Calcium Carbonate', 'supplement', 'tablet', '500mg'),

-- Respiratory
('Salbutamol', 'bronchodilator', 'inhaler', '100mcg'),
('Montelukast', 'respiratory', 'tablet', '10mg'),
('Cetirizine', 'antihistamine', 'tablet', '10mg'),
('Loratadine', 'antihistamine', 'tablet', '10mg'),
('Dextromethorphan', 'cough suppressant', 'syrup', '10mg/5ml')

ON CONFLICT (name) DO NOTHING;