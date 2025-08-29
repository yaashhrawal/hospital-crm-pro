-- Hospital CRM Sample Data Import Script for Azure PostgreSQL
-- This script populates all tables with realistic sample data

-- First, let's get the admin user ID for foreign key references
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@hospital.com';
    
    -- Insert Doctors
    INSERT INTO doctors (name, department, specialization, fee, phone, email) VALUES
    ('Dr. Rajesh Kumar', 'Cardiology', 'Interventional Cardiology', 1500.00, '+91-9876543210', 'rajesh.kumar@hospital.com'),
    ('Dr. Priya Sharma', 'Pediatrics', 'Child Development', 800.00, '+91-9876543211', 'priya.sharma@hospital.com'),
    ('Dr. Amit Singh', 'Surgery', 'General Surgery', 2000.00, '+91-9876543212', 'amit.singh@hospital.com'),
    ('Dr. Sunita Gupta', 'Obstetrics & Gynecology', 'Maternal Health', 1200.00, '+91-9876543213', 'sunita.gupta@hospital.com'),
    ('Dr. Vikram Patel', 'Orthopedics', 'Joint Replacement', 1800.00, '+91-9876543214', 'vikram.patel@hospital.com'),
    ('Dr. Meera Joshi', 'General Medicine', 'Internal Medicine', 600.00, '+91-9876543215', 'meera.joshi@hospital.com'),
    ('Dr. Arjun Reddy', 'Neurology', 'Neurological Surgery', 2500.00, '+91-9876543216', 'arjun.reddy@hospital.com'),
    ('Dr. Kavita Nair', 'Emergency', 'Emergency Medicine', 1000.00, '+91-9876543217', 'kavita.nair@hospital.com'),
    ('Dr. Rohit Agarwal', 'ICU', 'Critical Care', 1800.00, '+91-9876543218', 'rohit.agarwal@hospital.com'),
    ('Dr. Asha Menon', 'Radiology', 'Diagnostic Imaging', 900.00, '+91-9876543219', 'asha.menon@hospital.com');

    -- Insert Beds
    INSERT INTO beds (bed_number, department, room_type, floor, daily_rate) VALUES
    -- General Ward Beds (Floor 1)
    ('G101', 'General Medicine', 'general', 1, 800.00),
    ('G102', 'General Medicine', 'general', 1, 800.00),
    ('G103', 'General Medicine', 'general', 1, 800.00),
    ('G104', 'General Medicine', 'general', 1, 800.00),
    ('G105', 'General Medicine', 'general', 1, 800.00),
    
    -- Private Rooms (Floor 2)
    ('P201', 'Surgery', 'private', 2, 2000.00),
    ('P202', 'Surgery', 'private', 2, 2000.00),
    ('P203', 'Cardiology', 'private', 2, 2200.00),
    ('P204', 'Cardiology', 'private', 2, 2200.00),
    ('P205', 'Orthopedics', 'private', 2, 1800.00),
    
    -- Semi-Private Rooms (Floor 2)
    ('SP206', 'Pediatrics', 'semi-private', 2, 1200.00),
    ('SP207', 'Pediatrics', 'semi-private', 2, 1200.00),
    ('SP208', 'Obstetrics & Gynecology', 'semi-private', 2, 1400.00),
    ('SP209', 'Obstetrics & Gynecology', 'semi-private', 2, 1400.00),
    
    -- ICU Beds (Floor 3)
    ('ICU301', 'ICU', 'icu', 3, 5000.00),
    ('ICU302', 'ICU', 'icu', 3, 5000.00),
    ('ICU303', 'ICU', 'icu', 3, 5000.00),
    ('ICU304', 'ICU', 'icu', 3, 5000.00),
    
    -- Emergency Beds (Ground Floor)
    ('ER001', 'Emergency', 'emergency', 0, 1500.00),
    ('ER002', 'Emergency', 'emergency', 0, 1500.00),
    ('ER003', 'Emergency', 'emergency', 0, 1500.00);

    -- Insert Medicines
    INSERT INTO medicines (name, generic_name, category, manufacturer, unit_price, stock_quantity, reorder_level, expiry_date, batch_number) VALUES
    ('Paracetamol 500mg', 'Paracetamol', 'Analgesic', 'Sun Pharma', 2.50, 1000, 100, '2025-12-31', 'PC001'),
    ('Amoxicillin 250mg', 'Amoxicillin', 'Antibiotic', 'Cipla', 15.00, 500, 50, '2025-10-15', 'AM001'),
    ('Aspirin 75mg', 'Aspirin', 'Antiplatelet', 'Dr. Reddy''s', 3.20, 800, 80, '2025-11-30', 'AS001'),
    ('Metformin 500mg', 'Metformin', 'Antidiabetic', 'Lupin', 8.50, 600, 60, '2026-01-20', 'MF001'),
    ('Lisinopril 10mg', 'Lisinopril', 'ACE Inhibitor', 'Ranbaxy', 12.00, 400, 40, '2025-09-15', 'LS001'),
    ('Omeprazole 20mg', 'Omeprazole', 'PPI', 'Zydus Cadila', 6.80, 700, 70, '2025-12-10', 'OM001'),
    ('Ceftriaxone 1g', 'Ceftriaxone', 'Antibiotic', 'Glenmark', 45.00, 200, 20, '2025-08-30', 'CF001'),
    ('Diclofenac 50mg', 'Diclofenac', 'NSAID', 'Mankind', 4.50, 900, 90, '2026-02-28', 'DC001'),
    ('Insulin Regular', 'Human Insulin', 'Hormone', 'Biocon', 120.00, 150, 15, '2025-07-31', 'IN001'),
    ('Salbutamol Inhaler', 'Salbutamol', 'Bronchodilator', 'GSK', 85.00, 300, 30, '2025-11-15', 'SB001');

    -- Insert Patients
    INSERT INTO patients (patient_id, first_name, last_name, age, gender, phone, email, address, emergency_contact_name, emergency_contact_phone, medical_history, allergies, blood_group, date_of_entry, created_by) VALUES
    ('PAT001', 'Ramesh', 'Kumar', 45, 'MALE', '+91-9876501234', 'ramesh.kumar@email.com', '123 MG Road, Mumbai, Maharashtra 400001', 'Sunita Kumar', '+91-9876501235', 'Hypertension, Diabetes Type 2', 'No known allergies', 'B+', CURRENT_DATE - INTERVAL '30 days', admin_user_id),
    ('PAT002', 'Priya', 'Sharma', 28, 'FEMALE', '+91-9876501236', 'priya.sharma@email.com', '456 Park Street, Delhi, Delhi 110001', 'Raj Sharma', '+91-9876501237', 'None', 'Penicillin allergy', 'A+', CURRENT_DATE - INTERVAL '25 days', admin_user_id),
    ('PAT003', 'Arjun', 'Singh', 62, 'MALE', '+91-9876501238', 'arjun.singh@email.com', '789 Brigade Road, Bangalore, Karnataka 560001', 'Meera Singh', '+91-9876501239', 'Heart Disease, Arthritis', 'No known allergies', 'O+', CURRENT_DATE - INTERVAL '20 days', admin_user_id),
    ('PAT004', 'Kavita', 'Patel', 35, 'FEMALE', '+91-9876501240', 'kavita.patel@email.com', '321 FC Road, Pune, Maharashtra 411001', 'Vikram Patel', '+91-9876501241', 'Thyroid disorder', 'Latex allergy', 'AB+', CURRENT_DATE - INTERVAL '18 days', admin_user_id),
    ('PAT005', 'Rohit', 'Gupta', 22, 'MALE', '+91-9876501242', 'rohit.gupta@email.com', '654 Salt Lake, Kolkata, West Bengal 700001', 'Asha Gupta', '+91-9876501243', 'Asthma', 'Dust allergy', 'B-', CURRENT_DATE - INTERVAL '15 days', admin_user_id),
    ('PAT006', 'Anita', 'Joshi', 58, 'FEMALE', '+91-9876501244', 'anita.joshi@email.com', '987 Anna Salai, Chennai, Tamil Nadu 600001', 'Suresh Joshi', '+91-9876501245', 'Diabetes, High cholesterol', 'No known allergies', 'A-', CURRENT_DATE - INTERVAL '12 days', admin_user_id),
    ('PAT007', 'Manoj', 'Reddy', 41, 'MALE', '+91-9876501246', 'manoj.reddy@email.com', '159 Banjara Hills, Hyderabad, Telangana 500001', 'Lakshmi Reddy', '+91-9876501247', 'Migraine, Back pain', 'Aspirin allergy', 'O-', CURRENT_DATE - INTERVAL '10 days', admin_user_id),
    ('PAT008', 'Deepa', 'Nair', 33, 'FEMALE', '+91-9876501248', 'deepa.nair@email.com', '753 Marine Drive, Kochi, Kerala 682001', 'Ravi Nair', '+91-9876501249', 'None', 'Shellfish allergy', 'AB-', CURRENT_DATE - INTERVAL '8 days', admin_user_id),
    ('PAT009', 'Sanjay', 'Agarwal', 67, 'MALE', '+91-9876501250', 'sanjay.agarwal@email.com', '852 Civil Lines, Jaipur, Rajasthan 302001', 'Renu Agarwal', '+91-9876501251', 'COPD, Hypertension', 'No known allergies', 'B+', CURRENT_DATE - INTERVAL '5 days', admin_user_id),
    ('PAT010', 'Pooja', 'Menon', 26, 'FEMALE', '+91-9876501252', 'pooja.menon@email.com', '741 Residency Road, Mysore, Karnataka 570001', 'Arun Menon', '+91-9876501253', 'None', 'No known allergies', 'A+', CURRENT_DATE - INTERVAL '3 days', admin_user_id),
    ('PAT011', 'Vikash', 'Yadav', 54, 'MALE', '+91-9876501254', 'vikash.yadav@email.com', '963 Hazratganj, Lucknow, Uttar Pradesh 226001', 'Sunita Yadav', '+91-9876501255', 'Kidney stones, Gout', 'Sulfa drugs allergy', 'O+', CURRENT_DATE - INTERVAL '2 days', admin_user_id),
    ('PAT012', 'Rekha', 'Das', 39, 'FEMALE', '+91-9876501256', 'rekha.das@email.com', '147 Park Circus, Kolkata, West Bengal 700017', 'Amit Das', '+91-9876501257', 'Depression, Anxiety', 'No known allergies', 'B-', CURRENT_DATE - INTERVAL '1 day', admin_user_id),
    ('PAT013', 'Ajay', 'Kapoor', 31, 'MALE', '+91-9876501258', 'ajay.kapoor@email.com', '258 CP, New Delhi, Delhi 110001', 'Neha Kapoor', '+91-9876501259', 'Sports injury history', 'No known allergies', 'A-', CURRENT_DATE, admin_user_id),
    ('PAT014', 'Madhuri', 'Iyer', 48, 'FEMALE', '+91-9876501260', 'madhuri.iyer@email.com', '369 Worli, Mumbai, Maharashtra 400018', 'Suresh Iyer', '+91-9876501261', 'Breast cancer survivor', 'Chemotherapy allergies', 'AB+', CURRENT_DATE, admin_user_id),
    ('PAT015', 'Ravi', 'Chandra', 72, 'MALE', '+91-9876501262', 'ravi.chandra@email.com', '456 Jubilee Hills, Hyderabad, Telangana 500033', 'Lakshmi Chandra', '+91-9876501263', 'Alzheimer''s early stage, Diabetes', 'No known allergies', 'O-', CURRENT_DATE, admin_user_id);

