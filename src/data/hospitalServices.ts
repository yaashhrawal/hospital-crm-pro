export interface HospitalService {
  id: string;
  name: string;
  category: 'LABORATORY' | 'RADIOLOGY' | 'MRI' | 'CARDIOLOGY' | 'PROCEDURES' | 'DENTAL';
  corporateRate: number;
  generalRate: number;
  duration: string; // Duration in minutes or description
  description?: string;
  subCategory?: string;
}

export const HOSPITAL_SERVICES: HospitalService[] = [
  // LABORATORY SERVICES
  {
    id: 'LAB001',
    name: 'Complete Blood Count (CBC)',
    category: 'LABORATORY',
    corporateRate: 200,
    generalRate: 300,
    duration: '30',
    description: 'Complete blood count with differential',
    subCategory: 'Hematology'
  },
  {
    id: 'LAB002',
    name: 'Blood Sugar (Fasting)',
    category: 'LABORATORY',
    corporateRate: 80,
    generalRate: 120,
    duration: '15',
    description: 'Fasting blood glucose test',
    subCategory: 'Biochemistry'
  },
  {
    id: 'LAB003',
    name: 'Blood Sugar (Random)',
    category: 'LABORATORY',
    corporateRate: 80,
    generalRate: 120,
    duration: '15',
    description: 'Random blood glucose test',
    subCategory: 'Biochemistry'
  },
  {
    id: 'LAB004',
    name: 'HbA1c (Glycated Hemoglobin)',
    category: 'LABORATORY',
    corporateRate: 450,
    generalRate: 600,
    duration: '45',
    description: 'Long-term blood sugar control test',
    subCategory: 'Biochemistry'
  },
  {
    id: 'LAB005',
    name: 'Lipid Profile',
    category: 'LABORATORY',
    corporateRate: 400,
    generalRate: 550,
    duration: '45',
    description: 'Total cholesterol, HDL, LDL, triglycerides',
    subCategory: 'Biochemistry'
  },
  {
    id: 'LAB006',
    name: 'Kidney Function Test (KFT)',
    category: 'LABORATORY',
    corporateRate: 350,
    generalRate: 500,
    duration: '60',
    description: 'Urea, creatinine, uric acid',
    subCategory: 'Biochemistry'
  },
  {
    id: 'LAB007',
    name: 'Liver Function Test (LFT)',
    category: 'LABORATORY',
    corporateRate: 400,
    generalRate: 550,
    duration: '60',
    description: 'SGOT, SGPT, bilirubin, alkaline phosphatase',
    subCategory: 'Biochemistry'
  },
  {
    id: 'LAB008',
    name: 'Thyroid Profile (T3, T4, TSH)',
    category: 'LABORATORY',
    corporateRate: 500,
    generalRate: 700,
    duration: '90',
    description: 'Complete thyroid function assessment',
    subCategory: 'Hormones'
  },
  {
    id: 'LAB009',
    name: 'Urine Routine & Microscopy',
    category: 'LABORATORY',
    corporateRate: 100,
    generalRate: 150,
    duration: '30',
    description: 'Complete urine analysis',
    subCategory: 'Urine Tests'
  },
  {
    id: 'LAB010',
    name: 'ESR (Erythrocyte Sedimentation Rate)',
    category: 'LABORATORY',
    corporateRate: 80,
    generalRate: 120,
    duration: '120',
    description: 'Inflammation marker test',
    subCategory: 'Hematology'
  },
  {
    id: 'LAB011',
    name: 'CRP (C-Reactive Protein)',
    category: 'LABORATORY',
    corporateRate: 200,
    generalRate: 300,
    duration: '60',
    description: 'Acute inflammation marker',
    subCategory: 'Immunology'
  },
  {
    id: 'LAB012',
    name: 'Vitamin D3',
    category: 'LABORATORY',
    corporateRate: 800,
    generalRate: 1200,
    duration: '120',
    description: '25-hydroxy vitamin D test',
    subCategory: 'Vitamins'
  },
  {
    id: 'LAB013',
    name: 'Vitamin B12',
    category: 'LABORATORY',
    corporateRate: 600,
    generalRate: 900,
    duration: '90',
    description: 'Vitamin B12 deficiency test',
    subCategory: 'Vitamins'
  },

  // RADIOLOGY SERVICES
  {
    id: 'RAD001',
    name: 'Chest X-Ray (PA View)',
    category: 'RADIOLOGY',
    corporateRate: 300,
    generalRate: 450,
    duration: '15',
    description: 'Chest X-ray posterior-anterior view',
    subCategory: 'X-Ray'
  },
  {
    id: 'RAD002',
    name: 'Chest X-Ray (Lateral View)',
    category: 'RADIOLOGY',
    corporateRate: 300,
    generalRate: 450,
    duration: '15',
    description: 'Chest X-ray lateral view',
    subCategory: 'X-Ray'
  },
  {
    id: 'RAD003',
    name: 'Abdominal X-Ray',
    category: 'RADIOLOGY',
    corporateRate: 350,
    generalRate: 500,
    duration: '20',
    description: 'Plain abdominal radiograph',
    subCategory: 'X-Ray'
  },
  {
    id: 'RAD004',
    name: 'Spine X-Ray (Cervical)',
    category: 'RADIOLOGY',
    corporateRate: 400,
    generalRate: 600,
    duration: '25',
    description: 'Cervical spine X-ray',
    subCategory: 'X-Ray'
  },
  {
    id: 'RAD005',
    name: 'Spine X-Ray (Lumbar)',
    category: 'RADIOLOGY',
    corporateRate: 450,
    generalRate: 650,
    duration: '25',
    description: 'Lumbar spine X-ray',
    subCategory: 'X-Ray'
  },
  {
    id: 'RAD006',
    name: 'Knee X-Ray (Both Views)',
    category: 'RADIOLOGY',
    corporateRate: 400,
    generalRate: 600,
    duration: '20',
    description: 'Knee X-ray AP and lateral views',
    subCategory: 'X-Ray'
  },
  {
    id: 'RAD007',
    name: 'Ultrasound Abdomen & Pelvis',
    category: 'RADIOLOGY',
    corporateRate: 800,
    generalRate: 1200,
    duration: '30',
    description: 'Complete abdominal and pelvic ultrasound',
    subCategory: 'Ultrasound'
  },
  {
    id: 'RAD008',
    name: 'Ultrasound Pregnancy',
    category: 'RADIOLOGY',
    corporateRate: 600,
    generalRate: 900,
    duration: '25',
    description: 'Obstetric ultrasound scan',
    subCategory: 'Ultrasound'
  },
  {
    id: 'RAD009',
    name: 'Ultrasound Thyroid',
    category: 'RADIOLOGY',
    corporateRate: 500,
    generalRate: 750,
    duration: '20',
    description: 'Thyroid gland ultrasound',
    subCategory: 'Ultrasound'
  },
  {
    id: 'RAD010',
    name: 'CT Scan Head (Plain)',
    category: 'RADIOLOGY',
    corporateRate: 2500,
    generalRate: 3500,
    duration: '20',
    description: 'Non-contrast CT scan of head',
    subCategory: 'CT Scan'
  },
  {
    id: 'RAD011',
    name: 'CT Scan Chest (Plain)',
    category: 'RADIOLOGY',
    corporateRate: 3000,
    generalRate: 4200,
    duration: '25',
    description: 'Non-contrast CT scan of chest',
    subCategory: 'CT Scan'
  },
  {
    id: 'RAD012',
    name: 'CT Scan Abdomen (Contrast)',
    category: 'RADIOLOGY',
    corporateRate: 4500,
    generalRate: 6300,
    duration: '45',
    description: 'Contrast-enhanced CT scan of abdomen',
    subCategory: 'CT Scan'
  },

  // MRI SERVICES
  {
    id: 'MRI001',
    name: 'MRI Brain (Plain)',
    category: 'MRI',
    corporateRate: 6000,
    generalRate: 8500,
    duration: '45',
    description: 'Non-contrast MRI of brain',
    subCategory: 'Neurological'
  },
  {
    id: 'MRI002',
    name: 'MRI Brain (Contrast)',
    category: 'MRI',
    corporateRate: 8500,
    generalRate: 12000,
    duration: '60',
    description: 'Contrast-enhanced MRI of brain',
    subCategory: 'Neurological'
  },
  {
    id: 'MRI003',
    name: 'MRI Spine (Cervical)',
    category: 'MRI',
    corporateRate: 7000,
    generalRate: 10000,
    duration: '50',
    description: 'MRI of cervical spine',
    subCategory: 'Spinal'
  },
  {
    id: 'MRI004',
    name: 'MRI Spine (Lumbar)',
    category: 'MRI',
    corporateRate: 7000,
    generalRate: 10000,
    duration: '50',
    description: 'MRI of lumbar spine',
    subCategory: 'Spinal'
  },
  {
    id: 'MRI005',
    name: 'MRI Knee Joint',
    category: 'MRI',
    corporateRate: 6500,
    generalRate: 9200,
    duration: '40',
    description: 'MRI of knee joint',
    subCategory: 'Orthopedic'
  },
  {
    id: 'MRI006',
    name: 'MRI Shoulder Joint',
    category: 'MRI',
    corporateRate: 6500,
    generalRate: 9200,
    duration: '40',
    description: 'MRI of shoulder joint',
    subCategory: 'Orthopedic'
  },
  {
    id: 'MRI007',
    name: 'MRI Abdomen (Plain)',
    category: 'MRI',
    corporateRate: 8000,
    generalRate: 11500,
    duration: '60',
    description: 'Non-contrast MRI of abdomen',
    subCategory: 'Abdominal'
  },
  {
    id: 'MRI008',
    name: 'MRI Pelvis',
    category: 'MRI',
    corporateRate: 7500,
    generalRate: 10800,
    duration: '55',
    description: 'MRI of pelvis',
    subCategory: 'Pelvic'
  },

  // CARDIOLOGY SERVICES
  {
    id: 'CAR001',
    name: 'ECG (Electrocardiogram)',
    category: 'CARDIOLOGY',
    corporateRate: 150,
    generalRate: 250,
    duration: '15',
    description: '12-lead electrocardiogram',
    subCategory: 'Diagnostic'
  },
  {
    id: 'CAR002',
    name: '2D Echo (Echocardiography)',
    category: 'CARDIOLOGY',
    corporateRate: 1200,
    generalRate: 1800,
    duration: '30',
    description: 'Two-dimensional echocardiography',
    subCategory: 'Imaging'
  },
  {
    id: 'CAR003',
    name: 'Stress Test (TMT)',
    category: 'CARDIOLOGY',
    corporateRate: 1800,
    generalRate: 2500,
    duration: '45',
    description: 'Treadmill stress test',
    subCategory: 'Stress Testing'
  },
  {
    id: 'CAR004',
    name: 'Holter Monitoring (24 hrs)',
    category: 'CARDIOLOGY',
    corporateRate: 2500,
    generalRate: 3500,
    duration: '1440',
    description: '24-hour continuous ECG monitoring',
    subCategory: 'Monitoring'
  },
  {
    id: 'CAR005',
    name: 'Color Doppler Echo',
    category: 'CARDIOLOGY',
    corporateRate: 1800,
    generalRate: 2600,
    duration: '40',
    description: 'Color Doppler echocardiography',
    subCategory: 'Imaging'
  },
  {
    id: 'CAR006',
    name: 'Ambulatory BP Monitoring',
    category: 'CARDIOLOGY',
    corporateRate: 2000,
    generalRate: 2800,
    duration: '1440',
    description: '24-hour blood pressure monitoring',
    subCategory: 'Monitoring'
  },

  // PROCEDURES
  {
    id: 'PRO001',
    name: 'Minor Surgery (Local Anesthesia)',
    category: 'PROCEDURES',
    corporateRate: 3000,
    generalRate: 4500,
    duration: '60',
    description: 'Minor surgical procedure under local anesthesia',
    subCategory: 'Minor Surgery'
  },
  {
    id: 'PRO002',
    name: 'Wound Dressing (Large)',
    category: 'PROCEDURES',
    corporateRate: 200,
    generalRate: 350,
    duration: '20',
    description: 'Large wound dressing and care',
    subCategory: 'Wound Care'
  },
  {
    id: 'PRO003',
    name: 'Suture Removal',
    category: 'PROCEDURES',
    corporateRate: 150,
    generalRate: 250,
    duration: '15',
    description: 'Surgical suture removal',
    subCategory: 'Follow-up'
  },
  {
    id: 'PRO004',
    name: 'Injection (Intramuscular)',
    category: 'PROCEDURES',
    corporateRate: 50,
    generalRate: 100,
    duration: '5',
    description: 'Intramuscular injection administration',
    subCategory: 'Injection'
  },
  {
    id: 'PRO005',
    name: 'Injection (Intravenous)',
    category: 'PROCEDURES',
    corporateRate: 100,
    generalRate: 150,
    duration: '10',
    description: 'Intravenous injection administration',
    subCategory: 'Injection'
  },
  {
    id: 'PRO006',
    name: 'Endoscopy (Upper GI)',
    category: 'PROCEDURES',
    corporateRate: 4500,
    generalRate: 6500,
    duration: '30',
    description: 'Upper gastrointestinal endoscopy',
    subCategory: 'Endoscopy'
  },
  {
    id: 'PRO007',
    name: 'Colonoscopy',
    category: 'PROCEDURES',
    corporateRate: 6000,
    generalRate: 8500,
    duration: '45',
    description: 'Complete colonoscopy examination',
    subCategory: 'Endoscopy'
  },
  {
    id: 'PRO008',
    name: 'Biopsy (Tissue)',
    category: 'PROCEDURES',
    corporateRate: 2500,
    generalRate: 3500,
    duration: '30',
    description: 'Tissue biopsy procedure',
    subCategory: 'Biopsy'
  },

  // DENTAL SERVICES
  {
    id: 'DEN001',
    name: 'Dental Consultation',
    category: 'DENTAL',
    corporateRate: 300,
    generalRate: 500,
    duration: '20',
    description: 'General dental examination and consultation',
    subCategory: 'Consultation'
  },
  {
    id: 'DEN002',
    name: 'Dental Cleaning & Scaling',
    category: 'DENTAL',
    corporateRate: 800,
    generalRate: 1200,
    duration: '45',
    description: 'Professional dental cleaning and scaling',
    subCategory: 'Preventive'
  },
  {
    id: 'DEN003',
    name: 'Tooth Filling (Composite)',
    category: 'DENTAL',
    corporateRate: 1200,
    generalRate: 1800,
    duration: '45',
    description: 'Composite resin tooth filling',
    subCategory: 'Restorative'
  },
  {
    id: 'DEN004',
    name: 'Tooth Extraction (Simple)',
    category: 'DENTAL',
    corporateRate: 800,
    generalRate: 1200,
    duration: '30',
    description: 'Simple tooth extraction',
    subCategory: 'Oral Surgery'
  },
  {
    id: 'DEN005',
    name: 'Tooth Extraction (Surgical)',
    category: 'DENTAL',
    corporateRate: 2500,
    generalRate: 3500,
    duration: '60',
    description: 'Surgical tooth extraction',
    subCategory: 'Oral Surgery'
  },
  {
    id: 'DEN006',
    name: 'Root Canal Treatment',
    category: 'DENTAL',
    corporateRate: 4000,
    generalRate: 6000,
    duration: '90',
    description: 'Complete root canal therapy',
    subCategory: 'Endodontics'
  },
  {
    id: 'DEN007',
    name: 'Dental Crown (Ceramic)',
    category: 'DENTAL',
    corporateRate: 6000,
    generalRate: 9000,
    duration: '120',
    description: 'Ceramic dental crown placement',
    subCategory: 'Prosthetics'
  },
  {
    id: 'DEN008',
    name: 'Dental Implant',
    category: 'DENTAL',
    corporateRate: 25000,
    generalRate: 35000,
    duration: '180',
    description: 'Single dental implant placement',
    subCategory: 'Implantology'
  },
  {
    id: 'DEN009',
    name: 'Teeth Whitening',
    category: 'DENTAL',
    corporateRate: 3000,
    generalRate: 4500,
    duration: '60',
    description: 'Professional teeth whitening treatment',
    subCategory: 'Cosmetic'
  },
  {
    id: 'DEN010',
    name: 'Dental X-Ray (Intraoral)',
    category: 'DENTAL',
    corporateRate: 200,
    generalRate: 350,
    duration: '10',
    description: 'Intraoral dental X-ray',
    subCategory: 'Diagnostic'
  },
  {
    id: 'DEN011',
    name: 'Panoramic X-Ray',
    category: 'DENTAL',
    corporateRate: 600,
    generalRate: 900,
    duration: '15',
    description: 'Panoramic dental X-ray',
    subCategory: 'Diagnostic'
  }
];

// Helper functions
export const getServicesByCategory = (category: HospitalService['category']): HospitalService[] => {
  return HOSPITAL_SERVICES.filter(service => service.category === category);
};

export const getServiceById = (id: string): HospitalService | undefined => {
  return HOSPITAL_SERVICES.find(service => service.id === id);
};

export const searchServices = (query: string): HospitalService[] => {
  const searchTerm = query.toLowerCase();
  return HOSPITAL_SERVICES.filter(service => 
    service.name.toLowerCase().includes(searchTerm) ||
    service.description?.toLowerCase().includes(searchTerm) ||
    service.category.toLowerCase().includes(searchTerm) ||
    service.subCategory?.toLowerCase().includes(searchTerm)
  );
};

export const getServiceCategories = (): string[] => {
  return Array.from(new Set(HOSPITAL_SERVICES.map(service => service.category)));
};

export const getSubCategories = (category: HospitalService['category']): string[] => {
  return Array.from(new Set(
    HOSPITAL_SERVICES
      .filter(service => service.category === category)
      .map(service => service.subCategory)
      .filter(Boolean)
  )) as string[];
};

// Service pricing utilities
export const calculateServiceTotal = (serviceIds: string[], isCoorporate: boolean = false): number => {
  return serviceIds.reduce((total, serviceId) => {
    const service = getServiceById(serviceId);
    if (service) {
      return total + (isCoorporate ? service.corporateRate : service.generalRate);
    }
    return total;
  }, 0);
};

export const getServicePrice = (serviceId: string, isCoorporate: boolean = false): number => {
  const service = getServiceById(serviceId);
  if (!service) return 0;
  return isCoorporate ? service.corporateRate : service.generalRate;
};

// Service booking utilities
export interface ServiceBooking {
  serviceId: string;
  patientId: string;
  scheduledDate: string;
  scheduledTime: string;
  priority: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  notes?: string;
  isCoorporate: boolean;
}

export const estimateServiceDuration = (serviceIds: string[]): number => {
  return serviceIds.reduce((totalMinutes, serviceId) => {
    const service = getServiceById(serviceId);
    if (service) {
      const duration = parseInt(service.duration);
      return totalMinutes + (isNaN(duration) ? 30 : duration); // Default 30 minutes if duration is not a number
    }
    return totalMinutes;
  }, 0);
};