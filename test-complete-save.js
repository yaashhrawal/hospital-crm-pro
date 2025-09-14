// Test Complete Patient Record saving end-to-end
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = 'https://oghqwddhojnryovmfvzc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

async function testCompleteSave() {
  console.log('🧪 Testing Complete Patient Record Save End-to-End...');
  
  const testPatientId = 'P001449';
  const testData = {
    highRisk: {
      risk_factors: ['Diabetes', 'Hypertension'],
      allergy_drug: 'Penicillin',
      notes: 'Test high risk data - ' + new Date().toISOString()
    },
    chiefComplaints: [
      {
        complaint: 'Chest Pain',
        duration: '2 days',
        period: '2 D',
        performing_doctor: 'Dr. Test',
        notes: 'Severe chest pain'
      }
    ],
    examination: {
      general_appearance: 'Patient appears comfortable',
      vital_signs: 'BP: 120/80, HR: 72',
      notes: 'Normal examination'
    },
    investigation: {
      laboratory_tests: 'CBC, LFT, RFT',
      imaging_studies: 'Chest X-ray',
      notes: 'All normal'
    },
    diagnosis: {
      primary_diagnosis: 'Acute Gastritis',
      notes: 'Patient responded well to treatment'
    },
    prescription: {
      medications: [
        { medicineName: 'Pantoprazole', dosage: '40mg', frequency: 'Once daily' }
      ]
    },
    summary: {
      summary: 'Complete test record',
      created_by: 'test_system'
    }
  };
  
  try {
    // Test saving each component
    console.log('💾 Testing individual saves...');
    
    // 1. High Risk Data
    const highRiskResult = await fetch(`${SUPABASE_URL}/rest/v1/medical_high_risk_data`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ patient_id: testPatientId, ...testData.highRisk })
    });
    
    if (highRiskResult.ok) {
      console.log('✅ High Risk Data saved');
    } else {
      console.log('❌ High Risk Data failed:', await highRiskResult.text());
    }
    
    // 2. Chief Complaints
    const complaintsResult = await fetch(`${SUPABASE_URL}/rest/v1/patient_chief_complaints`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(testData.chiefComplaints.map(c => ({ 
        ...c, 
        patient_id: testPatientId,
        medical_record_id: crypto.randomUUID()
      })))
    });
    
    if (complaintsResult.ok) {
      console.log('✅ Chief Complaints saved');
    } else {
      console.log('❌ Chief Complaints failed:', await complaintsResult.text());
    }
    
    // 3. Examination Data
    const examinationResult = await fetch(`${SUPABASE_URL}/rest/v1/medical_examination_data`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ patient_id: testPatientId, ...testData.examination })
    });
    
    if (examinationResult.ok) {
      console.log('✅ Examination Data saved');
    } else {
      console.log('❌ Examination Data failed:', await examinationResult.text());
    }
    
    // Now test retrieval
    console.log('📥 Testing data retrieval...');
    
    const retrievalTests = [
      'medical_high_risk_data',
      'patient_chief_complaints',
      'medical_examination_data'
    ];
    
    for (const table of retrievalTests) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?patient_id=eq.${testPatientId}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ ${table}: ${data.length} records found`);
      } else {
        console.log(`❌ ${table}: Failed to retrieve`);
      }
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error);
  }
  
  console.log('🏁 Complete Patient Record test finished');
}

testCompleteSave().catch(console.error);