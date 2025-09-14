// Nurse Service - Similar to doctorService.ts pattern
export interface NurseInfo {
  name: string;
  department: string;
  id?: string;
  shift?: string;
  role?: string;
}

// Nurses data for various departments
export const NURSES_DATA: NurseInfo[] = [
  { name: 'Nurse Priya Sharma', department: 'ORTHOPAEDIC', shift: 'Morning', role: 'Staff Nurse' },
  { name: 'Nurse Anjali Patel', department: 'GENERAL PHYSICIAN', shift: 'Evening', role: 'Senior Nurse' },
  { name: 'Nurse Ravi Kumar', department: 'NEUROLOGY', shift: 'Night', role: 'Staff Nurse' },
  { name: 'Nurse Sunita Gupta', department: 'GYN.', shift: 'Morning', role: 'Senior Nurse' },
  { name: 'Nurse Deepak Singh', department: 'UROLOGY', shift: 'Evening', role: 'Staff Nurse' },
  { name: 'Nurse Meera Joshi', department: 'GASTRO', shift: 'Morning', role: 'Senior Nurse' },
  { name: 'Nurse Rahul Verma', department: 'NEUROSURGERY', shift: 'Night', role: 'Staff Nurse' },
  { name: 'Nurse Kavita Devi', department: 'SURGICAL ONCOLOGY', shift: 'Morning', role: 'Staff Nurse' },
  { name: 'Nurse Amit Yadav', department: 'MEDICAL ONCOLOGY', shift: 'Evening', role: 'Staff Nurse' },
  { name: 'Nurse Rekha Kumari', department: 'ENDOCRINOLOGY', shift: 'Morning', role: 'Senior Nurse' },
  { name: 'Nurse Vinod Tiwari', department: 'DIETICIAN', shift: 'Evening', role: 'Staff Nurse' },
  { name: 'Nurse Pooja Mishra', department: 'GENERAL PHYSICIAN', shift: 'Night', role: 'Staff Nurse' }
];

// Get unique departments from nurses
export const NURSE_DEPARTMENTS = [...new Set(NURSES_DATA.map(nurse => nurse.department))].sort();

export class NurseService {
  // Get all nurses with ID compatibility
  static getAllNurses(): NurseInfo[] {
    return NURSES_DATA.map((nurse, index) => ({
      ...nurse,
      id: `nurse-${index + 1}` // Generate IDs for system compatibility
    }));
  }

  // Get nurses by department
  static getNursesByDepartment(department: string): NurseInfo[] {
    return this.getAllNurses().filter(nurse => nurse.department === department);
  }

  // Get all departments where nurses work
  static getAllDepartments(): string[] {
    return NURSE_DEPARTMENTS;
  }

  // Find nurse by name
  static getNurseByName(name: string): NurseInfo | null {
    const nurse = NURSES_DATA.find(n => n.name === name);
    if (!nurse) return null;
    
    const index = NURSES_DATA.indexOf(nurse);
    return {
      ...nurse,
      id: `nurse-${index + 1}`
    };
  }

  // Find nurse by ID
  static getNurseById(id: string): NurseInfo | null {
    const index = parseInt(id.replace('nurse-', '')) - 1;
    if (index < 0 || index >= NURSES_DATA.length) return null;
    
    const nurse = NURSES_DATA[index];
    return {
      ...nurse,
      id
    };
  }

  // Search nurses by name, department, or shift
  static searchNurses(query: string): NurseInfo[] {
    const searchTerm = query.toLowerCase();
    return this.getAllNurses().filter(nurse =>
      nurse.name.toLowerCase().includes(searchTerm) ||
      nurse.department.toLowerCase().includes(searchTerm) ||
      (nurse.shift && nurse.shift.toLowerCase().includes(searchTerm)) ||
      (nurse.role && nurse.role.toLowerCase().includes(searchTerm))
    );
  }

  // Get nurses by shift
  static getNursesByShift(shift: string): NurseInfo[] {
    return this.getAllNurses().filter(nurse => nurse.shift === shift);
  }

  // Get nurses by role
  static getNursesByRole(role: string): NurseInfo[] {
    return this.getAllNurses().filter(nurse => nurse.role === role);
  }
}

export default NurseService;