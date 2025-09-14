// Test the Complete Patient Record service for P000917
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = 'https://oghqwddhojnryovmfvzc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

// Simulate the exact functions from completePatientRecordService.ts
async function getMedicalHighRiskData(patientId) {
  try {
    console.log(`🔍 Getting high risk data for patient: ${patientId}`);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/medical_high_risk_data?patient_id=eq.${patientId}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ High risk API response:', data);
      return data?.[0] || null;
    } else {
      console.log('❌ High risk API failed:', response.status);
      return null;
    }
  } catch (error) {
    console.error('💥 Error getting high risk data:', error);
    return null;
  }
}

async function getCompletePatientRecord(patientId) {
  try {
    console.log('📥 Getting complete patient record for:', patientId);
    
    // Get high risk data (this is what the service does)
    const highRisk = await getMedicalHighRiskData(patientId);
    
    // Get other data (simplified for testing)
    const examination = null; // We know P000917 has no exam data
    const investigation = null; // We know P000917 has no investigation data
    const diagnosis = null; // We know P000917 has no diagnosis data
    const prescription = null; // We know P000917 has no prescription data
    
    // Get summary data
    let summary = null;
    try {
      const summaryResponse = await fetch(`${SUPABASE_URL}/rest/v1/medical_record_summary_data?patient_id=eq.${patientId}`, {
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        }
      });
      
      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        summary = summaryData?.[0] || null;
      }
    } catch (error) {
      console.log('⚠️ Summary data error:', error.message);
    }
    
    // Extract chief complaints from summary text (this is what the service does now)
    let chiefComplaints = [];
    if (summary && summary.summary && summary.summary.includes('Chief Complaints:')) {
      console.log('📋 Extracting chief complaints from summary...');
      const match = summary.summary.match(/Chief Complaints: ([^.]+)\./);
      if (match) {
        const complaintsText = match[1];
        chiefComplaints = complaintsText.split(', ').map((complaint) => {
          const parts = complaint.split(' (');
          return {
            complaint: parts[0],
            period: parts[1]?.replace(')', '') || '',
            presentHistory: '',
            performingDoctor: '',
            notes: ''
          };
        });
      }
      console.log('📋 Retrieved chief complaints from summary text:', chiefComplaints.length);
    } else {
      console.log('📋 No chief complaints found in summary');
    }
    
    const result = {
      highRisk,
      chiefComplaints,
      examination,
      investigation,
      diagnosis,
      prescription,
      summary
    };
    
    console.log('✅ Complete patient record retrieved:', {
      highRisk: !!result.highRisk,
      chiefComplaints: result.chiefComplaints.length,
      examination: !!result.examination,
      investigation: !!result.investigation,
      diagnosis: !!result.diagnosis,
      prescription: !!result.prescription,
      summary: !!result.summary,
      highRiskDetails: result.highRisk ? {
        risk_factors: result.highRisk.risk_factors,
        allergy_drug: result.highRisk.allergy_drug,
        notes: result.highRisk.notes
      } : null
    });
    
    return result;
    
  } catch (error) {
    console.error('💥 Error getting complete patient record:', error);
    return null;
  }
}

// Test the service for P000917
getCompletePatientRecord('P000917');