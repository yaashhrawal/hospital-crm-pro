import { supabase, HOSPITAL_ID } from '../config/supabaseNew';
import type { PatientWithRelations } from '../config/supabaseNew';

export class ExactDateService {
  static async getPatientsForExactDate(dateStr: string, limit = 100): Promise<PatientWithRelations[]> {
    try {
      
      // Get all patients from the database
      const { data: allPatients, error } = await supabase
        .from('patients')
        .select(`
          *,
          transactions:patient_transactions(*),
          admissions:patient_admissions(*)
        `)
        .eq('hospital_id', HOSPITAL_ID)
        .order('created_at', { ascending: false })
        .limit(1000);

      if (error) {
        throw error;
      }

      if (!allPatients || allPatients.length === 0) {
        return [];
      }

      
      // STEP 1: Arrange all patients by their dates (datewise arrangement)
      const patientsByDate = new Map<string, any[]>();
      
      allPatients.forEach((patient, index) => {
        // Extract dates in YYYY-MM-DD format
        let patientDate = null;
        
        // Priority 1: date_of_entry (user-set visit date)
        if (patient.date_of_entry) {
          if (patient.date_of_entry.includes('T')) {
            patientDate = patient.date_of_entry.split('T')[0];
          } else {
            patientDate = patient.date_of_entry;
          }
        }
        // Priority 2: created_at (registration date)
        else if (patient.created_at) {
          patientDate = patient.created_at.split('T')[0];
        }
        
        if (patientDate) {
          if (!patientsByDate.has(patientDate)) {
            patientsByDate.set(patientDate, []);
          }
          patientsByDate.get(patientDate)!.push(patient);
          
          // Debug first few patients
          if (index < 5) {
          }
        }
      });
      
      // Show date-wise arrangement
      const sortedDates = Array.from(patientsByDate.keys()).sort();

      // STEP 2: Extract patients for the EXACT requested date only
      
      const exactDatePatients = patientsByDate.get(dateStr) || [];
      
      
      // Debug: Show what we found vs what we're excluding
      if (exactDatePatients.length > 0) {
      }
      
      // Debug: Show other dates we're excluding (to verify no cumulative results)
      const otherDates = sortedDates.filter(date => date !== dateStr);
      if (otherDates.length > 0) {
      }
      
      
      // STEP 3: Final verification to ensure NO cumulative results
      const verifiedPatients = exactDatePatients.filter(patient => {
        let patientDate = null;
        
        if (patient.date_of_entry) {
          patientDate = patient.date_of_entry.includes('T') ? patient.date_of_entry.split('T')[0] : patient.date_of_entry;
        } else if (patient.created_at) {
          patientDate = patient.created_at.split('T')[0];
        }
        
        const isExactMatch = patientDate === dateStr;
        
        if (!isExactMatch) {
        }
        
        return isExactMatch;
      });
      
      
      // Apply limit
      const limitedPatients = verifiedPatients.slice(0, limit);
      
      // Final validation check
      if (limitedPatients.length > 0) {
      }
      
      // Enhance patients with calculated fields
      const enhancedPatients = limitedPatients.map(patient => {
        const transactions = patient.transactions || [];
        const admissions = patient.admissions || [];
        
        // Only count completed transactions (exclude cancelled)
        const totalSpent = transactions
          .filter((t: any) => t.status !== 'CANCELLED')
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
          
        // Count patient entries/registrations and consultations (including 0 fee consultations, excluding cancelled)
        const registrationVisits = transactions.filter((t: any) => 
          (t.transaction_type === 'ENTRY_FEE' || 
          t.transaction_type === 'entry_fee' ||
          t.transaction_type === 'CONSULTATION' ||
          t.transaction_type === 'consultation') &&
          t.status !== 'CANCELLED'
        ).length;
        
        const visitCount = Math.max(registrationVisits, 1); // At least 1 (for the registration itself)
        
        // Get last transaction/visit date
        const lastTransactionDate = transactions.length > 0 
          ? new Date(Math.max(...transactions.map((t: any) => new Date(t.created_at).getTime())))
          : new Date(patient.created_at);
          
        return {
          ...patient,
          totalSpent,
          visitCount,
          lastVisit: lastTransactionDate.toISOString().split('T')[0],
          departmentStatus: patient.ipd_status === 'ADMITTED' || patient.ipd_status === 'DISCHARGED' ? 'IPD' as const : 'OPD' as const
        };
      });
      
      return enhancedPatients as PatientWithRelations[];
      
    } catch (error: any) {
      
      // Fallback: return empty array instead of throwing
      return [];
    }
  }

