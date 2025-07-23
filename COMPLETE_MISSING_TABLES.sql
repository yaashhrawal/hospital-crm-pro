-- =======================================================
-- COMPLETE MISSING TABLES FOR IPD DISCHARGE FUNCTIONALITY
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- =======================================================

-- 1. BEDS TABLE - Critical for IPD bed management
CREATE TABLE IF NOT EXISTS beds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bed_number TEXT NOT NULL UNIQUE,
    room_type TEXT NOT NULL CHECK (room_type IN ('GENERAL', 'PRIVATE', 'ICU', 'EMERGENCY')),
    ward_name TEXT,
    floor_number INTEGER,
    daily_rate DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED')),
    features TEXT[], -- Array of features like 'AC', 'TV', 'BATHROOM'
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. APPOINTMENTS TABLE - Core appointment functionality
CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id TEXT NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    appointment_type TEXT NOT NULL DEFAULT 'CONSULTATION' CHECK (appointment_type IN ('CONSULTATION', 'FOLLOW_UP', 'PROCEDURE', 'EMERGENCY', 'VACCINATION')),
    status TEXT NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW')),
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    duration INTEGER DEFAULT 30, -- Duration in minutes
    reason TEXT,
    symptoms TEXT,
    diagnosis TEXT,
    prescription TEXT,
    follow_up_date DATE,
    follow_up_instructions TEXT,
    notes TEXT,
    priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    estimated_cost DECIMAL(10,2) DEFAULT 0.00,
    actual_cost DECIMAL(10,2) DEFAULT 0.00,
    hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- 3. BILLS TABLE - Comprehensive billing system
CREATE TABLE IF NOT EXISTS bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bill_number TEXT NOT NULL UNIQUE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    admission_id UUID REFERENCES patient_admissions(id) ON DELETE SET NULL,
    bill_type TEXT NOT NULL CHECK (bill_type IN ('CONSULTATION', 'ADMISSION', 'PROCEDURE', 'PHARMACY', 'DIAGNOSTIC', 'DISCHARGE', 'OTHER')),
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PAID', 'PARTIAL', 'CANCELLED', 'REFUNDED')),
    
    -- Bill breakdown
    consultation_fee DECIMAL(10,2) DEFAULT 0.00,
    medicine_charges DECIMAL(10,2) DEFAULT 0.00,
    diagnostic_charges DECIMAL(10,2) DEFAULT 0.00,
    procedure_charges DECIMAL(10,2) DEFAULT 0.00,
    room_charges DECIMAL(10,2) DEFAULT 0.00,
    nursing_charges DECIMAL(10,2) DEFAULT 0.00,
    other_charges DECIMAL(10,2) DEFAULT 0.00,
    
    -- Totals
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0.00,
    discount_amount DECIMAL(10,2) DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL,
    paid_amount DECIMAL(10,2) DEFAULT 0.00,
    due_amount DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    
    -- Payment details
    payment_method TEXT CHECK (payment_method IN ('CASH', 'CARD', 'UPI', 'ONLINE', 'INSURANCE', 'CHEQUE')),
    payment_reference TEXT,
    payment_date TIMESTAMP WITH TIME ZONE,
    
    -- Additional info
    notes TEXT,
    due_date DATE,
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- System fields
    hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. FUTURE_APPOINTMENTS TABLE - Follow-up appointment scheduling
CREATE TABLE IF NOT EXISTS future_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME,
    appointment_type TEXT DEFAULT 'FOLLOW_UP' CHECK (appointment_type IN ('FOLLOW_UP', 'CONSULTATION', 'PROCEDURE', 'CHECK_UP')),
    reason TEXT,
    priority TEXT DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    status TEXT DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED')),
    notes TEXT,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_from TEXT, -- 'DISCHARGE', 'CONSULTATION', 'MANUAL'
    hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. IPD_SERVICES TABLE - IPD service tracking and billing
CREATE TABLE IF NOT EXISTS ipd_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admission_id UUID NOT NULL REFERENCES patient_admissions(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    service_name TEXT NOT NULL,
    service_type TEXT NOT NULL CHECK (service_type IN ('NURSING', 'MEDICATION', 'PROCEDURE', 'CONSULTATION', 'DIAGNOSTIC', 'PHYSIOTHERAPY', 'SURGERY', 'OTHER')),
    service_category TEXT,
    description TEXT,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    service_date DATE NOT NULL DEFAULT CURRENT_DATE,
    service_time TIME,
    provided_by TEXT, -- Name of person who provided service
    provided_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    department TEXT,
    status TEXT DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    notes TEXT,
    billing_status TEXT DEFAULT 'PENDING' CHECK (billing_status IN ('PENDING', 'BILLED', 'PAID')),
    hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =======================================================
-- INDEXES FOR PERFORMANCE
-- =======================================================

-- Beds indexes
CREATE INDEX IF NOT EXISTS idx_beds_bed_number ON beds(bed_number);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);
CREATE INDEX IF NOT EXISTS idx_beds_room_type ON beds(room_type);

-- Appointments indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_id ON appointments(appointment_id);

-- Bills indexes  
CREATE INDEX IF NOT EXISTS idx_bills_patient_id ON bills(patient_id);
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills(bill_number);
CREATE INDEX IF NOT EXISTS idx_bills_status ON bills(status);
CREATE INDEX IF NOT EXISTS idx_bills_bill_date ON bills(bill_date);
CREATE INDEX IF NOT EXISTS idx_bills_appointment_id ON bills(appointment_id);

