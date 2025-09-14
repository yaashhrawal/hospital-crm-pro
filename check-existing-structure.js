// Check exactly what medical tables exist and their structure
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = 'https://oghqwddhojnryovmfvzc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

async function checkExistingTables() {
  console.log('🔍 Checking existing medical table structure...');
  
  const tablesToCheck = [
    'medical_high_risk_data',
    'medical_examination_data', 
    'medical_investigation_data',
    'medical_diagnosis_data',
    'medical_prescription_data',
    'medical_record_summary_data',
    'patient_chief_complaints',
    'medical_consent_data',
    'medical_medication_data',
    'medical_vital_signs_data'
  ];
  
  for (const table of tablesToCheck) {
    try {
      console.log(`\n📋 Checking table: ${table}`);
      
      // Try to access the table
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?limit=1`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${table} - EXISTS and ACCESSIBLE`);
        
        if (data.length > 0) {
          console.log(`   📊 Has data (${data.length} records)`);
          console.log(`   🔑 Columns:`, Object.keys(data[0]).join(', '));
        } else {
          console.log(`   📭 Empty table`);
          
          // Try a test insert to check permissions
          const testData = { patient_id: 'P001449' };
          if (table === 'patient_chief_complaints') {
            testData.complaint = 'Test';
          } else if (table === 'medical_diagnosis_data') {
            testData.primary_diagnosis = 'Test';
          }
          
          const insertResponse = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
            method: 'POST',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(testData)
          });
          
          if (insertResponse.ok) {
            console.log(`   ✅ INSERT permission works`);
            // Clean up
            const insertResult = await insertResponse.json();
            if (insertResult.length > 0) {
              await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${insertResult[0].id}`, {
                method: 'DELETE',
                headers: {
                  'apikey': SUPABASE_ANON_KEY,
                  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
                }
              });
            }
          } else {
            const error = await insertResponse.text();
            console.log(`   ❌ INSERT blocked:`, error.substring(0, 100));
          }
        }
      } else {
        console.log(`❌ ${table} - NOT ACCESSIBLE (${response.status})`);
        const error = await response.text();
        console.log(`   Error:`, error.substring(0, 100));
      }
      
    } catch (error) {
      console.log(`💥 ${table} - ERROR:`, error.message);
    }
  }
  
  console.log('\n🎯 SUMMARY: Use only the tables marked as "EXISTS and ACCESSIBLE" with working INSERT permissions');
}

checkExistingTables();