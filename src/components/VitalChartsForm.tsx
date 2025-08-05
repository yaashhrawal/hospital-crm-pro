import React, { useState, useEffect } from 'react';
import type { PatientWithRelations } from '../config/supabaseNew';
import toast from 'react-hot-toast';
import { getEffectiveIPDNumber } from '../utils/ipdUtils';

interface VitalChartsFormProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientWithRelations;
  bedNumber: number;
  ipdNumber?: string;
  onSubmit: (vitalChartsData: any) => void;
  savedData?: any; // Previously saved form data
}

interface VitalEntry {
  id: string;
  date: string;
  time: string;
  pulse: string;
  bpSyst: string;
  bpDiast: string;
  resp: string;
  temp: string;
  spo2: string;
  painScore: string;
  gcs: string;
  sign: string;
}

const VitalChartsForm: React.FC<VitalChartsFormProps> = ({
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
    if (isOpen) {
      const ipd = getEffectiveIPDNumber(ipdNumber);
      setEffectiveIPDNumber(ipd);
    }
  }, [ipdNumber, isOpen]);
  const [vitalEntries, setVitalEntries] = useState<VitalEntry[]>(
    savedData?.vitalEntries || [{
      id: `vital-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      pulse: '',
      bpSyst: '',
      bpDiast: '',
      resp: '',
      temp: '',
      spo2: '',
      painScore: '',
      gcs: '',
      sign: ''
    }]
  );

  const addVitalEntry = () => {
    const newEntry: VitalEntry = {
      id: `vital-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      pulse: '',
      bpSyst: '',
      bpDiast: '',
      resp: '',
      temp: '',
      spo2: '',
      painScore: '',
      gcs: '',
      sign: ''
    };
    setVitalEntries([...vitalEntries, newEntry]);
  };

  const removeVitalEntry = (entryId: string) => {
    if (vitalEntries.length > 1) {
      setVitalEntries(vitalEntries.filter(entry => entry.id !== entryId));
    } else {
      toast.error('At least one vital entry must remain');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const vitalChartsData = {
      patientId: patient.id,
      bedNumber,
      vitalEntries,
      submittedAt: new Date().toISOString()
    };

    onSubmit(vitalChartsData);
    toast.success('Vital Charts saved successfully');
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
  <title>Vital Charts - ${patient.first_name} ${patient.last_name}</title>
  <meta charset="utf-8">
  <style>
    @page { margin: 0.5in; size: A4 portrait; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 10pt; line-height: 1.3; color: black; }
    .print-header { text-align: center; border-bottom: 2px solid black; margin-bottom: 15pt; padding-bottom: 10pt; }
    .print-header h1 { font-size: 18pt; font-weight: bold; margin-bottom: 4pt; }
    .print-header h2 { font-size: 14pt; font-weight: bold; margin-top: 4pt; }
    .print-header p { font-size: 9pt; margin: 2pt 0; }
    table { width: 100%; border-collapse: collapse; margin: 10pt 0; }
    th, td { border: 1px solid black; padding: 4pt; text-align: left; font-size: 8pt; }
    th { background: #f0f0f0; font-weight: bold; text-align: center; }
  </style>
</head>
<body>
  <div class="print-header">
    <h1>VALANT HOSPITAL</h1>
    <p>A-10, Madhav Vihar, Shobhagpura, Udaipur | +91-911911 8000</p>
    <h2>VITAL CHARTS (CLINICAL CHART)</h2>
    <p>Patient: ${patient.first_name} ${patient.last_name} | Bed: ${bedNumber}</p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Date</th><th>Time</th><th>Pulse</th><th>B.P. Syst</th><th>B.P. Diast</th>
        <th>RESP</th><th>TEMP</th><th>SpO2</th><th>Pain Score</th><th>GCS</th><th>Sign</th>
      </tr>
    </thead>
    <tbody>
      ${vitalEntries.map(entry => `
        <tr>
          <td>${entry.date}</td><td>${entry.time}</td><td>${entry.pulse}</td>
          <td>${entry.bpSyst}</td><td>${entry.bpDiast}</td><td>${entry.resp}</td>
          <td>${entry.temp}</td><td>${entry.spo2}</td><td>${entry.painScore}</td>
          <td>${entry.gcs}</td><td>${entry.sign}</td>
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
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Vital Charts (Clinical Chart)</h2>
            <p className="text-sm text-gray-600">
              Patient: {patient.first_name} {patient.last_name} | Bed: {bedNumber}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <span>🖨️</span> Print Chart
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Patient Information */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Patient Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                  <input
                    type="text"
                    value={patient.patient_id}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IPD No.</label>
                  <input
                    type="text"
                    value={effectiveIPDNumber || 'IPD Number Not Available'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bed Number</label>
                  <input
                    type="text"
                    value={bedNumber}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Vital Signs Monitoring</h3>
                <button
                  type="button"
                  onClick={addVitalEntry}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
                >
                  <span>➕</span> Add Row
                </button>
              </div>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Date</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Time</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Pulse</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold" colSpan={2}>B.P.</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">RESP</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">TEMP</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">SpO2</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Pain Score</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">GCS</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Sign</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Action</th>
                  </tr>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2"></th>
                    <th className="border border-gray-300 p-2"></th>
                    <th className="border border-gray-300 p-2"></th>
                    <th className="border border-gray-300 p-2 text-xs">Syst</th>
                    <th className="border border-gray-300 p-2 text-xs">Diast</th>
                    <th className="border border-gray-300 p-2"></th>
                    <th className="border border-gray-300 p-2"></th>
                    <th className="border border-gray-300 p-2"></th>
                    <th className="border border-gray-300 p-2"></th>
                    <th className="border border-gray-300 p-2"></th>
                    <th className="border border-gray-300 p-2"></th>
                    <th className="border border-gray-300 p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {vitalEntries.map((entry, index) => (
                    <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="date"
                          value={entry.date}
                          onChange={(e) => {
                            const updated = [...vitalEntries];
                            updated[index] = { ...entry, date: e.target.value };
                            setVitalEntries(updated);
                          }}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="time"
                          value={entry.time}
                          onChange={(e) => {
                            const updated = [...vitalEntries];
                            updated[index] = { ...entry, time: e.target.value };
                            setVitalEntries(updated);
                          }}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={entry.pulse}
                          onChange={(e) => {
                            const updated = [...vitalEntries];
                            updated[index] = { ...entry, pulse: e.target.value };
                            setVitalEntries(updated);
                          }}
                          placeholder="BPM"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={entry.bpSyst}
                          onChange={(e) => {
                            const updated = [...vitalEntries];
                            updated[index] = { ...entry, bpSyst: e.target.value };
                            setVitalEntries(updated);
                          }}
                          placeholder="Syst"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={entry.bpDiast}
                          onChange={(e) => {
                            const updated = [...vitalEntries];
                            updated[index] = { ...entry, bpDiast: e.target.value };
                            setVitalEntries(updated);
                          }}
                          placeholder="Diast"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={entry.resp}
                          onChange={(e) => {
                            const updated = [...vitalEntries];
                            updated[index] = { ...entry, resp: e.target.value };
                            setVitalEntries(updated);
                          }}
                          placeholder="/min"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={entry.temp}
                          onChange={(e) => {
                            const updated = [...vitalEntries];
                            updated[index] = { ...entry, temp: e.target.value };
                            setVitalEntries(updated);
                          }}
                          placeholder="°F"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={entry.spo2}
                          onChange={(e) => {
                            const updated = [...vitalEntries];
                            updated[index] = { ...entry, spo2: e.target.value };
                            setVitalEntries(updated);
                          }}
                          placeholder="%"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={entry.painScore}
                          onChange={(e) => {
                            const updated = [...vitalEntries];
                            updated[index] = { ...entry, painScore: e.target.value };
                            setVitalEntries(updated);
                          }}
                          placeholder="0-10"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={entry.gcs}
                          onChange={(e) => {
                            const updated = [...vitalEntries];
                            updated[index] = { ...entry, gcs: e.target.value };
                            setVitalEntries(updated);
                          }}
                          placeholder="15"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={entry.sign}
                          onChange={(e) => {
                            const updated = [...vitalEntries];
                            updated[index] = { ...entry, sign: e.target.value };
                            setVitalEntries(updated);
                          }}
                          placeholder="Initials"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeVitalEntry(entry.id)}
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
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-8 border-t">
            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 flex items-center gap-2 shadow-md"
            >
              <span>💾</span>
              Save Vital Charts
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VitalChartsForm;