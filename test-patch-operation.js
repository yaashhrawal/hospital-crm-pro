// Test PATCH operation specifically for high risk data
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = 'https://oghqwddhojnryovmfvzc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

async function testPatchOperation() {
  console.log('🧪 Testing PATCH operation for high risk data...');
  
  const testPatientId = 'P001449';
  
  // Test the exact upsert logic that the app uses
  try {
    console.log('🔍 Step 1: Check if record exists...');
    const existing = await fetch(`${SUPABASE_URL}/rest/v1/medical_high_risk_data?patient_id=eq.${testPatientId}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (existing.ok) {
      const existingData = await existing.json();
      console.log(`📊 Found ${existingData.length} existing records`);
      
      if (existingData.length > 0) {
        console.log('🔄 Step 2: Update existing record...');
        
        const updateData = {
          risk_factors: ['Updated from PATCH test - ' + new Date().toISOString()],
          allergy_drug: 'Updated Test Allergy',
          notes: 'Updated via PATCH operation test'
        };
        
        const patchResponse = await fetch(`${SUPABASE_URL}/rest/v1/medical_high_risk_data?patient_id=eq.${testPatientId}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation,resolution=merge-duplicates'
          },
          body: JSON.stringify(updateData)
        });
        
        console.log(`PATCH Response: ${patchResponse.status} ${patchResponse.statusText}`);
        
        if (patchResponse.ok) {
          const patchResult = await patchResponse.json();
          console.log('✅ PATCH successful:', {
            records_updated: patchResult.length,
            updated_data: patchResult[0] ? {
              risk_factors: patchResult[0].risk_factors,
              notes: patchResult[0].notes,
              updated_at: patchResult[0].updated_at
            } : 'No data returned'
          });
        } else {
          const patchError = await patchResponse.text();
          console.log('❌ PATCH failed:', patchError);
        }
        
        // Verify the update
        console.log('✅ Step 3: Verify the update...');
        const verifyResponse = await fetch(`${SUPABASE_URL}/rest/v1/medical_high_risk_data?patient_id=eq.${testPatientId}`, {
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
          }
        });
        
        if (verifyResponse.ok) {
          const verifyData = await verifyResponse.json();
          console.log('📊 After PATCH - Records:', verifyData.length);
          if (verifyData.length > 0) {
            console.log('🔍 Latest record:', {
              risk_factors: verifyData[0].risk_factors,
              notes: verifyData[0].notes,
              updated_at: verifyData[0].updated_at
            });
          }
        }
        
      } else {
        console.log('➕ No existing records - would do INSERT');
      }
    }
    
  } catch (error) {
    console.error('💥 Test error:', error);
  }
  
  console.log('🏁 PATCH operation test completed');
}

testPatchOperation();