#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Test with service role keys for better access
const valantClient = createClient(
  'https://oghqwddhojnryovmfvzc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzExNDU0MSwiZXhwIjoyMDY4NjkwNTQxfQ.NYr_Q6dLcxeKMqKA3h4GN92xkHjLfZClVKRd30Epmvg'
);

const madhubanClient = createClient(
  'https://btoeupnfqkioxigrheyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b2V1cG5mcWtpb3hpZ3JoZXlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAxODQyNCwiZXhwIjoyMDY5NTk0NDI0fQ.BWDIB5vzXl6J7PasV51yOa-rAEt_QxK8x9VoGcfkT5U'
);

async function advancedDebug() {
  console.log('🔍 ADVANCED DATABASE SEPARATION DEBUG\n');
  
  // Test 1: Add unique test patient to Valant
  console.log('🧪 TEST 1: Adding unique test patient to VALANT...');
  const valantTestPatient = {
    patient_id: `VALANT_TEST_${Date.now()}`,
    first_name: 'VALANT',
    last_name: 'TEST',
    age: '99',
    gender: 'M',
    phone: '1111111111',
    address: 'Valant Test Address',
    emergency_contact_name: 'Test',
    emergency_contact_phone: '1111111111',
    hospital_id: '550e8400-e29b-41d4-a716-446655440000',
    has_reference: false,
    assigned_department: 'TEST',
    assigned_doctor: 'TEST',
    prefix: 'Mr',
    is_active: true,
    date_of_entry: new Date().toISOString().split('T')[0],
    ipd_status: 'OPD'
  };
  
  const { data: valantInsert, error: valantError } = await valantClient
    .from('patients')
    .insert([valantTestPatient])
    .select();
    
  if (valantError) {
    console.log('❌ Error adding to Valant:', valantError.message);
  } else {
    console.log('✅ Added test patient to Valant:', valantInsert[0]?.patient_id);
  }
  
  // Test 2: Add unique test patient to Madhuban
  console.log('\n🧪 TEST 2: Adding unique test patient to MADHUBAN...');
  const madhubanTestPatient = {
    patient_id: `MADHUBAN_TEST_${Date.now()}`,
    first_name: 'MADHUBAN',
    last_name: 'TEST',
    age: '88',
    gender: 'F',
    phone: '2222222222',
    address: 'Madhuban Test Address',
    emergency_contact_name: 'Test',
    emergency_contact_phone: '2222222222',
    hospital_id: '550e8400-e29b-41d4-a716-446655440000',
    has_reference: false,
    assigned_department: 'TEST',
    assigned_doctor: 'TEST',
    prefix: 'Mrs',
    is_active: true,
    date_of_entry: new Date().toISOString().split('T')[0],
    ipd_status: 'OPD'
  };
  
  const { data: madhubanInsert, error: madhubanError } = await madhubanClient
    .from('patients')
    .insert([madhubanTestPatient])
    .select();
    
  if (madhubanError) {
    console.log('❌ Error adding to Madhuban:', madhubanError.message);
  } else {
    console.log('✅ Added test patient to Madhuban:', madhubanInsert[0]?.patient_id);
  }
  
  // Wait for propagation
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Test 3: Check if Valant patient appears in Madhuban
  console.log('\n🔍 TEST 3: Checking if VALANT patient appears in MADHUBAN...');
  const { data: valantInMadhuban } = await madhubanClient
    .from('patients')
    .select('*')
    .eq('patient_id', valantTestPatient.patient_id);
    
  if (valantInMadhuban && valantInMadhuban.length > 0) {
    console.log('🚨 CRITICAL: Valant patient found in Madhuban database!');
    console.log('This means databases are somehow connected!');
  } else {
    console.log('✅ Valant patient NOT found in Madhuban (correct)');
  }
  
  // Test 4: Check if Madhuban patient appears in Valant
  console.log('\n🔍 TEST 4: Checking if MADHUBAN patient appears in VALANT...');
  const { data: madhubanInValant } = await valantClient
    .from('patients')
    .select('*')
    .eq('patient_id', madhubanTestPatient.patient_id);
    
  if (madhubanInValant && madhubanInValant.length > 0) {
    console.log('🚨 CRITICAL: Madhuban patient found in Valant database!');
    console.log('This means databases are somehow connected!');
  } else {
    console.log('✅ Madhuban patient NOT found in Valant (correct)');
  }
  
  // Test 5: Get all patients from both databases
  console.log('\n📊 TEST 5: Getting patient counts...');
  const { count: valantCount } = await valantClient
    .from('patients')
    .select('*', { count: 'exact', head: true });
    
  const { count: madhubanCount } = await madhubanClient
    .from('patients')
    .select('*', { count: 'exact', head: true });
    
  console.log(`Valant database patients: ${valantCount}`);
  console.log(`Madhuban database patients: ${madhubanCount}`);
  
  // Clean up test data
  console.log('\n🧹 Cleaning up test data...');
  await valantClient.from('patients').delete().eq('patient_id', valantTestPatient.patient_id);
  await madhubanClient.from('patients').delete().eq('patient_id', madhubanTestPatient.patient_id);
  
  console.log('\n🎯 CONCLUSION:');
  console.log('If test patients appeared in both databases, the issue is at database level.');
  console.log('If they stayed separate, the issue is at frontend/deployment level.');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  advancedDebug()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}