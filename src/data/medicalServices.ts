// Comprehensive Medical Services Data Structure
// Based on Indian Healthcare Standards

export interface MedicalService {
  id: string;
  name: string;
  code: string;
  category: ServiceCategory;
  department: string;
  description: string;
  basePrice: number;
  duration: number; // in minutes
  preparationRequired: boolean;
  fastingRequired: boolean;
  instructions?: string;
  isActive: boolean;
}

export type ServiceCategory = 
  | 'RADIOLOGY' 
  | 'CARDIOLOGY' 
  | 'LABORATORY' 
  | 'PROCEDURES' 
  | 'PHYSIOTHERAPY' 
  | 'DENTAL' 
  | 'CONSULTATION'
  | 'SURGERY'
  | 'EMERGENCY';

export interface ServiceOrder {
  id: string;
  patientId: string;
  services: OrderedService[];
  totalAmount: number;
  discountAmount: number;
  netAmount: number;
  paymentMode: 'CASH' | 'ONLINE' | 'INSURANCE' | 'CREDIT';
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  orderedBy: string;
  orderedAt: string;
  completedAt?: string;
  notes?: string;
}

export interface OrderedService {
  serviceId: string;
  serviceName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  performedBy?: string;
  completedAt?: string;
  notes?: string;
}

