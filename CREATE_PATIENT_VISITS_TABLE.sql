-- Create patient_visits table to track individual visits
CREATE TABLE IF NOT EXISTS patient_visits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    visit_type VARCHAR(50) DEFAULT 'Consultation',
    chief_complaint TEXT,
    diagnosis TEXT,
    treatment_plan TEXT,
    doctor_id UUID REFERENCES doctors(id),
    department VARCHAR(100),
    vital_signs JSONB, -- Stores BP, temperature, weight, etc.
    prescriptions JSONB, -- Stores medication details
    follow_up_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_patient_visits_patient_id ON patient_visits(patient_id);
CREATE INDEX idx_patient_visits_visit_date ON patient_visits(visit_date);

-- Enable RLS (Row Level Security)
ALTER TABLE patient_visits ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to view/create visits
CREATE POLICY "Allow authenticated users to manage patient visits" ON patient_visits
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_patient_visits_updated_at BEFORE UPDATE
    ON patient_visits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();