import { supabase } from '../config/supabase';
import type { 
  Patient, 
  PatientWithRelations, 
  CreatePatientData, 
  PaginatedResponse,
  SupabaseQuery 
} from '../config/supabase';

export interface PatientFilters {
  search?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  bloodGroup?: string;
  isActive?: boolean;
  createdBy?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface PatientListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: PatientFilters;
}

class PatientService {
  /**
   * Get all patients with pagination and filters
   */
  async getPatients(params: PatientListParams = {}): Promise<PaginatedResponse<PatientWithRelations>> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'created_at',
        sortOrder = 'desc',
        filters = {},
      } = params;

      const offset = (page - 1) * limit;

      // Build query
      let query = supabase
        .from('patients')
        .select(`
          *,
          created_by_user:users!patients_created_by_fkey(
            id,
            first_name,
            last_name,
            email,
            role
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.search) {
        query = query.or(`first_name.ilike.%${filters.search}%,last_name.ilike.%${filters.search}%,phone.ilike.%${filters.search}%,email.ilike.%${filters.search}%,patient_id.ilike.%${filters.search}%`);
      }

      if (filters.gender) {
        query = query.eq('gender', filters.gender);
      }

      if (filters.bloodGroup) {
        query = query.eq('blood_group', filters.bloodGroup);
      }

      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters.createdBy) {
        query = query.eq('created_by', filters.createdBy);
      }

      if (filters.dateRange) {
        query = query
          .gte('created_at', filters.dateRange.start)
          .lte('created_at', filters.dateRange.end);
      }

      // Apply sorting and pagination
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error, count }: SupabaseQuery<PatientWithRelations> = await query;

      if (error) {
        throw new Error(error.message);
      }

      return {
        data: data || [],
        count: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      console.error('Error fetching patients:', error);
      throw error;
    }
  }

  /**
   * Get a single patient by ID
   */
  async getPatientById(id: string): Promise<PatientWithRelations | null> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          created_by_user:users!patients_created_by_fkey(
            id,
            first_name,
            last_name,
            email,
            role
          ),
          appointments(
            *,
            doctor:users!appointments_doctor_id_fkey(
              id,
              first_name,
              last_name,
              email
            ),
            department:departments(
              id,
              name,
              description
            )
          ),
          bills(
            *,
            appointment:appointments(
              id,
              appointment_id,
              scheduled_at,
              reason
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Patient not found
        }
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error fetching patient:', error);
      throw error;
    }
  }

  /**
   * Get patient by phone number
   */
  async getPatientByPhone(phone: string): Promise<Patient | null> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .eq('phone', phone)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Patient not found
        }
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error fetching patient by phone:', error);
      throw error;
    }
  }

  /**
   * Create a new patient
   */
  async createPatient(patientData: CreatePatientData, createdBy: string): Promise<Patient> {
    try {
      // Generate patient ID
      const patientId = await this.generatePatientId();

      const { data, error } = await supabase
        .from('patients')
        .insert({
          ...patientData,
          patient_id: patientId,
          created_by: createdBy,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error creating patient:', error);
      throw error;
    }
  }

  /**
   * Update an existing patient
   */
  async updatePatient(id: string, updates: Partial<CreatePatientData>): Promise<Patient> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }

  /**
   * Soft delete a patient (mark as inactive)
   */
  async deletePatient(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          is_active: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error deleting patient:', error);
      throw error;
    }
  }

  /**
   * Restore a soft-deleted patient
   */
  async restorePatient(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('patients')
        .update({
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error restoring patient:', error);
      throw error;
    }
  }

  /**
   * Get patient statistics
   */
  async getPatientStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    newThisMonth: number;
    genderDistribution: Record<string, number>;
    bloodGroupDistribution: Record<string, number>;
    ageGroups: Record<string, number>;
  }> {
    try {
      // Get basic counts
      const [totalResult, activeResult, inactiveResult] = await Promise.all([
        supabase.from('patients').select('id', { count: 'exact', head: true }),
        supabase.from('patients').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('patients').select('id', { count: 'exact', head: true }).eq('is_active', false),
      ]);

      // Get new patients this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: newThisMonth } = await supabase
        .from('patients')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      // Get all patients for detailed stats
      const { data: patients } = await supabase
        .from('patients')
        .select('gender, blood_group, date_of_birth')
        .eq('is_active', true);

      // Calculate distributions
      const genderDistribution: Record<string, number> = {};
      const bloodGroupDistribution: Record<string, number> = {};
      const ageGroups: Record<string, number> = {
        '0-17': 0,
        '18-30': 0,
        '31-50': 0,
        '51-70': 0,
        '70+': 0,
      };

      patients?.forEach((patient) => {
        // Gender distribution
        genderDistribution[patient.gender] = (genderDistribution[patient.gender] || 0) + 1;

        // Blood group distribution
        if (patient.blood_group) {
          bloodGroupDistribution[patient.blood_group] = (bloodGroupDistribution[patient.blood_group] || 0) + 1;
        }

        // Age groups
        const age = new Date().getFullYear() - new Date(patient.date_of_birth).getFullYear();
        if (age < 18) ageGroups['0-17']++;
        else if (age <= 30) ageGroups['18-30']++;
        else if (age <= 50) ageGroups['31-50']++;
        else if (age <= 70) ageGroups['51-70']++;
        else ageGroups['70+']++;
      });

      return {
        total: totalResult.count || 0,
        active: activeResult.count || 0,
        inactive: inactiveResult.count || 0,
        newThisMonth: newThisMonth || 0,
        genderDistribution,
        bloodGroupDistribution,
        ageGroups,
      };
    } catch (error) {
      console.error('Error fetching patient stats:', error);
      throw error;
    }
  }

  /**
   * Generate a unique patient ID
   */
  private async generatePatientId(): Promise<string> {
    try {
      const currentYear = new Date().getFullYear();
      const prefix = `PAT${currentYear}`;

      // Get the last patient ID for this year
      const { data } = await supabase
        .from('patients')
        .select('patient_id')
        .like('patient_id', `${prefix}%`)
        .order('patient_id', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastId = data[0].patient_id;
        const lastNumber = parseInt(lastId.replace(prefix, ''));
        nextNumber = lastNumber + 1;
      }

      return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating patient ID:', error);
      // Fallback to timestamp-based ID
      return `PAT${Date.now()}`;
    }
  }

  /**
   * Subscribe to patient changes
   */
  subscribeToPatients(callback: (payload: any) => void) {
    return supabase
      .channel('patients_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'patients' 
        }, 
        callback
      )
      .subscribe();
  }

  /**
   * Bulk import patients
   */
  async bulkImportPatients(patients: CreatePatientData[], createdBy: string): Promise<{
    successful: number;
    failed: number;
    errors: string[];
  }> {
    const results = {
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    for (let i = 0; i < patients.length; i++) {
      try {
        await this.createPatient(patients[i], createdBy);
        results.successful++;
      } catch (error) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    return results;
  }
}

export const patientService = new PatientService();
export default patientService;