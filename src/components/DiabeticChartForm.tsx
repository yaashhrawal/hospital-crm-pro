import React, { useState, useEffect } from 'react';
import type { PatientWithRelations } from '../config/supabaseNew';
import toast from 'react-hot-toast';

interface DiabeticChartFormProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientWithRelations;
  bedNumber: number;
  ipdNumber?: string;
  onSubmit: (diabeticData: any) => void;
  savedData?: any; // Previously saved form data
}

interface DiabeticEntry {
  id: string;
  dateTime: string;
  bloodSugar: string;
  medicationName: string;
  medicationDose: string;
  route: string;
  sign: string;
}

const DiabeticChartForm: React.FC<DiabeticChartFormProps> = ({
  isOpen,
  onClose,
  patient,
  bedNumber,
  ipdNumber,
  onSubmit,
  savedData
}) => {
  // Get effective IPD number with fallback
  const [effectiveIPDNumber, setEffectiveIPDNumber] = useState<string>('');
  
  useEffect(() => {
    if (ipdNumber && ipdNumber !== 'IPD Number Not Available') {
      setEffectiveIPDNumber(ipdNumber);
    } else {
      // Try to find IPD number from localStorage as fallback
      const bedKeys = Object.keys(localStorage).filter(key => key.includes('-ipdNumber'));
      if (bedKeys.length > 0) {
        const latestKey = bedKeys[bedKeys.length - 1];
        const fallbackIPD = localStorage.getItem(latestKey);
        if (fallbackIPD) {
          setEffectiveIPDNumber(fallbackIPD);
        } else {
          setEffectiveIPDNumber('IPD Number Not Available');
        }
      } else {
        setEffectiveIPDNumber('IPD Number Not Available');
      }
    }
  }, [ipdNumber, isOpen]);

  const [diabeticPatientInfo, setDiabeticPatientInfo] = useState({
    patientName: savedData?.diabeticPatientInfo?.patientName || '',
    patientId: savedData?.diabeticPatientInfo?.patientId || '',
    ipNo: savedData?.diabeticPatientInfo?.ipNo || '',
    ageSex: savedData?.diabeticPatientInfo?.ageSex || '',
    department: savedData?.diabeticPatientInfo?.department || '',
    doctor: savedData?.diabeticPatientInfo?.doctor || ''
  });

  const [diabeticEntries, setDiabeticEntries] = useState<DiabeticEntry[]>(
    savedData?.diabeticEntries || [{
      id: `diabetic-${Date.now()}`,
      dateTime: new Date().toISOString().slice(0, 16),
      bloodSugar: '',
      medicationName: '',
      medicationDose: '',
      route: '',
      sign: ''
    }]
  );

  useEffect(() => {
    if (isOpen && patient && !savedData) {
      const patientName = `${patient.first_name} ${patient.last_name}`;
      const ageSex = `${patient.age || 'N/A'}/${patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : patient.gender}`;
      
      setDiabeticPatientInfo(prev => ({
        ...prev,
        patientName,
        patientId: patient.patient_id,
        ipNo: effectiveIPDNumber || 'IPD Number Not Available',
        ageSex
      }));
    }
  }, [isOpen, patient, effectiveIPDNumber, bedNumber, savedData]);

  const addDiabeticEntry = () => {
    const newEntry: DiabeticEntry = {
      id: `diabetic-${Date.now()}`,
      dateTime: new Date().toISOString().slice(0, 16),
      bloodSugar: '',
      medicationName: '',
      medicationDose: '',
      route: '',
      sign: ''
    };
    setDiabeticEntries([...diabeticEntries, newEntry]);
  };

  const removeDiabeticEntry = (entryId: string) => {
    if (diabeticEntries.length > 1) {
      setDiabeticEntries(diabeticEntries.filter(entry => entry.id !== entryId));
    } else {
      toast.error('At least one diabetic entry must remain');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const diabeticData = {
      patientId: patient.id,
      bedNumber,
      diabeticPatientInfo,
      diabeticEntries,
      submittedAt: new Date().toISOString()
    };

    onSubmit(diabeticData);
    toast.success('Diabetic Flow Chart saved successfully');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Diabetic Flow Chart</h2>
            <p className="text-sm text-gray-600">
              Patient: {patient.first_name} {patient.last_name} | Bed: {bedNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Patient Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient's Name</label>
                <input
                  type="text"
                  value={diabeticPatientInfo.patientName}
                  onChange={(e) => setDiabeticPatientInfo(prev => ({ ...prev, patientName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                <input
                  type="text"
                  value={diabeticPatientInfo.patientId}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IPD No.</label>
                <input
                  type="text"
                  value={diabeticPatientInfo.ipNo}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age/Sex</label>
                <input
                  type="text"
                  value={diabeticPatientInfo.ageSex}
                  onChange={(e) => setDiabeticPatientInfo(prev => ({ ...prev, ageSex: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={diabeticPatientInfo.department}
                  onChange={(e) => setDiabeticPatientInfo(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name of Doctor</label>
                <input
                  type="text"
                  value={diabeticPatientInfo.doctor}
                  onChange={(e) => setDiabeticPatientInfo(prev => ({ ...prev, doctor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-800">Diabetic Monitoring</h4>
              <button
                type="button"
                onClick={addDiabeticEntry}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <span>➕</span> Add Entry
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Date & Time</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Blood Sugar (Mg/dl)</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold text-center" colSpan={2}>Anti Diabetic Agent</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Route</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Sign</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Action</th>
                  </tr>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2"></th>
                    <th className="border border-gray-300 p-2"></th>
                    <th className="border border-gray-300 p-2 text-xs">Name</th>
                    <th className="border border-gray-300 p-2 text-xs">Dose</th>
                    <th className="border border-gray-300 p-2"></th>
                    <th className="border border-gray-300 p-2"></th>
                    <th className="border border-gray-300 p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {diabeticEntries.map((entry, index) => (
                    <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="datetime-local"
                          value={entry.dateTime}
                          onChange={(e) => {
                            const updated = [...diabeticEntries];
                            updated[index] = { ...entry, dateTime: e.target.value };
                            setDiabeticEntries(updated);
                          }}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={entry.bloodSugar}
                          onChange={(e) => {
                            const updated = [...diabeticEntries];
                            updated[index] = { ...entry, bloodSugar: e.target.value };
                            setDiabeticEntries(updated);
                          }}
                          placeholder="mg/dl"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={entry.medicationName}
                          onChange={(e) => {
                            const updated = [...diabeticEntries];
                            updated[index] = { ...entry, medicationName: e.target.value };
                            setDiabeticEntries(updated);
                          }}
                          placeholder="Medication name"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={entry.medicationDose}
                          onChange={(e) => {
                            const updated = [...diabeticEntries];
                            updated[index] = { ...entry, medicationDose: e.target.value };
                            setDiabeticEntries(updated);
                          }}
                          placeholder="Dose"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={entry.route}
                          onChange={(e) => {
                            const updated = [...diabeticEntries];
                            updated[index] = { ...entry, route: e.target.value };
                            setDiabeticEntries(updated);
                          }}
                          placeholder="Route"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={entry.sign}
                          onChange={(e) => {
                            const updated = [...diabeticEntries];
                            updated[index] = { ...entry, sign: e.target.value };
                            setDiabeticEntries(updated);
                          }}
                          placeholder="Initials"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeDiabeticEntry(entry.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1 mx-auto"
                          title="Delete this entry"
                        >
                          <span>🗑️</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex justify-center pt-8 border-t">
            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 flex items-center gap-2 shadow-md"
            >
              <span>💾</span>
              Save Diabetic Chart
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DiabeticChartForm;