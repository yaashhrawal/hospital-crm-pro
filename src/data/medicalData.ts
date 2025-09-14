// Comprehensive Medical Data for Hospital CRM
// All medical constants, options, and dropdown data

// High Risk Conditions
export const HIGH_RISK_CONDITIONS = [
  'COVID19',
  'Dengue',
  'HIV',
  'HbsAg',
  'Thalassemia',
  'Rh negative mother',
  'Heart disease',
  'Polio',
  'Hyper thyroid',
  'Envron'
];

// Chief Complaints - Comprehensive list of medical conditions
export const CHIEF_COMPLAINTS = [
  'Abdominal Aortic Aneurysm',
  'Acute Bronchitis',
  'Abdominal pain',
  'Angina Pectoris',
  'Dyspnea',
  'Fever on and off',
  'Hand Pain',
  'Knee Pain',
  'Long Back Pain',
  'Obesity',
  'Restlessness',
  'Rheumatic Arthritis',
  'Sinusitis',
  'Snoring',
  'Difficulty to walk',
  'Urinary tract infection',
  'Ventricular Fibrillation',
  'Chest Pain',
  'Headache',
  'Dizziness',
  'Nausea',
  'Vomiting',
  'Diarrhea',
  'Constipation',
  'Joint Pain',
  'Muscle Pain',
  'Shortness of Breath',
  'Palpitations',
  'Fatigue',
  'Weight Loss',
  'Weight Gain',
  'Sleep Disorders',
  'Vision Problems',
  'Hearing Problems'
];

// Task Order Instructions
export const TASK_INSTRUCTIONS = [
  'CBC',
  'ESR',
  'rest for 2 days',
  'mouth wash',
  'gen.',
  'Blood pressure monitoring',
  'Temperature monitoring',
  'Wound care',
  'Medication administration',
  'IV fluid administration',
  'Oxygen therapy',
  'Physical therapy',
  'Dietary counseling',
  'Patient education',
  'Discharge planning'
];

// Hospital Admission Types
export const ADMISSION_TYPES = ['In-house', 'External'];
export const ADMISSION_MODES = ['Elective', 'Immediate', 'Emergency'];
export const INSURANCE_OPTIONS = ['Yes', 'No'];

// Counselling Types
export const COUNSELLING_TYPES = [
  'Pre-operative counselling',
  'Post-operative counselling',
  'Dietary counselling',
  'Psychological counselling',
  'Medication counselling',
  'Discharge counselling',
  'Family counselling',
  'Lifestyle counselling'
];

// Therapy Types
export const THERAPY_TYPES = [
  'Physical Therapy',
  'Occupational Therapy',
  'Speech Therapy',
  'Respiratory Therapy',
  'Cognitive Therapy',
  'Behavioral Therapy',
  'Pain Management',
  'Wound Care Therapy'
];

// Injection Types
export const INJECTION_TYPES = [
  'Intramuscular (IM)',
  'Intravenous (IV)',
  'Subcutaneous (SC)',
  'Intradermal (ID)',
  'Intra-articular',
  'Epidural',
  'Spinal',
  'Local Anesthetic',
  'Insulin',
  'Vaccination'
];

// Treatment Types
export const TREATMENT_TYPES = [
  'Conservative Management',
  'Surgical Treatment',
  'Medical Management',
  'Emergency Treatment',
  'Palliative Care',
  'Preventive Care',
  'Rehabilitation',
  'Follow-up Care'
];

// Vaccines
export const VACCINES = [
  'COVID-19 Vaccine',
  'Influenza Vaccine',
  'Hepatitis B Vaccine',
  'Tetanus Toxoid',
  'MMR Vaccine',
  'DPT Vaccine',
  'Polio Vaccine',
  'Pneumococcal Vaccine',
  'Meningococcal Vaccine',
  'HPV Vaccine',
  'Varicella Vaccine',
  'Rabies Vaccine'
];

// Examination Types
export const EXAMINATION_TYPES = [
  'Abdominal palpation',
  'EBC',
  'Inspection',
  'Left foot',
  'MSE',
  'Physical Examination',
  'Right knee',
  'Cardiovascular examination',
  'Respiratory examination',
  'Neurological examination',
  'Musculoskeletal examination',
  'Dermatological examination',
  'ENT examination',
  'Ophthalmological examination',
  'Gynecological examination'
];

