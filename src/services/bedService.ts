import { supabase } from '../config/supabaseNew';
import type { PatientWithRelations } from '../config/supabaseNew';

export interface BedData {
  id: string;
  bed_number: string;
  room_type: string;
  status: 'occupied' | 'vacant' | 'AVAILABLE' | 'OCCUPIED';
  patient_id?: string;
  ipd_number?: string;
  admission_date?: string;
  admission_id?: string;
  tat_start_time?: number;
  tat_status?: 'idle' | 'running' | 'completed' | 'expired';
  tat_remaining_seconds?: number;
  consent_form_data?: any;
  consent_form_submitted?: boolean;
  clinical_record_data?: any;
  clinical_record_submitted?: boolean;
  progress_sheet_data?: any;
  progress_sheet_submitted?: boolean;
  nurses_orders_data?: any;
  nurses_orders_submitted?: boolean;
  ipd_consents_data?: any;
  created_at?: string;
  updated_at?: string;
  // Include patient data when loaded
  patients?: PatientWithRelations;
}

export interface IPDCounter {
  id: string;
  date_key: string;
  counter: number;
  created_at: string;
  updated_at: string;
}

class BedService {
  // Get all beds with patient information
  async getAllBeds(): Promise<BedData[]> {
    try {
      console.log('🔍 BedService: Starting getAllBeds query...');
      
      const { data, error } = await supabase
        .from('beds')
        .select(`
          *,
          patients (
            id,
            patient_id,
            first_name,
            last_name,
            phone,
            age,
            gender,
            address,
            assigned_doctor,
            assigned_department,
            assigned_doctors,
            consultation_fees,
            admissions:patient_admissions(*)
          )
        `)
        .order('bed_number');

      console.log('🔍 BedService: Query completed');
      console.log('🔍 BedService: Error?', error);
      console.log('🔍 BedService: Data?', data?.length, 'rows');

      if (error) {
        console.error('❌ BedService: Error fetching beds:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('❌ BedService.getAllBeds failed:', error);
      console.error('❌ BedService error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      throw error;
    }
  }

  // Get a specific bed by ID
  async getBedById(bedId: string): Promise<BedData | null> {
    try {
      const { data, error } = await supabase
        .from('beds')
        .select(`
          *,
          patients (
            id,
            patient_id,
            first_name,
            last_name,
            phone,
            age,
            gender,
            address,
            assigned_doctor,
            assigned_department,
            assigned_doctors,
            consultation_fees
          )
        `)
        .eq('id', bedId)
        .single();

      if (error) {
        console.error('Error fetching bed:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('BedService.getBedById failed:', error);
      return null;
    }
  }

  // Generate next IPD number using database function
  async getNextIPDNumber(): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('get_next_ipd_number');

      if (error) {
        console.error('Error generating IPD number:', error);
        throw error;
      }

      console.log('🏥 Generated IPD Number:', data);
      return data;
    } catch (error) {
      console.error('BedService.getNextIPDNumber failed:', error);
      throw error;
    }
  }

  // Admit patient to bed
  async admitPatientToBed(
    bedId: string, 
    patient: PatientWithRelations, 
    admissionDate?: string
  ): Promise<BedData> {
    try {
      // Generate IPD number
      const ipdNumber = await this.getNextIPDNumber();
      
      const admissionDateToUse = admissionDate || new Date().toISOString();

      // Get bed details first to extract bed number
      const { data: bedData } = await supabase
        .from('beds')
        .select('bed_number, room_type, hospital_id')
        .eq('id', bedId)
        .single();

      // First, create admission record in patient_admissions table
      const { data: admissionData, error: admissionError } = await supabase
        .from('patient_admissions')
        .insert({
          patient_id: patient.id,
          bed_number: bedData?.bed_number ? parseInt(bedData.bed_number) : 1,
          room_type: bedData?.room_type || 'GENERAL',
          department: patient.assigned_department || 'GENERAL',
          admission_date: admissionDateToUse,
          status: 'ADMITTED',
          hospital_id: bedData?.hospital_id || 'b8a8c5e2-5c4d-4a8b-9e6f-3d2c1a0b9c8d'
          // Removed treating_doctor and ipd_number - columns don't exist in patient_admissions table
        })
        .select()
        .single();

      if (admissionError) {
        console.error('❌ Error creating admission record:', admissionError);
        throw new Error(`Failed to create admission record: ${admissionError.message}`);
      }

      console.log('✅ Admission record created:', admissionData);

      // Update bed with patient information and admission ID
      const { data, error } = await supabase
        .from('beds')
        .update({
          status: 'occupied',
          patient_id: patient.id,
          ipd_number: ipdNumber,
          admission_date: admissionDateToUse,
          admission_id: admissionData.id, // Link to admission record
          tat_status: 'idle',
          tat_remaining_seconds: 1800, // 30 minutes
          consent_form_submitted: false,
          clinical_record_submitted: false,
          progress_sheet_submitted: false,
          nurses_orders_submitted: false
        })
        .eq('id', bedId)
        .select(`
          *,
          patients (
            id,
            patient_id,
            first_name,
            last_name,
            phone,
            age,
            gender,
            address,
            assigned_doctor,
            assigned_department,
            assigned_doctors,
            consultation_fees
          )
        `)
        .single();

      if (error) {
        console.error('❌ Error admitting patient to bed:');
        console.log(error); // Use console.log to fully expand the object
        console.error('❌ Error message:', error?.message);
        console.error('❌ Error code:', error?.code);
        console.error('❌ Error details:', error?.details);
        console.error('❌ Error hint:', error?.hint);
        console.error('❌ Full error object:', JSON.stringify(error, null, 2));
        console.error('❌ Attempted update data:');
        console.log({
          bedId,
          patientId: patient.id,
          ipdNumber,
          admissionDateToUse,
          status: 'occupied'
        });
        throw error;
      }

      console.log('✅ Patient admitted successfully. IPD Number:', ipdNumber);
      return data;
    } catch (error) {
      console.error('❌ BedService.admitPatientToBed failed:');
      console.log(error); // Use console.log to expand the full error
      console.error('❌ Catch block - Full error:', JSON.stringify(error, null, 2));
      throw error;
    }
  }

  // Discharge patient from bed
  async dischargePatientFromBed(bedId: string): Promise<BedData> {
    try {
      const { data, error } = await supabase
        .from('beds')
        .update({
          status: 'vacant',
          patient_id: null,
          ipd_number: null,
          admission_date: null,
          admission_id: null,
          tat_start_time: null,
          tat_status: 'idle',
          tat_remaining_seconds: 1800,
          consent_form_data: null,
          consent_form_submitted: false,
          clinical_record_data: null,
          clinical_record_submitted: false,
          progress_sheet_data: null,
          progress_sheet_submitted: false,
          nurses_orders_data: null,
          nurses_orders_submitted: false,
          ipd_consents_data: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', bedId)
        .select()
        .single();

      if (error) {
        console.error('Error discharging patient from bed:', error);
        throw error;
      }

      console.log('✅ Patient discharged successfully');
      return data;
    } catch (error) {
      console.error('BedService.dischargePatientFromBed failed:', error);
      throw error;
    }
  }

  // Update bed data (for forms, TAT, etc.)
  async updateBed(bedId: string, updates: Partial<BedData>): Promise<BedData> {
    try {
      const { data, error } = await supabase
        .from('beds')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', bedId)
        .select(`
          *,
          patients (
            id,
            patient_id,
            first_name,
            last_name,
            phone,
            age,
            gender,
            address,
            assigned_doctor,
            assigned_department,
            assigned_doctors,
            consultation_fees
          )
        `)
        .single();

      if (error) {
        console.error('Error updating bed:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('BedService.updateBed failed:', error);
      throw error;
    }
  }

  // Subscribe to real-time bed changes
  subscribeToBedsChanges(callback: (payload: any) => void) {
    const subscription = supabase
      .channel('beds-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'beds'
        },
        callback
      )
      .subscribe();

    console.log('🔄 Subscribed to real-time bed changes');
    return subscription;
  }

  // Unsubscribe from real-time changes
  unsubscribeFromBedsChanges(subscription: any) {
    if (subscription) {
      supabase.removeChannel(subscription);
      console.log('❌ Unsubscribed from real-time bed changes');
    }
  }

  // Get today's IPD stats
  async getIPDStats(): Promise<{ date: string; count: number; lastIPD: string }> {
    try {
      const today = new Date();
      const dateKey = today.getFullYear().toString() + 
                     (today.getMonth() + 1).toString().padStart(2, '0') + 
                     today.getDate().toString().padStart(2, '0');

      const { data, error } = await supabase
        .from('ipd_counters')
        .select('counter')
        .eq('date_key', dateKey)
        .single();

      const count = data?.counter || 0;
      const lastIPD = count > 0 ? `IPD-${dateKey}-${count.toString().padStart(3, '0')}` : 'None';

      return {
        date: dateKey,
        count,
        lastIPD
      };
    } catch (error) {
      console.error('BedService.getIPDStats failed:', error);
      return {
        date: new Date().toISOString().split('T')[0].replace(/-/g, ''),
        count: 0,
        lastIPD: 'None'
      };
    }
  }

  // Initialize beds if they don't exist - DISABLED TO PREVENT DUPLICATES
  async initializeBeds(): Promise<void> {
    console.log('🚫 Bed initialization DISABLED - use main database only');
    return; // Completely disabled to prevent any local bed creation
  }
}

export default new BedService();