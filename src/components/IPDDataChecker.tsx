import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';

const IPDDataChecker: React.FC = () => {
  const [admissionData, setAdmissionData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const checkIPDData = async () => {
    setLoading(true);
    try {
      console.log('🔍 Checking IPD data in database...');

      // Get ALL admissions (no filtering)
      const { data: allAdmissions, error: allError } = await supabase
        .from('patient_admissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (allError) {
        console.error('Error loading all admissions:', allError);
        toast.error(`Failed to load admissions: ${allError.message}`);
        return;
      }

      console.log('📊 ALL admissions in database:', allAdmissions);
      console.log('📊 Total admissions count:', allAdmissions?.length || 0);

      if (allAdmissions && allAdmissions.length > 0) {
        // Show status breakdown
        const statusCounts: { [key: string]: number } = {};
        allAdmissions.forEach(admission => {
          const status = admission.status || 'NULL';
          statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        console.log('📊 Status breakdown:', statusCounts);

        // Get patient details for each admission
        const admissionsWithPatients = [];
        for (const admission of allAdmissions) {
          let patientData = null;
          if (admission.patient_id) {
            const { data: patient, error: patientError } = await supabase
              .from('patients')
              .select('id, patient_id, first_name, last_name')
              .eq('id', admission.patient_id)
              .single();
            
            if (!patientError && patient) {
              patientData = patient;
            }
          }

          admissionsWithPatients.push({
            ...admission,
            patient: patientData
          });
        }

        setAdmissionData(admissionsWithPatients);
      } else {
        console.log('📊 No admissions found in database');
        setAdmissionData([]);
      }

    } catch (error: any) {
      console.error('🚨 Error checking IPD data:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fixAdmissionStatuses = async () => {
    try {
      console.log('🔧 Fixing admission statuses...');

      // Update all admissions to have 'ACTIVE' status
      const { error } = await supabase
        .from('patient_admissions')
        .update({ status: 'ACTIVE' })
        .is('actual_discharge_date', null);

      if (error) {
        console.error('Error updating statuses:', error);
        toast.error(`Failed to update: ${error.message}`);
      } else {
        console.log('✅ Updated all non-discharged admissions to ACTIVE status');
        toast.success('Fixed admission statuses - check IPD section now!');
        await checkIPDData(); // Refresh data
      }

    } catch (error: any) {
      console.error('🚨 Error fixing statuses:', error);
      toast.error(`Error: ${error.message}`);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-blue-600">📊 IPD Data Checker</h1>
        <p className="text-gray-600">Check what IPD data exists in the database</p>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={checkIPDData}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? '🔄 Checking...' : '🔍 Check IPD Data'}
        </button>

        <button
          onClick={fixAdmissionStatuses}
          disabled={loading || admissionData.length === 0}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
        >
          🔧 Fix Status Issues
        </button>
      </div>

      {admissionData.length > 0 && (
        <div className="bg-white rounded-lg border overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="text-lg font-semibold">
              📋 All IPD Admissions ({admissionData.length})
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 font-medium text-gray-700">Patient</th>
                  <th className="text-left p-3 font-medium text-gray-700">Bed</th>
                  <th className="text-left p-3 font-medium text-gray-700">Room Type</th>
                  <th className="text-left p-3 font-medium text-gray-700">Status</th>
                  <th className="text-left p-3 font-medium text-gray-700">Admission Date</th>
                  <th className="text-left p-3 font-medium text-gray-700">Discharge Date</th>
                </tr>
              </thead>
              <tbody>
                {admissionData.map((admission, index) => (
                  <tr key={admission.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                    <td className="p-3">
                      {admission.patient ? (
                        <div>
                          <div className="font-medium">
                            {admission.patient.first_name} {admission.patient.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {admission.patient.patient_id}
                          </div>
                        </div>
                      ) : (
                        <div className="text-red-500">
                          Patient not found
                          <div className="text-xs">UUID: {admission.patient_id}</div>
                        </div>
                      )}
                    </td>
                    <td className="p-3 font-mono">{admission.bed_number}</td>
                    <td className="p-3">{admission.room_type}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        admission.status === 'ACTIVE' 
                          ? 'bg-green-100 text-green-800'
                          : admission.status === 'DISCHARGED'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {admission.status || 'NULL'}
                      </span>
                    </td>
                    <td className="p-3 text-sm">
                      {admission.admission_date ? new Date(admission.admission_date).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="p-3 text-sm">
                      {admission.actual_discharge_date ? new Date(admission.actual_discharge_date).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && admissionData.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border">
          <div className="text-6xl mb-4">🏥</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No IPD admissions found</h3>
          <p className="text-gray-500">No data in the patient_admissions table</p>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-medium text-blue-800 mb-2">🎯 This Tool Will Show:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• All admissions in the database (regardless of status)</li>
          <li>• Patient names and details for each admission</li>
          <li>• Status values (ACTIVE, DISCHARGED, NULL, etc.)</li>
          <li>• Admission and discharge dates</li>
          <li>• Fix any status issues automatically</li>
        </ul>
      </div>
    </div>
  );
};

export default IPDDataChecker;