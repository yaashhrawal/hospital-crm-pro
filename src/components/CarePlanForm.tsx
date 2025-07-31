import React, { useState, useEffect } from 'react';
import type { PatientWithRelations } from '../config/supabaseNew';
import toast from 'react-hot-toast';

interface CarePlanFormProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientWithRelations;
  bedNumber: number;
  ipdNumber?: string;
  onSubmit: (carePlanData: any) => void;
}

interface CarePlanEntry {
  id: string;
  assessment: string;
  goal: string;
  plannedCare: string;
  evaluation: string;
  dateTime: string;
  nameSign: string;
}

const CarePlanForm: React.FC<CarePlanFormProps> = ({
  isOpen,
  onClose,
  patient,
  bedNumber,
  ipdNumber,
  onSubmit
}) => {
  const [carePlanPatientInfo, setCarePlanPatientInfo] = useState({
    patientName: '',
    patientId: '',
    ipNo: '',
    ageSex: '',
    department: '',
    doctor: ''
  });

  const [carePlanEntries, setCarePlanEntries] = useState<CarePlanEntry[]>([{
    id: `care-${Date.now()}`,
    assessment: '',
    goal: '',
    plannedCare: '',
    evaluation: '',
    dateTime: new Date().toISOString().slice(0, 16),
    nameSign: ''
  }]);

  useEffect(() => {
    if (isOpen && patient) {
      const patientName = `${patient.first_name} ${patient.last_name}`;
      const ageSex = `${patient.age || 'N/A'}/${patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : patient.gender}`;
      
      setCarePlanPatientInfo(prev => ({
        ...prev,
        patientName,
        patientId: patient.patient_id,
        ipNo: ipdNumber || 'IPD Number Not Available',
        ageSex
      }));
    }
  }, [isOpen, patient, ipdNumber, bedNumber]);

  const addCarePlanEntry = () => {
    const newEntry: CarePlanEntry = {
      id: `care-${Date.now()}`,
      assessment: '',
      goal: '',
      plannedCare: '',
      evaluation: '',
      dateTime: new Date().toISOString().slice(0, 16),
      nameSign: ''
    };
    setCarePlanEntries([...carePlanEntries, newEntry]);
  };

  const removeCarePlanEntry = (entryId: string) => {
    if (carePlanEntries.length > 1) {
      setCarePlanEntries(carePlanEntries.filter(entry => entry.id !== entryId));
    } else {
      toast.error('At least one care plan entry must remain');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const carePlanData = {
      patientId: patient.id,
      bedNumber,
      carePlanPatientInfo,
      carePlanEntries,
      submittedAt: new Date().toISOString()
    };

    onSubmit(carePlanData);
    toast.success('Nursing Care Plan saved successfully');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Nursing Care Plan</h2>
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
          <div className="bg-green-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Patient Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient's Name</label>
                <input
                  type="text"
                  value={carePlanPatientInfo.patientName}
                  onChange={(e) => setCarePlanPatientInfo(prev => ({ ...prev, patientName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                <input
                  type="text"
                  value={carePlanPatientInfo.patientId}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IPD No.</label>
                <input
                  type="text"
                  value={carePlanPatientInfo.ipNo}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age/Sex</label>
                <input
                  type="text"
                  value={carePlanPatientInfo.ageSex}
                  onChange={(e) => setCarePlanPatientInfo(prev => ({ ...prev, ageSex: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <input
                  type="text"
                  value={carePlanPatientInfo.department}
                  onChange={(e) => setCarePlanPatientInfo(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name of Doctor</label>
                <input
                  type="text"
                  value={carePlanPatientInfo.doctor}
                  onChange={(e) => setCarePlanPatientInfo(prev => ({ ...prev, doctor: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-800">Care Plan Details</h4>
              <button
                type="button"
                onClick={addCarePlanEntry}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <span>➕</span> Add Care Plan
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Assessment/Nursing Diagnosis</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Goal/Expected Outcome</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Planned Care</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Evaluation (Resolved/Continued)</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Date/Time</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Name/Sign</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {carePlanEntries.map((entry, index) => (
                    <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 p-2">
                        <textarea
                          value={entry.assessment}
                          onChange={(e) => {
                            const updated = [...carePlanEntries];
                            updated[index] = { ...entry, assessment: e.target.value };
                            setCarePlanEntries(updated);
                          }}
                          rows={3}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                          placeholder="Assessment and nursing diagnosis..."
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <textarea
                          value={entry.goal}
                          onChange={(e) => {
                            const updated = [...carePlanEntries];
                            updated[index] = { ...entry, goal: e.target.value };
                            setCarePlanEntries(updated);
                          }}
                          rows={3}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                          placeholder="Goals and expected outcomes..."
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <textarea
                          value={entry.plannedCare}
                          onChange={(e) => {
                            const updated = [...carePlanEntries];
                            updated[index] = { ...entry, plannedCare: e.target.value };
                            setCarePlanEntries(updated);
                          }}
                          rows={3}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                          placeholder="Planned care interventions..."
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <textarea
                          value={entry.evaluation}
                          onChange={(e) => {
                            const updated = [...carePlanEntries];
                            updated[index] = { ...entry, evaluation: e.target.value };
                            setCarePlanEntries(updated);
                          }}
                          rows={3}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                          placeholder="Evaluation: Resolved/Continued..."
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="datetime-local"
                          value={entry.dateTime}
                          onChange={(e) => {
                            const updated = [...carePlanEntries];
                            updated[index] = { ...entry, dateTime: e.target.value };
                            setCarePlanEntries(updated);
                          }}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={entry.nameSign}
                          onChange={(e) => {
                            const updated = [...carePlanEntries];
                            updated[index] = { ...entry, nameSign: e.target.value };
                            setCarePlanEntries(updated);
                          }}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Name & Signature"
                        />
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeCarePlanEntry(entry.id)}
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
              Save Care Plan
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CarePlanForm;