// Test script to check if the medical data API is working
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Direct API test
const SUPABASE_URL = 'https://oghqwddhojnryovmfvzc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

async function testSaveAPI() {
  console.log('🧪 Testing Complete Patient Record Save API...');
  
  const testPatientId = 'P001449'; // Use a real patient ID from your database
  
  const testData = {
    patient_id: testPatientId,
    risk_factors: ['Test Risk Factor'],
    allergy_drug: 'Test Drug Allergy',
    notes: 'Test data from API test script - ' + new Date().toISOString()
  };
  
  try {
    // Test POST (insert)
    console.log('📤 Testing POST (insert) to medical_high_risk_data...');
    const response = await fetch(`${SUPABASE_URL}/rest/v1/medical_high_risk_data`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testData)
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ POST Error:', errorText);
      
      // Test if record already exists, then try PATCH
      console.log('🔍 Checking if record exists...');
      const existingResponse = await fetch(`${SUPABASE_URL}/rest/v1/medical_high_risk_data?patient_id=eq.${testPatientId}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        }
      });
      
      if (existingResponse.ok) {
        const existingData = await existingResponse.json();
        console.log('📋 Existing records found:', existingData.length);
        
        if (existingData.length > 0) {
          console.log('🔄 Testing PATCH (update)...');
          const patchResponse = await fetch(`${SUPABASE_URL}/rest/v1/medical_high_risk_data?patient_id=eq.${testPatientId}`, {
            method: 'PATCH',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation,resolution=merge-duplicates'
            },
            body: JSON.stringify({
              notes: 'Updated test data - ' + new Date().toISOString(),
              allergy_drug: 'Updated Test Drug Allergy'
            })
          });
          
          console.log(`PATCH Response status: ${patchResponse.status} ${patchResponse.statusText}`);
          
          if (patchResponse.ok) {
            const patchResult = await patchResponse.json();
            console.log('✅ PATCH Success:', patchResult);
          } else {
            const patchError = await patchResponse.text();
            console.error('❌ PATCH Error:', patchError);
          }
        }
      }
      
    } else {
      const result = await response.json();
      console.log('✅ POST Success:', result);
    }
    
    // Test GET to verify
    console.log('📥 Testing GET to verify data...');
    const getResponse = await fetch(`${SUPABASE_URL}/rest/v1/medical_high_risk_data?patient_id=eq.${testPatientId}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      }
    });
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ GET Success:', getData);
      console.log(`📊 Total records for patient ${testPatientId}:`, getData.length);
    } else {
      console.error('❌ GET Error:', await getResponse.text());
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
  
  console.log('🏁 API test completed');
}

testSaveAPI().catch(console.error);