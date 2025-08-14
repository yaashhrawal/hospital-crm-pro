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

async function finalSeparationTest() {
  console.log('🎯 FINAL SEPARATION TEST');
  console.log('========================\n');
  
  const timestamp = Date.now().toString().slice(-6);
  
  // Create unique test patients
  const valantPatient = {
    patient_id: `V${timestamp}`,
    first_name: 'VALANT_ONLY',
    last_name: 'TEST',
    age: '30',
    gender: 'M',
    phone: '1111111111',
    address: 'Valant Test',
    emergency_contact_name: 'Test',
    emergency_contact_phone: '1111111111',
    hospital_id: '550e8400-e29b-41d4-a716-446655440000',
    has_reference: false,
    assigned_department: 'TEST',
    assigned_doctor: 'TEST',
    prefix: 'Mr',
    is_active: true,
    date_of_entry: '2025-01-31',
    ipd_status: 'OPD'
  };
  
  const madhubanPatient = {
    patient_id: `M${timestamp}`,
    first_name: 'MADHUBAN_ONLY',
    last_name: 'TEST',
    age: '25',
    gender: 'F',
    phone: '2222222222',
    address: 'Madhuban Test',
    emergency_contact_name: 'Test',
    emergency_contact_phone: '2222222222',
    hospital_id: '550e8400-e29b-41d4-a716-446655440000',
    has_reference: false,
    assigned_department: 'TEST',
    assigned_doctor: 'TEST',
    prefix: 'Mrs',
    is_active: true,
    date_of_entry: '2025-01-31',
    ipd_status: 'OPD'
  };
  
  try {
    console.log('➕ Adding VALANT_ONLY patient to Valant database...');
    const { error: valantError } = await valantClient
      .from('patients')
      .insert([valantPatient]);
    
    if (valantError) {
      console.log('❌ Error adding to Valant:', valantError.message);
      return;
    }
    
    console.log('➕ Adding MADHUBAN_ONLY patient to Madhuban database...');
    const { error: madhubanError } = await madhubanClient
      .from('patients')
      .insert([madhubanPatient]);
    
    if (madhubanError) {
      console.log('❌ Error adding to Madhuban:', madhubanError.message);
      return;
    }
    
    console.log('✅ Both test patients added successfully');
    
    // Wait for potential propagation
    console.log('\n⏳ Waiting 3 seconds for any potential data sync...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🔍 CROSS-DATABASE CHECK:');
    console.log('=======================');
    
    // Check if Valant patient appears in Madhuban
    const { data: valantInMadhuban } = await madhubanClient
      .from('patients')
      .select('*')
      .eq('patient_id', valantPatient.patient_id);
    
    // Check if Madhuban patient appears in Valant  
    const { data: madhubanInValant } = await valantClient
      .from('patients')
      .select('*')
      .eq('patient_id', madhubanPatient.patient_id);
    
    console.log(`Valant patient in Madhuban DB: ${valantInMadhuban?.length || 0} found`);
    console.log(`Madhuban patient in Valant DB: ${madhubanInValant?.length || 0} found`);
    
    if ((valantInMadhuban?.length || 0) === 0 && (madhubanInValant?.length || 0) === 0) {
      console.log('\n🎉 ✅ DATABASES ARE PERFECTLY SEPARATED!');
      console.log('✅ No cross-database data leakage detected');
      console.log('✅ Each patient only exists in its intended database');
    } else {
      console.log('\n🚨 ❌ DATA LEAKAGE DETECTED!');
      console.log('❌ Patients are appearing in both databases');
    }
    
    console.log('\n📋 MANUAL VERIFICATION:');
    console.log('=======================');
    console.log(`1. Go to VALANT website and search for: V${timestamp}`);
    console.log(`   - Should find: VALANT_ONLY TEST`);
    console.log(`   - Should NOT find: M${timestamp}`);
    console.log('');
    console.log(`2. Go to MADHUBAN website and search for: M${timestamp}`);
    console.log(`   - Should find: MADHUBAN_ONLY TEST`);
    console.log(`   - Should NOT find: V${timestamp}`);
    console.log('');
    console.log('If both patients appear on both websites = Frontend issue');
    console.log('If they appear only on their respective websites = Working correctly');
    
    // Don't clean up - leave for manual verification
    console.log(`\n⚠️  Test patients V${timestamp} and M${timestamp} left for manual verification`);
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  finalSeparationTest()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}