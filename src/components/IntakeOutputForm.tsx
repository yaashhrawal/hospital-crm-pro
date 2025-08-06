import React, { useState, useEffect } from 'react';
import type { PatientWithRelations } from '../config/supabaseNew';
import toast from 'react-hot-toast';

interface IntakeOutputFormProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientWithRelations;
  bedNumber: number;
  ipdNumber?: string;
  onSubmit: (intakeOutputData: any) => void;
  savedData?: any; // Previously saved form data
}

interface IntakeOutputEntry {
  id: string;
  date: string;
  time: string;
  oralFeeding: string;
  oralAmount: string;
  iv01: string;
  iv02: string;
  rtAspiration: string;
  urine: string;
  vomit: string;
  stool: string;
  drain1: string;
  drain2: string;
}

const IntakeOutputForm: React.FC<IntakeOutputFormProps> = ({
  isOpen,
  onClose,
  patient,
  bedNumber,
  ipdNumber,
  onSubmit,
  savedData
}) => {
  const [intakeOutputEntries, setIntakeOutputEntries] = useState<IntakeOutputEntry[]>(
    savedData?.intakeOutputEntries || [{
      id: `io-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      oralFeeding: '',
      oralAmount: '',
      iv01: '',
      iv02: '',
      rtAspiration: '',
      urine: '',
      vomit: '',
      stool: '',
      drain1: '',
      drain2: ''
    }]
  );

  const [totalIntake, setTotalIntake] = useState(savedData?.totalIntake || '0');
  const [totalOutput, setTotalOutput] = useState(savedData?.totalOutput || '0');
  const [balance, setBalance] = useState(savedData?.balance || '0');
  const [previousDayBalance, setPreviousDayBalance] = useState(savedData?.previousDayBalance || '');
  const [remarks, setRemarks] = useState(savedData?.remarks || '');

  // Calculate totals automatically
  const calculateTotals = () => {
    let intake = 0;
    let output = 0;

    intakeOutputEntries.forEach(entry => {
      // Calculate intake from: oralAmount, iv01, iv02
      const oralAmount = parseFloat(entry.oralAmount) || 0;
      const iv01 = parseFloat(entry.iv01) || 0;
      const iv02 = parseFloat(entry.iv02) || 0;
      intake += oralAmount + iv01 + iv02;

      // Calculate output from: rtAspiration, urine, vomit, drain1, drain2
      const rtAspiration = parseFloat(entry.rtAspiration) || 0;
      const urine = parseFloat(entry.urine) || 0;
      const vomit = parseFloat(entry.vomit) || 0;
      const drain1 = parseFloat(entry.drain1) || 0;
      const drain2 = parseFloat(entry.drain2) || 0;
      output += rtAspiration + urine + vomit + drain1 + drain2;
    });

    const calculatedBalance = intake - output;

    setTotalIntake(intake.toString());
    setTotalOutput(output.toString());
    setBalance(calculatedBalance.toString());
  };

  // Recalculate totals whenever entries change
  useEffect(() => {
    calculateTotals();
  }, [intakeOutputEntries]);

  const addIntakeOutputEntry = () => {
    const newEntry: IntakeOutputEntry = {
      id: `io-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      oralFeeding: '',
      oralAmount: '',
      iv01: '',
      iv02: '',
      rtAspiration: '',
      urine: '',
      vomit: '',
      stool: '',
      drain1: '',
      drain2: ''
    };
    setIntakeOutputEntries([...intakeOutputEntries, newEntry]);
  };

  const removeIntakeOutputEntry = (entryId: string) => {
    if (intakeOutputEntries.length > 1) {
      setIntakeOutputEntries(intakeOutputEntries.filter(entry => entry.id !== entryId));
    } else {
      toast.error('At least one intake/output entry must remain');
    }
  };

  // Helper function to update entry and trigger recalculation
  const updateEntry = (index: number, field: keyof IntakeOutputEntry, value: string) => {
    const updated = [...intakeOutputEntries];
    updated[index] = { ...updated[index], [field]: value };
    setIntakeOutputEntries(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const intakeOutputData = {
      patientId: patient.id,
      bedNumber,
      intakeOutputEntries,
      intakeOutputSummary: {
        totalIntake,
        totalOutput,
        balance,
        previousDayBalance,
        remarks
      },
      submittedAt: new Date().toISOString()
    };

    onSubmit(intakeOutputData);
    toast.success('Intake & Output Record saved successfully');
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
  <title>Intake & Output Record - ${patient.first_name} ${patient.last_name}</title>
  <meta charset="utf-8">
  <style>
    @page { margin: 0.5in; size: A4 landscape; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 9pt; line-height: 1.3; color: black; }
    .print-header { text-align: center; border-bottom: 2px solid black; margin-bottom: 15pt; padding-bottom: 10pt; }
    .print-header h1 { font-size: 16pt; font-weight: bold; margin-bottom: 4pt; }
    .print-header h2 { font-size: 12pt; font-weight: bold; margin-top: 4pt; }
    .print-header p { font-size: 8pt; margin: 2pt 0; }
    table { width: 100%; border-collapse: collapse; margin: 10pt 0; }
    th, td { border: 1px solid black; padding: 3pt; text-align: center; font-size: 7pt; }
    th { background: #f0f0f0; font-weight: bold; }
    .summary { margin-top: 15pt; }
    .summary-table { width: 50%; }
  </style>
</head>
<body>
  <div class="print-header">
    <h1>VALANT HOSPITAL</h1>
    <p>A-10, Madhav Vihar, Shobhagpura, Udaipur | +91-911911 8000</p>
    <h2>INTAKE AND OUTPUT RECORD</h2>
    <p>Patient: ${patient.first_name} ${patient.last_name} | Bed: ${bedNumber}</p>
  </div>
  
  <table>
    <thead>
      <tr>
        <th rowspan="2">Date</th>
        <th rowspan="2">Time</th>
        <th colspan="4">INTAKE</th>
        <th colspan="6">OUTPUT</th>
      </tr>
      <tr>
        <th>Oral/RT Feeding Type</th>
        <th>Amount<br>(ml)</th>
        <th>IV-01<br>(ml)</th>
        <th>IV-02<br>(ml)</th>
        <th>RT Aspiration<br>(ml)</th>
        <th>Urine<br>(ml)</th>
        <th>Vomit<br>(ml)</th>
        <th>Stool<br>(No. of times)</th>
        <th>Drain-1<br>(ml)</th>
        <th>Drain-2<br>(ml)</th>
      </tr>
    </thead>
    <tbody>
      ${intakeOutputEntries.map(entry => `
        <tr>
          <td>${entry.date}</td>
          <td>${entry.time}</td>
          <td>${entry.oralFeeding}</td>
          <td>${entry.oralAmount || ''}</td>
          <td>${entry.iv01 || ''}</td>
          <td>${entry.iv02 || ''}</td>
          <td>${entry.rtAspiration || ''}</td>
          <td>${entry.urine || ''}</td>
          <td>${entry.vomit || ''}</td>
          <td>${entry.stool || ''}</td>
          <td>${entry.drain1 || ''}</td>
          <td>${entry.drain2 || ''}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="summary">
    <table class="summary-table">
      <tr><th>Total Intake (ml)</th><td>${totalIntake || ''}</td></tr>
      <tr><th>Total Output (ml)</th><td>${totalOutput || ''}</td></tr>
      <tr><th>Balance (ml)</th><td>${balance || ''}</td></tr>
      <tr><th>Previous Day Balance (ml)</th><td>${previousDayBalance || ''}</td></tr>
      <tr><th>Remarks</th><td>${remarks || ''}</td></tr>
    </table>
  </div>
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
            <h2 className="text-xl font-bold text-gray-800">Intake and Output Record</h2>
            <p className="text-sm text-gray-600">
              Patient: {patient.first_name} {patient.last_name} | Bed: {bedNumber}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <span>🖨️</span> Print Record
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
            <div className="bg-green-50 p-4 rounded-lg">
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
                    value={ipdNumber || 'IPD Number Not Available'}
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
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Fluid Intake and Output Monitoring</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    📊 Fields with chart icons automatically calculate totals. 
                    <span className="text-blue-600">Blue = Intake</span>, <span className="text-red-600">Red = Output</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={addIntakeOutputEntry}
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
                    <th className="border border-gray-300 p-3 text-sm font-semibold text-center" colSpan={4}>INTAKE</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold text-center" colSpan={6}>OUTPUT</th>
                    <th className="border border-gray-300 p-3 text-sm font-semibold">Action</th>
                  </tr>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2"></th>
                    <th className="border border-gray-300 p-2"></th>
                    <th className="border border-gray-300 p-2 text-xs">Oral/RT Feeding Type</th>
                    <th className="border border-gray-300 p-2 text-xs bg-blue-100">Amount (ml) 📊</th>
                    <th className="border border-gray-300 p-2 text-xs bg-blue-100">IV-01 (ml) 📊</th>
                    <th className="border border-gray-300 p-2 text-xs bg-blue-100">IV-02 (ml) 📊</th>
                    <th className="border border-gray-300 p-2 text-xs bg-red-100">RT Aspiration (ml) 📊</th>
                    <th className="border border-gray-300 p-2 text-xs bg-red-100">Urine (ml) 📊</th>
                    <th className="border border-gray-300 p-2 text-xs bg-red-100">Vomit (ml) 📊</th>
                    <th className="border border-gray-300 p-2 text-xs">Stool (No. of times)</th>
                    <th className="border border-gray-300 p-2 text-xs bg-red-100">Drain-1 (ml) 📊</th>
                    <th className="border border-gray-300 p-2 text-xs bg-red-100">Drain-2 (ml) 📊</th>
                    <th className="border border-gray-300 p-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {intakeOutputEntries.map((entry, index) => (
                    <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="date"
                          value={entry.date}
                          onChange={(e) => updateEntry(index, 'date', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="time"
                          value={entry.time}
                          onChange={(e) => updateEntry(index, 'time', e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="text"
                          value={entry.oralFeeding}
                          onChange={(e) => updateEntry(index, 'oralFeeding', e.target.value)}
                          placeholder="Type"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2 bg-blue-50">
                        <input
                          type="number"
                          value={entry.oralAmount}
                          onChange={(e) => updateEntry(index, 'oralAmount', e.target.value)}
                          placeholder="ml"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                        />
                      </td>
                      <td className="border border-gray-300 p-2 bg-blue-50">
                        <input
                          type="number"
                          value={entry.iv01}
                          onChange={(e) => updateEntry(index, 'iv01', e.target.value)}
                          placeholder="ml"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                        />
                      </td>
                      <td className="border border-gray-300 p-2 bg-blue-50">
                        <input
                          type="number"
                          value={entry.iv02}
                          onChange={(e) => updateEntry(index, 'iv02', e.target.value)}
                          placeholder="ml"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50"
                        />
                      </td>
                      <td className="border border-gray-300 p-2 bg-red-50">
                        <input
                          type="number"
                          value={entry.rtAspiration}
                          onChange={(e) => updateEntry(index, 'rtAspiration', e.target.value)}
                          placeholder="ml"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50"
                        />
                      </td>
                      <td className="border border-gray-300 p-2 bg-red-50">
                        <input
                          type="number"
                          value={entry.urine}
                          onChange={(e) => updateEntry(index, 'urine', e.target.value)}
                          placeholder="ml"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50"
                        />
                      </td>
                      <td className="border border-gray-300 p-2 bg-red-50">
                        <input
                          type="number"
                          value={entry.vomit}
                          onChange={(e) => updateEntry(index, 'vomit', e.target.value)}
                          placeholder="ml"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50"
                        />
                      </td>
                      <td className="border border-gray-300 p-2">
                        <input
                          type="number"
                          value={entry.stool}
                          onChange={(e) => updateEntry(index, 'stool', e.target.value)}
                          placeholder="Times"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="border border-gray-300 p-2 bg-red-50">
                        <input
                          type="number"
                          value={entry.drain1}
                          onChange={(e) => updateEntry(index, 'drain1', e.target.value)}
                          placeholder="ml"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50"
                        />
                      </td>
                      <td className="border border-gray-300 p-2 bg-red-50">
                        <input
                          type="number"
                          value={entry.drain2}
                          onChange={(e) => updateEntry(index, 'drain2', e.target.value)}
                          placeholder="ml"
                          className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-red-500 bg-red-50"
                        />
                      </td>
                      <td className="border border-gray-300 p-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeIntakeOutputEntry(entry.id)}
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

            {/* Summary Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Daily Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Intake (ml) <span className="text-xs text-blue-600">(Auto-calculated)</span>
                  </label>
                  <input
                    type="text"
                    value={totalIntake}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-blue-50 text-blue-900 font-semibold cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Output (ml) <span className="text-xs text-red-600">(Auto-calculated)</span>
                  </label>
                  <input
                    type="text"
                    value={totalOutput}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-red-50 text-red-900 font-semibold cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Balance (ml) <span className="text-xs text-green-600">(Auto-calculated)</span>
                  </label>
                  <input
                    type="text"
                    value={balance}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-green-50 text-green-900 font-semibold cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Previous Day Balance (ml)</label>
                  <input
                    type="text"
                    value={previousDayBalance}
                    onChange={(e) => setPreviousDayBalance(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                  <textarea
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
              Save Intake & Output Record
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IntakeOutputForm;