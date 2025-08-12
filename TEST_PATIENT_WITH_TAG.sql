-- Add a test patient with a patient tag to verify the system works
-- Run this in Supabase Dashboard → SQL Editor

-- First, let's check if we have any patients with tags
SELECT patient_id, first_name, last_name, patient_tag 
FROM patients 
WHERE patient_tag IS NOT NULL AND patient_tag != ''
LIMIT 10;

-- Add a test patient with 'Jain Community' tag
INSERT INTO patients (
    id, 
    patient_id,
    first_name,
    last_name,
    date_of_birth,
    age,
    gender,
    phone,
    hospital_id,
    patient_tag,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'P' || LPAD(FLOOR(RANDOM() * 9999 + 1)::TEXT, 4, '0'),
    'Test',
    'Patient Jain',
    '1985-06-15',
    39,
    'MALE',
    '9876543210',
    '550e8400-e29b-41d4-a716-446655440000',
    'Jain Community',
    true,
    NOW(),
    NOW()
) ON CONFLICT (patient_id) DO UPDATE SET
    patient_tag = 'Jain Community',
    is_active = true;

-- Add a test patient with 'Medical Camp' tag
INSERT INTO patients (
    id, 
    patient_id,
    first_name,
    last_name,
    date_of_birth,
    age,
    gender,
    phone,
    hospital_id,
    patient_tag,
    is_active,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'P' || LPAD(FLOOR(RANDOM() * 9999 + 1)::TEXT, 4, '0'),
    'Camp',
    'Patient Medical',
    '1990-03-20',
    34,
    'FEMALE',
    '9876543211',
    '550e8400-e29b-41d4-a716-446655440000',
    'Medical Camp',
    true,
    NOW(),
    NOW()
) ON CONFLICT (patient_id) DO UPDATE SET
    patient_tag = 'Medical Camp',
    is_active = true;

-- Create some transactions for these patients so they show up in operations
DO $$
DECLARE
    jain_patient_id UUID;
    camp_patient_id UUID;
BEGIN
    -- Get the patient IDs
    SELECT id INTO jain_patient_id 
    FROM patients 
    WHERE patient_tag = 'Jain Community' 
    AND first_name = 'Test' 
    LIMIT 1;
    
    SELECT id INTO camp_patient_id 
    FROM patients 
    WHERE patient_tag = 'Medical Camp' 
    AND first_name = 'Camp' 
    LIMIT 1;
    
    -- Create transactions for Jain Community patient
    IF jain_patient_id IS NOT NULL THEN
        INSERT INTO patient_transactions (
            patient_id,
            transaction_type,
            amount,
            payment_mode,
            description,
            status,
            hospital_id,
            created_at
        ) VALUES (
            jain_patient_id,
            'consultation',
            500,
            'CASH',
            'Consultation Fee - Jain Community Patient',
            'COMPLETED',
            '550e8400-e29b-41d4-a716-446655440000',
            NOW()
        );
    END IF;
    
    -- Create transactions for Medical Camp patient
    IF camp_patient_id IS NOT NULL THEN
        INSERT INTO patient_transactions (
            patient_id,
            transaction_type,
            amount,
            payment_mode,
            description,
            status,
            hospital_id,
            created_at
        ) VALUES (
            camp_patient_id,
            'consultation',
            300,
            'CASH',
            'Consultation Fee - Medical Camp Patient',
            'COMPLETED',
            '550e8400-e29b-41d4-a716-446655440000',
            NOW()
        );
    END IF;
END $$;

-- Verify the test data
SELECT 
    p.patient_id,
    p.first_name,
    p.last_name,
    p.patient_tag,
    COUNT(pt.id) as transaction_count,
    SUM(pt.amount) as total_amount
FROM patients p
LEFT JOIN patient_transactions pt ON p.id = pt.patient_id AND pt.status = 'COMPLETED'
WHERE p.patient_tag IN ('Jain Community', 'Medical Camp')
GROUP BY p.id, p.patient_id, p.first_name, p.last_name, p.patient_tag
ORDER BY p.patient_tag;