import { supabase, HOSPITAL_ID } from '../config/supabaseNew';
import type { PatientWithRelations } from '../config/supabaseNew';

export class ExactDateService {
  static async getPatientsForExactDate(dateStr: string, limit = 100): Promise<PatientWithRelations[]> {
    try {
      console.log(`📅 EXACT DATE SERVICE: Fetching patients for ${dateStr} (NO CUMULATIVE RESULTS)`);
      
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
        console.error('❌ Query error:', error);
        throw error;
      }

      if (!allPatients || allPatients.length === 0) {
        console.log('⚠️ No patients found in database');
        return [];
      }

      console.log(`📊 Got ${allPatients.length} total patients, arranging datewise for EXACT date: ${dateStr}`);
      
      // STEP 1: Arrange all patients by their dates (datewise arrangement)
      console.log('📅 STEP 1: Arranging patients datewise...');
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
            console.log(`Patient ${index + 1}: ${patient.first_name} ${patient.last_name} → Date: ${patientDate}`);
          }
        }
      });
      
      // Show date-wise arrangement
      console.log('📊 Datewise arrangement:');
      const sortedDates = Array.from(patientsByDate.keys()).sort();
      sortedDates.forEach(date => {
        const count = patientsByDate.get(date)?.length || 0;
        console.log(`  ${date}: ${count} patients`);
      });

      // STEP 2: Extract patients for the EXACT requested date only
      console.log(`🎯 STEP 2: Extracting patients for EXACT date: ${dateStr}`);
      
      const exactDatePatients = patientsByDate.get(dateStr) || [];
      
      console.log(`🔍 Found ${exactDatePatients.length} patients for exact date ${dateStr}`);
      
      // Debug: Show what we found vs what we're excluding
      if (exactDatePatients.length > 0) {
        console.log('✅ EXACT DATE MATCHES:');
        exactDatePatients.slice(0, 5).forEach((patient, i) => {
          console.log(`  ${i + 1}. ${patient.first_name} ${patient.last_name}`);
        });
      }
      
      // Debug: Show other dates we're excluding (to verify no cumulative results)
      const otherDates = sortedDates.filter(date => date !== dateStr);
      if (otherDates.length > 0) {
        console.log('❌ EXCLUDING other dates:');
        otherDates.slice(0, 3).forEach(date => {
          const count = patientsByDate.get(date)?.length || 0;
          console.log(`  ${date}: ${count} patients (EXCLUDED)`);
        });
      }
      
      console.log(`✅ STEP 3: Final verification - ${exactDatePatients.length} patients with EXACT date match for ${dateStr}`);
      
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
          console.error(`🚨 VERIFICATION FAILED: ${patient.first_name} ${patient.last_name} has date ${patientDate} but requested ${dateStr}`);
        }
        
        return isExactMatch;
      });
      
      console.log(`🔒 VERIFIED: ${verifiedPatients.length} patients confirmed for exact date ${dateStr}`);
      
      // Apply limit
      const limitedPatients = verifiedPatients.slice(0, limit);
      
      // Final validation check
      if (limitedPatients.length > 0) {
        console.log('🔍 Final sample patients:');
        limitedPatients.slice(0, 3).forEach((p, i) => {
          const createdDate = p.created_at ? p.created_at.split('T')[0] : null;
          const entryDate = p.date_of_entry ? (p.date_of_entry.includes('T') ? p.date_of_entry.split('T')[0] : p.date_of_entry) : null;
          console.log(`${i + 1}. ${p.first_name} ${p.last_name}: created=${createdDate}, entry=${entryDate}`);
          
          // Verify exact match
          if (createdDate !== dateStr && entryDate !== dateStr) {
            console.error(`🚨 FILTER ERROR: Patient ${p.first_name} ${p.last_name} doesn't match ${dateStr}!`);
          }
        });
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
          departmentStatus: patient.ipd_status === 'ADMITTED' ? 'IPD' as const : 'OPD' as const
        };
      });
      
      return enhancedPatients as PatientWithRelations[];
      
    } catch (error: any) {
      console.error('🚨 ExactDateService error:', error);
      
      // Fallback: return empty array instead of throwing
      console.log('🔄 Falling back to empty result due to error');
      return [];
    }
  }
}