  static async getPatientsForDateRange(startDateStr: string, endDateStr: string): Promise<PatientWithRelations[]> {
    try {
      console.log('🔍 getPatientsForDateRange - Input:', { startDateStr, endDateStr });
      
      // Convert dates to proper format for Supabase (add time component for proper range)
      const startDateTime = `${startDateStr}T00:00:00`;
      const endDateTime = `${endDateStr}T23:59:59`;
      
      console.log('📅 Using date range:', { startDateTime, endDateTime });

      // Get all patients and filter client-side for precise control
      const { data: allPatients, error } = await supabase
        .from('patients')
        .select(`
          *,
          transactions:patient_transactions(*),
          admissions:patient_admissions(*)
        `)
        .eq('hospital_id', HOSPITAL_ID)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      if (!allPatients || allPatients.length === 0) {
        return [];
      }
      
      // Filter patients by date range on client side for precise control
      const filteredPatients = allPatients.filter(patient => {
        // Get patient date (prioritize date_of_entry over created_at)
        let patientDateStr = null;
        
        if (patient.date_of_entry && patient.date_of_entry.trim() !== '') {
          patientDateStr = patient.date_of_entry.includes('T') 
            ? patient.date_of_entry.split('T')[0] 
            : patient.date_of_entry;
        } else if (patient.created_at) {
          patientDateStr = patient.created_at.split('T')[0];
        }
        
        if (!patientDateStr) return false;
        
        // Check if patient date is within the range (inclusive)
        const isInRange = patientDateStr >= startDateStr && patientDateStr <= endDateStr;
        
        if (isInRange) {
          console.log(`✅ Including patient: ${patient.first_name} ${patient.last_name} (${patientDateStr})`);
        }
        
        return isInRange;
      });
      
      console.log(`📊 Filtered ${filteredPatients.length} patients from ${allPatients.length} total patients`);
      
      const data = filteredPatients;

      const enhancedPatients = data.map(patient => {
        const transactions = patient.transactions || [];
        const admissions = patient.admissions || [];
        
        const totalSpent = transactions
          .filter((t: any) => t.status !== 'CANCELLED')
          .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);
          
        const registrationVisits = transactions.filter((t: any) => 
          (t.transaction_type === 'ENTRY_FEE' || 
          t.transaction_type === 'entry_fee' ||
          t.transaction_type === 'CONSULTATION' ||
          t.transaction_type === 'consultation') &&
          t.status !== 'CANCELLED'
        ).length;
        
        const visitCount = Math.max(registrationVisits, 1);
        
        const lastTransactionDate = transactions.length > 0 
          ? new Date(Math.max(...transactions.map((t: any) => new Date(t.created_at).getTime())))
          : new Date(patient.created_at);
          
        return {
          ...patient,
          totalSpent,
          visitCount,
          lastVisit: lastTransactionDate.toISOString().split('T')[0],
          departmentStatus: patient.ipd_status === 'ADMITTED' || patient.ipd_status === 'DISCHARGED' ? 'IPD' as const : 'OPD' as const
        };
      });
      
      return enhancedPatients as PatientWithRelations[];
      
    } catch (error: any) {
      return [];
    }
  }
}