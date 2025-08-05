// Shared doctor data service - same as used in patient entry
export interface DoctorInfo {
  name: string;
  department: string;
  id?: string; // Added for billing system compatibility
  specialization?: string; // Alias for department
}

// Doctors and Departments data - same as in NewFlexiblePatientEntry
export const DOCTORS_DATA: DoctorInfo[] = [
  { name: 'DR. HEMANT KHAJJA', department: 'ORTHOPAEDIC' },
  { name: 'DR. LALITA SUWALKA', department: 'DIETICIAN' },
  { name: 'DR. MILIND KIRIT AKHANI', department: 'GASTRO' },
  { name: 'DR MEETU BABLE', department: 'GYN.' },
  { name: 'DR. AMIT PATANVADIYA', department: 'NEUROLOGY' },
  { name: 'DR. KISHAN PATEL', department: 'UROLOGY' },
  { name: 'DR. PARTH SHAH', department: 'SURGICAL ONCOLOGY' },
  { name: 'DR.RAJEEDP GUPTA', department: 'MEDICAL ONCOLOGY' },
  { name: 'DR. KULDDEP VALA', department: 'NEUROSURGERY' },
  { name: 'DR. KURNAL PATEL', department: 'UROLOGY' },
  { name: 'DR. SAURABH GUPTA', department: 'ENDOCRINOLOGY' },
  { name: 'DR. BATUL PEEPAWALA', department: 'GENERAL PHYSICIAN' }
];

// Get unique departments
export const DEPARTMENTS = [...new Set(DOCTORS_DATA.map(doc => doc.department))].sort();

export class DoctorService {
  // Get all doctors with billing system compatibility
  static getAllDoctors(): DoctorInfo[] {
    return DOCTORS_DATA.map((doctor, index) => ({
      ...doctor,
      id: `doc-${index + 1}`, // Generate IDs for billing system
      specialization: doctor.department // Add specialization alias
    }));
  }

  // Get doctors by department
  static getDoctorsByDepartment(department: string): DoctorInfo[] {
    return this.getAllDoctors().filter(doc => doc.department === department);
  }

  // Get all departments
  static getAllDepartments(): string[] {
    return DEPARTMENTS;
  }

  // Find doctor by name
  static getDoctorByName(name: string): DoctorInfo | null {
    const doctor = DOCTORS_DATA.find(doc => doc.name === name);
    if (!doctor) return null;
    
    const index = DOCTORS_DATA.indexOf(doctor);
    return {
      ...doctor,
      id: `doc-${index + 1}`,
      specialization: doctor.department
    };
  }

  // Find doctor by ID
  static getDoctorById(id: string): DoctorInfo | null {
    const index = parseInt(id.replace('doc-', '')) - 1;
    if (index < 0 || index >= DOCTORS_DATA.length) return null;
    
    const doctor = DOCTORS_DATA[index];
    return {
      ...doctor,
      id,
      specialization: doctor.department
    };
  }

  // Search doctors by name or department
  static searchDoctors(query: string): DoctorInfo[] {
    const searchTerm = query.toLowerCase();
    return this.getAllDoctors().filter(doctor =>
      doctor.name.toLowerCase().includes(searchTerm) ||
      doctor.department.toLowerCase().includes(searchTerm)
    );
  }
}

export default DoctorService;