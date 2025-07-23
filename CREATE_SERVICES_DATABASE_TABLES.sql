-- ================================================
-- HOSPITAL SERVICES MODULE - DATABASE TABLES
-- ================================================
-- This script creates all necessary tables for the 
-- comprehensive hospital services module
-- ================================================

-- Enable RLS (Row Level Security) for all tables
-- This ensures data security and access control

-- ================================================
-- 1. SERVICE BOOKINGS TABLE
-- ================================================
-- Stores service appointment bookings

CREATE TABLE IF NOT EXISTS service_bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    service_ids TEXT[] NOT NULL, -- Array of service IDs from hospitalServices.ts
    scheduled_date DATE NOT NULL,
    scheduled_time TIME NOT NULL,
    priority TEXT CHECK (priority IN ('ROUTINE', 'URGENT', 'EMERGENCY')) DEFAULT 'ROUTINE',
    status TEXT CHECK (status IN ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')) DEFAULT 'SCHEDULED',
    notes TEXT,
    is_corporate BOOLEAN DEFAULT FALSE,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    estimated_duration INTEGER NOT NULL DEFAULT 30, -- Duration in minutes
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraint (assuming patients table exists)
    CONSTRAINT fk_service_bookings_patient 
        FOREIGN KEY (patient_id) 
        REFERENCES patients(id) 
        ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_bookings_patient_id ON service_bookings(patient_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_scheduled_date ON service_bookings(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON service_bookings(status);
CREATE INDEX IF NOT EXISTS idx_service_bookings_priority ON service_bookings(priority);

-- Enable RLS
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
    -- Policy for authenticated users to view all bookings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_bookings' 
        AND policyname = 'service_bookings_select_policy'
    ) THEN
        CREATE POLICY service_bookings_select_policy ON service_bookings
            FOR SELECT USING (true);
    END IF;

    -- Policy for authenticated users to insert bookings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_bookings' 
        AND policyname = 'service_bookings_insert_policy'
    ) THEN
        CREATE POLICY service_bookings_insert_policy ON service_bookings
            FOR INSERT WITH CHECK (true);
    END IF;

    -- Policy for authenticated users to update bookings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_bookings' 
        AND policyname = 'service_bookings_update_policy'
    ) THEN
        CREATE POLICY service_bookings_update_policy ON service_bookings
            FOR UPDATE USING (true);
    END IF;

    -- Policy for authenticated users to delete bookings
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_bookings' 
        AND policyname = 'service_bookings_delete_policy'
    ) THEN
        CREATE POLICY service_bookings_delete_policy ON service_bookings
            FOR DELETE USING (true);
    END IF;
END $$;

-- ================================================
-- 2. SERVICE TRANSACTIONS TABLE
-- ================================================
-- Stores detailed transaction records for each service

CREATE TABLE IF NOT EXISTS service_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    service_booking_id UUID, -- Optional: link to booking
    service_id TEXT NOT NULL, -- Service ID from hospitalServices.ts
    service_name TEXT NOT NULL,
    service_category TEXT NOT NULL,
    quantity INTEGER DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    is_corporate BOOLEAN DEFAULT FALSE,
    status TEXT CHECK (status IN ('PENDING', 'COMPLETED', 'CANCELLED', 'REFUNDED')) DEFAULT 'PENDING',
    payment_mode TEXT CHECK (payment_mode IN ('CASH', 'ONLINE', 'INSURANCE', 'PENDING')) DEFAULT 'PENDING',
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_date TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_service_transactions_patient 
        FOREIGN KEY (patient_id) 
        REFERENCES patients(id) 
        ON DELETE CASCADE,
    CONSTRAINT fk_service_transactions_booking
        FOREIGN KEY (service_booking_id)
        REFERENCES service_bookings(id)
        ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_transactions_patient_id ON service_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_service_transactions_booking_id ON service_transactions(service_booking_id);
