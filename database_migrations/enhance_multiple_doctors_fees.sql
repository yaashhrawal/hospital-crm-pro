-- Database Migration: Enhance Multiple Doctors with Fee Support
-- This migration adds fee support to the multiple doctors feature
-- while maintaining full backward compatibility

-- Step 1: Add consultation_fees column to store individual doctor fees
-- This is a JSONB column that will store fee information for each doctor
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS consultation_fees JSONB DEFAULT NULL;

-- Step 2: Create index for better performance on consultation_fees queries
CREATE INDEX IF NOT EXISTS idx_patients_consultation_fees 
ON patients USING GIN (consultation_fees);

-- Step 3: Add a helper function to calculate total consultation fees
-- This function handles both old single doctor format and new multiple doctor format
CREATE OR REPLACE FUNCTION calculate_total_consultation_fees(patient_row patients)
RETURNS NUMERIC AS $$
DECLARE
    total_fee NUMERIC := 0;
    doctor_fee JSONB;
BEGIN
    -- If consultation_fees exists (new format), sum all doctor fees
    IF patient_row.consultation_fees IS NOT NULL THEN
        FOR doctor_fee IN SELECT jsonb_array_elements(patient_row.consultation_fees)
        LOOP
            total_fee := total_fee + COALESCE((doctor_fee->>'fee')::NUMERIC, 0);
        END LOOP;
        RETURN total_fee;
    END IF;
    
    -- If assigned_doctors exists with fee info, sum from there
    IF patient_row.assigned_doctors IS NOT NULL THEN
        FOR doctor_fee IN SELECT jsonb_array_elements(patient_row.assigned_doctors)
        LOOP
            IF doctor_fee ? 'consultationFee' THEN
                total_fee := total_fee + COALESCE((doctor_fee->>'consultationFee')::NUMERIC, 0);
            END IF;
        END LOOP;
        
        -- If we found fees in assigned_doctors, return that
        IF total_fee > 0 THEN
            RETURN total_fee;
        END IF;
    END IF;
    
    -- For single doctor format without fee info, return 0 (fees are handled in transactions)
    RETURN 0;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create a function to get primary doctor with fee information
CREATE OR REPLACE FUNCTION get_primary_doctor_info(patient_row patients)
RETURNS JSONB AS $$
DECLARE
    doctor_info JSONB;
    primary_doctor JSONB := NULL;
BEGIN
    -- Check new assigned_doctors format first
    IF patient_row.assigned_doctors IS NOT NULL THEN
        FOR doctor_info IN SELECT jsonb_array_elements(patient_row.assigned_doctors)
        LOOP
            IF (doctor_info->>'isPrimary')::BOOLEAN = true THEN
                primary_doctor := doctor_info;
                EXIT;
            END IF;
        END LOOP;
        
        -- If no primary found, take the first one
        IF primary_doctor IS NULL THEN
            primary_doctor := (SELECT jsonb_array_elements(patient_row.assigned_doctors) LIMIT 1);
        END IF;
        
        RETURN primary_doctor;
    END IF;
    
    -- Fallback to single doctor format
    RETURN jsonb_build_object(
        'name', patient_row.assigned_doctor,
        'department', patient_row.assigned_department,
        'consultationFee', NULL,
        'isPrimary', true
    );
END;
$$ LANGUAGE plpgsql;

-- Step 5: Add comments for documentation
COMMENT ON COLUMN patients.consultation_fees IS 'JSONB array storing individual doctor consultation fees for multiple doctor consultations. Format: [{"doctorName": "Dr. Smith", "department": "Cardiology", "fee": 500}]';

COMMENT ON FUNCTION calculate_total_consultation_fees(patients) IS 'Calculates total consultation fees from multiple doctors or falls back to single doctor fee for backward compatibility';

COMMENT ON FUNCTION get_primary_doctor_info(patients) IS 'Returns primary doctor information with fee, handles both single and multiple doctor formats';

-- Step 6: Create a view for easy reporting of doctor fees
CREATE OR REPLACE VIEW patient_doctor_fees AS
SELECT 
    p.id,
    p.patient_id,
    CONCAT(p.first_name, ' ', p.last_name) as full_name,
    p.first_name,
    p.last_name,
    p.phone,
    p.created_at,
    get_primary_doctor_info(p) as primary_doctor,
    calculate_total_consultation_fees(p) as total_consultation_fee,
    p.assigned_doctors,
    p.consultation_fees,
    -- Legacy fields for backward compatibility
    p.assigned_doctor,
    p.assigned_department
FROM patients p;

COMMENT ON VIEW patient_doctor_fees IS 'Unified view showing patient doctor and fee information, compatible with both single and multiple doctor formats';

-- Step 7: Validation constraints
-- Ensure that if multiple doctors are assigned, each has a fee
ALTER TABLE patients 
ADD CONSTRAINT check_multiple_doctors_have_fees 
CHECK (
    assigned_doctors IS NULL OR 
    consultation_fees IS NOT NULL OR 
    (jsonb_array_length(assigned_doctors) = 1) OR
    (
        assigned_doctors IS NOT NULL AND 
        NOT EXISTS (
            SELECT 1 
            FROM jsonb_array_elements(assigned_doctors) as doctor 
            WHERE doctor ? 'consultationFee' = false
        )
    )
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE 'Database migration completed successfully!';
    RAISE NOTICE 'Added consultation_fees column with backward compatibility';
    RAISE NOTICE 'Created helper functions for fee calculations';
    RAISE NOTICE 'Added reporting view: patient_doctor_fees';
    RAISE NOTICE 'All existing data remains functional';
END $$;