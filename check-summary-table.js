// Check medical_record_summary_data table structure
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = 'https://oghqwddhojnryovmfvzc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

async function checkTableStructure() {
  console.log('🔍 Checking medical_record_summary_data table structure...');
  
  try {
    // Try to get any record to see the structure
    const response = await fetch(`${SUPABASE_URL}/rest/v1/medical_record_summary_data?limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Table exists. Record count:', data.length);
      if (data.length > 0) {
        console.log('📊 Table columns:', Object.keys(data[0]));
        console.log('🔍 First record:', data[0]);
      } else {
        console.log('📊 Table is empty');
        
        // Try to insert a test record to see what columns are accepted
        console.log('🧪 Testing with minimal data...');
        const testResponse = await fetch(`${SUPABASE_URL}/rest/v1/medical_record_summary_data`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            patient_id: 'TEST123',
            summary: 'Test summary'
          })
        });
        
        if (testResponse.ok) {
          const testData = await testResponse.json();
          console.log('✅ Test record created. Columns:', Object.keys(testData[0]));
          
          // Clean up
          await fetch(`${SUPABASE_URL}/rest/v1/medical_record_summary_data?patient_id=eq.TEST123`, {
            method: 'DELETE',
            headers: {
              'apikey': SUPABASE_ANON_KEY,
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
          });
          console.log('🧹 Cleaned up test record');
        } else {
          const errorText = await testResponse.text();
          console.log('❌ Test insert failed:', errorText);
        }
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Failed to access table:', response.status, errorText);
    }
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkTableStructure();