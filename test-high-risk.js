// Test high risk data saving specifically
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = 'https://oghqwddhojnryovmfvzc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

async function testHighRiskData() {
  console.log('🧪 Testing High Risk Data Saving...');
  
  const testPatientId = 'P001449';
  
  // First check existing data
  console.log('📥 Checking existing high risk data...');
  const getResponse = await fetch(`${SUPABASE_URL}/rest/v1/medical_high_risk_data?patient_id=eq.${testPatientId}`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  
  if (getResponse.ok) {
    const existingData = await getResponse.json();
    console.log(`📊 Found ${existingData.length} existing records`);
    if (existingData.length > 0) {
      console.log('🔍 Existing record:', {
        id: existingData[0].id,
        risk_factors: existingData[0].risk_factors,
        notes: existingData[0].notes
      });
    }
  }
  
  // Now test insert vs update
  const testData = {
    patient_id: testPatientId,
    risk_factors: ['Test from API - ' + new Date().toISOString()],
    allergy_drug: 'Test Allergy',
    notes: 'Testing high risk save functionality'
  };
  
  try {
    // Test 1: Try INSERT first (new record)
    console.log('📤 Testing INSERT (new record)...');
    const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/medical_high_risk_data`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testData)
    });
    
    console.log(`Insert Response: ${insertResponse.status} ${insertResponse.statusText}`);
    
    if (insertResponse.ok) {
      const insertResult = await insertResponse.json();
      console.log('✅ INSERT successful:', insertResult.length, 'records created');
      
      // Clean up - delete the test record
      if (insertResult.length > 0) {
        await fetch(`${SUPABASE_URL}/rest/v1/medical_high_risk_data?id=eq.${insertResult[0].id}`, {
          method: 'DELETE',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        console.log('🧹 Cleaned up test record');
      }
    } else {
      const insertError = await insertResponse.text();
      console.log('❌ INSERT failed:', insertError);
      
      // If insert failed, try UPDATE
      console.log('🔄 Testing UPDATE (existing record)...');
      const updateResponse = await fetch(`${SUPABASE_URL}/rest/v1/medical_high_risk_data?patient_id=eq.${testPatientId}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          risk_factors: ['Updated test - ' + new Date().toISOString()],
          notes: 'Updated from test script'
        })
      });
      
      console.log(`Update Response: ${updateResponse.status} ${updateResponse.statusText}`);
      
      if (updateResponse.ok) {
        const updateResult = await updateResponse.json();
        console.log('✅ UPDATE successful:', updateResult.length, 'records updated');
      } else {
        const updateError = await updateResponse.text();
        console.log('❌ UPDATE failed:', updateError);
      }
    }
    
    // Final check - show current data
    console.log('📥 Final check of data...');
    const finalResponse = await fetch(`${SUPABASE_URL}/rest/v1/medical_high_risk_data?patient_id=eq.${testPatientId}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (finalResponse.ok) {
      const finalData = await finalResponse.json();
      console.log(`📊 Final count: ${finalData.length} records`);
      if (finalData.length > 0) {
        console.log('🔍 Latest record:', {
          risk_factors: finalData[0].risk_factors,
          notes: finalData[0].notes,
          updated_at: finalData[0].updated_at
        });
      }
    }
    
  } catch (error) {
    console.error('💥 Test error:', error);
  }
  
  console.log('🏁 High Risk Data test completed');
}

testHighRiskData();