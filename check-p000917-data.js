// Check what data exists for patient P000917
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = 'https://oghqwddhojnryovmfvzc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

async function checkPatientData(patientId) {
  console.log(`🔍 Checking all data for patient: ${patientId}`);
  
  const tables = [
    'medical_high_risk_data',
    'medical_examination_data',
    'medical_investigation_data',
    'medical_diagnosis_data',
    'medical_prescription_data',
    'medical_record_summary_data'
  ];
  
  for (const table of tables) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?patient_id=eq.${patientId}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`\n📊 ${table}:`);
        console.log(`   Records found: ${data.length}`);
        
        if (data.length > 0) {
          console.log(`   First record:`, data[0]);
          
          // Special handling for high risk data
          if (table === 'medical_high_risk_data') {
            console.log(`   🎯 High Risk Details:`);
            console.log(`      risk_factors: ${JSON.stringify(data[0].risk_factors)}`);
            console.log(`      allergy_drug: ${data[0].allergy_drug}`);
            console.log(`      allergy_food: ${data[0].allergy_food}`);
            console.log(`      current_medications: ${data[0].current_medications}`);
            console.log(`      surgical_history: ${data[0].surgical_history}`);
            console.log(`      family_history: ${data[0].family_history}`);
            console.log(`      notes: ${data[0].notes}`);
          }
        } else {
          console.log(`   ❌ No data found`);
        }
      } else {
        console.log(`   ❌ Failed to fetch: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`   💥 Error: ${error.message}`);
    }
  }
  
  // Check if this patient has any Complete Patient Record data at all
  console.log(`\n📋 Summary for ${patientId}:`);
  
  try {
    const allTables = await Promise.all(tables.map(async (table) => {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?patient_id=eq.${patientId}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        return { table, count: data.length, hasData: data.length > 0 };
      }
      return { table, count: 0, hasData: false };
    }));
    
    const hasAnyData = allTables.some(t => t.hasData);
    console.log(`   Has Complete Patient Record data: ${hasAnyData ? '✅' : '❌'}`);
    
    allTables.forEach(({ table, count, hasData }) => {
      console.log(`   ${hasData ? '✅' : '❌'} ${table}: ${count} records`);
    });
    
  } catch (error) {
    console.log(`   💥 Summary error: ${error.message}`);
  }
}

// Check P000917
checkPatientData('P000917');