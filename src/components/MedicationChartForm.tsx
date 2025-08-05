import React, { useState, useEffect } from 'react';
import type { PatientWithRelations } from '../config/supabaseNew';
import toast from 'react-hot-toast';

interface MedicationChartFormProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientWithRelations;
  bedNumber: number;
  ipdNumber?: string;
  onSubmit: (medicationData: any) => void;
  savedData?: any; // Previously saved form data
}

interface MedicationEntry {
  id: string;
  sn: string;
  drugName: string;
  route: string;
  morningTime: string;
  morningName: string;
  noonTime: string;
  noonName: string;
  eveningTime: string;
  eveningName: string;
  nightTime: string;
  nightName: string;
}

const MedicationChartForm: React.FC<MedicationChartFormProps> = ({
  isOpen,
  onClose,
  patient,
  bedNumber,
  ipdNumber,
  onSubmit,
  savedData
}) => {
  const [medicationPatientInfo, setMedicationPatientInfo] = useState({
    patientName: savedData?.medicationPatientInfo?.patientName || '',
    patientId: savedData?.medicationPatientInfo?.patientId || '',
    ipdNo: savedData?.medicationPatientInfo?.ipdNo || '',
    ageSex: savedData?.medicationPatientInfo?.ageSex || '',
    dayOfAdmission: savedData?.medicationPatientInfo?.dayOfAdmission || '',
    consultant: savedData?.medicationPatientInfo?.consultant || '',
    date: savedData?.medicationPatientInfo?.date || new Date().toISOString().split('T')[0],
    pod: savedData?.medicationPatientInfo?.pod || '',
    allergy: savedData?.medicationPatientInfo?.allergy || '',
    diagnosisSurgery: savedData?.medicationPatientInfo?.diagnosisSurgery || '',
    diet: savedData?.medicationPatientInfo?.diet || '',
    investigation: savedData?.medicationPatientInfo?.investigation || '',
    rbs: savedData?.medicationPatientInfo?.rbs || ''
  });

  const [medicationEntries, setMedicationEntries] = useState<MedicationEntry[]>(
    savedData?.medicationEntries || [{
      id: `med-${Date.now()}`,
      sn: '1',
      drugName: '',
      route: '',
      morningTime: '',
      morningName: '',
      noonTime: '',
      noonName: '',
      eveningTime: '',
      eveningName: '',
      nightTime: '',
      nightName: ''
    }]
  );

  useEffect(() => {
    if (isOpen && patient && !savedData) {
      const patientName = `${patient.first_name} ${patient.last_name}`;
      const ageSex = `${patient.age || 'N/A'}/${patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : patient.gender}`;
      
      setMedicationPatientInfo(prev => ({
        ...prev,
        patientName,
        patientId: patient.patient_id,
        ipdNo: ipdNumber || 'IPD Number Not Available',
        ageSex
      }));
    }
  }, [isOpen, patient, ipdNumber, bedNumber, savedData]);

  const addMedicationEntry = () => {
    const newEntry: MedicationEntry = {
      id: `med-${Date.now()}`,
      sn: (medicationEntries.length + 1).toString(),
      drugName: '',
      route: '',
      morningTime: '',
      morningName: '',
      noonTime: '',
      noonName: '',
      eveningTime: '',
      eveningName: '',
      nightTime: '',
      nightName: ''
    };
    setMedicationEntries([...medicationEntries, newEntry]);
  };

  const removeMedicationEntry = (entryId: string) => {
    if (medicationEntries.length > 1) {
      const filteredEntries = medicationEntries.filter(entry => entry.id !== entryId);
      // Re-number the serial numbers
      const reNumberedEntries = filteredEntries.map((entry, index) => ({
        ...entry,
        sn: (index + 1).toString()
      }));
      setMedicationEntries(reNumberedEntries);
    } else {
      toast.error('At least one medication entry must remain');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const medicationData = {
      patientId: patient.id,
      bedNumber,
      medicationPatientInfo,
      medicationEntries,
      submittedAt: new Date().toISOString()
    };

    onSubmit(medicationData);
    toast.success('Medication Chart saved successfully');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Nurses Medication Chart</h2>
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
          {/* Patient Information */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">Patient Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                <input
                  type="text"
                  value={medicationPatientInfo.patientId}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">IPD No.</label>
                <input
                  type="text"
                  value={medicationPatientInfo.ipdNo}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Patient's Name</label>
                <input
                  type="text"
                  value={medicationPatientInfo.patientName}
                  onChange={(e) => setMedicationPatientInfo(prev => ({ ...prev, patientName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age/Sex</label>
                <input
                  type="text"
                  value={medicationPatientInfo.ageSex}
                  onChange={(e) => setMedicationPatientInfo(prev => ({ ...prev, ageSex: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Day of Admission</label>
                <input
                  type="date"
                  value={medicationPatientInfo.dayOfAdmission}
                  onChange={(e) => setMedicationPatientInfo(prev => ({ ...prev, dayOfAdmission: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name of Consultant</label>
                <input
                  type="text"
                  value={medicationPatientInfo.consultant}
                  onChange={(e) => setMedicationPatientInfo(prev => ({ ...prev, consultant: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* General Information */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-800 mb-3">General Information</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={medicationPatientInfo.date}
                  onChange={(e) => setMedicationPatientInfo(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">POD</label>
                <input
                  type="text"
                  value={medicationPatientInfo.pod}
                  onChange={(e) => setMedicationPatientInfo(prev => ({ ...prev, pod: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allergy</label>
                <input
                  type="text"
                  value={medicationPatientInfo.allergy}
                  onChange={(e) => setMedicationPatientInfo(prev => ({ ...prev, allergy: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis/Surgery</label>
                <input
                  type="text"
                  value={medicationPatientInfo.diagnosisSurgery}
                  onChange={(e) => setMedicationPatientInfo(prev => ({ ...prev, diagnosisSurgery: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diet</label>
                <textarea
                  value={medicationPatientInfo.diet}
                  onChange={(e) => setMedicationPatientInfo(prev => ({ ...prev, diet: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Investigation</label>
                <textarea
                  value={medicationPatientInfo.investigation}
                  onChange={(e) => setMedicationPatientInfo(prev => ({ ...prev, investigation: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RBS</label>
                <textarea
                  value={medicationPatientInfo.rbs}
                  onChange={(e) => setMedicationPatientInfo(prev => ({ ...prev, rbs: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Medication Table */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-800">Medication Details</h4>
              <button
                type="button"
                onClick={addMedicationEntry}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
              >
                <span>➕</span> Add Medication
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-3 text-sm font-semibold">S.N.</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Name of Drug & Dose</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Route</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold text-center" colSpan={8}>Frequency</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Action</th>
                  </tr>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2"></th>
                    <th className="border border-gray-300 p-2"></th>
                    <th className="border border-gray-300 p-2"></th>
                    <th className="border border-gray-300 p-2 text-xs" colSpan={2}>Morning</th>
                    <th className="border border-gray-300 p-2 text-xs" colSpan={2}>Noon</th>
                    <th className="border border-gray-300 p-2 text-xs" colSpan={2}>Evening</th>
                    <th className="border border-gray-300 p-2 text-xs" colSpan={2}>Night</th>
                    <th className="border border-gray-300 p-2"></th>
                  </tr>
                  <tr className="bg-gray-25">
                    <th className="border border-gray-300 p-1"></th>
                    <th className="border border-gray-300 p-1"></th>
                    <th className="border border-gray-300 p-1"></th>
                    <th className="border border-gray-300 p-1 text-xs">Actual Time</th>
                    <th className="border border-gray-300 p-1 text-xs">Name</th>
                    <th className="border border-gray-300 p-1 text-xs">Actual Time</th>
                    <th className="border border-gray-300 p-1 text-xs">Name</th>
                    <th className="border border-gray-300 p-1 text-xs">Actual Time</th>
                    <th className="border border-gray-300 p-1 text-xs">Name</th>
                    <th className="border border-gray-300 p-1 text-xs">Actual Time</th>
                    <th className="border border-gray-300 p-1 text-xs">Name</th>
                    <th className="border border-gray-300 p-1"></th>
                  </tr>
                </thead>
                <tbody>
                  {medicationEntries.map((entry, index) => (
                    <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 p-2 text-center">
                        <input
                          type="text"
                          value={entry.sn}
                          onChange={(e) => {
                            const updated = [...medicationEntries];
                            updated[index] = { ...entry, sn: e.target.value };
                            setMedicationEntries(updated);
                          }}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-center"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <textarea
                          value={entry.drugName}
                          onChange={(e) => {
                            const updated = [...medicationEntries];
                            updated[index] = { ...entry, drugName: e.target.value };
                            setMedicationEntries(updated);
                          }}
                          rows={2}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Drug name & dosage"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={entry.route}
                          onChange={(e) => {
                            const updated = [...medicationEntries];
                            updated[index] = { ...entry, route: e.target.value };
                            setMedicationEntries(updated);
                          }}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Route"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="time"
                          value={entry.morningTime}
                          onChange={(e) => {
                            const updated = [...medicationEntries];
                            updated[index] = { ...entry, morningTime: e.target.value };
                            setMedicationEntries(updated);
                          }}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={entry.morningName}
                          onChange={(e) => {
                            const updated = [...medicationEntries];
                            updated[index] = { ...entry, morningName: e.target.value };
                            setMedicationEntries(updated);
                          }}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Initials"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="time"
                          value={entry.noonTime}
                          onChange={(e) => {
                            const updated = [...medicationEntries];
                            updated[index] = { ...entry, noonTime: e.target.value };
                            setMedicationEntries(updated);
                          }}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={entry.noonName}
                          onChange={(e) => {
                            const updated = [...medicationEntries];
                            updated[index] = { ...entry, noonName: e.target.value };
                            setMedicationEntries(updated);
                          }}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Initials"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="time"
                          value={entry.eveningTime}
                          onChange={(e) => {
                            const updated = [...medicationEntries];
                            updated[index] = { ...entry, eveningTime: e.target.value };
                            setMedicationEntries(updated);
                          }}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={entry.eveningName}
                          onChange={(e) => {
                            const updated = [...medicationEntries];
                            updated[index] = { ...entry, eveningName: e.target.value };
                            setMedicationEntries(updated);
                          }}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Initials"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="time"
                          value={entry.nightTime}
                          onChange={(e) => {
                            const updated = [...medicationEntries];
                            updated[index] = { ...entry, nightTime: e.target.value };
                            setMedicationEntries(updated);
                          }}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={entry.nightName}
                          onChange={(e) => {
                            const updated = [...medicationEntries];
                            updated[index] = { ...entry, nightName: e.target.value };
                            setMedicationEntries(updated);
                          }}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Initials"
                        />
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeMedicationEntry(entry.id)}
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
              Save Medication Chart
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MedicationChartForm;