END $$;

-- Get doctor IDs for transactions and appointments
DO $$
DECLARE
    dr_rajesh_id UUID;
    dr_priya_id UUID;
    dr_amit_id UUID;
    dr_sunita_id UUID;
    dr_vikram_id UUID;
    dr_meera_id UUID;
    dr_arjun_id UUID;
    dr_kavita_id UUID;
    dr_rohit_id UUID;
    dr_asha_id UUID;
    admin_user_id UUID;
    patient_ids UUID[];
    bed_ids UUID[];
BEGIN
    -- Get doctor IDs
    SELECT id INTO dr_rajesh_id FROM doctors WHERE name = 'Dr. Rajesh Kumar';
    SELECT id INTO dr_priya_id FROM doctors WHERE name = 'Dr. Priya Sharma';
    SELECT id INTO dr_amit_id FROM doctors WHERE name = 'Dr. Amit Singh';
    SELECT id INTO dr_sunita_id FROM doctors WHERE name = 'Dr. Sunita Gupta';
    SELECT id INTO dr_vikram_id FROM doctors WHERE name = 'Dr. Vikram Patel';
    SELECT id INTO dr_meera_id FROM doctors WHERE name = 'Dr. Meera Joshi';
    SELECT id INTO dr_arjun_id FROM doctors WHERE name = 'Dr. Arjun Reddy';
    SELECT id INTO dr_kavita_id FROM doctors WHERE name = 'Dr. Kavita Nair';
    SELECT id INTO dr_rohit_id FROM doctors WHERE name = 'Dr. Rohit Agarwal';
    SELECT id INTO dr_asha_id FROM doctors WHERE name = 'Dr. Asha Menon';
    
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@hospital.com';
    
    -- Get patient IDs array
    SELECT ARRAY(SELECT id FROM patients ORDER BY created_at) INTO patient_ids;

    -- Insert Patient Transactions
    INSERT INTO patient_transactions (patient_id, transaction_type, amount, payment_mode, doctor_id, doctor_name, department, description, transaction_date, created_by) VALUES
    -- Entry fees
    (patient_ids[1], 'entry_fee', 100.00, 'cash', NULL, NULL, 'General Medicine', 'Hospital entry fee', CURRENT_DATE - INTERVAL '30 days', admin_user_id),
    (patient_ids[2], 'entry_fee', 100.00, 'upi', NULL, NULL, 'Pediatrics', 'Hospital entry fee', CURRENT_DATE - INTERVAL '25 days', admin_user_id),
    (patient_ids[3], 'entry_fee', 100.00, 'card', NULL, NULL, 'Cardiology', 'Hospital entry fee', CURRENT_DATE - INTERVAL '20 days', admin_user_id),
    
    -- Consultations
    (patient_ids[1], 'consultation', 600.00, 'cash', dr_meera_id, 'Dr. Meera Joshi', 'General Medicine', 'General checkup and medication', CURRENT_DATE - INTERVAL '29 days', admin_user_id),
    (patient_ids[2], 'consultation', 800.00, 'online', dr_priya_id, 'Dr. Priya Sharma', 'Pediatrics', 'Child development consultation', CURRENT_DATE - INTERVAL '24 days', admin_user_id),
    (patient_ids[3], 'consultation', 1500.00, 'card', dr_rajesh_id, 'Dr. Rajesh Kumar', 'Cardiology', 'Cardiac evaluation', CURRENT_DATE - INTERVAL '19 days', admin_user_id),
    (patient_ids[4], 'consultation', 1200.00, 'upi', dr_sunita_id, 'Dr. Sunita Gupta', 'Obstetrics & Gynecology', 'Prenatal checkup', CURRENT_DATE - INTERVAL '17 days', admin_user_id),
    (patient_ids[5], 'consultation', 600.00, 'cash', dr_meera_id, 'Dr. Meera Joshi', 'General Medicine', 'Asthma management', CURRENT_DATE - INTERVAL '14 days', admin_user_id),
    
    -- Lab tests
    (patient_ids[1], 'lab_test', 450.00, 'cash', NULL, NULL, 'Radiology', 'Blood sugar and lipid profile', CURRENT_DATE - INTERVAL '28 days', admin_user_id),
    (patient_ids[3], 'lab_test', 800.00, 'card', NULL, NULL, 'Radiology', 'ECG and Echo test', CURRENT_DATE - INTERVAL '18 days', admin_user_id),
    (patient_ids[6], 'lab_test', 350.00, 'upi', NULL, NULL, 'Radiology', 'Complete blood count', CURRENT_DATE - INTERVAL '11 days', admin_user_id),
    
    -- Medicines
    (patient_ids[1], 'medicine', 125.50, 'cash', NULL, NULL, 'Pharmacy', 'Diabetes medication - 1 month supply', CURRENT_DATE - INTERVAL '27 days', admin_user_id),
    (patient_ids[2], 'medicine', 85.00, 'upi', NULL, NULL, 'Pharmacy', 'Pediatric vitamins', CURRENT_DATE - INTERVAL '23 days', admin_user_id),
    (patient_ids[5], 'medicine', 95.00, 'cash', NULL, NULL, 'Pharmacy', 'Salbutamol inhaler', CURRENT_DATE - INTERVAL '13 days', admin_user_id),
    
    -- Procedures
    (patient_ids[7], 'procedure', 2500.00, 'card', dr_arjun_id, 'Dr. Arjun Reddy', 'Neurology', 'MRI scan and consultation', CURRENT_DATE - INTERVAL '9 days', admin_user_id),
    (patient_ids[11], 'procedure', 1800.00, 'insurance', dr_vikram_id, 'Dr. Vikram Patel', 'Orthopedics', 'Joint X-ray and physiotherapy', CURRENT_DATE - INTERVAL '1 day', admin_user_id);

    -- Insert Appointments
    INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, department, status, notes, created_by) VALUES
    -- Today's appointments
    (patient_ids[13], dr_meera_id, CURRENT_DATE, '09:00:00', 'General Medicine', 'confirmed', 'Follow-up for sports injury', admin_user_id),
    (patient_ids[14], dr_rajesh_id, CURRENT_DATE, '10:30:00', 'Cardiology', 'confirmed', 'Post-cancer cardiac health check', admin_user_id),
    (patient_ids[15], dr_arjun_id, CURRENT_DATE, '14:00:00', 'Neurology', 'scheduled', 'Alzheimer evaluation', admin_user_id),
    
    -- Tomorrow's appointments
    (patient_ids[1], dr_meera_id, CURRENT_DATE + INTERVAL '1 day', '09:30:00', 'General Medicine', 'scheduled', 'Diabetes follow-up', admin_user_id),
    (patient_ids[5], dr_priya_id, CURRENT_DATE + INTERVAL '1 day', '11:00:00', 'Pediatrics', 'scheduled', 'Asthma management review', admin_user_id),
    (patient_ids[7], dr_arjun_id, CURRENT_DATE + INTERVAL '1 day', '15:30:00', 'Neurology', 'scheduled', 'MRI results discussion', admin_user_id),
    
    -- Next week appointments
    (patient_ids[3], dr_rajesh_id, CURRENT_DATE + INTERVAL '7 days', '10:00:00', 'Cardiology', 'scheduled', 'Cardiac procedure follow-up', admin_user_id),
    (patient_ids[4], dr_sunita_id, CURRENT_DATE + INTERVAL '8 days', '11:30:00', 'Obstetrics & Gynecology', 'scheduled', 'Monthly prenatal checkup', admin_user_id),
    (patient_ids[6], dr_meera_id, CURRENT_DATE + INTERVAL '10 days', '09:00:00', 'General Medicine', 'scheduled', 'Cholesterol management', admin_user_id),
    (patient_ids[12], dr_arjun_id, CURRENT_DATE + INTERVAL '14 days', '14:30:00', 'Neurology', 'scheduled', 'Depression and anxiety consultation', admin_user_id);

    -- Insert some Patient Admissions (current and recent)
    INSERT INTO patient_admissions (patient_id, bed_number, room_type, department, daily_rate, admission_date, treating_doctor, history_present_illness, diagnosis, status, created_by) VALUES
    -- Current admissions
    (patient_ids[3], 'P203', 'private', 'Cardiology', 2200.00, CURRENT_DATE - INTERVAL '5 days', dr_rajesh_id, 'Chest pain and shortness of breath for 2 days', 'Acute myocardial infarction', 'active', admin_user_id),
    (patient_ids[9], 'ICU301', 'icu', 'ICU', 5000.00, CURRENT_DATE - INTERVAL '3 days', dr_rohit_id, 'Severe COPD exacerbation with respiratory failure', 'Acute respiratory failure', 'active', admin_user_id),
    (patient_ids[15], 'P201', 'private', 'Neurology', 2000.00, CURRENT_DATE - INTERVAL '2 days', dr_arjun_id, 'Progressive memory loss and confusion', 'Alzheimer disease evaluation', 'active', admin_user_id),
    
    -- Recent discharges
    (patient_ids[7], 'P202', 'private', 'Surgery', 2000.00, CURRENT_DATE - INTERVAL '15 days', dr_amit_id, 'Severe abdominal pain, suspected appendicitis', 'Acute appendicitis', 'discharged', admin_user_id),
    (patient_ids[11], 'P205', 'private', 'Orthopedics', 1800.00, CURRENT_DATE - INTERVAL '10 days', dr_vikram_id, 'Right knee pain and swelling after fall', 'Knee meniscus tear', 'discharged', admin_user_id);

    -- Update bed occupancy for current admissions
    UPDATE beds SET status = 'occupied', patient_id = patient_ids[3] WHERE bed_number = 'P203';
    UPDATE beds SET status = 'occupied', patient_id = patient_ids[9] WHERE bed_number = 'ICU301';
    UPDATE beds SET status = 'occupied', patient_id = patient_ids[15] WHERE bed_number = 'P201';

    -- Insert Patient Visits
    INSERT INTO patient_visits (patient_id, visit_date, visit_type, doctor_id, department, chief_complaint, diagnosis, treatment, prescription, follow_up_date, created_by) VALUES
    (patient_ids[1], CURRENT_DATE - INTERVAL '30 days', 'OPD', dr_meera_id, 'General Medicine', 'High blood sugar levels', 'Diabetes Type 2', 'Diet counseling, medication adjustment', 'Metformin 500mg BD, Glimepiride 2mg OD', CURRENT_DATE + INTERVAL '30 days', admin_user_id),
    (patient_ids[2], CURRENT_DATE - INTERVAL '25 days', 'OPD', dr_priya_id, 'Pediatrics', 'Delayed developmental milestones', 'Normal development with minor delays', 'Physiotherapy recommended', 'Multivitamin syrup', CURRENT_DATE + INTERVAL '60 days', admin_user_id),
    (patient_ids[5], CURRENT_DATE - INTERVAL '15 days', 'OPD', dr_meera_id, 'General Medicine', 'Breathing difficulty, wheezing', 'Bronchial asthma', 'Inhaler technique demonstration', 'Salbutamol inhaler SOS, Montelukast 10mg OD', CURRENT_DATE + INTERVAL '15 days', admin_user_id),
    (patient_ids[7], CURRENT_DATE - INTERVAL '10 days', 'Follow-up', dr_arjun_id, 'Neurology', 'Post-procedure follow-up', 'Migraine management', 'Continue current medication', 'Sumatriptan 50mg SOS', CURRENT_DATE + INTERVAL '30 days', admin_user_id),
    (patient_ids[12], CURRENT_DATE - INTERVAL '5 days', 'OPD', dr_meera_id, 'General Medicine', 'Persistent sadness, sleep disturbance', 'Depression with anxiety', 'Counseling referral', 'Sertraline 25mg OD', CURRENT_DATE + INTERVAL '14 days', admin_user_id);

    -- Insert Daily Expenses
    INSERT INTO daily_expenses (expense_category, description, amount, payment_mode, expense_date, receipt_number, vendor_name, created_by) VALUES
    ('Medical Supplies', 'Surgical instruments and disposables', 15000.00, 'bank_transfer', CURRENT_DATE - INTERVAL '7 days', 'RCP001', 'MedSupply Co.', admin_user_id),
    ('Utilities', 'Electricity bill for the month', 25000.00, 'online', CURRENT_DATE - INTERVAL '5 days', 'EB001', 'State Electricity Board', admin_user_id),
    ('Maintenance', 'ICU equipment servicing', 8000.00, 'cash', CURRENT_DATE - INTERVAL '3 days', 'MNT001', 'TechCare Services', admin_user_id),
    ('Pharmaceuticals', 'Medicine stock replenishment', 35000.00, 'cheque', CURRENT_DATE - INTERVAL '2 days', 'PH001', 'MedPharma Distributors', admin_user_id),
    ('Administrative', 'Office supplies and stationery', 2500.00, 'cash', CURRENT_DATE - INTERVAL '1 day', 'ADM001', 'Office Mart', admin_user_id),
    ('Food Services', 'Patient meal catering', 12000.00, 'upi', CURRENT_DATE, 'FS001', 'Healthy Meals Catering', admin_user_id);

END $$;

-- Create some discharge summaries for discharged patients
DO $$
DECLARE
    admin_user_id UUID;
    admission_id_1 UUID;
    admission_id_2 UUID;
    patient_id_7 UUID;
    patient_id_11 UUID;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@hospital.com';
    SELECT id INTO patient_id_7 FROM patients WHERE patient_id = 'PAT007';
    SELECT id INTO patient_id_11 FROM patients WHERE patient_id = 'PAT011';
    
    -- Get admission IDs for discharged patients
    SELECT id INTO admission_id_1 FROM patient_admissions WHERE patient_id = patient_id_7 AND status = 'discharged';
    SELECT id INTO admission_id_2 FROM patient_admissions WHERE patient_id = patient_id_11 AND status = 'discharged';

    INSERT INTO discharge_summary (admission_id, patient_id, discharge_date, discharge_type, final_diagnosis, treatment_summary, discharge_instructions, follow_up_instructions, medications_on_discharge, created_by) VALUES
    (admission_id_1, patient_id_7, CURRENT_DATE - INTERVAL '12 days', 'Regular', 'Acute appendicitis - post appendectomy', 'Patient underwent laparoscopic appendectomy on admission day. Surgery was successful without complications. Post-operative recovery was uneventful.', 'Wound care instructions provided. Avoid heavy lifting for 2 weeks. Resume normal activities gradually.', 'Follow-up in surgery OPD after 1 week. Remove sutures after 7-10 days.', 'Paracetamol 500mg TDS for pain, Amoxicillin 250mg TDS for 5 days', admin_user_id),
    (admission_id_2, patient_id_11, CURRENT_DATE - INTERVAL '7 days', 'Regular', 'Right knee meniscus tear - conservative management', 'Patient was managed conservatively with rest, ice application, compression and elevation (RICE protocol). Physiotherapy was initiated. Good response to treatment.', 'Continue knee exercises as demonstrated. Use ice pack 15-20 minutes 3-4 times daily. Avoid sudden twisting movements.', 'Physiotherapy sessions 3 times a week for 4 weeks. Review in orthopedics OPD after 2 weeks.', 'Diclofenac 50mg BD for pain and inflammation, continue for 1 week', admin_user_id);

END $$;