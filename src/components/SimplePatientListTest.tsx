import React, { useState, useEffect } from 'react';
import HospitalService from '../services/hospitalService';
import type { PatientWithRelations } from '../config/supabaseNew';

const SimplePatientListTest: React.FC = () => {
  const [patients, setPatients] = useState<PatientWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawData, setRawData] = useState<any>(null);

  useEffect(() => {
    const testPatientLoading = async () => {
      try {
        console.log('🧪 Starting patient loading test...');
        setLoading(true);
        setError(null);
        
        // Test the exact call that ComprehensivePatientList makes
        const result = await HospitalService.getPatients(200);
        console.log('🧪 HospitalService.getPatients result:', result);
        console.log('🧪 Result type:', typeof result);
        console.log('🧪 Result length:', result?.length);
        console.log('🧪 First patient:', result?.[0]);
        
        setPatients(result);
        setRawData(result);
        
      } catch (err: any) {
        console.error('🧪 Patient loading test failed:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    testPatientLoading();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">🧪 Patient List Debug Test</h2>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Testing patient loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4 text-red-600">🧪 Patient List Debug Test - ERROR</h2>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <h3 className="font-semibold text-red-800">Error Details:</h3>
          <p className="text-red-700">{error}</p>
          <h3 className="font-semibold text-red-800 mt-4">Check Browser Console:</h3>
          <p className="text-red-700">Open browser dev tools (F12) and check the Console tab for detailed error messages.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">🧪 Patient List Debug Test</h2>
      
      <div className="mb-6 bg-blue-50 border border-blue-200 rounded p-4">
        <h3 className="font-semibold text-blue-800">Test Results:</h3>
        <ul className="text-blue-700 mt-2">
          <li>✅ Service call completed without error</li>
          <li>📊 Patients loaded: {patients.length}</li>
          <li>📝 Data type: {typeof rawData}</li>
          <li>🔍 Raw data available: {rawData ? 'Yes' : 'No'}</li>
        </ul>
      </div>

      {patients.length === 0 ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
          <h3 className="font-semibold text-yellow-800">No Patients Found</h3>
          <p className="text-yellow-700 mt-2">
            The query returned successfully but found 0 patients. This could mean:
          </p>
          <ul className="text-yellow-700 mt-2 ml-4">
            <li>• No patients exist in the database</li>
            <li>• Patients exist but don't match the hospital_id filter</li>
            <li>• Database relationship issues</li>
          </ul>
          <p className="text-yellow-700 mt-2">
            <strong>Check the SQL diagnostic results to see actual database content.</strong>
          </p>
        </div>
      ) : (
        <div>
          <h3 className="font-semibold mb-4">Found {patients.length} patients:</h3>
          <div className="space-y-2">
            {patients.map((patient, index) => (
              <div key={patient.id || index} className="border rounded p-3 bg-white">
                <div className="flex justify-between items-center">
                  <div>
                    <strong>{patient.first_name} {patient.last_name}</strong>
                    <span className="text-gray-500 ml-2">({patient.patient_id})</span>
                  </div>
                  <div className="text-sm text-gray-500">
                    ID: {patient.id?.substring(0, 8)}...
                  </div>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  Phone: {patient.phone} | Hospital ID: {patient.hospital_id?.substring(0, 8)}...
                </div>
                <div className="text-sm text-gray-600">
                  Transactions: {patient.transactions?.length || 0} | 
                  Total Spent: ₹{patient.totalSpent || 0} | 
                  Visits: {patient.visitCount || 0}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-6 bg-gray-50 border border-gray-200 rounded p-4">
        <h3 className="font-semibold text-gray-800">Raw Data Preview:</h3>
        <pre className="text-xs text-gray-600 mt-2 overflow-auto max-h-40">
          {JSON.stringify(rawData, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default SimplePatientListTest;