-- Future appointments indexes
CREATE INDEX IF NOT EXISTS idx_future_appointments_patient_id ON future_appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_future_appointments_appointment_date ON future_appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_future_appointments_status ON future_appointments(status);

-- IPD services indexes
CREATE INDEX IF NOT EXISTS idx_ipd_services_admission_id ON ipd_services(admission_id);
CREATE INDEX IF NOT EXISTS idx_ipd_services_patient_id ON ipd_services(patient_id);
CREATE INDEX IF NOT EXISTS idx_ipd_services_service_date ON ipd_services(service_date);
CREATE INDEX IF NOT EXISTS idx_ipd_services_service_type ON ipd_services(service_type);

-- =======================================================
-- ROW LEVEL SECURITY (RLS)
-- =======================================================

ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE future_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipd_services ENABLE ROW LEVEL SECURITY;

-- =======================================================
-- RLS POLICIES (Allow authenticated users full access)
-- =======================================================

-- Drop existing policies if they exist, then create new ones
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Enable all operations for authenticated users on beds" ON beds;
    DROP POLICY IF EXISTS "Enable all operations for authenticated users on appointments" ON appointments;
    DROP POLICY IF EXISTS "Enable all operations for authenticated users on bills" ON bills;
    DROP POLICY IF EXISTS "Enable all operations for authenticated users on future_appointments" ON future_appointments;
    DROP POLICY IF EXISTS "Enable all operations for authenticated users on ipd_services" ON ipd_services;
EXCEPTION 
    WHEN undefined_table THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;

-- Create new policies
CREATE POLICY "Enable all operations for authenticated users on beds"
ON beds FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users on appointments"
ON appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users on bills"
ON bills FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users on future_appointments"
ON future_appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users on ipd_services"
ON ipd_services FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- =======================================================
-- UPDATED_AT FUNCTION (Create if doesn't exist)
-- =======================================================

-- Create the update function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =======================================================
-- UPDATED_AT TRIGGERS
-- =======================================================

-- Drop existing triggers if they exist, then create new ones
DROP TRIGGER IF EXISTS update_beds_updated_at ON beds;
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
DROP TRIGGER IF EXISTS update_bills_updated_at ON bills;
DROP TRIGGER IF EXISTS update_future_appointments_updated_at ON future_appointments;
DROP TRIGGER IF EXISTS update_ipd_services_updated_at ON ipd_services;

-- Create triggers for updated_at columns
CREATE TRIGGER update_beds_updated_at
    BEFORE UPDATE ON beds FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_updated_at
    BEFORE UPDATE ON bills FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_future_appointments_updated_at
    BEFORE UPDATE ON future_appointments FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ipd_services_updated_at
    BEFORE UPDATE ON ipd_services FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =======================================================
-- SAMPLE DATA FOR TESTING
-- =======================================================

-- First, let's check what columns exist in the beds table
DO $$
DECLARE
    beds_exists boolean;
BEGIN
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'beds'
    ) INTO beds_exists;
    
    IF beds_exists THEN
        RAISE NOTICE 'Beds table already exists, skipping sample data insert';
    ELSE
        -- Insert sample beds only if table was just created
        INSERT INTO beds (bed_number, room_type, ward_name, floor_number, daily_rate, status) VALUES
        ('B001', 'GENERAL', 'General Ward A', 1, 1000.00, 'AVAILABLE'),
        ('B002', 'GENERAL', 'General Ward A', 1, 1000.00, 'AVAILABLE'),
        ('B003', 'GENERAL', 'General Ward A', 1, 1000.00, 'AVAILABLE'),
        ('P001', 'PRIVATE', 'Private Wing', 2, 2500.00, 'AVAILABLE'),
        ('P002', 'PRIVATE', 'Private Wing', 2, 2500.00, 'AVAILABLE'),
        ('I001', 'ICU', 'ICU Ward', 3, 5000.00, 'AVAILABLE'),
        ('I002', 'ICU', 'ICU Ward', 3, 5000.00, 'AVAILABLE'),
        ('E001', 'EMERGENCY', 'Emergency Ward', 1, 1500.00, 'AVAILABLE')
        ON CONFLICT (bed_number) DO NOTHING;
    END IF;
END $$;

-- =======================================================
-- VERIFICATION QUERIES
-- =======================================================

-- Verify all tables were created successfully
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'beds' THEN (SELECT COUNT(*) FROM beds)::text
        WHEN table_name = 'appointments' THEN (SELECT COUNT(*) FROM appointments)::text
        WHEN table_name = 'bills' THEN (SELECT COUNT(*) FROM bills)::text
        WHEN table_name = 'future_appointments' THEN (SELECT COUNT(*) FROM future_appointments)::text
        WHEN table_name = 'ipd_services' THEN (SELECT COUNT(*) FROM ipd_services)::text
        ELSE '0'
    END as record_count
FROM (
    VALUES 
        ('beds'),
        ('appointments'), 
        ('bills'),
        ('future_appointments'),
        ('ipd_services')
) AS t(table_name);

-- Final success message
SELECT '🎉 SUCCESS: All missing tables created successfully!' as status,
       'Your IPD discharge functionality should now work properly!' as message;