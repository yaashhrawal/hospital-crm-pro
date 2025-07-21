// Local Storage Service - Emergency fallback for Supabase failures
// Simple UUID generator fallback
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

const uuidv4 = generateUUID;

// Types for Hospital CRM
export interface Patient {
  id: string;
  patient_id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  phone: string;
  email?: string;
  address: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  medical_history?: string;
  allergies?: string;
  current_medications?: string;
  blood_group?: string;
  notes?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface Doctor {
  id: string;
  name: string;
  department: string;
  specialization: string;
  fee: number;
  is_active: boolean;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
}

export interface PatientTransaction {
  id: string;
  patient_id: string;
  transaction_type: 'entry_fee' | 'consultation' | 'service' | 'admission' | 'medicine' | 'discount' | 'refund';
  amount: number;
  payment_mode: 'cash' | 'online' | 'card' | 'upi' | 'insurance' | 'adjustment';
  doctor_id?: string;
  department: string;
  description: string;
  created_at: string;
}

export interface PatientAdmission {
  id: string;
  patient_id: string;
  bed_number: string;
  room_type: 'general' | 'private' | 'icu';
  department: string;
  daily_rate: number;
  admission_date: string;
  discharge_date?: string;
  status: 'active' | 'discharged';
  total_amount: number;
}

export interface DailyExpense {
  id: string;
  expense_category: 'salaries' | 'utilities' | 'medical_supplies' | 'maintenance' | 'administrative';
  description: string;
  amount: number;
  payment_mode: 'cash' | 'online' | 'card' | 'upi';
  date: string;
  approved_by: string;
}

export interface User {
  id: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  role: 'ADMIN' | 'DOCTOR' | 'NURSE' | 'STAFF';
  is_active: boolean;
  created_at: string;
}

class LocalStorageService {
  private storagePrefix = 'hospital_crm_';

  // Generic storage methods
  private setItem<T>(key: string, value: T): void {
    localStorage.setItem(this.storagePrefix + key, JSON.stringify(value));
  }

  private getItem<T>(key: string): T | null {
    const item = localStorage.getItem(this.storagePrefix + key);
    return item ? JSON.parse(item) : null;
  }

  private removeItem(key: string): void {
    localStorage.removeItem(this.storagePrefix + key);
  }

  // Initialize default data
  initializeDefaultData(): void {
    // Initialize default admin user
    const users = this.getItem<User[]>('users') || [];
    if (users.length === 0) {
      const adminUser: User = {
        id: uuidv4(),
        email: 'admin@hospital.com',
        password: 'admin123', // In real app, this would be hashed
        first_name: 'Admin',
        last_name: 'User',
        role: 'ADMIN',
        is_active: true,
        created_at: new Date().toISOString(),
      };
      this.setItem('users', [adminUser]);
    }

    // Initialize default departments
    const departments = this.getItem<Department[]>('departments') || [];
    if (departments.length === 0) {
      const defaultDepartments: Department[] = [
        { id: uuidv4(), name: 'General', description: 'General Medicine', is_active: true },
        { id: uuidv4(), name: 'Cardiology', description: 'Heart and Blood Vessels', is_active: true },
        { id: uuidv4(), name: 'Pediatrics', description: 'Child Care', is_active: true },
        { id: uuidv4(), name: 'Emergency', description: 'Emergency Medicine', is_active: true },
        { id: uuidv4(), name: 'Orthopedics', description: 'Bone and Joint Care', is_active: true },
      ];
      this.setItem('departments', defaultDepartments);
    }

    // Initialize default doctors
    const doctors = this.getItem<Doctor[]>('doctors') || [];
    if (doctors.length === 0) {
      const defaultDoctors: Doctor[] = [
        { id: uuidv4(), name: 'Dr. Rajesh Kumar', department: 'General', specialization: 'General Medicine', fee: 500, is_active: true },
        { id: uuidv4(), name: 'Dr. Priya Sharma', department: 'Cardiology', specialization: 'Cardiology', fee: 1200, is_active: true },
        { id: uuidv4(), name: 'Dr. Amit Singh', department: 'Pediatrics', specialization: 'Child Care', fee: 800, is_active: true },
        { id: uuidv4(), name: 'Dr. Neha Gupta', department: 'Emergency', specialization: 'Emergency Medicine', fee: 1000, is_active: true },
        { id: uuidv4(), name: 'Dr. Suresh Patel', department: 'Orthopedics', specialization: 'Bone & Joint', fee: 900, is_active: true },
      ];
      this.setItem('doctors', defaultDoctors);
    }

    // Initialize empty arrays for other entities
    if (!this.getItem<Patient[]>('patients')) this.setItem('patients', []);
    if (!this.getItem<PatientTransaction[]>('transactions')) this.setItem('transactions', []);
    if (!this.getItem<PatientAdmission[]>('admissions')) this.setItem('admissions', []);
    if (!this.getItem<DailyExpense[]>('expenses')) this.setItem('expenses', []);
  }

  // Authentication
  async login(email: string, password: string): Promise<User | null> {
    const users = this.getItem<User[]>('users') || [];
    const user = users.find(u => u.email === email && u.password === password && u.is_active);
    if (user) {
      this.setItem('current_user', user);
      return { ...user, password: '' }; // Don't return password
    }
    return null;
  }