// Comprehensive Services Database
export const MEDICAL_SERVICES: MedicalService[] = [
  // RADIOLOGY SERVICES
  {
    id: 'rad_xray_chest',
    name: 'X-Ray Chest (PA View)',
    code: 'XR-CHEST-PA',
    category: 'RADIOLOGY',
    department: 'Radiology',
    description: 'Chest X-ray, Postero-Anterior view for lung and heart evaluation',
    basePrice: 800,
    duration: 15,
    preparationRequired: false,
    fastingRequired: false,
    instructions: 'Remove metal objects, jewelry. Wear hospital gown.',
    isActive: true
  },
  {
    id: 'rad_xray_abdomen',
    name: 'X-Ray Abdomen (AP View)',
    code: 'XR-ABD-AP',
    category: 'RADIOLOGY',
    department: 'Radiology',
    description: 'Abdominal X-ray for bowel, kidney, and pelvis evaluation',
    basePrice: 900,
    duration: 15,
    preparationRequired: true,
    fastingRequired: true,
    instructions: 'Fast for 6 hours. Empty bladder before procedure.',
    isActive: true
  },
  {
    id: 'rad_xray_spine',
    name: 'X-Ray Spine (Lumbar)',
    code: 'XR-SPINE-L',
    category: 'RADIOLOGY',
    department: 'Radiology',
    description: 'Lumbar spine X-ray for back pain evaluation',
    basePrice: 1200,
    duration: 20,
    preparationRequired: false,
    fastingRequired: false,
    instructions: 'Remove metal objects. May require standing and lying positions.',
    isActive: true
  },
  {
    id: 'rad_usg_abdomen',
    name: 'USG Abdomen & Pelvis',
    code: 'USG-ABD-PEL',
    category: 'RADIOLOGY',
    department: 'Radiology',
    description: 'Ultrasound examination of abdominal and pelvic organs',
    basePrice: 1500,
    duration: 30,
    preparationRequired: true,
    fastingRequired: true,
    instructions: 'Fast for 8 hours. Drink 1 liter water 1 hour before scan.',
    isActive: true
  },
  {
    id: 'rad_ct_head',
    name: 'CT Scan Head (Plain)',
    code: 'CT-HEAD-PLAIN',
    category: 'RADIOLOGY',
    department: 'Radiology',
    description: 'CT scan of head for brain evaluation',
    basePrice: 3500,
    duration: 45,
    preparationRequired: true,
    fastingRequired: false,
    instructions: 'Remove metal objects. Inform about allergies.',
    isActive: true
  },
  {
    id: 'rad_mri_brain',
    name: 'MRI Brain (Plain)',
    code: 'MRI-BRAIN-PLAIN',
    category: 'RADIOLOGY',
    department: 'Radiology',
    description: 'MRI scan of brain for detailed neurological evaluation',
    basePrice: 8000,
    duration: 60,
    preparationRequired: true,
    fastingRequired: false,
    instructions: 'Remove all metal objects, pacemaker check, claustrophobia assessment.',
    isActive: true
  },

  // CARDIOLOGY SERVICES
  {
    id: 'card_ecg',
    name: 'ECG (12 Lead)',
    code: 'ECG-12L',
    category: 'CARDIOLOGY',
    department: 'Cardiology',
    description: 'Electrocardiogram for heart rhythm and electrical activity assessment',
    basePrice: 300,
    duration: 10,
    preparationRequired: false,
    fastingRequired: false,
    instructions: 'Rest for 5 minutes before test. Remove upper garments.',
    isActive: true
  },
  {
    id: 'card_echo',
    name: 'Echocardiography (2D Echo)',
    code: 'ECHO-2D',
    category: 'CARDIOLOGY',
    department: 'Cardiology',
    description: '2D Echocardiography for heart structure and function evaluation',
    basePrice: 2000,
    duration: 30,
    preparationRequired: false,
    fastingRequired: false,
    instructions: 'Comfortable clothing. May require gel application on chest.',
    isActive: true
  },
  {
    id: 'card_stress_test',
    name: 'Stress Test (TMT)',
    code: 'TMT-STRESS',
    category: 'CARDIOLOGY',
    department: 'Cardiology',
    description: 'Treadmill Test for exercise-induced cardiac evaluation',
    basePrice: 2500,
    duration: 45,
    preparationRequired: true,
    fastingRequired: false,
    instructions: 'Wear comfortable shoes. Light meal 2 hours before. Avoid caffeine.',
    isActive: true
  },
  {
    id: 'card_holter',
    name: 'Holter Monitoring (24 Hours)',
    code: 'HOLTER-24H',
    category: 'CARDIOLOGY',
    department: 'Cardiology',
    description: '24-hour continuous ECG monitoring',
    basePrice: 3500,
    duration: 1440, // 24 hours
    preparationRequired: true,
    fastingRequired: false,
    instructions: 'Maintain normal activities. Keep diary of symptoms. Avoid bathing.',
    isActive: true
  },

  // LABORATORY SERVICES
  {
    id: 'lab_cbc',
    name: 'Complete Blood Count (CBC)',
    code: 'LAB-CBC',
    category: 'LABORATORY',
    department: 'Laboratory',
    description: 'Complete blood count with differential count',
    basePrice: 400,
    duration: 60,
    preparationRequired: false,
    fastingRequired: false,
    instructions: 'Blood sample collection from arm vein.',
    isActive: true
  },
  {
    id: 'lab_fbs',
    name: 'Fasting Blood Sugar',
    code: 'LAB-FBS',
    category: 'LABORATORY',
    department: 'Laboratory',
    description: 'Fasting blood glucose level measurement',
    basePrice: 150,
    duration: 30,
    preparationRequired: true,
    fastingRequired: true,
    instructions: 'Fast for 8-12 hours. Only water allowed.',
    isActive: true
  },
  {
    id: 'lab_ppbs',
    name: 'Post Prandial Blood Sugar',
    code: 'LAB-PPBS',
    category: 'LABORATORY',
    department: 'Laboratory',
    description: 'Blood sugar level 2 hours after meal',
    basePrice: 150,
    duration: 30,
    preparationRequired: true,
    fastingRequired: false,
    instructions: 'Eat normal meal 2 hours before test.',
    isActive: true
  },
  {
    id: 'lab_hba1c',
    name: 'HbA1c (Glycated Hemoglobin)',
    code: 'LAB-HBA1C',
    category: 'LABORATORY',
    department: 'Laboratory',
    description: 'Average blood sugar control over 2-3 months',
    basePrice: 800,
    duration: 120,
    preparationRequired: false,
    fastingRequired: false,
    instructions: 'No special preparation required.',
    isActive: true
  },
  {
    id: 'lab_lipid',
    name: 'Lipid Profile',
    code: 'LAB-LIPID',
    category: 'LABORATORY',
    department: 'Laboratory',
    description: 'Cholesterol, triglycerides, HDL, LDL levels',
    basePrice: 600,
    duration: 90,
    preparationRequired: true,
    fastingRequired: true,
    instructions: 'Fast for 12 hours. Only water allowed.',
    isActive: true
  },
  {
    id: 'lab_lft',
    name: 'Liver Function Test (LFT)',
    code: 'LAB-LFT',
    category: 'LABORATORY',
    department: 'Laboratory',
    description: 'Liver enzymes and bilirubin levels',
    basePrice: 700,
    duration: 120,
    preparationRequired: true,
    fastingRequired: true,
    instructions: 'Fast for 8 hours. Avoid alcohol 24 hours before test.',
    isActive: true
  },
  {
    id: 'lab_kft',
    name: 'Kidney Function Test (KFT)',
    code: 'LAB-KFT',
    category: 'LABORATORY',
    department: 'Laboratory',
    description: 'Creatinine, urea, and electrolyte levels',
    basePrice: 650,
    duration: 90,
    preparationRequired: false,
    fastingRequired: false,
    instructions: 'Normal water intake. No special preparation.',
    isActive: true
  },
  {
    id: 'lab_thyroid',
    name: 'Thyroid Function Test (TFT)',
    code: 'LAB-TFT',
    category: 'LABORATORY',
    department: 'Laboratory',
    description: 'TSH, T3, T4 levels for thyroid function',
    basePrice: 900,
    duration: 180,
    preparationRequired: false,
    fastingRequired: false,
    instructions: 'No special preparation. Morning sample preferred.',
    isActive: true
  },
  {
    id: 'lab_urine_routine',
    name: 'Urine Routine & Microscopy',
    code: 'LAB-URINE-R',
    category: 'LABORATORY',
    department: 'Laboratory',
    description: 'Complete urine analysis and microscopic examination',
    basePrice: 200,
    duration: 45,
    preparationRequired: true,
    fastingRequired: false,
    instructions: 'Collect first morning urine sample in sterile container.',
    isActive: true
  },

  // PROCEDURES
  {
    id: 'proc_wound_dressing',
    name: 'Wound Dressing (Simple)',
    code: 'PROC-DRESS-S',
    category: 'PROCEDURES',
    department: 'General Medicine',
    description: 'Simple wound cleaning and dressing',
    basePrice: 300,
    duration: 15,
    preparationRequired: false,
    fastingRequired: false,
    instructions: 'Keep wound area accessible. Inform about allergies.',
    isActive: true
  },
  {
    id: 'proc_injection_im',
    name: 'Injection (Intramuscular)',
    code: 'PROC-INJ-IM',
    category: 'PROCEDURES',
    department: 'General Medicine',
    description: 'Intramuscular injection administration',
    basePrice: 100,
    duration: 5,
    preparationRequired: false,
    fastingRequired: false,
    instructions: 'Expose injection site. Inform about medication allergies.',
    isActive: true
  },
  {
    id: 'proc_injection_iv',
    name: 'Injection (Intravenous)',
    code: 'PROC-INJ-IV',
    category: 'PROCEDURES',
    department: 'General Medicine',
    description: 'Intravenous injection or IV fluid administration',
    basePrice: 200,
    duration: 10,
    preparationRequired: false,
    fastingRequired: false,
    instructions: 'Comfortable position. Accessible arm veins.',
    isActive: true
  },
  {
    id: 'proc_suturing',
    name: 'Suturing (Simple)',
    code: 'PROC-SUTURE-S',
    category: 'PROCEDURES',
    department: 'General Surgery',
    description: 'Simple wound suturing procedure',
    basePrice: 800,
    duration: 30,
    preparationRequired: true,
    fastingRequired: false,
    instructions: 'Clean wound area. Local anesthesia will be given.',
    isActive: true
  },
  {
    id: 'proc_nebulization',
    name: 'Nebulization',
    code: 'PROC-NEBUL',
    category: 'PROCEDURES',
    department: 'Pulmonology',
    description: 'Bronchodilator nebulization for respiratory conditions',
    basePrice: 250,
    duration: 15,
    preparationRequired: false,
    fastingRequired: false,
    instructions: 'Sit comfortably. Breathe normally through mask.',
    isActive: true
  },

  // PHYSIOTHERAPY
  {
    id: 'physio_evaluation',
    name: 'Physiotherapy Evaluation',
    code: 'PHYSIO-EVAL',
    category: 'PHYSIOTHERAPY',
    department: 'Physiotherapy',
    description: 'Initial physiotherapy assessment and treatment planning',
    basePrice: 500,
    duration: 45,
    preparationRequired: false,
    fastingRequired: false,
    instructions: 'Wear comfortable clothing. Bring previous reports.',
    isActive: true
  },
  {
    id: 'physio_session',
    name: 'Physiotherapy Session',
    code: 'PHYSIO-SESS',
    category: 'PHYSIOTHERAPY',
    department: 'Physiotherapy',
    description: 'Individual physiotherapy treatment session',
    basePrice: 400,
    duration: 30,
    preparationRequired: false,
    fastingRequired: false,
    instructions: 'Wear loose, comfortable clothing.',
    isActive: true
  },
  {
    id: 'physio_electrotherapy',
    name: 'Electrotherapy',
    code: 'PHYSIO-ELECTRO',
    category: 'PHYSIOTHERAPY',
    department: 'Physiotherapy',
    description: 'Electrical stimulation therapy for pain and muscle strengthening',
    basePrice: 300,
    duration: 20,
    preparationRequired: false,
    fastingRequired: false,
    instructions: 'Remove metal jewelry. Inform about pacemaker.',
    isActive: true
  },

  // DENTAL SERVICES
  {
    id: 'dental_consultation',
    name: 'Dental Consultation',
    code: 'DENTAL-CONSULT',
    category: 'DENTAL',
    department: 'Dentistry',
    description: 'General dental examination and consultation',
    basePrice: 400,
    duration: 20,
    preparationRequired: false,
    fastingRequired: false,
    instructions: 'Brush teeth before visit. Bring previous dental records.',
    isActive: true
  },
  {
    id: 'dental_cleaning',
    name: 'Dental Cleaning (Scaling)',
    code: 'DENTAL-CLEAN',
    category: 'DENTAL',
    department: 'Dentistry',
    description: 'Professional teeth cleaning and plaque removal',
    basePrice: 800,
    duration: 30,
    preparationRequired: false,
    fastingRequired: false,
    instructions: 'Avoid eating 1 hour before procedure.',
    isActive: true
  },
  {
    id: 'dental_extraction',
    name: 'Tooth Extraction (Simple)',
    code: 'DENTAL-EXTRACT',
    category: 'DENTAL',
    department: 'Dentistry',
    description: 'Simple tooth extraction procedure',
    basePrice: 1200,
    duration: 30,
    preparationRequired: true,
    fastingRequired: false,
    instructions: 'Light meal before procedure. Arrange transportation.',
    isActive: true
  },
  {
    id: 'dental_filling',
    name: 'Dental Filling (Composite)',
    code: 'DENTAL-FILL',
    category: 'DENTAL',
    department: 'Dentistry',
    description: 'Tooth cavity filling with composite material',
    basePrice: 1500,
    duration: 45,
    preparationRequired: false,
    fastingRequired: false,
    instructions: 'Local anesthesia will be administered.',
    isActive: true
  },
  {
    id: 'dental_root_canal',
    name: 'Root Canal Treatment',
    code: 'DENTAL-RCT',
    category: 'DENTAL',
    department: 'Dentistry',
    description: 'Root canal treatment for infected tooth',
    basePrice: 4000,
    duration: 90,
    preparationRequired: true,
    fastingRequired: false,
    instructions: 'May require multiple visits. Light meal before procedure.',
    isActive: true
  }
];

