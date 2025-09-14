// Debug high risk data loading in prescription templates
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = 'https://oghqwddhojnryovmfvzc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

// Simulate what completePatientRecordService.getCompletePatientRecord does
async function debugCompletePatientRecord(patientId) {
  console.log(`🔍 Debug: Loading Complete Patient Record for ${patientId}...`);
  
  try {
    // Step 1: Get high risk data directly
    console.log('📊 Step 1: Getting high risk data...');
    const highRiskResponse = await fetch(`${SUPABASE_URL}/rest/v1/medical_high_risk_data?patient_id=eq.${patientId}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    let highRiskData = null;
    if (highRiskResponse.ok) {
      const highRiskArray = await highRiskResponse.json();
      highRiskData = highRiskArray[0] || null;
      console.log('✅ High Risk Data:', {
        found: !!highRiskData,
        record: highRiskData
      });
    } else {
      console.log('❌ High Risk fetch failed:', highRiskResponse.status);
    }
    
    // Step 2: Get other medical data
    const tables = [
      'medical_examination_data',
      'medical_investigation_data', 
      'medical_diagnosis_data',
      'medical_prescription_data',
      'medical_record_summary_data'
    ];
    
    const otherData = {};
    for (const table of tables) {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/${table}?patient_id=eq.${patientId}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        otherData[table] = data[0] || null;
        console.log(`✅ ${table}:`, !!otherData[table]);
      }
    }
    
    // Step 3: Simulate what getCompletePatientRecord returns
    const result = {
      highRisk: highRiskData,
      chiefComplaints: [], // Would be extracted from summary
      examination: otherData['medical_examination_data'],
      investigation: otherData['medical_investigation_data'],
      diagnosis: otherData['medical_diagnosis_data'],
      prescription: otherData['medical_prescription_data'],
      summary: otherData['medical_record_summary_data']
    };
    
    console.log('📋 Final Complete Patient Record structure:', {
      hasHighRisk: !!result.highRisk,
      hasExamination: !!result.examination,
      hasInvestigation: !!result.investigation,
      hasDiagnosis: !!result.diagnosis,
      hasPrescription: !!result.prescription,
      hasSummary: !!result.summary,
      highRiskDetails: result.highRisk ? {
        risk_factors: result.highRisk.risk_factors,
        allergy_drug: result.highRisk.allergy_drug,
        notes: result.highRisk.notes
      } : null
    });
    
    // Step 4: Simulate prescription template mapping
    if (result.highRisk) {
      console.log('🎯 Testing prescription template mapping...');
      
      // Test ValantPrescription mapping
      const pastHistory = result.highRisk?.surgical_history || result.highRisk?.family_history || result.highRisk?.notes || '';
      const drugHistory = result.highRisk?.current_medications || result.highRisk?.allergy_drug || result.highRisk?.allergy_food || '';
      
      console.log('📝 ValantPrescription would map to:', {
        pastHistory,
        drugHistory
      });
      
      // Test VHPrescription mapping (enhanced)
      const highRiskInfo = [];
      if (result.highRisk.risk_factors?.length > 0) {
        highRiskInfo.push(`Risk Factors: ${result.highRisk.risk_factors.join(', ')}`);
      }
      if (result.highRisk.allergy_drug) {
        highRiskInfo.push(`Drug Allergies: ${result.highRisk.allergy_drug}`);
      }
      if (result.highRisk.current_medications) {
        highRiskInfo.push(`Current Medications: ${result.highRisk.current_medications}`);
      }
      
      console.log('📝 VHPrescription would show:', highRiskInfo);
      
      // Test Valant2Prescription mapping (enhanced)
      const valant2HighRisk = [];
      if (result.highRisk.risk_factors?.length > 0) {
        valant2HighRisk.push(`High Risk Factors: ${result.highRisk.risk_factors.join(', ')}`);
      }
      if (result.highRisk.allergy_drug || result.highRisk.allergy_food) {
        const allergies = [result.highRisk.allergy_drug, result.highRisk.allergy_food].filter(Boolean);
        valant2HighRisk.push(`Allergies: ${allergies.join(', ')}`);
      }
      
      console.log('📝 Valant2Prescription would show:', valant2HighRisk);
      
    } else {
      console.log('⚠️ No high risk data found - templates will be empty');
    }
    
  } catch (error) {
    console.error('💥 Debug error:', error);
  }
}

// Test with the patient that has high risk data
debugCompletePatientRecord('P001449');