// Severity Levels
export const SEVERITY_LEVELS = ['High', 'Low', 'Moderate'];

// Investigation Services - Extended from existing medicalServices.ts
export const INVESTIGATION_SERVICES = [
  'ICU profile',
  'Surgical profile',
  'Hospital packages',
  'General ward male',
  'registration fee',
  'ALPHA BED',
  '1st consultation',
  '1339 IQRA',
  'Anesthesia',
  'AC wash',
  'COVID-19 profile',
  'Lipid profile',
  'Homocystein-Serum',
  'LDL Cholesterol',
  'Urine Spot Protein',
  'Alkaline Phosphatase',
  'Blood Sugar(F)(CBG)',
  'Cholesterol',
  'Procalcitonin',
  'Complete Blood Count (CBC)',
  'Liver Function Test (LFT)',
  'Kidney Function Test (KFT)',
  'Thyroid Function Test (TFT)',
  'Electrolyte Panel',
  'Cardiac Enzymes',
  'Tumor Markers',
  'Coagulation Studies',
  'Arterial Blood Gas',
  'Urine Analysis',
  'Stool Analysis',
  'ECG',
  'Chest X-Ray',
  'Abdominal Ultrasound',
  'CT Scan',
  'MRI',
  'Echocardiography',
  'Endoscopy',
  'Colonoscopy',
  'Bronchoscopy',
  'Biopsy',
  'Culture & Sensitivity',
  'Blood Gas Analysis',
  'Pulmonary Function Test',
  'Stress Test',
  'Holter Monitoring',
  'EEG',
  'EMG',
  'Bone Density Test',
  'Mammography'
];

// Diagnosis Options
export const DIAGNOSIS_OPTIONS = [
  'Anemia',
  'Atrial Fibrillation',
  'Abdominal pain',
  'Fever',
  'Fracture mandible condyle of femur',
  'Inter vertebral disc prolapse',
  'Urinary tract infection',
  'Hypertension',
  'Diabetes Mellitus',
  'Chronic Kidney Disease',
  'Coronary Artery Disease',
  'Heart Failure',
  'Pneumonia',
  'Asthma',
  'COPD',
  'Stroke',
  'Migraine',
  'Depression',
  'Anxiety',
  'Osteoarthritis',
  'Rheumatoid Arthritis',
  'Gastritis',
  'Peptic Ulcer Disease',
  'Appendicitis',
  'Cholecystitis',
  'Pancreatitis',
  'Hepatitis',
  'Cirrhosis',
  'Renal Stones',
  'Prostate Enlargement',
  'Thyroid Disorders',
  'Osteoporosis',
  'Cancer',
  'Seizure Disorder'
];

// Medicine Types for Enhanced Prescription
export const MEDICINE_TYPES = [
  'Tablet',
  'Capsule',
  'Syrup',
  'Injection',
  'Drops',
  'Cream',
  'Ointment',
  'Gel',
  'Patch',
  'Inhaler',
  'Spray',
  'Powder',
  'Solution',
  'Suspension'
];

// Medicine Timing (M/A/N - Morning/Afternoon/Night)
export const MEDICINE_TIMING = {
  M: 'Morning',
  A: 'Afternoon', 
  N: 'Night'
};

// Common Medicine Names for Search/Dropdown
export const COMMON_MEDICINES = [
  'Paracetamol',
  'Ibuprofen',
  'Aspirin',
  'Metformin',
  'Amlodipine',
  'Atenolol',
  'Omeprazole',
  'Ranitidine',
  'Cetirizine',
  'Amoxicillin',
  'Ciprofloxacin',
  'Azithromycin',
  'Prednisolone',
  'Insulin',
  'Salbutamol',
  'Losartan',
  'Simvastatin',
  'Clopidogrel',
  'Furosemide',
  'Digoxin',
  'Warfarin',
  'Heparin',
  'Morphine',
  'Tramadol',
  'Diazepam',
  'Phenytoin',
  'Carbamazepine',
  'Levothyroxine',
  'Hydrochlorothiazide',
  'Enalapril'
];

// Duration Units
export const DURATION_UNITS = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' }
];