  getCurrentUser(): User | null {
    const user = this.getItem<User>('current_user');
    return user ? { ...user, password: '' } : null;
  }

  logout(): void {
    this.removeItem('current_user');
  }

  // Patient Management
  async createPatient(patientData: Omit<Patient, 'id' | 'patient_id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<Patient> {
    const patients = this.getItem<Patient[]>('patients') || [];
    const currentUser = this.getCurrentUser();
    
    const newPatient: Patient = {
      ...patientData,
      id: uuidv4(),
      patient_id: `PAT${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: currentUser?.id || '',
    };

    patients.push(newPatient);
    this.setItem('patients', patients);
    return newPatient;
  }

  async getPatients(): Promise<Patient[]> {
    return this.getItem<Patient[]>('patients') || [];
  }

  async getPatientById(id: string): Promise<Patient | null> {
    const patients = this.getItem<Patient[]>('patients') || [];
    return patients.find(p => p.id === id) || null;
  }

  // Doctor Management
  async getDoctors(): Promise<Doctor[]> {
    return this.getItem<Doctor[]>('doctors') || [];
  }

  async getDoctorsByDepartment(department: string): Promise<Doctor[]> {
    const doctors = this.getItem<Doctor[]>('doctors') || [];
    return doctors.filter(d => d.department === department && d.is_active);
  }

  // Department Management
  async getDepartments(): Promise<Department[]> {
    return this.getItem<Department[]>('departments') || [];
  }

  // Transaction Management
  async createTransaction(transactionData: Omit<PatientTransaction, 'id' | 'created_at'>): Promise<PatientTransaction> {
    const transactions = this.getItem<PatientTransaction[]>('transactions') || [];
    
    const newTransaction: PatientTransaction = {
      ...transactionData,
      id: uuidv4(),
      created_at: new Date().toISOString(),
    };

    transactions.push(newTransaction);
    this.setItem('transactions', transactions);
    return newTransaction;
  }

  async getTransactionsByPatient(patientId: string): Promise<PatientTransaction[]> {
    const transactions = this.getItem<PatientTransaction[]>('transactions') || [];
    return transactions.filter(t => t.patient_id === patientId);
  }

  async getTransactionsByDate(date: string): Promise<PatientTransaction[]> {
    const transactions = this.getItem<PatientTransaction[]>('transactions') || [];
    return transactions.filter(t => t.created_at.startsWith(date));
  }

  // Admission Management
  async createAdmission(admissionData: Omit<PatientAdmission, 'id'>): Promise<PatientAdmission> {
    const admissions = this.getItem<PatientAdmission[]>('admissions') || [];
    
    const newAdmission: PatientAdmission = {
      ...admissionData,
      id: uuidv4(),
    };

    admissions.push(newAdmission);
    this.setItem('admissions', admissions);
    return newAdmission;
  }

  async getActiveAdmissions(): Promise<PatientAdmission[]> {
    const admissions = this.getItem<PatientAdmission[]>('admissions') || [];
    return admissions.filter(a => a.status === 'active');
  }

  // Expense Management
  async createExpense(expenseData: Omit<DailyExpense, 'id'>): Promise<DailyExpense> {
    const expenses = this.getItem<DailyExpense[]>('expenses') || [];
    
    const newExpense: DailyExpense = {
      ...expenseData,
      id: uuidv4(),
    };

    expenses.push(newExpense);
    this.setItem('expenses', expenses);
    return newExpense;
  }

  async getExpensesByDate(date: string): Promise<DailyExpense[]> {
    const expenses = this.getItem<DailyExpense[]>('expenses') || [];
    return expenses.filter(e => e.date === date);
  }

  // Revenue Calculation
  async getDailyRevenue(date: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netRevenue: number;
    transactionBreakdown: any;
  }> {
    const transactions = await this.getTransactionsByDate(date);
    const expenses = await this.getExpensesByDate(date);

    const totalIncome = transactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
    const netRevenue = totalIncome - totalExpenses;

    const transactionBreakdown = transactions.reduce((breakdown, t) => {
      breakdown[t.transaction_type] = (breakdown[t.transaction_type] || 0) + t.amount;
      return breakdown;
    }, {} as Record<string, number>);

    return {
      totalIncome,
      totalExpenses,
      netRevenue,
      transactionBreakdown,
    };
  }

  // Utility methods
  clearAllData(): void {
    const keys = Object.keys(localStorage).filter(key => key.startsWith(this.storagePrefix));
    keys.forEach(key => localStorage.removeItem(key));
  }

  exportData(): string {
    const data = {
      patients: this.getItem('patients'),
      doctors: this.getItem('doctors'),
      departments: this.getItem('departments'),
      transactions: this.getItem('transactions'),
      admissions: this.getItem('admissions'),
      expenses: this.getItem('expenses'),
      users: this.getItem('users'),
    };
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData: string): void {
    try {
      const data = JSON.parse(jsonData);
      Object.keys(data).forEach(key => {
        if (data[key]) {
          this.setItem(key, data[key]);
        }
      });
    } catch (error) {
      throw new Error('Invalid JSON data');
    }
  }
}

// Create and export singleton instance
const localStorageService = new LocalStorageService();
export default localStorageService;