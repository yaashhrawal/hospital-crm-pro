// Test script to verify transaction type fix
import { createClient } from '@supabase/supabase-js';

// Configuration
const supabaseUrl = 'https://oghqwddhojnryovmfvzc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTransactionTypes() {
  console.log('🔍 Testing transaction type constraints...\n');
  
  try {
    // 1. Get a sample patient
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, first_name, last_name')
      .limit(1)
      .single();
    
    if (patientError || !patient) {
      console.error('❌ No patient found for testing');
      return;
    }
    
    console.log('✅ Using patient:', patient.first_name, patient.last_name);
    console.log('   Patient ID:', patient.id);
    console.log('');
    
    // 2. Test valid transaction types (uppercase)
    const validTypes = ['SERVICE', 'ADMISSION_FEE', 'CONSULTATION', 'LAB_TEST', 'MEDICINE'];
    
    console.log('Testing VALID transaction types (uppercase):');
    for (const type of validTypes) {
      const testTransaction = {
        patient_id: patient.id,
        transaction_type: type,
        description: `TEST ${type} - Can be deleted`,
        amount: 100,
        payment_mode: 'CASH',
        status: 'PAID',
        transaction_reference: `TEST-${type}-${Date.now()}`,
        transaction_date: new Date().toISOString().split('T')[0]
      };
      
      const { data, error } = await supabase
        .from('patient_transactions')
        .insert([testTransaction])
        .select();
      
      if (error) {
        console.log(`  ❌ ${type}: Failed - ${error.message}`);
      } else {
        console.log(`  ✅ ${type}: Success`);
        // Clean up
        if (data && data[0]) {
          await supabase.from('patient_transactions').delete().eq('id', data[0].id);
        }
      }
    }
    
    console.log('\nTesting INVALID transaction types (lowercase):');
    // 3. Test invalid transaction types (lowercase - should fail)
    const invalidTypes = ['service', 'admission', 'consultation'];
    
    for (const type of invalidTypes) {
      const testTransaction = {
        patient_id: patient.id,
        transaction_type: type,
        description: `TEST ${type} - Should fail`,
        amount: 100,
        payment_mode: 'CASH',
        status: 'PAID',
        transaction_reference: `TEST-${type}-${Date.now()}`,
        transaction_date: new Date().toISOString().split('T')[0]
      };
      
      const { data, error } = await supabase
        .from('patient_transactions')
        .insert([testTransaction])
        .select();
      
      if (error) {
        console.log(`  ❌ ${type}: Failed as expected - ${error.message}`);
      } else {
        console.log(`  ⚠️  ${type}: Unexpectedly succeeded!`);
        // Clean up
        if (data && data[0]) {
          await supabase.from('patient_transactions').delete().eq('id', data[0].id);
        }
      }
    }
    
    console.log('\n📋 Summary:');
    console.log('- Transaction types MUST be uppercase');
    console.log('- Valid types: ENTRY_FEE, CONSULTATION, LAB_TEST, XRAY, MEDICINE,');
    console.log('              PROCEDURE, ADMISSION_FEE, DAILY_CHARGE, SERVICE, REFUND, DISCOUNT');
    console.log('- IPD deposits should use: ADMISSION_FEE');
    console.log('- IPD bills should use: SERVICE or DAILY_CHARGE');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testTransactionTypes();