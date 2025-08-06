import React, { useState, useEffect } from 'react';
import type { PatientWithRelations } from '../config/supabaseNew';
import toast from 'react-hot-toast';

interface NursesOrdersProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientWithRelations;
  bedNumber: number;
  onSubmit: (nursesOrdersData: any) => void;
  initialTab?: string; // Optional parameter to set which tab to open initially
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

interface CarePlanEntry {
  id: string;
  assessment: string;
  goal: string;
  plannedCare: string;
  evaluation: string;
  dateTime: string;
  nameSign: string;
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

const NursesOrders: React.FC<NursesOrdersProps> = ({
  isOpen,
  onClose,
  patient,
  bedNumber,
  onSubmit,
  initialTab = 'vitals'
}) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // Vital Charts State
  const [vitalEntries, setVitalEntries] = useState<VitalEntry[]>([{
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
  }]);

  // Intake Output State
  const [intakeOutputEntries, setIntakeOutputEntries] = useState<IntakeOutputEntry[]>([{
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
  }]);

  const [totalIntake, setTotalIntake] = useState('');
  const [totalOutput, setTotalOutput] = useState('');
  const [balance, setBalance] = useState('');
  const [previousDayBalance, setPreviousDayBalance] = useState('');
  const [remarks, setRemarks] = useState('');

  // Medication Chart State
  const [medicationPatientInfo, setMedicationPatientInfo] = useState({
    patientName: '',
    ageSex: '',
    dayOfAdmission: '',
    consultant: '',
    date: new Date().toISOString().split('T')[0],
    pod: '',
    allergy: '',
    diagnosisSurgery: '',
    diet: '',
    investigation: '',
    rbs: ''
  });

  const [medicationEntries, setMedicationEntries] = useState<MedicationEntry[]>([{
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
  }]);