CREATE INDEX IF NOT EXISTS idx_service_transactions_service_id ON service_transactions(service_id);
CREATE INDEX IF NOT EXISTS idx_service_transactions_status ON service_transactions(status);
CREATE INDEX IF NOT EXISTS idx_service_transactions_category ON service_transactions(service_category);
CREATE INDEX IF NOT EXISTS idx_service_transactions_date ON service_transactions(transaction_date);

-- Enable RLS
ALTER TABLE service_transactions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
    -- Policy for authenticated users to view all transactions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_transactions' 
        AND policyname = 'service_transactions_select_policy'
    ) THEN
        CREATE POLICY service_transactions_select_policy ON service_transactions
            FOR SELECT USING (true);
    END IF;

    -- Policy for authenticated users to insert transactions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_transactions' 
        AND policyname = 'service_transactions_insert_policy'
    ) THEN
        CREATE POLICY service_transactions_insert_policy ON service_transactions
            FOR INSERT WITH CHECK (true);
    END IF;

    -- Policy for authenticated users to update transactions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_transactions' 
        AND policyname = 'service_transactions_update_policy'
    ) THEN
        CREATE POLICY service_transactions_update_policy ON service_transactions
            FOR UPDATE USING (true);
    END IF;

    -- Policy for authenticated users to delete transactions
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_transactions' 
        AND policyname = 'service_transactions_delete_policy'
    ) THEN
        CREATE POLICY service_transactions_delete_policy ON service_transactions
            FOR DELETE USING (true);
    END IF;
END $$;

-- ================================================
-- 3. SERVICE PROVIDERS TABLE (Optional)
-- ================================================
-- Stores information about service providers/doctors

CREATE TABLE IF NOT EXISTS service_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    specialization TEXT,
    department TEXT,
    qualification TEXT,
    experience_years INTEGER,
    contact_phone TEXT,
    contact_email TEXT,
    available_services TEXT[], -- Array of service IDs they can provide
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_service_providers_specialization ON service_providers(specialization);
CREATE INDEX IF NOT EXISTS idx_service_providers_department ON service_providers(department);
CREATE INDEX IF NOT EXISTS idx_service_providers_active ON service_providers(is_active);

-- Enable RLS
ALTER TABLE service_providers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_providers' 
        AND policyname = 'service_providers_select_policy'
    ) THEN
        CREATE POLICY service_providers_select_policy ON service_providers
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_providers' 
        AND policyname = 'service_providers_insert_policy'
    ) THEN
        CREATE POLICY service_providers_insert_policy ON service_providers
            FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_providers' 
        AND policyname = 'service_providers_update_policy'
    ) THEN
        CREATE POLICY service_providers_update_policy ON service_providers
            FOR UPDATE USING (true);
    END IF;
END $$;

-- ================================================
-- 4. SERVICE BOOKING ASSIGNMENTS TABLE
-- ================================================
-- Links service bookings to specific providers

CREATE TABLE IF NOT EXISTS service_booking_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_booking_id UUID NOT NULL,
    service_provider_id UUID NOT NULL,
    service_id TEXT NOT NULL, -- Specific service assigned
    assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT CHECK (status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')) DEFAULT 'ASSIGNED',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key constraints
    CONSTRAINT fk_assignments_booking
        FOREIGN KEY (service_booking_id)
        REFERENCES service_bookings(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_assignments_provider
        FOREIGN KEY (service_provider_id)
        REFERENCES service_providers(id)
        ON DELETE CASCADE,
        
    -- Ensure unique assignment per service per booking
    UNIQUE(service_booking_id, service_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_assignments_booking_id ON service_booking_assignments(service_booking_id);
CREATE INDEX IF NOT EXISTS idx_assignments_provider_id ON service_booking_assignments(service_provider_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON service_booking_assignments(status);

-- Enable RLS
ALTER TABLE service_booking_assignments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_booking_assignments' 
        AND policyname = 'assignments_select_policy'
    ) THEN
        CREATE POLICY assignments_select_policy ON service_booking_assignments
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_booking_assignments' 
        AND policyname = 'assignments_insert_policy'
    ) THEN
        CREATE POLICY assignments_insert_policy ON service_booking_assignments
            FOR INSERT WITH CHECK (true);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'service_booking_assignments' 
        AND policyname = 'assignments_update_policy'
    ) THEN
        CREATE POLICY assignments_update_policy ON service_booking_assignments
            FOR UPDATE USING (true);
    END IF;
END $$;

-- ================================================
-- 5. TRIGGERS FOR AUTOMATIC UPDATES
-- ================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
DO $$
BEGIN
    -- service_bookings trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_service_bookings_updated_at'
    ) THEN
        CREATE TRIGGER update_service_bookings_updated_at
            BEFORE UPDATE ON service_bookings
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- service_transactions trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_service_transactions_updated_at'
    ) THEN
        CREATE TRIGGER update_service_transactions_updated_at
            BEFORE UPDATE ON service_transactions
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- service_providers trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_service_providers_updated_at'
    ) THEN
        CREATE TRIGGER update_service_providers_updated_at
            BEFORE UPDATE ON service_providers
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;

    -- service_booking_assignments trigger
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'update_assignments_updated_at'
    ) THEN
        CREATE TRIGGER update_assignments_updated_at
            BEFORE UPDATE ON service_booking_assignments
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- ================================================
-- 6. SAMPLE DATA INSERTION (Optional)
-- ================================================

-- Insert sample service providers
INSERT INTO service_providers (name, specialization, department, qualification, experience_years, contact_phone, available_services, is_active)
VALUES 
    ('Dr. Rajesh Kumar', 'Cardiology', 'Cardiology', 'MD Cardiology', 15, '+91-9876543210', ARRAY['CAR001', 'CAR002', 'CAR003', 'CAR004', 'CAR005', 'CAR006'], true),
    ('Dr. Priya Sharma', 'Radiology', 'Radiology', 'MD Radiology', 12, '+91-9876543211', ARRAY['RAD001', 'RAD002', 'RAD003', 'RAD004', 'RAD005', 'RAD006', 'RAD007', 'RAD008', 'RAD009', 'RAD010', 'RAD011', 'RAD012'], true),
    ('Dr. Amit Patel', 'General Medicine', 'Laboratory', 'MD Pathology', 10, '+91-9876543212', ARRAY['LAB001', 'LAB002', 'LAB003', 'LAB004', 'LAB005', 'LAB006', 'LAB007', 'LAB008', 'LAB009', 'LAB010', 'LAB011', 'LAB012', 'LAB013'], true),
    ('Dr. Sunita Singh', 'Neurology', 'MRI', 'MD Radiology', 8, '+91-9876543213', ARRAY['MRI001', 'MRI002', 'MRI003', 'MRI004', 'MRI005', 'MRI006', 'MRI007', 'MRI008'], true),
    ('Dr. Vikram Gupta', 'General Surgery', 'Surgery', 'MS General Surgery', 18, '+91-9876543214', ARRAY['PRO001', 'PRO002', 'PRO003', 'PRO004', 'PRO005', 'PRO006', 'PRO007', 'PRO008'], true),
    ('Dr. Kavita Jain', 'Dentistry', 'Dental', 'BDS, MDS', 14, '+91-9876543215', ARRAY['DEN001', 'DEN002', 'DEN003', 'DEN004', 'DEN005', 'DEN006', 'DEN007', 'DEN008', 'DEN009', 'DEN010', 'DEN011'], true)
ON CONFLICT DO NOTHING;

-- ================================================
-- 7. VIEWS FOR REPORTING
-- ================================================

-- View for service booking summary
CREATE OR REPLACE VIEW service_booking_summary AS
SELECT 
    sb.id,
    sb.scheduled_date,
    sb.scheduled_time,
    sb.priority,
    sb.status,
    sb.total_amount,
    sb.is_corporate,
    p.first_name || ' ' || p.last_name AS patient_name,
    p.patient_id,
    p.phone AS patient_phone,
    array_length(sb.service_ids, 1) AS service_count,
    sb.estimated_duration,
    sb.created_at
FROM service_bookings sb
LEFT JOIN patients p ON sb.patient_id = p.id;

-- View for service transaction summary
CREATE OR REPLACE VIEW service_transaction_summary AS
SELECT 
    st.id,
    st.service_name,
    st.service_category,
    st.quantity,
    st.unit_price,
    st.total_amount,
    st.is_corporate,
    st.status,
    st.payment_mode,
    st.transaction_date,
    p.first_name || ' ' || p.last_name AS patient_name,
    p.patient_id,
    sb.scheduled_date,
    sb.scheduled_time
FROM service_transactions st
LEFT JOIN patients p ON st.patient_id = p.id
LEFT JOIN service_bookings sb ON st.service_booking_id = sb.id;

-- ================================================
-- 8. FUNCTIONS FOR ANALYTICS
-- ================================================

-- Function to get service revenue by category
CREATE OR REPLACE FUNCTION get_service_revenue_by_category(
    start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    service_category TEXT,
    total_revenue NUMERIC,
    transaction_count BIGINT,
    avg_transaction_amount NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        st.service_category,
        SUM(st.total_amount) AS total_revenue,
        COUNT(*) AS transaction_count,
        AVG(st.total_amount) AS avg_transaction_amount
    FROM service_transactions st
    WHERE st.status = 'COMPLETED'
        AND st.transaction_date::DATE BETWEEN start_date AND end_date
    GROUP BY st.service_category
    ORDER BY total_revenue DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get daily service statistics
CREATE OR REPLACE FUNCTION get_daily_service_stats(
    target_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE(
    total_bookings BIGINT,
    completed_services BIGINT,
    pending_services BIGINT,
    cancelled_services BIGINT,
    total_revenue NUMERIC,
    corporate_revenue NUMERIC,
    general_revenue NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM service_bookings WHERE scheduled_date = target_date) AS total_bookings,
        (SELECT COUNT(*) FROM service_transactions WHERE transaction_date::DATE = target_date AND status = 'COMPLETED') AS completed_services,
        (SELECT COUNT(*) FROM service_transactions WHERE transaction_date::DATE = target_date AND status = 'PENDING') AS pending_services,
        (SELECT COUNT(*) FROM service_transactions WHERE transaction_date::DATE = target_date AND status = 'CANCELLED') AS cancelled_services,
        (SELECT COALESCE(SUM(total_amount), 0) FROM service_transactions WHERE transaction_date::DATE = target_date AND status = 'COMPLETED') AS total_revenue,
        (SELECT COALESCE(SUM(total_amount), 0) FROM service_transactions WHERE transaction_date::DATE = target_date AND status = 'COMPLETED' AND is_corporate = true) AS corporate_revenue,
        (SELECT COALESCE(SUM(total_amount), 0) FROM service_transactions WHERE transaction_date::DATE = target_date AND status = 'COMPLETED' AND is_corporate = false) AS general_revenue;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- SCRIPT COMPLETED SUCCESSFULLY
-- ================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Hospital Services Database Tables Created Successfully!';
    RAISE NOTICE '📋 Created Tables:';
    RAISE NOTICE '   - service_bookings (Service appointment bookings)';
    RAISE NOTICE '   - service_transactions (Detailed service transactions)';
    RAISE NOTICE '   - service_providers (Service provider information)';
    RAISE NOTICE '   - service_booking_assignments (Provider assignments)';
    RAISE NOTICE '📊 Created Views:';
    RAISE NOTICE '   - service_booking_summary';
    RAISE NOTICE '   - service_transaction_summary';
    RAISE NOTICE '🔧 Created Functions:';
    RAISE NOTICE '   - get_service_revenue_by_category()';
    RAISE NOTICE '   - get_daily_service_stats()';
    RAISE NOTICE '🔐 Row Level Security (RLS) enabled on all tables';
    RAISE NOTICE '⚡ Triggers for automatic timestamp updates added';
    RAISE NOTICE '🎯 Sample service providers inserted';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 Hospital Services Module is ready to use!';
END $$;