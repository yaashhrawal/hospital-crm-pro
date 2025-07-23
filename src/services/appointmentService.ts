import { supabase } from '../config/supabase';
import { PatientService, type CreatePatientData } from './patientService';
import type { 
  Appointment, 
  AppointmentWithRelations, 
  CreateAppointmentData, 
  PaginatedResponse,
  SupabaseQuery 
} from '../config/supabase';

export interface AppointmentFilters {
  patientId?: string;
  doctorId?: string;
  departmentId?: string;
  status?: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  appointmentType?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

export interface AppointmentListParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: AppointmentFilters;
}

export interface UpdateAppointmentData extends Partial<CreateAppointmentData> {
  status?: 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
  actual_start_time?: string;
  actual_end_time?: string;
  diagnosis?: string;
  prescription?: string;
  follow_up_date?: string;
  notes?: string;
}

class AppointmentService {
  /**
   * Get all appointments with pagination and filters
   */
  async getAppointments(params: AppointmentListParams = {}): Promise<PaginatedResponse<AppointmentWithRelations>> {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'scheduled_at',
        sortOrder = 'asc',
        filters = {},
      } = params;

      const offset = (page - 1) * limit;

      // Build query
      let query = supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(
            id,
            patient_id,
            first_name,
            last_name,
            phone,
            email,
            gender,
            blood_group
          ),
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
          ),
          bills(
            id,
            bill_number,
            status,
            total_amount
          )
        `, { count: 'exact' });

      // Apply filters
      if (filters.patientId) {
        query = query.eq('patient_id', filters.patientId);
      }

      if (filters.doctorId) {
        query = query.eq('doctor_id', filters.doctorId);
      }

      if (filters.departmentId) {
        query = query.eq('department_id', filters.departmentId);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.appointmentType) {
        query = query.eq('appointment_type', filters.appointmentType);
      }

      if (filters.dateRange) {
        query = query
          .gte('scheduled_at', filters.dateRange.start)
          .lte('scheduled_at', filters.dateRange.end);
      }

      // Apply sorting and pagination
      query = query
        .order(sortBy, { ascending: sortOrder === 'asc' })
        .range(offset, offset + limit - 1);

      const { data, error, count }: SupabaseQuery<AppointmentWithRelations> = await query;

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
      console.error('Error fetching appointments:', error);
      throw error;
    }
  }

  /**
   * Get a single appointment by ID
   */
  async getAppointmentById(id: string): Promise<AppointmentWithRelations | null> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(
            id,
            patient_id,
            first_name,
            last_name,
            phone,
            email,
            gender,
            blood_group,
            medical_history,
            allergies,
            current_medications
          ),
          doctor:users!appointments_doctor_id_fkey(
            id,
            first_name,
            last_name,
            email,
            role
          ),
          department:departments(
            id,
            name,
            description
          ),
          bills(
            id,
            bill_number,
            status,
            total_amount,
            payment_method
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Appointment not found
        }
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error fetching appointment:', error);
      throw error;
    }
  }

  /**
   * Create a new appointment with a new patient
   */
  async createAppointmentWithNewPatient(
    appointmentData: Omit<CreateAppointmentData, 'patient_id'>,
    patientData: CreatePatientData
  ): Promise<{ appointment: Appointment; patient: any }> {
    try {
      // First create the new patient
      const newPatient = await PatientService.createPatient(patientData);
      
      // Then create the appointment with the new patient ID
      const appointment = await this.createAppointment({
        ...appointmentData,
        patient_id: newPatient.id,
      });

      return { appointment, patient: newPatient };
    } catch (error) {
      console.error('Error creating appointment with new patient:', error);
      throw error;
    }
  }

  /**
   * Create a new appointment
   */
  async createAppointment(appointmentData: CreateAppointmentData): Promise<Appointment> {
    try {
      // Check for conflicts
      const hasConflict = await this.checkTimeConflict(
        appointmentData.doctor_id,
        appointmentData.scheduled_at,
        appointmentData.duration || 30
      );

      if (hasConflict) {
        throw new Error('Doctor is not available at the requested time');
      }

      // Generate appointment ID
      const appointmentId = await this.generateAppointmentId();

      const { data, error } = await supabase
        .from('appointments')
        .insert({
          ...appointmentData,
          appointment_id: appointmentId,
          duration: appointmentData.duration || 30,
          appointment_type: appointmentData.appointment_type || 'CONSULTATION',
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      return data;
    } catch (error) {
      console.error('Error creating appointment:', error);
      throw error;
    }
  }

  /**
   * Update an existing appointment
   */
  async updateAppointment(id: string, updates: UpdateAppointmentData): Promise<Appointment> {
    try {
      // If updating scheduled time, check for conflicts
      if (updates.scheduled_at && updates.doctor_id) {
        const hasConflict = await this.checkTimeConflict(
          updates.doctor_id,
          updates.scheduled_at,
          updates.duration || 30,
          id // Exclude current appointment from conflict check
        );

        if (hasConflict) {
          throw new Error('Doctor is not available at the requested time');
        }
      }

      // Handle status transitions
      const updateData = { ...updates };
      if (updates.status === 'IN_PROGRESS' && !updates.actual_start_time) {
        updateData.actual_start_time = new Date().toISOString();
      }
      if (updates.status === 'COMPLETED' && !updates.actual_end_time) {
        updateData.actual_end_time = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('appointments')
        .update({
          ...updateData,
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
      console.error('Error updating appointment:', error);
      throw error;
    }
  }

  /**
   * Cancel an appointment
   */
  async cancelAppointment(id: string, reason?: string): Promise<void> {
    try {
      const updateData: any = {
        status: 'CANCELLED',
        updated_at: new Date().toISOString(),
      };

      if (reason) {
        // Get current notes and append cancellation reason
        const { data: appointment } = await supabase
          .from('appointments')
          .select('notes')
          .eq('id', id)
          .single();

        const currentNotes = appointment?.notes || '';
        updateData.notes = currentNotes 
          ? `${currentNotes}\nCancellation reason: ${reason}`
          : `Cancellation reason: ${reason}`;
      }

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw new Error(error.message);
      }
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      throw error;
    }
  }

  /**
   * Get today's appointments
   */
  async getTodayAppointments(): Promise<AppointmentWithRelations[]> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(
            id,
            patient_id,
            first_name,
            last_name,
            phone
          ),
          doctor:users!appointments_doctor_id_fkey(
            id,
            first_name,
            last_name
          ),
          department:departments(
            id,
            name
          )
        `)
        .gte('scheduled_at', startOfDay)
        .lte('scheduled_at', endOfDay)
        .order('scheduled_at', { ascending: true });

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching today\'s appointments:', error);
      throw error;
    }
  }

  /**
   * Get upcoming appointments for a doctor
   */
  async getDoctorUpcomingAppointments(doctorId: string, limit: number = 10): Promise<AppointmentWithRelations[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patient:patients(
            id,
            patient_id,
            first_name,
            last_name,
            phone
          ),
          department:departments(
            id,
            name
          )
        `)
        .eq('doctor_id', doctorId)
        .in('status', ['SCHEDULED', 'CONFIRMED'])
        .gte('scheduled_at', new Date().toISOString())
        .order('scheduled_at', { ascending: true })
        .limit(limit);

      if (error) {
        throw new Error(error.message);
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching doctor upcoming appointments:', error);
      throw error;
    }
  }

  /**
   * Get appointment statistics
   */
  async getAppointmentStats(): Promise<{
    total: number;
    today: number;
    scheduled: number;
    completed: number;
    cancelled: number;
    statusDistribution: Record<string, number>;
    typeDistribution: Record<string, number>;
    completionRate: number;
  }> {
    try {
      // Get basic counts
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
      const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

      const [
        { count: total },
        { count: todayCount },
        { count: scheduled },
        { count: completed },
        { count: cancelled },
      ] = await Promise.all([
        supabase.from('appointments').select('id', { count: 'exact', head: true }),
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .gte('scheduled_at', startOfDay)
          .lte('scheduled_at', endOfDay),
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .eq('status', 'SCHEDULED'),
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .eq('status', 'COMPLETED'),
        supabase.from('appointments').select('id', { count: 'exact', head: true })
          .eq('status', 'CANCELLED'),
      ]);

      // Get all appointments for detailed stats
      const { data: appointments } = await supabase
        .from('appointments')
        .select('status, appointment_type');

      // Calculate distributions
      const statusDistribution: Record<string, number> = {};
      const typeDistribution: Record<string, number> = {};

      appointments?.forEach((appointment) => {
        statusDistribution[appointment.status] = (statusDistribution[appointment.status] || 0) + 1;
        typeDistribution[appointment.appointment_type] = (typeDistribution[appointment.appointment_type] || 0) + 1;
      });

      const completionRate = total ? ((completed || 0) / (total || 1)) * 100 : 0;

      return {
        total: total || 0,
        today: todayCount || 0,
        scheduled: scheduled || 0,
        completed: completed || 0,
        cancelled: cancelled || 0,
        statusDistribution,
        typeDistribution,
        completionRate,
      };
    } catch (error) {
      console.error('Error fetching appointment stats:', error);
      throw error;
    }
  }

  /**
   * Check for time conflicts
   */
  private async checkTimeConflict(
    doctorId: string,
    scheduledAt: string,
    duration: number,
    excludeAppointmentId?: string
  ): Promise<boolean> {
    try {
      const appointmentStart = new Date(scheduledAt);
      const appointmentEnd = new Date(appointmentStart.getTime() + duration * 60000);

      let query = supabase
        .from('appointments')
        .select('id')
        .eq('doctor_id', doctorId)
        .in('status', ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'])
        .lte('scheduled_at', appointmentEnd.toISOString());

      if (excludeAppointmentId) {
        query = query.neq('id', excludeAppointmentId);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(error.message);
      }

      // Check for overlapping appointments
      for (const appointment of data || []) {
        // This is a simplified conflict check
        // In a real application, you might want to implement more sophisticated logic
        return true; // Conflict found
      }

      return false; // No conflict
    } catch (error) {
      console.error('Error checking time conflict:', error);
      return false; // Assume no conflict on error
    }
  }

  /**
   * Generate a unique appointment ID
   */
  private async generateAppointmentId(): Promise<string> {
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const prefix = `APT${currentYear}${currentMonth.toString().padStart(2, '0')}`;

      // Get the last appointment ID for this month
      const { data } = await supabase
        .from('appointments')
        .select('appointment_id')
        .like('appointment_id', `${prefix}%`)
        .order('appointment_id', { ascending: false })
        .limit(1);

      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastId = data[0].appointment_id;
        const lastNumber = parseInt(lastId.replace(prefix, ''));
        nextNumber = lastNumber + 1;
      }

      return `${prefix}${nextNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      console.error('Error generating appointment ID:', error);
      // Fallback to timestamp-based ID
      return `APT${Date.now()}`;
    }
  }

  /**
   * Subscribe to appointment changes
   */
  subscribeToAppointments(callback: (payload: any) => void) {
    return supabase
      .channel('appointments_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'appointments' 
        }, 
        callback
      )
      .subscribe();
  }
}

export const appointmentService = new AppointmentService();
export default appointmentService;