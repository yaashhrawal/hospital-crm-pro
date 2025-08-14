#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

const valantClient = createClient(
  'https://oghqwddhojnryovmfvzc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzExNDU0MSwiZXhwIjoyMDY4NjkwNTQxfQ.NYr_Q6dLcxeKMqKA3h4GN92xkHjLfZClVKRd30Epmvg'
);

const madhubanClient = createClient(
  'https://btoeupnfqkioxigrheyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b2V1cG5mcWtpb3hpZ3JoZXlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAxODQyNCwiZXhwIjoyMDY5NTk0NDI0fQ.BWDIB5vzXl6J7PasV51yOa-rAEt_QxK8x9VoGcfkT5U'
);

async function simpleSeparationTest() {
  console.log('🎯 SIMPLE SEPARATION TEST');
  console.log('=========================\n');
  
  const timestamp = Date.now().toString().slice(-6);
  
  // Simple test patients with valid constraints
  const valantPatient = {
    patient_id: `V${timestamp}`,
    first_name: 'VALANT_ONLY',
    last_name: 'TEST',
    age: '30',
    gender: 'Male',
    phone: '1111111111',
    address: 'Valant Test',
    emergency_contact_name: 'Test',
    emergency_contact_phone: '1111111111',
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
    console.log('➕ Adding test patient to VALANT database...');
    const { error: valantError } = await valantClient
      .from('patients')
      .insert([valantPatient]);
    
    if (valantError) {
      console.log('❌ Error adding to Valant:', valantError.message);
      // Try with minimal data
      const minimalPatient = {
        patient_id: `V${timestamp}`,
        first_name: 'VALANT_TEST',
        last_name: 'SEPARATION',
        age: '30',
        gender: 'Male',
        phone: '1111111111',
        hospital_id: '550e8400-e29b-41d4-a716-446655440000'
      };
      
      const { error: minimalError } = await valantClient
        .from('patients')
        .insert([minimalPatient]);
        
      if (minimalError) {
        console.log('❌ Minimal insert also failed:', minimalError.message);
        return;
      }
      console.log('✅ Minimal patient added to Valant');
    } else {
      console.log('✅ Full patient added to Valant');
    }
    
    // Wait for potential propagation
    console.log('\n⏳ Waiting 2 seconds...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if it appears in Madhuban database
    console.log('🔍 Checking if Valant patient appears in Madhuban database...');
    const { data: crossCheck } = await madhubanClient
      .from('patients')
      .select('*')
      .eq('patient_id', `V${timestamp}`);
    
    console.log('\n📊 RESULT:');
    console.log(`Patient V${timestamp} found in Madhuban database: ${crossCheck?.length || 0}`);
    
    if ((crossCheck?.length || 0) === 0) {
      console.log('\n🎉 ✅ DATABASES ARE SEPARATED!');
      console.log('✅ Patient only exists in Valant database');
      console.log('✅ No cross-database data sharing');
    } else {
      console.log('\n🚨 ❌ DATABASES ARE CONNECTED!');
      console.log('❌ Patient appeared in both databases');
    }
    
    console.log('\n🔍 MANUAL VERIFICATION:');
    console.log(`Go to both websites and search for patient: V${timestamp}`);
    console.log('- If it appears ONLY on Valant website = Working correctly');
    console.log('- If it appears on BOTH websites = Still sharing data');
    
    console.log(`\n⚠️  Test patient V${timestamp} left for your manual verification`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  simpleSeparationTest()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}