-- Create custom_services table for storing user-defined services
-- This table is needed by NewIPDBillingModule.tsx for saving custom services

CREATE TABLE IF NOT EXISTS custom_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    hospital_id UUID NOT NULL,
    service_name TEXT NOT NULL,
    service_code TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'PROCEDURES',
    department TEXT,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_custom_services_hospital_id ON custom_services(hospital_id);
CREATE INDEX IF NOT EXISTS idx_custom_services_service_code ON custom_services(service_code);
CREATE INDEX IF NOT EXISTS idx_custom_services_category ON custom_services(category);
CREATE INDEX IF NOT EXISTS idx_custom_services_active ON custom_services(is_active);

-- Add RLS (Row Level Security)
ALTER TABLE custom_services ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only see services from their hospital
CREATE POLICY IF NOT EXISTS "Users can view custom services from their hospital" ON custom_services
    FOR SELECT USING (true); -- Allow all users to see services for now

CREATE POLICY IF NOT EXISTS "Users can insert custom services" ON custom_services
    FOR INSERT WITH CHECK (true); -- Allow all users to create services for now

CREATE POLICY IF NOT EXISTS "Users can update custom services from their hospital" ON custom_services
    FOR UPDATE USING (true); -- Allow all users to update services for now

CREATE POLICY IF NOT EXISTS "Users can delete custom services from their hospital" ON custom_services
    FOR DELETE USING (true); -- Allow all users to delete services for now

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_custom_services_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_custom_services_updated_at
    BEFORE UPDATE ON custom_services
    FOR EACH ROW EXECUTE FUNCTION update_custom_services_updated_at();

-- Insert some default custom services
INSERT INTO custom_services (hospital_id, service_name, service_code, category, description, base_price)
VALUES
    ('00000000-0000-0000-0000-000000000000', 'Custom Consultation', 'CUSTOM-CONSULT', 'CONSULTATION', 'Custom consultation service', 500.00),
    ('00000000-0000-0000-0000-000000000000', 'Custom Procedure', 'CUSTOM-PROC', 'PROCEDURES', 'Custom procedure service', 1000.00),
    ('00000000-0000-0000-0000-000000000000', 'Custom Medication', 'CUSTOM-MED', 'MEDICATION', 'Custom medication service', 200.00)
ON CONFLICT (service_code) DO NOTHING;