#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';

// Create test clients with different identifiers
const valantClient = createClient(
  'https://oghqwddhojnryovmfvzc.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzExNDU0MSwiZXhwIjoyMDY4NjkwNTQxfQ.NYr_Q6dLcxeKMqKA3h4GN92xkHjLfZClVKRd30Epmvg'
);

const madhubanClient = createClient(
  'https://btoeupnfqkioxigrheyp.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0b2V1cG5mcWtpb3hpZ3JoZXlwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAxODQyNCwiZXhwIjoyMDY5NTk0NDI0fQ.BWDIB5vzXl6J7PasV51yOa-rAEt_QxK8x9VoGcfkT5U'
);

async function nuclearDebug() {
  console.log('🚨 NUCLEAR DEBUG - FINDING THE ROOT CAUSE\n');
  
  // Add a unique test record to Madhuban with shorter ID
  const uniqueId = `MAD${Date.now().toString().slice(-8)}`;
  console.log(`🧪 Adding test patient with ID: ${uniqueId} to MADHUBAN ONLY`);
  
  const testPatient = {
    patient_id: uniqueId,
    first_name: 'MADHUBAN',
    last_name: 'ISOLATION_TEST',
    age: '25',
    gender: 'M',
    phone: '9999999999',
    address: 'Madhuban Test',
    emergency_contact_name: 'Test',
    emergency_contact_phone: '9999999999',
    hospital_id: '550e8400-e29b-41d4-a716-446655440000',
    has_reference: false,
    assigned_department: 'TEST',
    assigned_doctor: 'TEST',
    prefix: 'Mr',
    is_active: true,
    date_of_entry: '2025-01-31',
    ipd_status: 'OPD'
  };
  
  const { data: insertData, error: insertError } = await madhubanClient
    .from('patients')
    .insert([testPatient])
    .select();
    
  if (insertError) {
    console.log('❌ Failed to insert test patient:', insertError.message);
    return;
  }
  
  console.log('✅ Test patient added to Madhuban');
  
  // Wait for any potential propagation
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Check both databases
  console.log('\n🔍 Checking VALANT database for test patient...');
  const { data: valantCheck } = await valantClient
    .from('patients')
    .select('*')
    .eq('patient_id', uniqueId);
    
  console.log('\n🔍 Checking MADHUBAN database for test patient...');
  const { data: madhubanCheck } = await madhubanClient
    .from('patients')
    .select('*')
    .eq('patient_id', uniqueId);
  
  console.log('\n📊 RESULTS:');
  console.log(`Found in VALANT: ${valantCheck?.length || 0} records`);
  console.log(`Found in MADHUBAN: ${madhubanCheck?.length || 0} records`);
  
  if (valantCheck && valantCheck.length > 0) {
    console.log('🚨 CRITICAL PROBLEM: Test patient appeared in VALANT database!');
    console.log('This means there is database replication or connection mixing!');
  } else {
    console.log('✅ Test patient only in Madhuban (correct)');
  }
  
  // Check if you're seeing this patient in the Valant frontend
  console.log('\n🎯 CRITICAL TEST:');
  console.log(`1. Go to your VALANT website (hospital-crm-pro.vercel.app)`);
  console.log(`2. Look for patient ID: ${uniqueId}`);
  console.log(`3. If you see this patient, the problem is at Vercel deployment level`);
  console.log(`4. If you don't see this patient, the databases are properly separated`);
  
  console.log('\n🔍 DEBUGGING CHECKLIST:');
  console.log('If patient appears in Valant frontend but not in Valant database:');
  console.log('- Vercel projects are connected to wrong repositories');
  console.log('- Environment variables are being overridden somewhere');
  console.log('- There is caching/CDN issue');
  console.log('- Both projects are deploying the same code');
  
  // Don't clean up - leave test patient for manual verification
  console.log(`\n⚠️  Test patient ${uniqueId} left in Madhuban for manual verification`);
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  nuclearDebug()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}