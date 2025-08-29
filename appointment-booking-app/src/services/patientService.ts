import { supabase, HOSPITAL_ID, type Patient } from '../config/supabase';

export interface PatientSearchFilters {
  searchTerm?: string;
  department?: string;
  doctor?: string;
  isActive?: boolean;
}

export interface PatientSearchResult extends Patient {
  appointment_count?: number;
  last_appointment?: string;
  doctor_name?: string;
  department_name?: string;
}

class PatientService {
  /**
   * Search patients by name, phone, or patient ID
   */
  async searchPatients(
    searchTerm: string, 
    limit: number = 20
  ): Promise<PatientSearchResult[]> {
    try {
      if (!searchTerm || searchTerm.trim().length < 2) {
        return [];
      }

      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          appointments:appointments(count),
          appointments:appointments!inner(
            appointment_date,
            appointment_time,
            doctor:users!appointments_doctor_id_fkey(first_name, last_name),
            department:departments!appointments_department_id_fkey(name)
          )
        `)
        .eq('hospital_id', HOSPITAL_ID)
        .eq('is_active', true)
        .or(`
          first_name.ilike.%${searchTerm}%,
          last_name.ilike.%${searchTerm}%,
          phone.ilike.%${searchTerm}%,
          patient_id.ilike.%${searchTerm}%
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error searching patients:', error);
        throw error;
      }

      // Process the results to include additional info
      const processedResults: PatientSearchResult[] = (data || []).map(patient => {
        const appointments = patient.appointments || [];
        const latestAppointment = appointments[0];
        
        return {
          ...patient,
          appointment_count: appointments.length,
          last_appointment: latestAppointment 
            ? `${latestAppointment.appointment_date} ${latestAppointment.appointment_time}`
            : undefined,
          doctor_name: latestAppointment?.doctor 
            ? `${latestAppointment.doctor.first_name} ${latestAppointment.doctor.last_name}`
            : patient.assigned_doctor,
          department_name: latestAppointment?.department?.name || patient.assigned_department
        };
      });

      return processedResults;
    } catch (error) {
      console.error('❌ Patient search error:', error);
      throw error;
    }
  }

  /**
   * Get patient by ID
   */
  async getPatientById(patientId: string): Promise<PatientSearchResult | null> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          appointments:appointments(
            id,
            appointment_date,
            appointment_time,
            status,
            doctor:users!appointments_doctor_id_fkey(first_name, last_name),
            department:departments!appointments_department_id_fkey(name)
          )
        `)
        .eq('id', patientId)
        .eq('hospital_id', HOSPITAL_ID)
        .single();

      if (error) {
        console.error('❌ Error fetching patient:', error);
        throw error;
      }

      if (!data) {
        return null;
      }

      const appointments = data.appointments || [];
      const latestAppointment = appointments[0];

      return {
        ...data,
        appointment_count: appointments.length,
        last_appointment: latestAppointment 
          ? `${latestAppointment.appointment_date} ${latestAppointment.appointment_time}`
          : undefined,
        doctor_name: latestAppointment?.doctor 
          ? `${latestAppointment.doctor.first_name} ${latestAppointment.doctor.last_name}`
          : data.assigned_doctor,
        department_name: latestAppointment?.department?.name || data.assigned_department
      };
    } catch (error) {
      console.error('❌ Error fetching patient by ID:', error);
      throw error;
    }
  }

  /**
   * Get recently added patients
   */
  async getRecentPatients(limit: number = 10): Promise<PatientSearchResult[]> {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          appointments:appointments(count)
        `)
        .eq('hospital_id', HOSPITAL_ID)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('❌ Error fetching recent patients:', error);
        throw error;
      }

      return (data || []).map(patient => ({
        ...patient,
        appointment_count: patient.appointments?.[0]?.count || 0,
        doctor_name: patient.assigned_doctor,
        department_name: patient.assigned_department
      }));
    } catch (error) {
      console.error('❌ Error fetching recent patients:', error);
      throw error;
    }
  }

  /**
   * Get patient appointment history
   */
  async getPatientAppointments(patientId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          doctor:users!appointments_doctor_id_fkey(first_name, last_name),
          department:departments!appointments_department_id_fkey(name)
        `)
        .eq('patient_id', patientId)
        .eq('hospital_id', HOSPITAL_ID)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) {
        console.error('❌ Error fetching patient appointments:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ Error fetching patient appointments:', error);
      throw error;
    }
  }
}

export const patientService = new PatientService();