-- =======================================================
-- SAFE SCRIPT FOR MISSING TABLES (Handles existing tables)
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- =======================================================

-- =======================================================
-- 1. CREATE MISSING TABLES ONLY (Skip if they exist)
-- =======================================================

-- Appointments table (most critical for IPD discharge)
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
    duration INTEGER DEFAULT 30,
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

-- Bills table (critical for billing)
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

-- Future appointments table
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
    created_from TEXT,
    hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- IPD services table
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
    provided_by TEXT,
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
-- 2. HANDLE BEDS TABLE (Add missing columns if needed)
-- =======================================================

-- Check if beds table exists and add missing columns
DO $$
DECLARE
    beds_exists boolean;
    column_exists boolean;
BEGIN
    -- Check if beds table exists
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'beds'
    ) INTO beds_exists;
    
    IF NOT beds_exists THEN
        -- Create beds table if it doesn't exist
        CREATE TABLE beds (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            bed_number TEXT NOT NULL UNIQUE,
            room_type TEXT NOT NULL CHECK (room_type IN ('GENERAL', 'PRIVATE', 'ICU', 'EMERGENCY')),
            daily_rate DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
            status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED')),
            description TEXT,
            is_active BOOLEAN DEFAULT TRUE,
            hospital_id UUID DEFAULT '550e8400-e29b-41d4-a716-446655440000'::uuid,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        RAISE NOTICE 'Created beds table';
    ELSE
        -- Beds table exists, check and add missing columns
        
        -- Check if daily_rate column exists
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'beds' AND column_name = 'daily_rate'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            ALTER TABLE beds ADD COLUMN daily_rate DECIMAL(10,2) NOT NULL DEFAULT 1000.00;
            RAISE NOTICE 'Added daily_rate column to beds table';
        END IF;
        
        -- Check if status column exists
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'beds' AND column_name = 'status'
        ) INTO column_exists;
        
        IF NOT column_exists THEN
            ALTER TABLE beds ADD COLUMN status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'OCCUPIED', 'MAINTENANCE', 'RESERVED'));
            RAISE NOTICE 'Added status column to beds table';
        END IF;
        
        RAISE NOTICE 'Beds table already exists, checked for missing columns';
    END IF;
END $$;

-- =======================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =======================================================

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

-- Beds indexes (only if table exists)
CREATE INDEX IF NOT EXISTS idx_beds_bed_number ON beds(bed_number);
CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);

-- =======================================================
-- 4. ENABLE ROW LEVEL SECURITY
-- =======================================================

-- Enable RLS on new tables
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;  
ALTER TABLE future_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ipd_services ENABLE ROW LEVEL SECURITY;

-- Enable RLS on beds if it exists
DO $$
BEGIN
    ALTER TABLE beds ENABLE ROW LEVEL SECURITY;
EXCEPTION 
    WHEN undefined_table THEN 
        RAISE NOTICE 'Beds table not found, skipping RLS';
END $$;

-- =======================================================
-- 5. CREATE RLS POLICIES
-- =======================================================

-- Drop existing policies and create new ones
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Enable all operations for authenticated users on appointments" ON appointments;
    DROP POLICY IF EXISTS "Enable all operations for authenticated users on bills" ON bills;
    DROP POLICY IF EXISTS "Enable all operations for authenticated users on future_appointments" ON future_appointments;
    DROP POLICY IF EXISTS "Enable all operations for authenticated users on ipd_services" ON ipd_services;
    DROP POLICY IF EXISTS "Enable all operations for authenticated users on beds" ON beds;
EXCEPTION 
    WHEN undefined_table THEN NULL;
    WHEN undefined_object THEN NULL;
END $$;

-- Create new policies
CREATE POLICY "Enable all operations for authenticated users on appointments"
ON appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users on bills"
ON bills FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users on future_appointments"
ON future_appointments FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for authenticated users on ipd_services"
ON ipd_services FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create beds policy only if table exists
DO $$
BEGIN
    CREATE POLICY "Enable all operations for authenticated users on beds"
    ON beds FOR ALL TO authenticated USING (true) WITH CHECK (true);
EXCEPTION 
    WHEN undefined_table THEN 
        RAISE NOTICE 'Beds table not found, skipping policy creation';
END $$;

-- =======================================================
-- 6. CREATE UPDATE FUNCTION AND TRIGGERS
-- =======================================================

-- Create the update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
DROP TRIGGER IF EXISTS update_bills_updated_at ON bills;
DROP TRIGGER IF EXISTS update_future_appointments_updated_at ON future_appointments;
DROP TRIGGER IF EXISTS update_ipd_services_updated_at ON ipd_services;
DROP TRIGGER IF EXISTS update_beds_updated_at ON beds;

-- Create triggers for new tables
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

-- Create beds trigger only if table exists
DO $$
BEGIN
    CREATE TRIGGER update_beds_updated_at
        BEFORE UPDATE ON beds FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
EXCEPTION 
    WHEN undefined_table THEN 
        RAISE NOTICE 'Beds table not found, skipping trigger creation';
END $$;

-- =======================================================
-- 7. INSERT SAMPLE DATA (Only for beds if newly created)
-- =======================================================

-- Insert sample beds only if table is empty
DO $$
DECLARE
    bed_count integer;
BEGIN
    SELECT COUNT(*) INTO bed_count FROM beds;
    
    IF bed_count = 0 THEN
        INSERT INTO beds (bed_number, room_type, daily_rate, status) VALUES
        ('B001', 'GENERAL', 1000.00, 'AVAILABLE'),
        ('B002', 'GENERAL', 1000.00, 'AVAILABLE'),
        ('B003', 'GENERAL', 1000.00, 'AVAILABLE'),
        ('P001', 'PRIVATE', 2500.00, 'AVAILABLE'),
        ('P002', 'PRIVATE', 2500.00, 'AVAILABLE'),
        ('I001', 'ICU', 5000.00, 'AVAILABLE'),
        ('I002', 'ICU', 5000.00, 'AVAILABLE'),
        ('E001', 'EMERGENCY', 1500.00, 'AVAILABLE')
        ON CONFLICT (bed_number) DO NOTHING;
        
        RAISE NOTICE 'Inserted sample bed data';
    ELSE
        RAISE NOTICE 'Beds table already has data, skipping sample insert';
    END IF;
EXCEPTION 
    WHEN undefined_table THEN 
        RAISE NOTICE 'Beds table not found, skipping sample data';
END $$;

-- =======================================================
-- 8. VERIFICATION
-- =======================================================

-- Check what tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name = 'beds' THEN 
            CASE WHEN EXISTS(SELECT 1 FROM beds LIMIT 1) THEN (SELECT COUNT(*)::text FROM beds) ELSE '0' END
        WHEN table_name = 'appointments' THEN 
            CASE WHEN EXISTS(SELECT 1 FROM appointments LIMIT 1) THEN (SELECT COUNT(*)::text FROM appointments) ELSE '0' END
        WHEN table_name = 'bills' THEN 
            CASE WHEN EXISTS(SELECT 1 FROM bills LIMIT 1) THEN (SELECT COUNT(*)::text FROM bills) ELSE '0' END
        WHEN table_name = 'future_appointments' THEN 
            CASE WHEN EXISTS(SELECT 1 FROM future_appointments LIMIT 1) THEN (SELECT COUNT(*)::text FROM future_appointments) ELSE '0' END
        WHEN table_name = 'ipd_services' THEN 
            CASE WHEN EXISTS(SELECT 1 FROM ipd_services LIMIT 1) THEN (SELECT COUNT(*)::text FROM ipd_services) ELSE '0' END
        ELSE 'TABLE_NOT_FOUND'
    END as record_count,
    CASE 
        WHEN EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' AND information_schema.tables.table_name = t.table_name
        ) THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as table_status
FROM (
    VALUES 
        ('beds'),
        ('appointments'), 
        ('bills'),
        ('future_appointments'),
        ('ipd_services')
) AS t(table_name);

-- Final success message
SELECT '🎉 SUCCESS: All required tables are now ready!' as status,
       'Your IPD discharge functionality should work properly now!' as message;