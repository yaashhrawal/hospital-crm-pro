-- Create future_appointments table if it doesn't exist
-- Run this script in your Supabase SQL editor

-- Create future_appointments table
CREATE TABLE IF NOT EXISTS future_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    appointment_type TEXT DEFAULT 'CONSULTATION' CHECK (appointment_type IN ('CONSULTATION', 'FOLLOWUP', 'CHECKUP', 'PROCEDURE', 'EMERGENCY')),
    status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'CANCELLED', 'COMPLETED', 'NO_SHOW')),
    reason TEXT,
    estimated_cost DECIMAL(10,2) DEFAULT 0.00,
    notes TEXT,
    hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_future_appointments_patient_id ON future_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_future_appointments_doctor_id ON future_appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_future_appointments_date ON future_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_future_appointments_status ON future_appointments(status);
CREATE INDEX IF NOT EXISTS idx_future_appointments_hospital_id ON future_appointments(hospital_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_future_appointments_updated_at ON future_appointments;
CREATE TRIGGER update_future_appointments_updated_at
    BEFORE UPDATE ON future_appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE future_appointments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY IF NOT EXISTS "Enable all operations for authenticated users"
ON future_appointments FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Insert some sample appointments for testing
INSERT INTO future_appointments (
    patient_id,
    doctor_id, 
    appointment_date,
    appointment_time,
    appointment_type,
    reason,
    estimated_cost,
    status
) VALUES 
-- Use the first patient and user from your tables
(
    (SELECT id FROM patients LIMIT 1),
    (SELECT id FROM users LIMIT 1),
    CURRENT_DATE + INTERVAL '1 day',
    '10:00:00',
    'CONSULTATION',
    'Regular checkup',
    500.00,
    'SCHEDULED'
),
(
    (SELECT id FROM patients LIMIT 1),
    (SELECT id FROM users LIMIT 1),
    CURRENT_DATE + INTERVAL '2 days',
    '14:30:00',
    'FOLLOWUP',
    'Follow up consultation',
    300.00,
    'CONFIRMED'
)
ON CONFLICT DO NOTHING;

-- Verify table was created
SELECT 
    COUNT(*) as appointment_count,
    appointment_type,
    status
FROM future_appointments 
GROUP BY appointment_type, status
ORDER BY appointment_type, status;