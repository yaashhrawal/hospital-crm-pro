// Test script to verify patient_transactions table and saving
const { createClient } = require('@supabase/supabase-js');

// Configuration
const supabaseUrl = 'https://oghqwddhojnryovmfvzc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';
const HOSPITAL_ID = '550e8400-e29b-41d4-a716-446655440000';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDatabaseConnection() {
  console.log('🔍 Testing database connection and transaction saving...\n');
  
  try {
    // 1. Test basic connection
    console.log('1️⃣ Testing basic connection...');
    const { data: test, error: testError } = await supabase
      .from('patient_transactions')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Connection failed:', testError);
      return;
    }
    console.log('✅ Basic connection successful\n');
    
    // 2. Check table columns
    console.log('2️⃣ Checking patient_transactions table structure...');
    const { data: sampleRow, error: sampleError } = await supabase
      .from('patient_transactions')
      .select('*')
      .limit(1);
    
    if (sampleRow && sampleRow.length > 0) {
      console.log('Table columns:', Object.keys(sampleRow[0]));
    }
    console.log('');
    
    // 3. Check if hospital exists
    console.log('3️⃣ Checking if hospital exists...');
    const { data: hospital, error: hospitalError } = await supabase
      .from('hospitals')
      .select('id, name')
      .eq('id', HOSPITAL_ID)
      .single();
    
    if (hospitalError) {
      console.error('❌ Hospital not found:', hospitalError);
      console.log('⚠️  This is likely the issue - hospital ID does not exist');
      
      // Try to list available hospitals
      const { data: hospitals } = await supabase
        .from('hospitals')
        .select('id, name')
        .limit(5);
      
      if (hospitals && hospitals.length > 0) {
        console.log('\nAvailable hospitals:');
        hospitals.forEach(h => console.log(`  - ${h.name}: ${h.id}`));
      }
    } else {
      console.log('✅ Hospital found:', hospital.name);
    }
    console.log('');
    
    // 4. Check if we can find any patient
    console.log('4️⃣ Checking for sample patient...');
    const { data: patient, error: patientError } = await supabase
      .from('patients')
      .select('id, first_name, last_name')
      .limit(1)
      .single();
    
    if (patientError) {
      console.error('❌ No patients found:', patientError);
    } else {
      console.log('✅ Sample patient found:', patient.first_name, patient.last_name);
      console.log('   Patient ID:', patient.id);
      
      // 5. Try to save a test transaction
      console.log('\n5️⃣ Testing transaction save...');
      const testTransaction = {
        patient_id: patient.id,
        transaction_type: 'service',
        description: 'TEST TRANSACTION - Can be deleted',
        amount: 100,
        payment_mode: 'CASH',
        doctor_id: null,
        doctor_name: null,
        status: 'PAID',
        transaction_reference: `TEST-${Date.now()}`,
        transaction_date: new Date().toISOString().split('T')[0],
        hospital_id: HOSPITAL_ID
      };
      
      console.log('Transaction data:', testTransaction);
      
      const { data: saved, error: saveError } = await supabase
        .from('patient_transactions')
        .insert([testTransaction])
        .select();
      
      if (saveError) {
        console.error('❌ Save failed:', saveError);
        console.error('Error details:', {
          message: saveError.message,
          code: saveError.code,
          details: saveError.details,
          hint: saveError.hint
        });
      } else {
        console.log('✅ Test transaction saved successfully!');
        console.log('Saved data:', saved);
        
        // Clean up test transaction
        if (saved && saved[0]) {
          const { error: deleteError } = await supabase
            .from('patient_transactions')
            .delete()
            .eq('id', saved[0].id);
          
          if (!deleteError) {
            console.log('🧹 Test transaction cleaned up');
          }
        }
      }
    }
    
    // 6. Check required columns
    console.log('\n6️⃣ Checking for required columns...');
    const { data: nullCheck } = await supabase
      .from('patient_transactions')
      .select('*')
      .is('hospital_id', null)
      .limit(5);
    
    if (nullCheck && nullCheck.length > 0) {
      console.log(`⚠️  Found ${nullCheck.length} transactions with NULL hospital_id`);
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
  
  console.log('\n✅ Test completed. Check the output above for any issues.');
}

// Run the test
testDatabaseConnection();