// Service Categories Configuration
export const SERVICE_CATEGORIES = {
  RADIOLOGY: {
    name: 'Radiology',
    icon: '🔬',
    color: 'blue',
    description: 'X-Ray, CT, MRI, Ultrasound services'
  },
  CARDIOLOGY: {
    name: 'Cardiology',
    icon: '❤️',
    color: 'red',
    description: 'Heart-related diagnostic services'
  },
  LABORATORY: {
    name: 'Laboratory',
    icon: '🧪',
    color: 'green',
    description: 'Blood tests, urine tests, pathology'
  },
  PROCEDURES: {
    name: 'Procedures',
    icon: '🏥',
    color: 'purple',
    description: 'Medical procedures and treatments'
  },
  PHYSIOTHERAPY: {
    name: 'Physiotherapy',
    icon: '🤸',
    color: 'orange',
    description: 'Physical therapy and rehabilitation'
  },
  DENTAL: {
    name: 'Dental',
    icon: '🦷',
    color: 'indigo',
    description: 'Dental care and oral health services'
  },
  CONSULTATION: {
    name: 'Consultation',
    icon: '👨‍⚕️',
    color: 'teal',
    description: 'Doctor consultations and examinations'
  },
  SURGERY: {
    name: 'Surgery',
    icon: '🔪',
    color: 'yellow',
    description: 'Surgical procedures and operations'
  },
  EMERGENCY: {
    name: 'Emergency',
    icon: '🚨',
    color: 'pink',
    description: 'Emergency medical services'
  }
};

// Helper functions
export const getServiceById = (id: string): MedicalService | undefined => {
  return MEDICAL_SERVICES.find(service => service.id === id);
};

export const getServicesByCategory = (category: ServiceCategory): MedicalService[] => {
  return MEDICAL_SERVICES.filter(service => service.category === category && service.isActive);
};

export const searchServices = (query: string): MedicalService[] => {
  const searchTerm = query.toLowerCase();
  return MEDICAL_SERVICES.filter(service => 
    service.isActive && (
      service.name.toLowerCase().includes(searchTerm) ||
      service.code.toLowerCase().includes(searchTerm) ||
      service.description.toLowerCase().includes(searchTerm) ||
      service.department.toLowerCase().includes(searchTerm)
    )
  );
};

export const calculateServiceTotal = (services: OrderedService[]): number => {
  return services.reduce((total, service) => total + service.totalPrice, 0);
};