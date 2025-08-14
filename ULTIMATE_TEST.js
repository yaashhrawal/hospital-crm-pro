#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const madhubanClient = createClient(
  'https://btoeupnfqkioxigrheyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b2V1cG5mcWtpb3hpZ3JoZXlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAxODQyNCwiZXhwIjoyMDY5NTk0NDI0fQ. BWDIB5vzXl6J7PasV51yOa-rAEt_QxK8x9VoGcfkT5U'
);

async function ultimateTest() {
  console.log('🎯 ULTIMATE SEPARATION TEST');
  console.log('===========================\n');
  
  const testId = `TEST_${Date.now().toString().slice(-8)}`;
  
  // Use same format as existing patients
  const testPatient = {
    patient_id: testId,
    first_name: 'MADHUBAN_SEPARATION',
    last_name: 'TEST',
    age: '25',
    gender: 'M', // Try single letter
    phone: '9999999999',
    address: 'Test Address',
    emergency_contact_name: 'Emergency Contact',
    emergency_contact_phone: '9999999999',
    hospital_id: '550e8400-e29b-41d4-a716-446655440000',
    has_reference: false,
    assigned_department: 'General',
    assigned_doctor: 'Dr. Test',
    prefix: 'Mr',
    is_active: true,
    date_of_entry: '2025-01-31',
    ipd_status: 'OPD'
  };
  
  try {
    console.log(`➕ Adding test patient ${testId} to MADHUBAN database ONLY...`);
    
    const { data: insertData, error: insertError } = await madhubanClient
      .from('patients')
      .insert([testPatient])
      .select();
    
    if (insertError) {
      console.log('❌ Insert failed:', insertError.message);
      console.log('💡 Try using the Madhuban website to add a patient manually instead');
      return;
    }
    
    console.log('✅ Test patient added to Madhuban database');
    console.log(`Patient ID: ${testId}`);
    console.log('Name: MADHUBAN_SEPARATION TEST');
    
    console.log('\n🔍 CRITICAL MANUAL TEST:');
    console.log('========================');
    console.log('1. Go to your VALANT website');
    console.log(`2. Search for patient ID: ${testId}`);
    console.log(`3. Search for name: MADHUBAN_SEPARATION`);
    console.log('');
    console.log('EXPECTED RESULT:');
    console.log('✅ Should NOT find this patient on Valant website');
    console.log('✅ Should ONLY find it on Madhuban website');
    console.log('');
    console.log('If you find this patient on BOTH websites:');
    console.log('🚨 There is still a configuration issue');
    console.log('');
    console.log('If you find it ONLY on Madhuban website:');
    console.log('🎉 The separation is working correctly!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  ultimateTest()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}