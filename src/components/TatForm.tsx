import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface TatFormData {
  // Patient Information
  consultantName: string;
  patientName: string;
  arrivalDateTime: string;
  ageSex: string;
  department: string;
  uhidIpNo: string;
  receivingStaff: string;
  historyGivenBy: 'patient' | 'relative' | '';

  // Arrival & Vitals
  arrivalBy: {
    stretcher: boolean;
    wheelChair: boolean;
    ambulatory: boolean;
    other: boolean;
    otherSpecify: string;
  };
  height: string;
  weight: string;
  unableToStandDue: string;
  vitals: {
    temp: string;
    pulse: string;
    bp: string;
    spo2: string;
    resp: string;
  };
  levelOfConsciousness: {
    conscious: boolean;
    semiConscious: boolean;
    unconscious: boolean;
  };
  psychologicalStatus: {
    calm: boolean;
    anxious: boolean;
    withdrawn: boolean;
    agitated: boolean;
    depressed: boolean;
    sleepy: boolean;
  };
  provisionalDiagnosis: string;

  // Medical History
  historyOfAllergy: 'yes' | 'no' | '';
  allergyDescription: string;
  medicationsOnAdmission: 'yes' | 'no' | '';
  medicationsDescription: string;
  medications: Array<{
    srNo: number;
    name: string;
    doses: string;
    timing: string;
  }>;

  // Patient Status and Assessment
  anyDeformities: 'yes' | 'no' | '';
  deformitiesSpecify: string;
  patientItems: {
    denture: boolean;
    contactLenses: boolean;
    artificialLimbs: boolean;
    implants: boolean;
  };
  onAdmission: {
    rylesTube: boolean;
    centralLine: boolean;
    foleysCath: boolean;
    etTube: boolean;
    ttTube: boolean;
    arterialLine: boolean;
    gastroJejunostomy: boolean;
    ivLine: boolean;
    slab: boolean;
    other: boolean;
  };
  pressureSore: 'yes' | 'no' | '';
  pressureSoreLocation: string;
  pressureSoreStage: '1' | '2' | '3' | '4' | '';

  // Patient Safety
  sideRailingUp: 'yes' | 'no' | '';
  callBellWorking: 'yes' | 'no' | '';

  // Major Surgical History
  majorSurgicalHistory: string;
  pastMedicalHistory: string;

  // Vulnerable Assessment
  patientVulnerable: 'yes' | 'no' | '';
  vulnerableCategories: {
    ageCategory: 'yes' | 'no' | '';
    physicallyDisabled: 'yes' | 'no' | '';
    mentallyDisabled: 'yes' | 'no' | '';
    terminallyIll: 'yes' | 'no' | '';
    unableToSpeak: 'yes' | 'no' | '';
    alteredConsciousness: 'yes' | 'no' | '';
    epilepticFit: 'yes' | 'no' | '';
    medicationRelated: 'yes' | 'no' | '';
    absenceOfRelative: 'yes' | 'no' | '';
    immuneCompromised: 'yes' | 'no' | '';
  };

  // GCS Score
  gcsScore: {
    eyeOpening: {
      spontaneous: boolean;
      toVoice: boolean;
      toPain: boolean;
      none: boolean;
    };
    motorResponse: {
      obeysCommands: boolean;
      localizesToPain: boolean;
      withdrawsFromPain: boolean;
      flexionToPain: boolean;
      extensionToPain: boolean;
      none: boolean;
    };
    verbalResponse: {
      oriented: boolean;
      confused: boolean;
      inappropriateWords: boolean;
      incomprehensibleSounds: boolean;
      none: boolean;
    };
  };

  // Patient Valuables
  valuables: Array<{
    srNo: number;
    itemName: string;
    quantity: string;
  }>;

  // Staff Signatures
  nursingStaffName: string;
  nursingStaffDateTime: string;
  patientRelativeName: string;
  patientRelativeDateTime: string;
  relationToPatient: string;
}

interface TatFormProps {
  patientId?: string;
  bedNumber?: string;
  onClose: () => void;
  onSave?: (data: TatFormData) => void;
}