  // Nursing Care Plan State
  const [carePlanPatientInfo, setCarePlanPatientInfo] = useState({
    patientName: '',
    uhid: '',
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

  // Diabetic Flow Chart State
  const [diabeticPatientInfo, setDiabeticPatientInfo] = useState({
    patientName: '',
    uhid: '',
    ipNo: '',
    ageSex: '',
    department: '',
    doctor: ''
  });

  const [diabeticEntries, setDiabeticEntries] = useState<DiabeticEntry[]>([{
    id: `diabetic-${Date.now()}`,
    dateTime: new Date().toISOString().slice(0, 16),
    bloodSugar: '',
    medicationName: '',
    medicationDose: '',
    route: '',
    sign: ''
  }]);

  // Nurses Notes State
  const [nursesNotes, setNursesNotes] = useState({
    morningNotes: '',
    morningSign: '',
    eveningNotes: '',
    eveningSign: '',
    nightNotes: '',
    nightSign: ''
  });

  // Update active tab when initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Auto-populate patient data when opened
  useEffect(() => {
    if (isOpen && patient) {
      const patientName = `${patient.first_name} ${patient.last_name}`;
      const ageSex = `${patient.age || 'N/A'}/${patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : patient.gender}`;
      
      // Update medication chart patient info
      setMedicationPatientInfo(prev => ({
        ...prev,
        patientName,
        ageSex
      }));

      // Update care plan patient info
      setCarePlanPatientInfo(prev => ({
        ...prev,
        patientName,
        ageSex
      }));

      // Update diabetic chart patient info
      setDiabeticPatientInfo(prev => ({
        ...prev,
        patientName,
        ageSex
      }));
    }
  }, [isOpen, patient]);

  // Add new entries functions
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const nursesOrdersData = {
      patientId: patient.id,
      bedNumber,
      vitalEntries,
      intakeOutputEntries,
      intakeOutputSummary: {
        totalIntake,
        totalOutput,
        balance,
        previousDayBalance,
        remarks
      },
      medicationPatientInfo,
      medicationEntries,
      carePlanPatientInfo,
      carePlanEntries,
      diabeticPatientInfo,
      diabeticEntries,
      nursesNotes,
      submittedAt: new Date().toISOString()
    };

    onSubmit(nursesOrdersData);
    toast.success('Nurses Orders saved successfully');
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
  <title>Nurses Orders - ${patient.first_name} ${patient.last_name}</title>
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
    .section-title { font-size: 12pt; font-weight: bold; margin: 15pt 0 8pt 0; page-break-after: avoid; }
    .summary-section { margin: 10pt 0; }
    .summary-table { width: 60%; }
  </style>
</head>
<body>
  <div class="print-header">
    <h1>VALANT HOSPITAL</h1>
    <p>A-10, Madhav Vihar, Shobhagpura, Udaipur | +91-911911 8000</p>
    <h2>NURSES ORDERS</h2>
    <p>Patient: ${patient.first_name} ${patient.last_name} | Bed: ${bedNumber}</p>
  </div>
  
  <div class="section-title">1. VITAL CHARTS</div>
  <table>
    <thead>
      <tr>
        <th>Date</th><th>Time</th><th>Pulse<br>(BPM)</th><th>B.P. Syst<br>(mmHg)</th><th>B.P. Diast<br>(mmHg)</th>
        <th>RESP<br>(/min)</th><th>TEMP<br>(°F)</th><th>SpO2<br>(%)</th><th>Pain Score<br>(0-10)</th><th>GCS</th><th>Sign</th>
      </tr>
    </thead>
    <tbody>
      ${vitalEntries.map(entry => `
        <tr>
          <td>${entry.date}</td><td>${entry.time}</td>
          <td>${entry.pulse || ''}</td>
          <td>${entry.bpSyst || ''}</td>
          <td>${entry.bpDiast || ''}</td>
          <td>${entry.resp || ''}</td>
          <td>${entry.temp || ''}</td>
          <td>${entry.spo2 || ''}</td>
          <td>${entry.painScore || ''}</td>
          <td>${entry.gcs || ''}</td><td>${entry.sign || ''}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="section-title">2. INTAKE AND OUTPUT RECORD</div>
  <table>
    <thead>
      <tr>
        <th>Date</th><th>Time</th><th>Oral/RT Feeding Type</th><th>Amount<br>(ml)</th>
        <th>IV-01<br>(ml)</th><th>IV-02<br>(ml)</th><th>RT Aspiration<br>(ml)</th><th>Urine<br>(ml)</th>
        <th>Vomit<br>(ml)</th><th>Stool<br>(times)</th><th>Drain-1<br>(ml)</th><th>Drain-2<br>(ml)</th>
      </tr>
    </thead>
    <tbody>
      ${intakeOutputEntries.map(entry => `
        <tr>
          <td>${entry.date}</td><td>${entry.time}</td><td>${entry.oralFeeding}</td>
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
  
  <div class="summary-section">
    <table class="summary-table">
      <tr><th>Total Intake (ml)</th><td>${totalIntake || ''}</td></tr>
      <tr><th>Total Output (ml)</th><td>${totalOutput || ''}</td></tr>
      <tr><th>Balance (ml)</th><td>${balance || ''}</td></tr>
      <tr><th>Previous Day Balance (ml)</th><td>${previousDayBalance || ''}</td></tr>
      <tr><th>Remarks</th><td>${remarks || ''}</td></tr>
    </table>
  </div>

  <div class="section-title">3. MEDICATION CHART</div>
  <div style="margin-bottom: 10pt;">
    <strong>Patient:</strong> ${medicationPatientInfo.patientName} | 
    <strong>Age/Sex:</strong> ${medicationPatientInfo.ageSex} | 
    <strong>Consultant:</strong> ${medicationPatientInfo.consultant}<br>
    <strong>Date:</strong> ${medicationPatientInfo.date} | 
    <strong>POD:</strong> ${medicationPatientInfo.pod} | 
    <strong>Allergy:</strong> ${medicationPatientInfo.allergy}<br>
    <strong>Diagnosis/Surgery:</strong> ${medicationPatientInfo.diagnosisSurgery}
  </div>
  <table>
    <thead>
      <tr>
        <th>S.N.</th><th>Drug Name & Dose</th><th>Route</th>
        <th>Morning Time</th><th>Morning Sign</th><th>Noon Time</th><th>Noon Sign</th>
        <th>Evening Time</th><th>Evening Sign</th><th>Night Time</th><th>Night Sign</th>
      </tr>
    </thead>
    <tbody>
      ${medicationEntries.map(entry => `
        <tr>
          <td>${entry.sn}</td><td>${entry.drugName}</td><td>${entry.route}</td>
          <td>${entry.morningTime}</td><td>${entry.morningName}</td>
          <td>${entry.noonTime}</td><td>${entry.noonName}</td>
          <td>${entry.eveningTime}</td><td>${entry.eveningName}</td>
          <td>${entry.nightTime}</td><td>${entry.nightName}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">4. DIABETIC FLOW CHART</div>
  <div style="margin-bottom: 10pt;">
    <strong>Patient:</strong> ${diabeticPatientInfo.patientName} | 
    <strong>Age/Sex:</strong> ${diabeticPatientInfo.ageSex} | 
    <strong>Department:</strong> ${diabeticPatientInfo.department}<br>
    <strong>UHID:</strong> ${diabeticPatientInfo.uhid} | 
    <strong>IP No:</strong> ${diabeticPatientInfo.ipNo} | 
    <strong>Doctor:</strong> ${diabeticPatientInfo.doctor}
  </div>
  <table>
    <thead>
      <tr>
        <th>Date & Time</th><th>Blood Sugar<br>(mg/dl)</th><th>Medication Name</th>
        <th>Dose</th><th>Route</th><th>Sign</th>
      </tr>
    </thead>
    <tbody>
      ${diabeticEntries.map(entry => `
        <tr>
          <td>${entry.dateTime}</td>
          <td>${entry.bloodSugar || ''}</td>
          <td>${entry.medicationName || ''}</td>
          <td>${entry.medicationDose || ''}</td>
          <td>${entry.route || ''}</td><td>${entry.sign || ''}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">5. NURSING CARE PLAN</div>
  <div style="margin-bottom: 10pt;">
    <strong>Patient:</strong> ${carePlanPatientInfo.patientName} | 
    <strong>Age/Sex:</strong> ${carePlanPatientInfo.ageSex} | 
    <strong>Department:</strong> ${carePlanPatientInfo.department}<br>
    <strong>UHID:</strong> ${carePlanPatientInfo.uhid} | 
    <strong>IP No:</strong> ${carePlanPatientInfo.ipNo} | 
    <strong>Doctor:</strong> ${carePlanPatientInfo.doctor}
  </div>
  <table>
    <thead>
      <tr>
        <th>Assessment/Nursing Diagnosis</th><th>Goal/Expected Outcome</th>
        <th>Planned Care</th><th>Evaluation</th><th>Date/Time</th><th>Name/Sign</th>
      </tr>
    </thead>
    <tbody>
      ${carePlanEntries.map(entry => `
        <tr>
          <td>${entry.assessment}</td><td>${entry.goal}</td><td>${entry.plannedCare}</td>
          <td>${entry.evaluation}</td><td>${entry.dateTime}</td><td>${entry.nameSign}</td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <div class="section-title">6. NURSES NOTES</div>
  <div style="margin-bottom: 15pt;">
    <div style="margin-bottom: 10pt;">
      <strong>Morning Notes:</strong><br>
      <div style="border: 1px solid black; padding: 8pt; margin-top: 4pt; min-height: 60pt;">${nursesNotes.morningNotes}</div>
      <div style="margin-top: 4pt;"><strong>Signature:</strong> ${nursesNotes.morningSign}</div>
    </div>
    
    <div style="margin-bottom: 10pt;">
      <strong>Evening Notes:</strong><br>
      <div style="border: 1px solid black; padding: 8pt; margin-top: 4pt; min-height: 60pt;">${nursesNotes.eveningNotes}</div>
      <div style="margin-top: 4pt;"><strong>Signature:</strong> ${nursesNotes.eveningSign}</div>
    </div>
    
    <div style="margin-bottom: 10pt;">
      <strong>Night Notes:</strong><br>
      <div style="border: 1px solid black; padding: 8pt; margin-top: 4pt; min-height: 60pt;">${nursesNotes.nightNotes}</div>
      <div style="margin-top: 4pt;"><strong>Signature:</strong> ${nursesNotes.nightSign}</div>
    </div>
  </div>
  
</body>
</html>`;
  };

  if (!isOpen) return null;

  const tabs = [
    { id: 'vitals', label: 'Vital Charts', icon: '🩺' },
    { id: 'intake-output', label: 'Intake & Output', icon: '💧' },
    { id: 'medication', label: 'Medication Chart', icon: '💊' },
    { id: 'care-plan', label: 'Care Plan', icon: '📋' },
    { id: 'diabetic', label: 'Diabetic Chart', icon: '🩸' },
    { id: 'notes', label: 'Nurses Notes', icon: '📝' }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-7xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Nurses Orders</h2>
            <p className="text-sm text-gray-600">
              Patient: {patient.first_name} {patient.last_name} | Bed: {bedNumber}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <span>🖨️</span> Print Orders
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex flex-wrap border-b bg-gray-100">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-600 hover:text-gray-800 hover:bg-gray-200'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {/* Tab Content */}
          {activeTab === 'vitals' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Vital Charts (Clinical Chart)</h3>
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
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'intake-output' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">Intake and Output Record</h3>
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
                    </tr>
                    <tr className="bg-gray-50">
                      <th className="border border-gray-300 p-2"></th>
                      <th className="border border-gray-300 p-2"></th>
                      <th className="border border-gray-300 p-2 text-xs">Oral/RT Feeding Type</th>
                      <th className="border border-gray-300 p-2 text-xs">Amount</th>
                      <th className="border border-gray-300 p-2 text-xs">IV-01</th>
                      <th className="border border-gray-300 p-2 text-xs">IV-02</th>
                      <th className="border border-gray-300 p-2 text-xs">RT Aspiration</th>
                      <th className="border border-gray-300 p-2 text-xs">Urine</th>
                      <th className="border border-gray-300 p-2 text-xs">Vomit</th>
                      <th className="border border-gray-300 p-2 text-xs">Stool (No. of times)</th>
                      <th className="border border-gray-300 p-2 text-xs">Drain-1</th>
                      <th className="border border-gray-300 p-2 text-xs">Drain-2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intakeOutputEntries.map((entry, index) => (
                      <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="date"
                            value={entry.date}
                            onChange={(e) => {
                              const updated = [...intakeOutputEntries];
                              updated[index] = { ...entry, date: e.target.value };
                              setIntakeOutputEntries(updated);
                            }}
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="time"
                            value={entry.time}
                            onChange={(e) => {
                              const updated = [...intakeOutputEntries];
                              updated[index] = { ...entry, time: e.target.value };
                              setIntakeOutputEntries(updated);
                            }}
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={entry.oralFeeding}
                            onChange={(e) => {
                              const updated = [...intakeOutputEntries];
                              updated[index] = { ...entry, oralFeeding: e.target.value };
                              setIntakeOutputEntries(updated);
                            }}
                            placeholder="Type"
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={entry.oralAmount}
                            onChange={(e) => {
                              const updated = [...intakeOutputEntries];
                              updated[index] = { ...entry, oralAmount: e.target.value };
                              setIntakeOutputEntries(updated);
                            }}
                            placeholder="ml"
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={entry.iv01}
                            onChange={(e) => {
                              const updated = [...intakeOutputEntries];
                              updated[index] = { ...entry, iv01: e.target.value };
                              setIntakeOutputEntries(updated);
                            }}
                            placeholder="ml"
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={entry.iv02}
                            onChange={(e) => {
                              const updated = [...intakeOutputEntries];
                              updated[index] = { ...entry, iv02: e.target.value };
                              setIntakeOutputEntries(updated);
                            }}
                            placeholder="ml"
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={entry.rtAspiration}
                            onChange={(e) => {
                              const updated = [...intakeOutputEntries];
                              updated[index] = { ...entry, rtAspiration: e.target.value };
                              setIntakeOutputEntries(updated);
                            }}
                            placeholder="ml"
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={entry.urine}
                            onChange={(e) => {
                              const updated = [...intakeOutputEntries];
                              updated[index] = { ...entry, urine: e.target.value };
                              setIntakeOutputEntries(updated);
                            }}
                            placeholder="ml"
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={entry.vomit}
                            onChange={(e) => {
                              const updated = [...intakeOutputEntries];
                              updated[index] = { ...entry, vomit: e.target.value };
                              setIntakeOutputEntries(updated);
                            }}
                            placeholder="ml"
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={entry.stool}
                            onChange={(e) => {
                              const updated = [...intakeOutputEntries];
                              updated[index] = { ...entry, stool: e.target.value };
                              setIntakeOutputEntries(updated);
                            }}
                            placeholder="Times"
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={entry.drain1}
                            onChange={(e) => {
                              const updated = [...intakeOutputEntries];
                              updated[index] = { ...entry, drain1: e.target.value };
                              setIntakeOutputEntries(updated);
                            }}
                            placeholder="ml"
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                        <td className="border border-gray-300 p-2">
                          <input
                            type="text"
                            value={entry.drain2}
                            onChange={(e) => {
                              const updated = [...intakeOutputEntries];
                              updated[index] = { ...entry, drain2: e.target.value };
                              setIntakeOutputEntries(updated);
                            }}
                            placeholder="ml"
                            className="w-full px-2 py-1 text-sm border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Summary Section */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Daily Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Intake (ml)</label>
                    <input
                      type="text"
                      value={totalIntake}
                      onChange={(e) => setTotalIntake(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Total Output (ml)</label>
                    <input
                      type="text"
                      value={totalOutput}
                      onChange={(e) => setTotalOutput(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Balance (ml)</label>
                    <input
                      type="text"
                      value={balance}
                      onChange={(e) => setBalance(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          )}

          {activeTab === 'medication' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Nurses Medication Chart</h3>
              
              {/* Patient Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Patient Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      </tr>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2"></th>
                        <th className="border border-gray-300 p-2"></th>
                        <th className="border border-gray-300 p-2"></th>
                        <th className="border border-gray-300 p-2 text-xs" colSpan={2}>Morning</th>
                        <th className="border border-gray-300 p-2 text-xs" colSpan={2}>Noon</th>
                        <th className="border border-gray-300 p-2 text-xs" colSpan={2}>Evening</th>
                        <th className="border border-gray-300 p-2 text-xs" colSpan={2}>Night</th>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'care-plan' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Nursing Care Plan</h3>
              
              {/* Patient Information */}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">UHID</label>
                    <input
                      type="text"
                      value={carePlanPatientInfo.uhid}
                      onChange={(e) => setCarePlanPatientInfo(prev => ({ ...prev, uhid: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IP No.</label>
                    <input
                      type="text"
                      value={carePlanPatientInfo.ipNo}
                      onChange={(e) => setCarePlanPatientInfo(prev => ({ ...prev, ipNo: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              {/* Care Plan Table */}
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'diabetic' && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">Diabetic Flow Chart</h3>
              
              {/* Patient Information */}
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
                    <label className="block text-sm font-medium text-gray-700 mb-1">UHID</label>
                    <input
                      type="text"
                      value={diabeticPatientInfo.uhid}
                      onChange={(e) => setDiabeticPatientInfo(prev => ({ ...prev, uhid: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">IP No.</label>
                    <input
                      type="text"
                      value={diabeticPatientInfo.ipNo}
                      onChange={(e) => setDiabeticPatientInfo(prev => ({ ...prev, ipNo: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

              {/* Diabetic Monitoring Table */}
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
                      </tr>
                      <tr className="bg-gray-50">
                        <th className="border border-gray-300 p-2"></th>
                        <th className="border border-gray-300 p-2"></th>
                        <th className="border border-gray-300 p-2 text-xs">Name</th>
                        <th className="border border-gray-300 p-2 text-xs">Dose</th>
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notes' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">Nurses Notes</h3>
              
              {/* Morning Notes */}
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Morning Notes</h4>
                <div className="space-y-3">
                  <textarea
                    value={nursesNotes.morningNotes}
                    onChange={(e) => setNursesNotes(prev => ({ ...prev, morningNotes: e.target.value }))}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    placeholder="Enter morning shift nursing observations, patient condition, and care provided..."
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Signature:</label>
                    <input
                      type="text"
                      value={nursesNotes.morningSign}
                      onChange={(e) => setNursesNotes(prev => ({ ...prev, morningSign: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Name and signature"
                    />
                  </div>
                </div>
              </div>

              {/* Evening Notes */}
              <div className="bg-orange-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Evening Notes</h4>
                <div className="space-y-3">
                  <textarea
                    value={nursesNotes.eveningNotes}
                    onChange={(e) => setNursesNotes(prev => ({ ...prev, eveningNotes: e.target.value }))}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    placeholder="Enter evening shift nursing observations, patient condition, and care provided..."
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Signature:</label>
                    <input
                      type="text"
                      value={nursesNotes.eveningSign}
                      onChange={(e) => setNursesNotes(prev => ({ ...prev, eveningSign: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Name and signature"
                    />
                  </div>
                </div>
              </div>

              {/* Night Notes */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-3">Night Notes</h4>
                <div className="space-y-3">
                  <textarea
                    value={nursesNotes.nightNotes}
                    onChange={(e) => setNursesNotes(prev => ({ ...prev, nightNotes: e.target.value }))}
                    rows={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                    placeholder="Enter night shift nursing observations, patient condition, and care provided..."
                  />
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-medium text-gray-700">Signature:</label>
                    <input
                      type="text"
                      value={nursesNotes.nightSign}
                      onChange={(e) => setNursesNotes(prev => ({ ...prev, nightSign: e.target.value }))}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Name and signature"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-center pt-8 border-t">
            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 flex items-center gap-2 shadow-md"
            >
              <span>💾</span>
              Save Nurses Orders
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NursesOrders;