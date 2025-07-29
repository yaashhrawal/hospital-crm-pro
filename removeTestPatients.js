// Script to remove test patients from the database
import { createClient } from '@supabase/supabase-js';

// Your Supabase configuration (update with your actual values)
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function removeTestPatients() {
  try {
    console.log('🔍 Finding test patients...');
    
    // First, let's see what patients we're about to delete
    const { data: testPatients, error: selectError } = await supabase
      .from('patients')
      .select('id, first_name, last_name, patient_id, phone, created_at')
      .or(`first_name.ilike.%testst%,first_name.ilike.%divyansh%,first_name.ilike.%testing%,last_name.ilike.%testst%,last_name.ilike.%divyansh%,last_name.ilike.%testing%`);

    if (selectError) {
      console.error('❌ Error finding test patients:', selectError);
      return;
    }

    console.log(`📋 Found ${testPatients.length} test patients to remove:`);
    testPatients.forEach(patient => {
      console.log(`  - ${patient.first_name} ${patient.last_name} (ID: ${patient.patient_id})`);
    });

    if (testPatients.length === 0) {
      console.log('✅ No test patients found. Database is clean!');
      return;
    }

    const patientIds = testPatients.map(p => p.id);

    console.log('🗑️ Removing related records...');

    // Delete patient transactions
    const { error: txError } = await supabase
      .from('patient_transactions')
      .delete()
      .in('patient_id', patientIds);

    if (txError) console.warn('⚠️ Error deleting transactions:', txError.message);

    // Delete patient admissions
    const { error: admissionError } = await supabase
      .from('patient_admissions')
      .delete()
      .in('patient_id', patientIds);

    if (admissionError) console.warn('⚠️ Error deleting admissions:', admissionError.message);

    // Delete appointments
    const { error: appointmentError } = await supabase
      .from('appointments')
      .delete()
      .in('patient_id', patientIds);

    if (appointmentError) console.warn('⚠️ Error deleting appointments:', appointmentError.message);

    console.log('🗑️ Removing test patients...');

    // Finally, delete the patients themselves
    const { error: deleteError } = await supabase
      .from('patients')
      .delete()
      .or(`first_name.ilike.%testst%,first_name.ilike.%divyansh%,first_name.ilike.%testing%,last_name.ilike.%testst%,last_name.ilike.%divyansh%,last_name.ilike.%testing%`);

    if (deleteError) {
      console.error('❌ Error deleting patients:', deleteError);
      return;
    }

    console.log('✅ Test patients removed successfully!');

    // Verify deletion
    const { data: remainingPatients, error: verifyError } = await supabase
      .from('patients')
      .select('count', { count: 'exact' })
      .or(`first_name.ilike.%testst%,first_name.ilike.%divyansh%,first_name.ilike.%testing%,last_name.ilike.%testst%,last_name.ilike.%divyansh%,last_name.ilike.%testing%`);

    if (!verifyError) {
      console.log(`✅ Verification: ${remainingPatients.length || 0} test patients remaining`);
    }

  } catch (error) {
    console.error('🚨 Unexpected error:', error);
  }
}

// Run the function
removeTestPatients();