const TatForm: React.FC<TatFormProps> = ({ patientId, bedNumber, onClose, onSave }) => {
  const [formData, setFormData] = useState<TatFormData>({
    consultantName: '',
    patientName: '',
    arrivalDateTime: new Date().toISOString().slice(0, 16),
    ageSex: '',
    department: '',
    uhidIpNo: '',
    receivingStaff: '',
    historyGivenBy: '',
    arrivalBy: {
      stretcher: false,
      wheelChair: false,
      ambulatory: false,
      other: false,
      otherSpecify: '',
    },
    height: '',
    weight: '',
    unableToStandDue: '',
    vitals: {
      temp: '',
      pulse: '',
      bp: '',
      spo2: '',
      resp: '',
    },
    levelOfConsciousness: {
      conscious: false,
      semiConscious: false,
      unconscious: false,
    },
    psychologicalStatus: {
      calm: false,
      anxious: false,
      withdrawn: false,
      agitated: false,
      depressed: false,
      sleepy: false,
    },
    provisionalDiagnosis: '',
    historyOfAllergy: '',
    allergyDescription: '',
    medicationsOnAdmission: '',
    medicationsDescription: '',
    medications: [
      { srNo: 1, name: '', doses: '', timing: '' },
      { srNo: 2, name: '', doses: '', timing: '' },
      { srNo: 3, name: '', doses: '', timing: '' },
    ],
    anyDeformities: '',
    deformitiesSpecify: '',
    patientItems: {
      denture: false,
      contactLenses: false,
      artificialLimbs: false,
      implants: false,
    },
    onAdmission: {
      rylesTube: false,
      centralLine: false,
      foleysCath: false,
      etTube: false,
      ttTube: false,
      arterialLine: false,
      gastroJejunostomy: false,
      ivLine: false,
      slab: false,
      other: false,
    },
    pressureSore: '',
    pressureSoreLocation: '',
    pressureSoreStage: '',
    sideRailingUp: '',
    callBellWorking: '',
    majorSurgicalHistory: '',
    pastMedicalHistory: '',
    patientVulnerable: '',
    vulnerableCategories: {
      ageCategory: '',
      physicallyDisabled: '',
      mentallyDisabled: '',
      terminallyIll: '',
      unableToSpeak: '',
      alteredConsciousness: '',
      epilepticFit: '',
      medicationRelated: '',
      absenceOfRelative: '',
      immuneCompromised: '',
    },
    gcsScore: {
      eyeOpening: {
        spontaneous: false,
        toVoice: false,
        toPain: false,
        none: false,
      },
      motorResponse: {
        obeysCommands: false,
        localizesToPain: false,
        withdrawsFromPain: false,
        flexionToPain: false,
        extensionToPain: false,
        none: false,
      },
      verbalResponse: {
        oriented: false,
        confused: false,
        inappropriateWords: false,
        incomprehensibleSounds: false,
        none: false,
      },
    },
    valuables: [
      { srNo: 1, itemName: '', quantity: '' },
      { srNo: 2, itemName: '', quantity: '' },
      { srNo: 3, itemName: '', quantity: '' },
    ],
    nursingStaffName: '',
    nursingStaffDateTime: new Date().toISOString().slice(0, 16),
    patientRelativeName: '',
    patientRelativeDateTime: new Date().toISOString().slice(0, 16),
    relationToPatient: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('TAT Form Data:', formData);
      
      if (onSave) {
        onSave(formData);
      }
      
      toast.success('TAT Form saved successfully!');
      onClose();
    } catch (error: any) {
      console.error('Error saving TAT form:', error);
      toast.error(`Failed to save TAT form: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addMedicationRow = () => {
    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, { srNo: prev.medications.length + 1, name: '', doses: '', timing: '' }]
    }));
  };

  const deleteMedicationRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter((_, i) => i !== index).map((med, i) => ({ ...med, srNo: i + 1 }))
    }));
  };

  const addValuableRow = () => {
    setFormData(prev => ({
      ...prev,
      valuables: [...prev.valuables, { srNo: prev.valuables.length + 1, itemName: '', quantity: '' }]
    }));
  };

  const deleteValuableRow = (index: number) => {
    setFormData(prev => ({
      ...prev,
      valuables: prev.valuables.filter((_, i) => i !== index).map((val, i) => ({ ...val, srNo: i + 1 }))
    }));
  };

  return (
    <>
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .tat-form-content, .tat-form-content * {
              visibility: visible;
            }
            .tat-form-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              max-width: none !important;
              max-height: none !important;
              overflow: visible !important;
            }
            .no-print {
              display: none !important;
            }
            .print-break {
              page-break-after: always;
            }
            table {
              page-break-inside: avoid;
            }
            .bg-blue-50, .bg-green-50, .bg-yellow-50, .bg-purple-50, 
            .bg-red-50, .bg-indigo-50, .bg-orange-50, .bg-teal-50, 
            .bg-pink-50, .bg-gray-50 {
              background-color: #f9f9f9 !important;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        `}
      </style>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden tat-form-content">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                📋 Initial Nursing Assessment (TAT Form)
              </h2>
              <p className="text-gray-600">
                {bedNumber && `Bed: ${bedNumber}`} • Turn Around Time Assessment
              </p>
            </div>
            <div className="flex gap-2 no-print">
              <button
                onClick={() => window.print()}
                className="bg-orange-500 text-white px-4 py-2 rounded-md hover:bg-orange-600"
              >
                🖨️ Print
              </button>
              <button
                onClick={onClose}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                ✕ Close
              </button>
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-8">
            
            {/* 1. Patient Information */}
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-blue-800">1. Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Consultant Name</label>
                  <input
                    type="text"
                    value={formData.consultantName}
                    onChange={(e) => setFormData(prev => ({ ...prev, consultantName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name</label>
                  <input
                    type="text"
                    value={formData.patientName}
                    onChange={(e) => setFormData(prev => ({ ...prev, patientName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time of Arrival</label>
                  <input
                    type="datetime-local"
                    value={formData.arrivalDateTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, arrivalDateTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age/Sex</label>
                  <input
                    type="text"
                    value={formData.ageSex}
                    onChange={(e) => setFormData(prev => ({ ...prev, ageSex: e.target.value }))}
                    placeholder="e.g., 45/M"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name of Dept</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UHID/IP No.</label>
                  <input
                    type="text"
                    value={formData.uhidIpNo}
                    onChange={(e) => setFormData(prev => ({ ...prev, uhidIpNo: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name & Sign. of receiving staff</label>
                  <input
                    type="text"
                    value={formData.receivingStaff}
                    onChange={(e) => setFormData(prev => ({ ...prev, receivingStaff: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">History information given by</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="historyGivenBy"
                        value="patient"
                        checked={formData.historyGivenBy === 'patient'}
                        onChange={(e) => setFormData(prev => ({ ...prev, historyGivenBy: e.target.value as 'patient' }))}
                        className="mr-2"
                      />
                      Patient
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="historyGivenBy"
                        value="relative"
                        checked={formData.historyGivenBy === 'relative'}
                        onChange={(e) => setFormData(prev => ({ ...prev, historyGivenBy: e.target.value as 'relative' }))}
                        className="mr-2"
                      />
                      Relative
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Arrival & Vitals */}
            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-green-800">2. Arrival & Vitals</h3>
              
              {/* Arrival By */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Arrival By</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries({
                    stretcher: 'Stretcher',
                    wheelChair: 'Wheel Chair',
                    ambulatory: 'Ambulatory',
                    other: 'Other'
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.arrivalBy[key as keyof typeof formData.arrivalBy]}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          arrivalBy: { ...prev.arrivalBy, [key]: e.target.checked }
                        }))}
                        className="mr-2"
                      />
                      {label}
                    </label>
                  ))}
                </div>
                {formData.arrivalBy.other && (
                  <div className="mt-2">
                    <input
                      type="text"
                      placeholder="Specify other..."
                      value={formData.arrivalBy.otherSpecify}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        arrivalBy: { ...prev.arrivalBy, otherSpecify: e.target.value }
                      }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                )}
              </div>

              {/* Physical Measurements */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={formData.height}
                    onChange={(e) => setFormData(prev => ({ ...prev, height: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    value={formData.weight}
                    onChange={(e) => setFormData(prev => ({ ...prev, weight: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unable to stand due to</label>
                  <input
                    type="text"
                    value={formData.unableToStandDue}
                    onChange={(e) => setFormData(prev => ({ ...prev, unableToStandDue: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>

              {/* Vitals */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Vitals</label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {Object.entries({
                    temp: 'Temp (°F)',
                    pulse: 'Pulse (bpm)',
                    bp: 'BP (mmHg)',
                    spo2: 'SpO2 (%)',
                    resp: 'Resp (rpm)'
                  }).map(([key, label]) => (
                    <div key={key}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      <input
                        type="text"
                        value={formData.vitals[key as keyof typeof formData.vitals]}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          vitals: { ...prev.vitals, [key]: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Level of Consciousness */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Level of Consciousness</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries({
                    conscious: 'Conscious',
                    semiConscious: 'Semi Conscious',
                    unconscious: 'Unconscious'
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.levelOfConsciousness[key as keyof typeof formData.levelOfConsciousness]}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          levelOfConsciousness: { ...prev.levelOfConsciousness, [key]: e.target.checked }
                        }))}
                        className="mr-2"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Psychological Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Psychological Status</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries({
                    calm: 'Calm',
                    anxious: 'Anxious',
                    withdrawn: 'Withdrawn',
                    agitated: 'Agitated',
                    depressed: 'Depressed',
                    sleepy: 'Sleepy'
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.psychologicalStatus[key as keyof typeof formData.psychologicalStatus]}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          psychologicalStatus: { ...prev.psychologicalStatus, [key]: e.target.checked }
                        }))}
                        className="mr-2"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Provisional Diagnosis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Provisional diagnosis</label>
                <textarea
                  value={formData.provisionalDiagnosis}
                  onChange={(e) => setFormData(prev => ({ ...prev, provisionalDiagnosis: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>

            {/* 3. Medical History */}
            <div className="bg-yellow-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-yellow-800">3. Medical History</h3>
              
              {/* History of Allergy */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">History of Allergy</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="historyOfAllergy"
                        value="yes"
                        checked={formData.historyOfAllergy === 'yes'}
                        onChange={(e) => setFormData(prev => ({ ...prev, historyOfAllergy: e.target.value as 'yes' }))}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="historyOfAllergy"
                        value="no"
                        checked={formData.historyOfAllergy === 'no'}
                        onChange={(e) => setFormData(prev => ({ ...prev, historyOfAllergy: e.target.value as 'no' }))}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">If yes, describe</label>
                  <input
                    type="text"
                    value={formData.allergyDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, allergyDescription: e.target.value }))}
                    disabled={formData.historyOfAllergy !== 'yes'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Medications on Admission */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">If on any Medications on admission</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="medicationsOnAdmission"
                        value="yes"
                        checked={formData.medicationsOnAdmission === 'yes'}
                        onChange={(e) => setFormData(prev => ({ ...prev, medicationsOnAdmission: e.target.value as 'yes' }))}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="medicationsOnAdmission"
                        value="no"
                        checked={formData.medicationsOnAdmission === 'no'}
                        onChange={(e) => setFormData(prev => ({ ...prev, medicationsOnAdmission: e.target.value as 'no' }))}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">If yes, describe</label>
                  <input
                    type="text"
                    value={formData.medicationsDescription}
                    onChange={(e) => setFormData(prev => ({ ...prev, medicationsDescription: e.target.value }))}
                    disabled={formData.medicationsOnAdmission !== 'yes'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Medications Table */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">Medications Table</label>
                  <button
                    type="button"
                    onClick={addMedicationRow}
                    className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
                  >
                    + Add Row
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border border-gray-300">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="border border-gray-300 px-2 py-1 text-left">Sr. No.</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Name of medicine</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Doses</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Timing</th>
                        <th className="border border-gray-300 px-2 py-1 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.medications.map((med, index) => (
                        <tr key={index}>
                          <td className="border border-gray-300 px-2 py-1">{med.srNo}</td>
                          <td className="border border-gray-300 px-2 py-1">
                            <input
                              type="text"
                              value={med.name}
                              onChange={(e) => {
                                const newMeds = [...formData.medications];
                                newMeds[index].name = e.target.value;
                                setFormData(prev => ({ ...prev, medications: newMeds }));
                              }}
                              className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            <input
                              type="text"
                              value={med.doses}
                              onChange={(e) => {
                                const newMeds = [...formData.medications];
                                newMeds[index].doses = e.target.value;
                                setFormData(prev => ({ ...prev, medications: newMeds }));
                              }}
                              className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            <input
                              type="text"
                              value={med.timing}
                              onChange={(e) => {
                                const newMeds = [...formData.medications];
                                newMeds[index].timing = e.target.value;
                                setFormData(prev => ({ ...prev, medications: newMeds }));
                              }}
                              className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                            />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-center">
                            {formData.medications.length > 1 && (
                              <button
                                type="button"
                                onClick={() => deleteMedicationRow(index)}
                                className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 no-print"
                              >
                                🗑️ Delete
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 4. Patient Status and Assessment */}
            <div className="bg-purple-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-purple-800">4. Patient Status and Assessment</h3>
              
              {/* Any deformities */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Any deformities</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="anyDeformities"
                        value="yes"
                        checked={formData.anyDeformities === 'yes'}
                        onChange={(e) => setFormData(prev => ({ ...prev, anyDeformities: e.target.value as 'yes' }))}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="anyDeformities"
                        value="no"
                        checked={formData.anyDeformities === 'no'}
                        onChange={(e) => setFormData(prev => ({ ...prev, anyDeformities: e.target.value as 'no' }))}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">If yes, specify</label>
                  <input
                    type="text"
                    value={formData.deformitiesSpecify}
                    onChange={(e) => setFormData(prev => ({ ...prev, deformitiesSpecify: e.target.value }))}
                    disabled={formData.anyDeformities !== 'yes'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              {/* Patient Items */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Denture, Contact lenses, etc.</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {Object.entries({
                    denture: 'Denture',
                    contactLenses: 'Contact lenses',
                    artificialLimbs: 'Artificial limbs',
                    implants: 'Implants'
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.patientItems[key as keyof typeof formData.patientItems]}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          patientItems: { ...prev.patientItems, [key]: e.target.checked }
                        }))}
                        className="mr-2"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* On Admission */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">On Admission</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {Object.entries({
                    rylesTube: 'Ryles tube',
                    centralLine: 'Central Line',
                    foleysCath: 'Foley\'s Cath',
                    etTube: 'ET Tube',
                    ttTube: 'TT Tube',
                    arterialLine: 'Arterial Line',
                    gastroJejunostomy: 'Gastro jejunostomy feed tube',
                    ivLine: 'I V line',
                    slab: 'Slab',
                    other: 'Other'
                  }).map(([key, label]) => (
                    <label key={key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.onAdmission[key as keyof typeof formData.onAdmission]}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          onAdmission: { ...prev.onAdmission, [key]: e.target.checked }
                        }))}
                        className="mr-2"
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Pressure Sore */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pressure Sore</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="pressureSore"
                        value="yes"
                        checked={formData.pressureSore === 'yes'}
                        onChange={(e) => setFormData(prev => ({ ...prev, pressureSore: e.target.value as 'yes' }))}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="pressureSore"
                        value="no"
                        checked={formData.pressureSore === 'no'}
                        onChange={(e) => setFormData(prev => ({ ...prev, pressureSore: e.target.value as 'no' }))}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={formData.pressureSoreLocation}
                    onChange={(e) => setFormData(prev => ({ ...prev, pressureSoreLocation: e.target.value }))}
                    disabled={formData.pressureSore !== 'yes'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Stage</label>
                  <div className="grid grid-cols-2 gap-1">
                    {[
                      { value: '1', label: '1 (Patch)' },
                      { value: '2', label: '2 (Superficial)' },
                      { value: '3', label: '3 (Intermediate)' },
                      { value: '4', label: '4 (Deep)' }
                    ].map(({ value, label }) => (
                      <label key={value} className="flex items-center">
                        <input
                          type="radio"
                          name="pressureSoreStage"
                          value={value}
                          checked={formData.pressureSoreStage === value}
                          onChange={(e) => setFormData(prev => ({ ...prev, pressureSoreStage: e.target.value as any }))}
                          disabled={formData.pressureSore !== 'yes'}
                          className="mr-2"
                        />
                        <span className="text-xs">{label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 5. Patient Safety */}
            <div className="bg-red-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-red-800">5. Patient Safety</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Side railing up & lock</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="sideRailingUp"
                        value="yes"
                        checked={formData.sideRailingUp === 'yes'}
                        onChange={(e) => setFormData(prev => ({ ...prev, sideRailingUp: e.target.value as 'yes' }))}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="sideRailingUp"
                        value="no"
                        checked={formData.sideRailingUp === 'no'}
                        onChange={(e) => setFormData(prev => ({ ...prev, sideRailingUp: e.target.value as 'no' }))}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Call bell with in reach & working</label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="callBellWorking"
                        value="yes"
                        checked={formData.callBellWorking === 'yes'}
                        onChange={(e) => setFormData(prev => ({ ...prev, callBellWorking: e.target.value as 'yes' }))}
                        className="mr-2"
                      />
                      Yes
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="callBellWorking"
                        value="no"
                        checked={formData.callBellWorking === 'no'}
                        onChange={(e) => setFormData(prev => ({ ...prev, callBellWorking: e.target.value as 'no' }))}
                        className="mr-2"
                      />
                      No
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. Major Surgical History */}
            <div className="bg-indigo-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-indigo-800">6. Major Surgical History</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Major surgical history</label>
                  <textarea
                    value={formData.majorSurgicalHistory}
                    onChange={(e) => setFormData(prev => ({ ...prev, majorSurgicalHistory: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Past Medical history</label>
                  <textarea
                    value={formData.pastMedicalHistory}
                    onChange={(e) => setFormData(prev => ({ ...prev, pastMedicalHistory: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>

            {/* 7. Vulnerable Assessment */}
            <div className="bg-orange-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-orange-800">7. Vulnerable Assessment</h3>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Patient Vulnerable</label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="patientVulnerable"
                      value="yes"
                      checked={formData.patientVulnerable === 'yes'}
                      onChange={(e) => setFormData(prev => ({ ...prev, patientVulnerable: e.target.value as 'yes' }))}
                      className="mr-2"
                    />
                    Yes
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="patientVulnerable"
                      value="no"
                      checked={formData.patientVulnerable === 'no'}
                      onChange={(e) => setFormData(prev => ({ ...prev, patientVulnerable: e.target.value as 'no' }))}
                      className="mr-2"
                    />
                    No
                  </label>
                </div>
              </div>

              {/* Assessment Table */}
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-2 py-1 text-left">No.</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Categories</th>
                      <th className="border border-gray-300 px-2 py-1 text-center">YES</th>
                      <th className="border border-gray-300 px-2 py-1 text-center">NO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { key: 'ageCategory', label: 'Age more than 65 or less than 5 years' },
                      { key: 'physicallyDisabled', label: 'Physically Challenged' },
                      { key: 'mentallyDisabled', label: 'Mentally Challenged' },
                      { key: 'terminallyIll', label: 'Terminally ill' },
                      { key: 'unableToSpeak', label: 'Inability to speak' },
                      { key: 'alteredConsciousness', label: 'Altered Consciousness' },
                      { key: 'epilepticFit', label: 'Epileptic Fit' },
                      { key: 'medicationRelated', label: 'Medication Related Consciousless Defect' },
                      { key: 'absenceOfRelative', label: 'Absence of Relative' },
                      { key: 'immuneCompromised', label: 'Immune compromised/Low Immunity' }
                    ].map((item, index) => (
                      <tr key={item.key}>
                        <td className="border border-gray-300 px-2 py-1">{index + 1}</td>
                        <td className="border border-gray-300 px-2 py-1">{item.label}</td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input
                            type="radio"
                            name={`vulnerable_${item.key}`}
                            value="yes"
                            checked={formData.vulnerableCategories[item.key as keyof typeof formData.vulnerableCategories] === 'yes'}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              vulnerableCategories: { ...prev.vulnerableCategories, [item.key]: 'yes' as any }
                            }))}
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          <input
                            type="radio"
                            name={`vulnerable_${item.key}`}
                            value="no"
                            checked={formData.vulnerableCategories[item.key as keyof typeof formData.vulnerableCategories] === 'no'}
                            onChange={(e) => setFormData(prev => ({
                              ...prev,
                              vulnerableCategories: { ...prev.vulnerableCategories, [item.key]: 'no' as any }
                            }))}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 8. Total GCS Score on Admission */}
            <div className="bg-teal-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-teal-800">8. Total GCS Score on Admission</h3>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-2 py-1 text-left">Eye Opening</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Motor Response</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Verbal Response</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-gray-300 px-2 py-1 align-top">
                        <div className="space-y-2">
                          {[
                            { key: 'spontaneous', label: 'Spontaneous (4)' },
                            { key: 'toVoice', label: 'To Voice (3)' },
                            { key: 'toPain', label: 'To Pain (2)' },
                            { key: 'none', label: 'None (1)' }
                          ].map(({ key, label }) => (
                            <label key={key} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.gcsScore.eyeOpening[key as keyof typeof formData.gcsScore.eyeOpening]}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  gcsScore: {
                                    ...prev.gcsScore,
                                    eyeOpening: { ...prev.gcsScore.eyeOpening, [key]: e.target.checked }
                                  }
                                }))}
                                className="mr-2"
                              />
                              <span className="text-sm">{label}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-2 py-1 align-top">
                        <div className="space-y-2">
                          {[
                            { key: 'obeysCommands', label: 'Obeys Commands (6)' },
                            { key: 'localizesToPain', label: 'Localizes to Pain (5)' },
                            { key: 'withdrawsFromPain', label: 'Withdraws from Pain (4)' },
                            { key: 'flexionToPain', label: 'Flexion to Pain (3)' },
                            { key: 'extensionToPain', label: 'Extension to Pain (2)' },
                            { key: 'none', label: 'None (1)' }
                          ].map(({ key, label }) => (
                            <label key={key} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.gcsScore.motorResponse[key as keyof typeof formData.gcsScore.motorResponse]}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  gcsScore: {
                                    ...prev.gcsScore,
                                    motorResponse: { ...prev.gcsScore.motorResponse, [key]: e.target.checked }
                                  }
                                }))}
                                className="mr-2"
                              />
                              <span className="text-sm">{label}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                      <td className="border border-gray-300 px-2 py-1 align-top">
                        <div className="space-y-2">
                          {[
                            { key: 'oriented', label: 'Oriented (5)' },
                            { key: 'confused', label: 'Confused (4)' },
                            { key: 'inappropriateWords', label: 'Inappropriate Words (3)' },
                            { key: 'incomprehensibleSounds', label: 'Incomprehensible Sounds (2)' },
                            { key: 'none', label: 'None (1)' }
                          ].map(({ key, label }) => (
                            <label key={key} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={formData.gcsScore.verbalResponse[key as keyof typeof formData.gcsScore.verbalResponse]}
                                onChange={(e) => setFormData(prev => ({
                                  ...prev,
                                  gcsScore: {
                                    ...prev.gcsScore,
                                    verbalResponse: { ...prev.gcsScore.verbalResponse, [key]: e.target.checked }
                                  }
                                }))}
                                className="mr-2"
                              />
                              <span className="text-sm">{label}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* 9. Patient Valuable Handover */}
            <div className="bg-pink-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-pink-800">9. Patient Valuable Handover</h3>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Valuables</span>
                <button
                  type="button"
                  onClick={addValuableRow}
                  className="bg-pink-600 text-white px-3 py-1 rounded text-sm hover:bg-pink-700"
                >
                  + Add Row
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full border border-gray-300">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="border border-gray-300 px-2 py-1 text-left">Sr. No.</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Name of Valuable Item</th>
                      <th className="border border-gray-300 px-2 py-1 text-left">Qty.</th>
                      <th className="border border-gray-300 px-2 py-1 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.valuables.map((valuable, index) => (
                      <tr key={index}>
                        <td className="border border-gray-300 px-2 py-1">{valuable.srNo}</td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="text"
                            value={valuable.itemName}
                            onChange={(e) => {
                              const newValuables = [...formData.valuables];
                              newValuables[index].itemName = e.target.value;
                              setFormData(prev => ({ ...prev, valuables: newValuables }));
                            }}
                            className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-pink-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1">
                          <input
                            type="text"
                            value={valuable.quantity}
                            onChange={(e) => {
                              const newValuables = [...formData.valuables];
                              newValuables[index].quantity = e.target.value;
                              setFormData(prev => ({ ...prev, valuables: newValuables }));
                            }}
                            className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-pink-500"
                          />
                        </td>
                        <td className="border border-gray-300 px-2 py-1 text-center">
                          {formData.valuables.length > 1 && (
                            <button
                              type="button"
                              onClick={() => deleteValuableRow(index)}
                              className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                            >
                              🗑️ Delete
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 10. Staff Signatures */}
            <div className="bg-gray-50 p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">10. Staff Signatures</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Nursing Staff</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name & Sign of Nsg. Staff</label>
                    <input
                      type="text"
                      value={formData.nursingStaffName}
                      onChange={(e) => setFormData(prev => ({ ...prev, nursingStaffName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={formData.nursingStaffDateTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, nursingStaffDateTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-medium text-gray-700">Patient/Relative</h4>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Name & Sign of Patient/Relative</label>
                    <input
                      type="text"
                      value={formData.patientRelativeName}
                      onChange={(e) => setFormData(prev => ({ ...prev, patientRelativeName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
                    <input
                      type="datetime-local"
                      value={formData.patientRelativeDateTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, patientRelativeDateTime: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Relation of Patient</label>
                    <input
                      type="text"
                      value={formData.relationToPatient}
                      onChange={(e) => setFormData(prev => ({ ...prev, relationToPatient: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 no-print">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save TAT Form'}
              </button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </>
  );
};

export default TatForm;