// Data Service - Adapter for Supabase with LocalStorage fallback
import { supabase } from '../config/supabase';
import localStorageService from './localStorageService';
import supabaseAuthService from './supabaseAuthService';
import type { Patient, Doctor, Department, PatientTransaction, PatientAdmission, DailyExpense, User } from './localStorageService';

class DataService {
  private useLocalFallback: boolean = false;
  
  constructor() {
    // Check if we should use local storage fallback
    this.useLocalFallback = import.meta.env.VITE_ENABLE_LOCAL_STORAGE_FALLBACK === 'true';
    
    if (this.useLocalFallback) {
      console.warn('🔄 Using LocalStorage fallback mode due to Supabase connection issues');
      localStorageService.initializeDefaultData();
    }
  }

  // Test Supabase connection
  async testSupabaseConnection(): Promise<boolean> {
    try {
      const { error } = await supabase.from('users').select('count').limit(1);
      return !error;
    } catch {
      return false;
    }
  }

  // Automatically switch to local storage if Supabase fails
  private async withFallback<T>(
    supabaseOperation: () => Promise<T>,
    localStorageOperation: () => Promise<T>
  ): Promise<T> {
    if (this.useLocalFallback) {
      return localStorageOperation();
    }

    try {
      return await supabaseOperation();
    } catch (error) {
      console.warn('📡 Supabase operation failed, falling back to localStorage:', error);
      this.useLocalFallback = true;
      localStorageService.initializeDefaultData();
      return localStorageOperation();
    }
  }

  // Authentication Methods
  async login(email: string, password: string): Promise<User | null> {
    return this.withFallback(
      async () => {
        const { user, error } = await supabaseAuthService.signIn(email, password);
        if (error) throw error;
        return user ? {
          id: user.id,
          email: user.email,
          password: '',
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role,
          is_active: user.is_active,
          created_at: new Date().toISOString()
        } as User : null;
      },
      () => localStorageService.login(email, password)
    );
  }

  getCurrentUser(): User | null {
    if (this.useLocalFallback) {
      return localStorageService.getCurrentUser();
    }
    
    // For now, return local storage user as supabase session handling needs more setup
    return localStorageService.getCurrentUser();
  }

  async logout(): Promise<void> {
    return this.withFallback(
      async () => {
        const { error } = await supabaseAuthService.signOut();
        if (error) throw error;
      },
      async () => {
        localStorageService.logout();
      }
    );
  }

  // Patient Management
  async createPatient(patientData: Omit<Patient, 'id' | 'patient_id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<Patient> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabase
          .from('patients')
          .insert([patientData])
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      () => localStorageService.createPatient(patientData)
    );
  }

  async getPatients(): Promise<Patient[]> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      },
      () => localStorageService.getPatients()
    );
  }

  async getPatientById(id: string): Promise<Patient | null> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabase
          .from('patients')
          .select('*')
          .eq('id', id)
          .single();
        if (error) throw error;
        return data;
      },
      () => localStorageService.getPatientById(id)
    );
  }

  // Doctor Management
  async getDoctors(): Promise<Doctor[]> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabase
          .from('doctors')
          .select('*')
          .eq('is_active', true)
          .order('name');
        if (error) throw error;
        return data || [];
      },
      () => localStorageService.getDoctors()
    );
  }

  async getDoctorsByDepartment(department: string): Promise<Doctor[]> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabase
          .from('doctors')
          .select('*')
          .eq('department', department)
          .eq('is_active', true)
          .order('name');
        if (error) throw error;
        return data || [];
      },
      () => localStorageService.getDoctorsByDepartment(department)
    );
  }

  // Department Management
  async getDepartments(): Promise<Department[]> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabase
          .from('departments')
          .select('*')
          .eq('is_active', true)
          .order('name');
        if (error) throw error;
        return data || [];
      },
      () => localStorageService.getDepartments()
    );
  }

  // Transaction Management
  async createTransaction(transactionData: Omit<PatientTransaction, 'id' | 'created_at'>): Promise<PatientTransaction> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabase
          .from('patient_transactions')
          .insert([transactionData])
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      () => localStorageService.createTransaction(transactionData)
    );
  }

  async getTransactionsByPatient(patientId: string): Promise<PatientTransaction[]> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabase
          .from('patient_transactions')
          .select('*')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      },
      () => localStorageService.getTransactionsByPatient(patientId)
    );
  }

  async getTransactionsByDate(date: string): Promise<PatientTransaction[]> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabase
          .from('patient_transactions')
          .select('*')
          .gte('created_at', date + 'T00:00:00.000Z')
          .lt('created_at', date + 'T23:59:59.999Z')
          .order('created_at', { ascending: false });
        if (error) throw error;
        return data || [];
      },
      () => localStorageService.getTransactionsByDate(date)
    );
  }

  // Admission Management
  async createAdmission(admissionData: Omit<PatientAdmission, 'id'>): Promise<PatientAdmission> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabase
          .from('patient_admissions')
          .insert([admissionData])
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      () => localStorageService.createAdmission(admissionData)
    );
  }

  async getActiveAdmissions(): Promise<PatientAdmission[]> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabase
          .from('patient_admissions')
          .select('*')
          .eq('status', 'active')
          .order('admission_date', { ascending: false });
        if (error) throw error;
        return data || [];
      },
      () => localStorageService.getActiveAdmissions()
    );
  }

  // Expense Management
  async createExpense(expenseData: Omit<DailyExpense, 'id'>): Promise<DailyExpense> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabase
          .from('daily_expenses')
          .insert([expenseData])
          .select()
          .single();
        if (error) throw error;
        return data;
      },
      () => localStorageService.createExpense(expenseData)
    );
  }

  async getExpensesByDate(date: string): Promise<DailyExpense[]> {
    return this.withFallback(
      async () => {
        const { data, error } = await supabase
          .from('daily_expenses')
          .select('*')
          .eq('date', date)
          .order('date', { ascending: false });
        if (error) throw error;
        return data || [];
      },
      () => localStorageService.getExpensesByDate(date)
    );
  }

  // Revenue Calculation
  async getDailyRevenue(date: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netRevenue: number;
    transactionBreakdown: any;
  }> {
    return this.withFallback(
      async () => {
        // This would need custom SQL in Supabase
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
      },
      () => localStorageService.getDailyRevenue(date)
    );
  }

  // Get service status
  getServiceStatus(): { isOnline: boolean; service: 'Supabase' | 'LocalStorage' } {
    return {
      isOnline: !this.useLocalFallback,
      service: this.useLocalFallback ? 'LocalStorage' : 'Supabase'
    };
  }

  // Data management
  exportData(): string {
    if (this.useLocalFallback) {
      return localStorageService.exportData();
    }
    // For Supabase, we'd need to fetch all tables and export
    throw new Error('Export not implemented for Supabase mode');
  }

  importData(jsonData: string): void {
    if (this.useLocalFallback) {
      localStorageService.importData(jsonData);
    } else {
      throw new Error('Import not implemented for Supabase mode');
    }
  }

  clearAllData(): void {
    if (this.useLocalFallback) {
      localStorageService.clearAllData();
      localStorageService.initializeDefaultData();
    }
  }
}

// Create and export singleton instance
const dataService = new DataService();
export default dataService;

// Export types
export type {
  Patient,
  Doctor, 
  Department,
  PatientTransaction,
  PatientAdmission,
  DailyExpense,
  User
};