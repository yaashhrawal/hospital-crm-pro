// Direct test of high risk data functionality 
import dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = 'https://oghqwddhojnryovmfvzc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

async function simulateReactComponentLogic() {
  console.log('🧪 Simulating React Component High Risk Data Logic...');
  
  const testPatientId = 'P001449';
  
  console.log('📥 Step 1: Simulate getCompletePatientRecord...');
  
  // Simulate what the service does
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/medical_high_risk_data?patient_id=eq.${testPatientId}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const highRiskData = await response.json();
    
    console.log('📊 Raw database response:', {
      recordCount: highRiskData.length,
      firstRecord: highRiskData[0] || null
    });
    
    // Simulate what getCompletePatientRecord returns
    const savedRecord = {
      highRisk: highRiskData[0] || null, // Take first record
      chiefComplaints: [],
      examination: null,
      investigation: null,
      diagnosis: null,
      prescription: null,
      summary: null
    };
    
    console.log('📄 Saved record structure:', {
      hasHighRisk: !!savedRecord.highRisk,
      highRiskStructure: savedRecord.highRisk ? Object.keys(savedRecord.highRisk) : null
    });
    
    // Simulate React component loading logic (lines 399-431 from SimpleEnhancedPatientRecord.tsx)
    if (savedRecord) {
      console.log('✅ Loading existing medical record from database:', {
        hasHighRisk: !!savedRecord.highRisk
      });
      
      console.log('🔍 High risk data structure:', savedRecord.highRisk);
      
      const loadedHighRisks = [];
      
      console.log('🔍 Checking high risk data:', {
        hasHighRisk: !!savedRecord.highRisk,
        hasRiskFactors: !!savedRecord.highRisk?.risk_factors,
        riskFactorsType: typeof savedRecord.highRisk?.risk_factors,
        riskFactorsLength: savedRecord.highRisk?.risk_factors?.length
      });
      
      if (savedRecord.highRisk?.risk_factors) {
        console.log('📊 Processing risk factors:', savedRecord.highRisk.risk_factors);
        savedRecord.highRisk.risk_factors.forEach((factor, index) => {
          console.log(`➕ Adding high risk #${index + 1}:`, factor);
          loadedHighRisks.push({
            condition: factor,
            identifiedDate: savedRecord.highRisk?.created_at?.split('T')[0] || '',
            notes: savedRecord.highRisk?.notes || ''
          });
        });
      } else {
        console.log('⚠️ No high risk data found or risk_factors is empty');
      }
      
      console.log('📊 Final loadedHighRisks array:', {
        length: loadedHighRisks.length,
        data: loadedHighRisks
      });
      
      // Simulate save logic (lines 315-319 from SimpleEnhancedPatientRecord.tsx)
      console.log('💾 Would save high risk data?', loadedHighRisks.length > 0);
      console.log('📊 Save data would be:', {
        highRisk: loadedHighRisks.length > 0 ? {
          risk_factors: loadedHighRisks.map(hr => hr.condition),
          notes: loadedHighRisks.map(hr => hr.notes).join('; ')
        } : null
      });
    }
    
  } catch (error) {
    console.error('💥 Test error:', error);
  }
  
  console.log('🏁 High Risk Logic Simulation completed');
}

simulateReactComponentLogic();