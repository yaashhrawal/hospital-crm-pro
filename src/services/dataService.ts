// Data Service - Adapter for Supabase with LocalStorage fallback
import { supabase } from '../config/supabase';
import localStorageService from './localStorageService';
import supabaseAuthService from './supabaseAuthService';
import type { Patient, Doctor, Department, PatientTransaction, PatientAdmission, DailyExpense } from './localStorageService';
import type { User, ApiResponse } from '../types/index';

class DataService {
  private useLocalFallback: boolean = false;
  
  constructor() {
    // Force Supabase mode - no LocalStorage fallback
    this.useLocalFallback = false;
    console.log('✅ DataService initialized in Supabase mode');
    console.log('Environment:', {
      SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'CONFIGURED' : 'MISSING',
      SUPABASE_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'CONFIGURED' : 'MISSING',
      LOCAL_FALLBACK: import.meta.env.VITE_ENABLE_LOCAL_STORAGE_FALLBACK
    });
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

  // Authentication Methods - Supabase Direct
  async login(email: string, password: string): Promise<User | null> {
    console.log('🔐 Attempting Supabase login for:', email);
    try {
      const { user, error } = await supabaseAuthService.signIn(email, password);
      if (error) {
        console.error('❌ Supabase login error:', error);
        throw error;
      }
      
      if (user) {
        console.log('✅ Supabase login successful:', user.email);
        return {
          id: user.id || '',
          email: user.email || email,
          password: '',
          first_name: user.first_name || '',
          last_name: user.last_name || '',
          role: (user.role as 'admin' | 'doctor' | 'staff') || 'staff',
          is_active: user.is_active ?? true,
          created_at: new Date().toISOString()
        } as User;
      }
      
      return null;
    } catch (error) {
      console.error('🚨 Authentication failed:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    console.log('🔍 Getting current Supabase user...');
    try {
      const user = await supabaseAuthService.getCurrentUser();
      if (user) {
        console.log('✅ Current user found:', user.email);
        return {
          id: user.id,
          email: user.email,
          password: '',
          first_name: user.first_name,
          last_name: user.last_name,
          role: (user.role as 'admin' | 'doctor' | 'staff'),
          is_active: user.is_active,
          created_at: new Date().toISOString()
        } as User;
      }
      console.log('⚠️ No current user found');
      return null;
    } catch (error) {
      console.error('❌ Error getting current user:', error);
      return null;
    }
  }

  async logout(): Promise<void> {
    console.log('📡 Logging out via Supabase Auth Service');
    try {
      const { error } = await supabaseAuthService.signOut();
      if (error) {
        console.error('❌ Supabase logout error:', error);
        throw error;
      }
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('🚨 Logout failed:', error);
      throw error;
    }
  }

  // Patient Management - Direct Supabase Integration
  async createPatient(patientData: Omit<Patient, 'id' | 'patient_id' | 'created_at' | 'updated_at' | 'created_by'>): Promise<Patient> {
    console.log('📡 Creating patient directly in Supabase:', patientData);
    try {
      const { data, error } = await supabase
        .from('patients')
        .insert([patientData])
        .select()
        .single();
      if (error) {
        console.error('❌ Supabase patient creation error:', error);
        throw error;
      }
      console.log('✅ Patient created successfully in Supabase:', data);
      return data;
    } catch (error) {
      console.error('🚨 Patient creation failed:', error);
      throw error;
    }
  }

  async getPatients(): Promise<Patient[]> {
    console.log('📡 Fetching patients directly from Supabase');
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('❌ Supabase patients fetch error:', error);
        throw error;
      }
      console.log('✅ Patients fetched successfully from Supabase:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      console.error('🚨 Patients fetch failed:', error);
      throw error;
    }
  }

  async getPatientById(id: string): Promise<Patient | null> {
    console.log('📡 Fetching patient by ID directly from Supabase:', id);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('id', id)
        .single();
      if (error) {
        console.error('❌ Supabase patient fetch error:', error);
        throw error;
      }
      console.log('✅ Patient fetched successfully from Supabase:', data);
      return data;
    } catch (error) {
      console.error('🚨 Patient fetch failed:', error);
      throw error;
    }
  }

  // Doctor Management - Direct Supabase Integration
  async getDoctors(): Promise<Doctor[]> {
    console.log('📡 Fetching doctors directly from Supabase');
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) {
        console.error('❌ Supabase doctors fetch error:', error);
        console.error('Error details:', { message: error.message, code: error.code, details: error.details });
        
        // If table doesn't exist, return empty array instead of throwing
        if (error.code === '42P01') {
          console.warn('⚠️ Doctors table does not exist. Please run CREATE_DOCTORS_TABLE.sql');
          return [];
        }
        throw error;
      }
      console.log('✅ Doctors fetched successfully from Supabase:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      console.error('🚨 Doctors fetch failed:', error);
      throw error;
    }
  }

  async getDoctorsByDepartment(department: string): Promise<Doctor[]> {
    console.log('📡 Fetching doctors by department directly from Supabase:', department);
    try {
      const { data, error } = await supabase
        .from('doctors')
        .select('*')
        .eq('department', department)
        .eq('is_active', true)
        .order('name');
      if (error) {
        console.error('❌ Supabase doctors by department fetch error:', error);
        throw error;
      }
      console.log('✅ Doctors by department fetched successfully from Supabase:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      console.error('🚨 Doctors by department fetch failed:', error);
      throw error;
    }
  }

  // Department Management - Direct Supabase Integration
  async getDepartments(): Promise<Department[]> {
    console.log('📡 Fetching departments directly from Supabase');
    try {
      const { data, error } = await supabase
        .from('departments')
        .select('*')
        .eq('is_active', true)
        .order('name');
      if (error) {
        console.error('❌ Supabase departments fetch error:', error);
        throw error;
      }
      console.log('✅ Departments fetched successfully from Supabase:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      console.error('🚨 Departments fetch failed:', error);
      throw error;
    }
  }

  // Transaction Management - Direct Supabase Integration
  async createTransaction(transactionData: Omit<PatientTransaction, 'id' | 'created_at'>): Promise<PatientTransaction> {
    console.log('📡 Creating transaction directly in Supabase:', transactionData);
    try {
      const { data, error } = await supabase
        .from('patient_transactions')
        .insert([transactionData])
        .select()
        .single();
      if (error) {
        console.error('❌ Supabase transaction creation error:', error);
        throw error;
      }
      console.log('✅ Transaction created successfully in Supabase:', data);
      return data;
    } catch (error) {
      console.error('🚨 Transaction creation failed:', error);
      throw error;
    }
  }

  async getTransactionsByPatient(patientId: string): Promise<PatientTransaction[]> {
    console.log('📡 Fetching transactions by patient directly from Supabase:', patientId);
    try {
      const { data, error } = await supabase
        .from('patient_transactions')
        .select('*')
        .eq('patient_id', patientId)
        .order('created_at', { ascending: false });
      if (error) {
        console.error('❌ Supabase transactions fetch error:', error);
        throw error;
      }
      console.log('✅ Transactions fetched successfully from Supabase:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      console.error('🚨 Transactions fetch failed:', error);
      throw error;
    }
  }

  async getPatientVisits(patientId: string): Promise<any[]> {
    console.log('📡 Fetching patient visits from Supabase:', patientId);
    try {
      const { data, error } = await supabase
        .from('patient_visits')
        .select('*')
        .eq('patient_id', patientId)
        .order('visit_date', { ascending: false });
      if (error) {
        console.error('❌ Supabase patient visits fetch error:', error);
        throw error;
      }
      console.log('✅ Patient visits fetched successfully from Supabase:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      console.error('🚨 Patient visits fetch failed:', error);
      throw error;
    }
  }

  async getTransactionsByDate(date: string): Promise<PatientTransaction[]> {
    console.log('📡 Fetching transactions by date directly from Supabase:', date);
    try {
      const { data, error } = await supabase
        .from('patient_transactions')
        .select('*')
        .gte('created_at', date + 'T00:00:00.000Z')
        .lt('created_at', date + 'T23:59:59.999Z')
        .order('created_at', { ascending: false });
      if (error) {
        console.error('❌ Supabase transactions by date fetch error:', error);
        throw error;
      }
      console.log('✅ Transactions by date fetched successfully from Supabase:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      console.error('🚨 Transactions by date fetch failed:', error);
      throw error;
    }
  }

  // Admission Management - Direct Supabase Integration
  async createAdmission(admissionData: Omit<PatientAdmission, 'id'>): Promise<PatientAdmission> {
    console.log('📡 Creating admission directly in Supabase:', admissionData);
    try {
      const { data, error } = await supabase
        .from('patient_admissions')
        .insert([admissionData])
        .select()
        .single();
      if (error) {
        console.error('❌ Supabase admission creation error:', error);
        throw error;
      }
      console.log('✅ Admission created successfully in Supabase:', data);
      return data;
    } catch (error) {
      console.error('🚨 Admission creation failed:', error);
      throw error;
    }
  }

  async getActiveAdmissions(): Promise<PatientAdmission[]> {
    console.log('📡 Fetching active admissions directly from Supabase');
    try {
      const { data, error } = await supabase
        .from('patient_admissions')
        .select('*')
        .eq('status', 'active')
        .order('admission_date', { ascending: false });
      if (error) {
        console.error('❌ Supabase active admissions fetch error:', error);
        throw error;
      }
      console.log('✅ Active admissions fetched successfully from Supabase:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      console.error('🚨 Active admissions fetch failed:', error);
      throw error;
    }
  }

  // Expense Management - Direct Supabase Integration
  async createExpense(expenseData: Omit<DailyExpense, 'id'>): Promise<DailyExpense> {
    console.log('📡 Creating expense directly in Supabase:', expenseData);
    try {
      const { data, error } = await supabase
        .from('daily_expenses')
        .insert([expenseData])
        .select()
        .single();
      if (error) {
        console.error('❌ Supabase expense creation error:', error);
        throw error;
      }
      console.log('✅ Expense created successfully in Supabase:', data);
      return data;
    } catch (error) {
      console.error('🚨 Expense creation failed:', error);
      throw error;
    }
  }

  async getExpensesByDate(date: string): Promise<DailyExpense[]> {
    console.log('📡 Fetching expenses by date directly from Supabase:', date);
    try {
      const { data, error } = await supabase
        .from('daily_expenses')
        .select('*')
        .eq('date', date)
        .order('date', { ascending: false });
      if (error) {
        console.error('❌ Supabase expenses by date fetch error:', error);
        throw error;
      }
      console.log('✅ Expenses by date fetched successfully from Supabase:', data?.length || 0, 'records');
      return data || [];
    } catch (error) {
      console.error('🚨 Expenses by date fetch failed:', error);
      throw error;
    }
  }

  // Revenue Calculation - Direct Supabase Integration
  async getDailyRevenue(date: string): Promise<{
    totalIncome: number;
    totalExpenses: number;
    netRevenue: number;
    transactionBreakdown: any;
  }> {
    console.log('📡 Calculating daily revenue directly from Supabase for date:', date);
    try {
      // Fetch data directly from Supabase
      const transactions = await this.getTransactionsByDate(date);
      const expenses = await this.getExpensesByDate(date);

      const totalIncome = transactions.reduce((sum, t) => sum + t.amount, 0);
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const netRevenue = totalIncome - totalExpenses;

      const transactionBreakdown = transactions.reduce((breakdown, t) => {
        breakdown[t.transaction_type] = (breakdown[t.transaction_type] || 0) + t.amount;
        return breakdown;
      }, {} as Record<string, number>);

      const result = {
        totalIncome,
        totalExpenses,
        netRevenue,
        transactionBreakdown,
      };

      console.log('✅ Daily revenue calculated successfully from Supabase:', result);
      return result;
    } catch (error) {
      console.error('🚨 Daily revenue calculation failed:', error);
      throw error;
    }
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