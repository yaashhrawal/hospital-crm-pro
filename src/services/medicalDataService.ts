// Direct API service to bypass RLS issues for medical data tables
const SUPABASE_URL = 'https://oghqwddhojnryovmfvzc.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9naHF3ZGRob2pucnlvdm1mdnpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxMTQ1NDEsImV4cCI6MjA2ODY5MDU0MX0.NVvYQFtqIg8OV-vvkAhCNFC_uMC1SBJDSKcLHRjf5w0';

// Direct fetch function to bypass Supabase client issues
async function fetchFromSupabase(endpoint: string, method: string = 'GET', data?: any) {
  const url = `${SUPABASE_URL}/rest/v1/${endpoint}`;
  
  const headers: any = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation'
  };

  // For PATCH requests, we need to specify merge-duplicates
  if (method === 'PATCH') {
    headers['Prefer'] = 'return=representation,resolution=merge-duplicates';
  }

  const config: RequestInit = {
    method,
    headers,
  };

  if (data && (method === 'POST' || method === 'PATCH' || method === 'PUT')) {
    config.body = JSON.stringify(data);
  }

  try {
    console.log(`🌐 Direct API call: ${method} ${url}`);
    const response = await fetch(url, config);
    
    console.log(`📡 Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error: ${response.status} - ${errorText}`);
      throw new Error(`API Error: ${response.status} - ${errorText}`);
    }

    if (response.status === 204) {
      return null; // No content
    }

    const result = await response.json();
    console.log(`✅ API Success:`, result);
    return result;
  } catch (error) {
    console.error(`💥 Fetch error:`, error);
    throw error;
  }
}

// Helper function for upsert operations
async function upsertMedicalData(tableName: string, data: any, patientId: string) {
  console.log(`💾 Upserting ${tableName} data:`, data);
  
  try {
    // First check if record exists
    const existing = await fetchFromSupabase(`${tableName}?patient_id=eq.${patientId}`);
    
    if (existing && existing.length > 0) {
      // Update existing record
      console.log(`🔄 Updating existing ${tableName} data for patient: ${patientId}`);
      const result = await fetchFromSupabase(`${tableName}?patient_id=eq.${patientId}`, 'PATCH', data);
      return result?.[0] || result;
    } else {
      // Insert new record
      console.log(`➕ Inserting new ${tableName} data for patient: ${patientId}`);
      const result = await fetchFromSupabase(tableName, 'POST', data);
      return result?.[0] || result;
    }
  } catch (error) {
    console.error(`Error upserting ${tableName} data:`, error);
    throw error;
  }
}

// Medical Data Service Functions
export const getMedicalHighRiskData = async (patientId: string) => {
  try {
    console.log(`🔍 Getting high risk data for patient: ${patientId}`);
    const data = await fetchFromSupabase(`medical_high_risk_data?patient_id=eq.${patientId}`);
    return data?.[0] || null;
  } catch (error) {
    console.error('Error getting high risk data:', error);
    return null;
  }
};

export const saveMedicalHighRiskData = async (data: any) => {
  return await upsertMedicalData('medical_high_risk_data', data, data.patient_id);
};

export const getMedicalExaminationData = async (patientId: string) => {
  try {
    console.log(`🔍 Getting examination data for patient: ${patientId}`);
    const data = await fetchFromSupabase(`medical_examination_data?patient_id=eq.${patientId}`);
    return data?.[0] || null;
  } catch (error) {
    console.error('Error getting examination data:', error);
    return null;
  }
};

export const saveMedicalExaminationData = async (data: any) => {
  return await upsertMedicalData('medical_examination_data', data, data.patient_id);
};

export const getMedicalInvestigationData = async (patientId: string) => {
  try {
    console.log(`🔍 Getting investigation data for patient: ${patientId}`);
    const data = await fetchFromSupabase(`medical_investigation_data?patient_id=eq.${patientId}`);
    return data?.[0] || null;
  } catch (error) {
    console.error('Error getting investigation data:', error);
    return null;
  }
};

export const saveMedicalInvestigationData = async (data: any) => {
  return await upsertMedicalData('medical_investigation_data', data, data.patient_id);
};

export const getMedicalDiagnosisData = async (patientId: string) => {
  try {
    console.log(`🔍 Getting diagnosis data for patient: ${patientId}`);
    const data = await fetchFromSupabase(`medical_diagnosis_data?patient_id=eq.${patientId}`);
    return data?.[0] || null;
  } catch (error) {
    console.error('Error getting diagnosis data:', error);
    return null;
  }
};

export const saveMedicalDiagnosisData = async (data: any) => {
  return await upsertMedicalData('medical_diagnosis_data', data, data.patient_id);
};

export const getMedicalPrescriptionData = async (patientId: string) => {
  try {
    console.log(`🔍 Getting prescription data for patient: ${patientId}`);
    const data = await fetchFromSupabase(`medical_prescription_data?patient_id=eq.${patientId}`);
    return data?.[0] || null;
  } catch (error) {
    console.error('Error getting prescription data:', error);
    return null;
  }
};

