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
    patientName: '',
    patientId: '',
    ipdNo: '',
    ageSex: '',
    dayOfAdmission: savedData?.medicationPatientInfo?.dayOfAdmission || '',
    consultant: '',
    date: savedData?.medicationPatientInfo?.date || new Date().toISOString().split('T')[0],
    pod: savedData?.medicationPatientInfo?.pod || '',
    allergy: savedData?.medicationPatientInfo?.allergy || '',
    diagnosisSurgery: savedData?.medicationPatientInfo?.diagnosisSurgery || '',
    diet: savedData?.medicationPatientInfo?.diet || '',
    investigation: savedData?.medicationPatientInfo?.investigation || '',
    remark: savedData?.medicationPatientInfo?.remark || ''
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
    console.log('🔍 MedicationChartForm Debug:', { 
      isOpen, 
      patient: patient ? { 
        first_name: patient.first_name, 
        last_name: patient.last_name, 
        patient_id: patient.patient_id,
        age: patient.age,
        gender: patient.gender,
        assigned_doctor: patient.assigned_doctor
      } : null, 
      ipdNumber, 
      bedNumber 
    });
    
    if (isOpen && patient) {
      console.log('📝 Setting MedicationChartForm data with patient:', patient);
      const patientName = `${patient.first_name} ${patient.last_name}`;
      const ageSex = `${patient.age || 'N/A'}/${patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : patient.gender}`;
      
      setMedicationPatientInfo(prev => ({
        ...prev,
        patientName,
        patientId: patient.patient_id,
        ipdNo: ipdNumber || 'IPD Number Not Available',
        ageSex,
        consultant: patient.assigned_doctor || 'Not Assigned'
      }));
      
      console.log('✅ MedicationChartForm data set with values:', {
        patientName,
        patientId: patient.patient_id,
        ipdNo: ipdNumber || 'IPD Number Not Available',
        ageSex,
        consultant: patient.assigned_doctor || 'Not Assigned'
      });
    }
  }, [isOpen, patient, ipdNumber, bedNumber]);

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

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');

    if (printWindow) {
      const fullPrintContent = generatePrintContent();
      printWindow.document.write(fullPrintContent);
      printWindow.document.close();
      printWindow.focus();

      setTimeout(() => {
        try {
          printWindow.print();
        } catch (error) {
          console.error('Print error:', error);
        }
      }, 500);
    }
  };

  const generatePrintContent = () => {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Nurses Medication Chart - ${patient.first_name} ${patient.last_name}</title>
  <meta charset="utf-8">
  <style>
    @page { margin: 0.5in; size: A4 portrait; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.3; color: black; }
    .print-header { text-align: center; border-bottom: 2px solid black; margin-bottom: 15pt; padding-bottom: 10pt; }
    .print-header h1 { font-size: 18pt; font-weight: bold; margin-bottom: 4pt; }
    .print-header h2 { font-size: 14pt; font-weight: bold; margin-top: 4pt; }
    .print-header p { font-size: 9pt; margin: 2pt 0; }
    .info-section { margin: 10pt 0; padding: 8pt; background: #f9f9f9; border: 1px solid #ccc; }
    .info-section p { margin: 3pt 0; font-size: 9pt; }
    .section-title { font-size: 11pt; font-weight: bold; margin: 12pt 0 6pt 0; }
    table { width: 100%; border-collapse: collapse; margin: 10pt 0; }
    th, td { border: 1px solid black; padding: 4pt; text-align: left; font-size: 8pt; }
    th { background: #f0f0f0; font-weight: bold; text-align: center; }
    .textarea-content { white-space: pre-wrap; word-wrap: break-word; }
  </style>
</head>
<body>
  <div class="print-header">
    <h1>VALANT HOSPITAL</h1>
    <p>A-10, Madhav Vihar, Shobhagpura, Udaipur | +91-911911 8000</p>
    <h2>NURSES MEDICATION CHART</h2>
    <p>Patient: ${patient.first_name} ${patient.last_name} | Bed: ${bedNumber} | Date: ${new Date().toLocaleDateString()}</p>
  </div>

  <div class="info-section">
    <p><strong>Patient ID:</strong> ${medicationPatientInfo.patientId || 'N/A'}</p>
    <p><strong>IPD No:</strong> ${medicationPatientInfo.ipdNo || 'N/A'}</p>
    <p><strong>Patient Name:</strong> ${medicationPatientInfo.patientName || 'N/A'}</p>
    <p><strong>Age/Sex:</strong> ${medicationPatientInfo.ageSex || 'N/A'}</p>
    <p><strong>Day of Admission:</strong> ${medicationPatientInfo.dayOfAdmission || 'N/A'}</p>
    <p><strong>Consultant:</strong> ${medicationPatientInfo.consultant || 'N/A'}</p>
  </div>

  <div class="section-title">General Information</div>
  <div class="info-section">
    <p><strong>Date:</strong> ${medicationPatientInfo.date || 'N/A'}</p>
    <p><strong>POD:</strong> ${medicationPatientInfo.pod || 'N/A'}</p>
    <p><strong>Allergy:</strong> ${medicationPatientInfo.allergy || 'N/A'}</p>
    <p><strong>Diagnosis/Surgery:</strong> ${medicationPatientInfo.diagnosisSurgery || 'N/A'}</p>
    <p><strong>Diet:</strong> <span class="textarea-content">${medicationPatientInfo.diet || 'N/A'}</span></p>
    <p><strong>Investigation:</strong> <span class="textarea-content">${medicationPatientInfo.investigation || 'N/A'}</span></p>
    <p><strong>Remark:</strong> <span class="textarea-content">${medicationPatientInfo.remark || 'N/A'}</span></p>
  </div>

  <div class="section-title">Medication Details</div>
  <table>
    <thead>
      <tr>
        <th rowspan="3">S.N.</th>
        <th rowspan="3">Name of Drug & Dose</th>
        <th rowspan="3">Route</th>
        <th colspan="8">Frequency</th>
      </tr>
      <tr>
        <th colspan="2">Morning</th>
        <th colspan="2">Noon</th>
        <th colspan="2">Evening</th>
        <th colspan="2">Night</th>
      </tr>
      <tr>
        <th>Actual Time</th>
        <th>Name</th>
        <th>Actual Time</th>
        <th>Name</th>
        <th>Actual Time</th>
        <th>Name</th>
        <th>Actual Time</th>
        <th>Name</th>
      </tr>
    </thead>
    <tbody>
      ${medicationEntries.map(entry => `
        <tr>
          <td style="text-align: center;">${entry.sn}</td>
          <td><span class="textarea-content">${entry.drugName || ''}</span></td>
          <td>${entry.route || ''}</td>
          <td>${entry.morningTime || ''}</td>
          <td>${entry.morningName || ''}</td>
          <td>${entry.noonTime || ''}</td>
          <td>${entry.noonName || ''}</td>
          <td>${entry.eveningTime || ''}</td>
          <td>${entry.eveningName || ''}</td>
          <td>${entry.nightTime || ''}</td>
          <td>${entry.nightName || ''}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

</body>
</html>`;
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
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <span>🖨️</span> Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Remark</label>
                <textarea
                  value={medicationPatientInfo.remark}
                  onChange={(e) => setMedicationPatientInfo(prev => ({ ...prev, remark: e.target.value }))}
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