// Frequency Options
export const FREQUENCY_OPTIONS = [
  'Once daily (OD)',
  'Twice daily (BD)',
  'Three times daily (TDS)',
  'Four times daily (QDS)',
  'Every 6 hours',
  'Every 8 hours',
  'Every 12 hours',
  'As required (PRN)',
  'Before meals',
  'After meals',
  'At bedtime',
  'On empty stomach'
];

// Route of Administration
export const ADMINISTRATION_ROUTES = [
  'Oral',
  'Intravenous',
  'Intramuscular', 
  'Subcutaneous',
  'Topical',
  'Inhalation',
  'Rectal',
  'Sublingual',
  'Transdermal',
  'Nasal',
  'Ocular',
  'Otic'
];

// Helper interfaces for type safety
export interface HighRiskData {
  condition: string;
  identifiedDate: string;
  notes?: string;
}

export interface ChiefComplaintData {
  complaint: string;
  period: string;
  presentHistory: string;
  performingDoctor: string;
  performingNurse: string;
  notes: string;
}

export interface TaskOrderData {
  type: 'instruction' | 'admission' | 'appointment' | 'counselling' | 'therapy' | 'injection' | 'treatment' | 'vaccination';
  instruction?: string;
  reason?: string;
  admissionType?: string;
  admissionMode?: string;
  specificDoctor?: string;
  insurance?: string;
  counsellorName?: string;
  duration?: string;
  injectionType?: string;
  vaccineName?: string;
  doctor: string;
  nurse: string;
  notes: string;
}

export interface ExaminationData {
  examination: string;
  problemSince: string;
  severity: string;
  doctor: string;
  nurse: string;
  notes: string;
}

export interface InvestigationData {
  service: string;
  testResults: string;
  outsideTest: boolean;
  doctor: string;
  nurse: string;
  notes: string;
}

export interface DiagnosisData {
  diagnosis: string;
  highRisk: boolean;
  doctor: string;
  nurse: string;
  treatmentGiven: string;
}

export interface PrescriptionMedicine {
  id: string;
  medicine: string;
  type: string;
  timing: { M: boolean; A: boolean; N: boolean };
  duration: string;
  taken: string;
  rate: number;
  discAmount: number;
  netAmount: number;
}

// Default data structures for form initialization
export const DEFAULT_HIGH_RISK: HighRiskData = {
  condition: '',
  identifiedDate: '',
  notes: ''
};

export const DEFAULT_CHIEF_COMPLAINT: ChiefComplaintData = {
  complaint: '',
  period: '',
  presentHistory: '',
  performingDoctor: '',
  performingNurse: '',
  notes: ''
};

export const DEFAULT_EXAMINATION: ExaminationData = {
  examination: '',
  problemSince: '',
  severity: '',
  doctor: '',
  nurse: '',
  notes: ''
};

export const DEFAULT_INVESTIGATION: InvestigationData = {
  service: '',
  testResults: '',
  outsideTest: false,
  doctor: '',
  nurse: '',
  notes: ''
};

export const DEFAULT_DIAGNOSIS: DiagnosisData = {
  diagnosis: '',
  highRisk: false,
  doctor: '',
  nurse: '',
  treatmentGiven: ''
};

export const DEFAULT_PRESCRIPTION_MEDICINE: PrescriptionMedicine = {
  id: '',
  medicine: '',
  type: '',
  timing: { M: false, A: false, N: false },
  duration: '',
  taken: '',
  rate: 0,
  discAmount: 0,
  netAmount: 0
};

// Export all data arrays for easy access
export const MEDICAL_DATA = {
  HIGH_RISK_CONDITIONS,
  CHIEF_COMPLAINTS,
  TASK_INSTRUCTIONS,
  ADMISSION_TYPES,
  ADMISSION_MODES,
  INSURANCE_OPTIONS,
  COUNSELLING_TYPES,
  THERAPY_TYPES,
  INJECTION_TYPES,
  TREATMENT_TYPES,
  VACCINES,
  EXAMINATION_TYPES,
  SEVERITY_LEVELS,
  INVESTIGATION_SERVICES,
  DIAGNOSIS_OPTIONS,
  MEDICINE_TYPES,
  MEDICINE_TIMING,
  COMMON_MEDICINES,
  DURATION_UNITS,
  FREQUENCY_OPTIONS,
  ADMINISTRATION_ROUTES
};

export default MEDICAL_DATA;