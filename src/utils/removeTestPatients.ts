import { supabase } from '../config/supabaseNew';

export async function removeTestPatients() {
  try {
    console.log('🔍 Finding test patients...');
    
    // Find test patients
    const { data: testPatients, error: selectError } = await supabase
      .from('patients')
      .select('id, first_name, last_name, patient_id, phone, created_at')
      .or('first_name.ilike.%testst%,first_name.ilike.%divyansh%,first_name.ilike.%testing%,last_name.ilike.%testst%,last_name.ilike.%divyansh%,last_name.ilike.%testing%');

    if (selectError) {
      console.error('❌ Error finding test patients:', selectError);
      return false;
    }

    console.log(`📋 Found ${testPatients.length} test patients to remove:`);
    testPatients.forEach(patient => {
      console.log(`  - ${patient.first_name} ${patient.last_name} (ID: ${patient.patient_id})`);
    });

    if (testPatients.length === 0) {
      console.log('✅ No test patients found. Database is clean!');
      return true;
    }

    const patientIds = testPatients.map(p => p.id);

    console.log('🗑️ Removing related records...');

    // Delete patient transactions
    const { error: txError } = await supabase
      .from('patient_transactions')
      .delete()
      .in('patient_id', patientIds);

    if (txError && !txError.message.includes('No rows')) {
      console.warn('⚠️ Error deleting transactions:', txError.message);
    } else {
      console.log('✅ Patient transactions removed');
    }

    // Delete patient admissions  
    const { error: admissionError } = await supabase
      .from('patient_admissions')
      .delete()
      .in('patient_id', patientIds);

    if (admissionError && !admissionError.message.includes('No rows')) {
      console.warn('⚠️ Error deleting admissions:', admissionError.message);
    } else {
      console.log('✅ Patient admissions removed');
    }

    // Delete appointments
    const { error: appointmentError } = await supabase
      .from('appointments')
      .delete()
      .in('patient_id', patientIds);

    if (appointmentError && !appointmentError.message.includes('No rows')) {
      console.warn('⚠️ Error deleting appointments:', appointmentError.message);
    } else {
      console.log('✅ Appointments removed');
    }

    console.log('🗑️ Removing test patients...');

    // Delete the patients themselves
    const { error: deleteError } = await supabase
      .from('patients')
      .delete()
      .in('id', patientIds);

    if (deleteError) {
      console.error('❌ Error deleting patients:', deleteError);
      return false;
    }

    console.log('✅ Test patients removed successfully!');

    // Verify deletion
    const { data: remainingPatients, error: verifyError } = await supabase
      .from('patients')
      .select('id')
      .or('first_name.ilike.%testst%,first_name.ilike.%divyansh%,first_name.ilike.%testing%,last_name.ilike.%testst%,last_name.ilike.%divyansh%,last_name.ilike.%testing%');

    if (!verifyError) {
      console.log(`✅ Verification: ${remainingPatients?.length || 0} test patients remaining`);
    }

    return true;

  } catch (error) {
    console.error('🚨 Unexpected error:', error);
    return false;
  }
}

// Make it available globally for browser console access
(window as any).removeTestPatients = removeTestPatients;