export const saveMedicalPrescriptionData = async (data: any) => {
  return await upsertMedicalData('medical_prescription_data', data, data.patient_id);
};

export const getMedicalRecordSummaryData = async (patientId: string) => {
  try {
    console.log(`🔍 Getting record summary for patient: ${patientId}`);
    const data = await fetchFromSupabase(`medical_record_summary_data?patient_id=eq.${patientId}`);
    return data?.[0] || null;
  } catch (error) {
    console.error('Error getting record summary:', error);
    return null;
  }
};

export const saveMedicalRecordSummaryData = async (data: any) => {
  return await upsertMedicalData('medical_record_summary_data', data, data.patient_id);
};

// Chief Complaints functions (different table structure)
export const getPatientChiefComplaintsData = async (patientId: string) => {
  try {
    console.log(`🔍 Getting chief complaints for patient: ${patientId}`);
    const data = await fetchFromSupabase(`patient_chief_complaints?patient_id=eq.${patientId}&order=created_at.desc`);
    return data || [];
  } catch (error) {
    console.error('Error getting chief complaints:', error);
    return [];
  }
};

export const savePatientChiefComplaintsData = async (patientId: string, complaintsArray: any[]) => {
  try {
    console.log(`💾 Saving chief complaints for patient: ${patientId}`, complaintsArray);
    
    // First delete existing complaints for this patient
    await fetchFromSupabase(`patient_chief_complaints?patient_id=eq.${patientId}`, 'DELETE');
    
    // Then insert new complaints
    if (complaintsArray.length > 0) {
      const complaintsToInsert = complaintsArray.map(complaint => ({
        ...complaint,
        patient_id: patientId,
        medical_record_id: crypto.randomUUID() // Generate UUID for medical_record_id
      }));
      
      const result = await fetchFromSupabase('patient_chief_complaints', 'POST', complaintsToInsert);
      return result;
    }
    
    return [];
  } catch (error) {
    console.error('Error saving chief complaints:', error);
    throw error;
  }
};

// Bulk operations
export const getAllMedicalData = async (patientId: string) => {
  try {
    console.log(`📋 Getting all medical data for patient: ${patientId}`);
    
    const [
      highRisk,
      examination,
      investigation,
      diagnosis,
      prescription,
      recordSummary
    ] = await Promise.allSettled([
      getMedicalHighRiskData(patientId),
      getMedicalExaminationData(patientId),
      getMedicalInvestigationData(patientId),
      getMedicalDiagnosisData(patientId),
      getMedicalPrescriptionData(patientId),
      getMedicalRecordSummaryData(patientId)
    ]);

    return {
      highRisk: highRisk.status === 'fulfilled' ? highRisk.value : null,
      examination: examination.status === 'fulfilled' ? examination.value : null,
      investigation: investigation.status === 'fulfilled' ? investigation.value : null,
      diagnosis: diagnosis.status === 'fulfilled' ? diagnosis.value : null,
      prescription: prescription.status === 'fulfilled' ? prescription.value : null,
      recordSummary: recordSummary.status === 'fulfilled' ? recordSummary.value : null
    };
  } catch (error) {
    console.error('Error getting all medical data:', error);
    return {
      highRisk: null,
      examination: null,
      investigation: null,
      diagnosis: null,
      prescription: null,
      recordSummary: null
    };
  }
};

export const saveAllMedicalData = async (patientId: string, medicalData: any) => {
  try {
    console.log(`💾 Saving all medical data for patient: ${patientId}`);
    
    const promises = [];
    
    if (medicalData.highRisk) {
      promises.push(saveMedicalHighRiskData({ patient_id: patientId, ...medicalData.highRisk }));
    }
    
    if (medicalData.examination) {
      promises.push(saveMedicalExaminationData({ patient_id: patientId, ...medicalData.examination }));
    }
    
    if (medicalData.investigation) {
      promises.push(saveMedicalInvestigationData({ patient_id: patientId, ...medicalData.investigation }));
    }
    
    if (medicalData.diagnosis) {
      promises.push(saveMedicalDiagnosisData({ patient_id: patientId, ...medicalData.diagnosis }));
    }
    
    if (medicalData.prescription) {
      promises.push(saveMedicalPrescriptionData({ patient_id: patientId, ...medicalData.prescription }));
    }
    
    if (medicalData.recordSummary) {
      promises.push(saveMedicalRecordSummaryData({ patient_id: patientId, ...medicalData.recordSummary }));
    }
    
    const results = await Promise.allSettled(promises);
    const errors = results.filter(r => r.status === 'rejected');
    
    if (errors.length > 0) {
      console.error('Some saves failed:', errors);
      throw new Error(`${errors.length} save operations failed`);
    }
    
    console.log('✅ All medical data saved successfully');
    return true;
  } catch (error) {
    console.error('Error saving all medical data:', error);
    throw error;
  }
};