// Test data structure specifically for high risk data
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = 'https://oghqwddhojnryovmfvzc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

async function testDataStructure() {
  console.log('🔍 Testing data structure for P001449...');
  
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/medical_high_risk_data?patient_id=eq.P001449`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('📊 High Risk Data Structure:');
      console.log('Record count:', data.length);
      
      if (data.length > 0) {
        console.log('First record structure:', JSON.stringify(data[0], null, 2));
        console.log('risk_factors type:', typeof data[0].risk_factors);
        console.log('risk_factors value:', data[0].risk_factors);
        console.log('notes value:', data[0].notes);
      }
    } else {
      console.log('❌ Error:', response.status, response.statusText);
    }
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

testDataStructure();