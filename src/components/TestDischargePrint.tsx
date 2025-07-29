import React, { useState } from 'react';
import { supabase } from '../config/supabaseNew';
import toast from 'react-hot-toast';

// Simple test component to debug discharge printing
const TestDischargePrint: React.FC = () => {
  const [admissionId, setAdmissionId] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const testRetrieveData = async () => {
    if (!admissionId.trim()) {
      toast.error('Please enter an admission ID');
      return;
    }

    setLoading(true);
    try {
      console.log('🔍 Testing data retrieval for admission:', admissionId);

      // Test 1: Check if discharge summary exists
      const { data: summaryData, error: summaryError } = await supabase
        .from('discharge_summaries')
        .select('*')
        .eq('admission_id', admissionId)
        .single();

      if (summaryError) {
        console.error('❌ Error getting discharge summary:', summaryError);
        toast.error(`Discharge summary error: ${summaryError.message}`);
        return;
      }

      console.log('✅ Discharge summary found:', summaryData);

      // Test 2: Get patient data
      const { data: patientData, error: patientError } = await supabase
        .from('patients')
        .select('*')
        .eq('id', summaryData.patient_id)
        .single();

      if (patientError) {
        console.error('❌ Error getting patient:', patientError);
      }

      // Test 3: Get admission data
      const { data: admissionData, error: admissionError } = await supabase
        .from('patient_admissions')
        .select('*')
        .eq('id', admissionId)
        .single();

      if (admissionError) {
        console.error('❌ Error getting admission:', admissionError);
      }

      const combinedData = {
        summary: summaryData,
        patient: patientData,
        admission: admissionData
      };

      setData(combinedData);
      console.log('📋 Combined data:', combinedData);
      toast.success('Data retrieved successfully! Check console for details.');

    } catch (error) {
      console.error('❌ Test failed:', error);
      toast.error('Test failed - check console');
    } finally {
      setLoading(false);
    }
  };

  const testPrintFormat = () => {
    if (!data) {
      toast.error('No data to format. Retrieve data first.');
      return;
    }

    try {
      const receiptData = {
        type: 'DISCHARGE',
        receiptNumber: `TEST-${Date.now()}`,
        date: new Date().toLocaleDateString(),
        time: new Date().toLocaleTimeString(),
        hospital: {
          name: "VALANT Hospital",
          address: "Test Address",
          phone: "Test Phone",
          email: "test@hospital.com",
          registration: "TEST123",
          gst: "TEST456"
        },
        patient: {
          id: data.patient?.patient_id || 'N/A',
          name: `${data.patient?.first_name || ''} ${data.patient?.last_name || ''}`.trim() || 'N/A',
          age: data.patient?.age || 'N/A',
          gender: data.patient?.gender || 'N/A',
          phone: data.patient?.phone || 'N/A'
        },
        medical: {
          final_diagnosis: data.summary?.final_diagnosis || 'Not specified',
          primary_consultant: data.summary?.primary_consultant || 'Not specified',
          chief_complaints: data.summary?.chief_complaints || 'Not specified',
          hopi: data.summary?.hopi || 'Not specified',
          past_history: data.summary?.past_history || 'Not specified',
          investigations: data.summary?.investigations || 'Not specified',
          course_of_stay: data.summary?.course_of_stay || 'Not specified',
          treatment_during_hospitalization: data.summary?.treatment_during_hospitalization || 'Not specified',
          discharge_medication: data.summary?.discharge_medication || 'Not specified',
          follow_up_on: data.summary?.follow_up_on || 'Not specified',
          admissionDate: data.admission?.admission_date,
          dischargeDate: data.admission?.discharge_date
        },
        charges: [],
        payments: [],
        totals: { netAmount: 0, amountPaid: 0, balance: 0 },
        staff: { processedBy: 'Test User' },
        notes: data.summary?.discharge_notes || 'Test discharge'
      };

      console.log('🎯 Formatted receipt data:', receiptData);
      
      // Simple print test - just open a new window with the data
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head><title>Discharge Summary Test</title></head>
            <body>
              <h1>Discharge Summary</h1>
              <h2>Patient: ${receiptData.patient.name}</h2>
              <h3>Final Diagnosis: ${receiptData.medical.final_diagnosis}</h3>
              <h3>Primary Consultant: ${receiptData.medical.primary_consultant}</h3>
              <p><strong>Chief Complaints:</strong> ${receiptData.medical.chief_complaints}</p>
              <p><strong>HOPI:</strong> ${receiptData.medical.hopi}</p>
              <p><strong>Past History:</strong> ${receiptData.medical.past_history}</p>
              <p><strong>Investigations:</strong> ${receiptData.medical.investigations}</p>
              <p><strong>Course of Stay:</strong> ${receiptData.medical.course_of_stay}</p>
              <p><strong>Treatment:</strong> ${receiptData.medical.treatment_during_hospitalization}</p>
              <p><strong>Discharge Medication:</strong> ${receiptData.medical.discharge_medication}</p>
              <p><strong>Follow Up:</strong> ${receiptData.medical.follow_up_on}</p>
            </body>
          </html>
        `);
        printWindow.document.close();
        toast.success('Print window opened! Check the new tab.');
      } else {
        toast.error('Failed to open print window');
      }

    } catch (error) {
      console.error('❌ Print format test failed:', error);
      toast.error('Print format test failed');
    }
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">🧪 Test Discharge Print</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Admission ID:</label>
          <input
            type="text"
            value={admissionId}
            onChange={(e) => setAdmissionId(e.target.value)}
            placeholder="Enter admission ID of discharged patient"
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>

        <div className="flex space-x-4">
          <button
            onClick={testRetrieveData}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Testing...' : '1. Test Data Retrieval'}
          </button>

          <button
            onClick={testPrintFormat}
            disabled={!data}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            2. Test Print Format
          </button>
        </div>

        {data && (
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h3 className="font-bold">✅ Data Retrieved:</h3>
            <p>Patient: {data.patient?.first_name} {data.patient?.last_name}</p>
            <p>Final Diagnosis: {data.summary?.final_diagnosis}</p>
            <p>Primary Consultant: {data.summary?.primary_consultant}</p>
            <p>Status: Data looks good!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestDischargePrint;