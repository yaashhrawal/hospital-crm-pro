// Check patient_chief_complaints table structure
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = 'https://oghqwddhojnryovmfvzc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

async function checkTable() {
  console.log('🔍 Checking patient_chief_complaints table...');
  
  try {
    // Check if table exists and get sample data
    const response = await fetch(`${SUPABASE_URL}/rest/v1/patient_chief_complaints?limit=1`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Table exists');
      console.log('📊 Sample data:', JSON.stringify(data, null, 2));
      
      if (data.length > 0) {
        console.log('🔍 Column structure:');
        Object.keys(data[0]).forEach(key => {
          console.log(`  - ${key}: ${typeof data[0][key]} (${data[0][key]})`);
        });
      } else {
        console.log('📭 Table is empty');
        
        // Try to insert a minimal record to see what columns are required
        console.log('🧪 Testing minimal insert to discover required columns...');
        const testInsert = await fetch(`${SUPABASE_URL}/rest/v1/patient_chief_complaints`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({
            patient_id: 'P001449',
            complaint: 'Test complaint'
          })
        });
        
        if (testInsert.ok) {
          const insertResult = await testInsert.json();
          console.log('✅ Minimal insert worked:', insertResult);
          
          // Clean up test record
          if (insertResult.length > 0) {
            await fetch(`${SUPABASE_URL}/rest/v1/patient_chief_complaints?id=eq.${insertResult[0].id}`, {
              method: 'DELETE',
              headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
              }
            });
            console.log('🧹 Cleaned up test record');
          }
        } else {
          const error = await testInsert.text();
          console.log('❌ Insert failed:', error);
        }
      }
      
    } else {
      const error = await response.text();
      console.log('❌ Table does not exist or is not accessible:', error);
    }
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkTable();