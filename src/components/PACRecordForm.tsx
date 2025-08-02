import React, { useState } from 'react';
import { X } from 'lucide-react';

interface PACRecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  patientData: {
    name: string;
    age: string;
    gender: string;
    ipdNo: string;
    roomWardNo?: string;
  };
  onSave?: (data: any) => void;
}

const PACRecordForm: React.FC<PACRecordFormProps> = ({
  isOpen,
  onClose,
  patientData,
  onSave
}) => {
  const [formData, setFormData] = useState({
    // Patient Header Section
    name: patientData.name || '',
    ageSex: `${patientData.age || ''} / ${patientData.gender || ''}`,
    ipdNo: patientData.ipdNo || '',
    roomWardNo: patientData.roomWardNo || '',
    operation: '',
    alertAllergiesMedications: '',
    anaestheticPlan: '',
    drugToBeUsed: '',
    
    // Patient Vitals and History
    anaesthesiaType: '',
    asaGrade: '',
    consent: '',
    bloodGroup: '',
    height: '',
    weight: '',
    temp: '',
    hrRhythm: '',
    bp: '',
    rr: '',
    presentIllness: '',
    pastIllness: '',
    previousSurgery: '',
    personalHistory: '',
    
    // General Examination
    generalCondition: '',
    pallor: '',
    cyanosis: '',
    icterus: '',
    exerciseTolerance: '',
    edema: '',
    oralHygiene: '',
    dentures: '',
    airway: '',
    mouthOpening: '',
    neckMovement: '',
    mallampatiGrade: '',
    mentothyroidDistance: '',
    dentition: '',
    bht: '',
    spinal: '',
    
    // Systemic Examination
    cns: '',
    gcs: '',
    cvs: '',
    pulse: '',
    echo: '',
    resp: '',
    rrSystemic: '',
    pupillarySize: '',
    bpSystemic: '',
    ecg: '',
    cxr: '',
    
    // Investigations
    hbPcv: '',
    tlc: '',
    platelets: '',
    crp: '',
    tsh: '',
    bloodSugar: '',
    sgotSgpt: '',
    bloodUrea: '',
    uricAcid: '',
    sodium: '',
    potassium: '',
    hbsAgHivHcv: '',
    aptt: '',
    ptInr: '',
    sCreatinine: '',
    otherInvestigations: '',
    
    // Preanaesthetic Instructions
    preanaestheticInstructions: '',
    
    // PAC Revaluation
    revaluationDate: '',
    revaluationTime: '',
    anaesthetistName1: '',
    revaluationTemp: '',
    revaluationRr: '',
    revaluationPulse: '',
    revaluationBp: '',
    revaluationSpo2: '',
    revaluationRemarks: '',
    finalDate: '',
    finalTime: '',
    anaesthetistName2: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (onSave) {
      onSave({
        ...formData,
        createdAt: new Date().toISOString(),
        patientId: patientData.ipdNo
      });
    }
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden print:max-w-none print:max-h-none print:overflow-visible">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center print:bg-white print:text-black print:border-b-2 print:border-black">
          <h2 className="text-xl font-bold">PRE ANAESTHESIA CHECK UP (PAC) Record</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 print:hidden"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] print:max-h-none">
          {/* Patient Header Section */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4 print:border-black">
            <h3 className="font-bold text-lg mb-3 text-blue-700 print:text-black">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Age / Sex:</label>
                <input
                  type="text"
                  value={formData.ageSex}
                  onChange={(e) => handleInputChange('ageSex', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">IPD No.:</label>
                <input
                  type="text"
                  value={formData.ipdNo}
                  onChange={(e) => handleInputChange('ipdNo', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Room / Ward No.:</label>
                <input
                  type="text"
                  value={formData.roomWardNo}
                  onChange={(e) => handleInputChange('roomWardNo', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Operation:</label>
                <input
                  type="text"
                  value={formData.operation}
                  onChange={(e) => handleInputChange('operation', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Alert / Allergies / Medications:</label>
                <input
                  type="text"
                  value={formData.alertAllergiesMedications}
                  onChange={(e) => handleInputChange('alertAllergiesMedications', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Anaesthetic Plan:</label>
                <input
                  type="text"
                  value={formData.anaestheticPlan}
                  onChange={(e) => handleInputChange('anaestheticPlan', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name of Drug to be used:</label>
                <input
                  type="text"
                  value={formData.drugToBeUsed}
                  onChange={(e) => handleInputChange('drugToBeUsed', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Patient Vitals and History */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4 print:border-black">
            <h3 className="font-bold text-lg mb-3 text-blue-700 print:text-black">Patient Vitals and History</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">GA / MAC / Reg. / N. Block / LA / SA / EPIDURAL:</label>
                <input
                  type="text"
                  value={formData.anaesthesiaType}
                  onChange={(e) => handleInputChange('anaesthesiaType', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ASA 1 2 3 4 5 6 E:</label>
                <input
                  type="text"
                  value={formData.asaGrade}
                  onChange={(e) => handleInputChange('asaGrade', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Consent:</label>
                <input
                  type="text"
                  value={formData.consent}
                  onChange={(e) => handleInputChange('consent', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Blood G.P.:</label>
                <input
                  type="text"
                  value={formData.bloodGroup}
                  onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Ht. (m):</label>
                <input
                  type="text"
                  value={formData.height}
                  onChange={(e) => handleInputChange('height', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Wt. (kg.):</label>
                <input
                  type="text"
                  value={formData.weight}
                  onChange={(e) => handleInputChange('weight', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Temp:</label>
                <input
                  type="text"
                  value={formData.temp}
                  onChange={(e) => handleInputChange('temp', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">HR / Rhythm:</label>
                <input
                  type="text"
                  value={formData.hrRhythm}
                  onChange={(e) => handleInputChange('hrRhythm', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">B.P.:</label>
                <input
                  type="text"
                  value={formData.bp}
                  onChange={(e) => handleInputChange('bp', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">R.R.:</label>
                <input
                  type="text"
                  value={formData.rr}
                  onChange={(e) => handleInputChange('rr', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">H/O PRESENT ILLNESS:</label>
                <textarea
                  value={formData.presentIllness}
                  onChange={(e) => handleInputChange('presentIllness', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">H/O PAST ILLNESS:</label>
                <textarea
                  value={formData.pastIllness}
                  onChange={(e) => handleInputChange('pastIllness', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">PREVIOUS SURGERY:</label>
                <textarea
                  value={formData.previousSurgery}
                  onChange={(e) => handleInputChange('previousSurgery', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">PERSONAL HISTORY:</label>
                <textarea
                  value={formData.personalHistory}
                  onChange={(e) => handleInputChange('personalHistory', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* General Examination */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4 print:border-black">
            <h3 className="font-bold text-lg mb-3 text-blue-700 print:text-black">General Examination</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">General Condition:</label>
                <input
                  type="text"
                  value={formData.generalCondition}
                  onChange={(e) => handleInputChange('generalCondition', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pallor:</label>
                <input
                  type="text"
                  value={formData.pallor}
                  onChange={(e) => handleInputChange('pallor', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Cyanosis:</label>
                <input
                  type="text"
                  value={formData.cyanosis}
                  onChange={(e) => handleInputChange('cyanosis', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Icterus:</label>
                <input
                  type="text"
                  value={formData.icterus}
                  onChange={(e) => handleInputChange('icterus', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Exercise Tolerance:</label>
                <input
                  type="text"
                  value={formData.exerciseTolerance}
                  onChange={(e) => handleInputChange('exerciseTolerance', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Edema:</label>
                <input
                  type="text"
                  value={formData.edema}
                  onChange={(e) => handleInputChange('edema', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Oral Hygiene:</label>
                <input
                  type="text"
                  value={formData.oralHygiene}
                  onChange={(e) => handleInputChange('oralHygiene', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dentures:</label>
                <input
                  type="text"
                  value={formData.dentures}
                  onChange={(e) => handleInputChange('dentures', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Airway:</label>
                <input
                  type="text"
                  value={formData.airway}
                  onChange={(e) => handleInputChange('airway', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mouth Opening:</label>
                <input
                  type="text"
                  value={formData.mouthOpening}
                  onChange={(e) => handleInputChange('mouthOpening', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Neck Movement:</label>
                <input
                  type="text"
                  value={formData.neckMovement}
                  onChange={(e) => handleInputChange('neckMovement', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mallampati Grade:</label>
                <input
                  type="text"
                  value={formData.mallampatiGrade}
                  onChange={(e) => handleInputChange('mallampatiGrade', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mentothyroid Distance:</label>
                <input
                  type="text"
                  value={formData.mentothyroidDistance}
                  onChange={(e) => handleInputChange('mentothyroidDistance', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Dentition:</label>
                <input
                  type="text"
                  value={formData.dentition}
                  onChange={(e) => handleInputChange('dentition', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">BHT (Breath Holding Rate):</label>
                <input
                  type="text"
                  value={formData.bht}
                  onChange={(e) => handleInputChange('bht', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Spinal:</label>
              <textarea
                value={formData.spinal}
                onChange={(e) => handleInputChange('spinal', e.target.value)}
                className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
          </div>

          {/* Systemic Examination */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4 print:border-black">
            <h3 className="font-bold text-lg mb-3 text-blue-700 print:text-black">Systemic Examination</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">CNS:</label>
                <input
                  type="text"
                  value={formData.cns}
                  onChange={(e) => handleInputChange('cns', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">GCS:</label>
                <input
                  type="text"
                  value={formData.gcs}
                  onChange={(e) => handleInputChange('gcs', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CVS:</label>
                <input
                  type="text"
                  value={formData.cvs}
                  onChange={(e) => handleInputChange('cvs', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pulse:</label>
                <input
                  type="text"
                  value={formData.pulse}
                  onChange={(e) => handleInputChange('pulse', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ECHO:</label>
                <input
                  type="text"
                  value={formData.echo}
                  onChange={(e) => handleInputChange('echo', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Resp:</label>
                <input
                  type="text"
                  value={formData.resp}
                  onChange={(e) => handleInputChange('resp', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">RR:</label>
                <input
                  type="text"
                  value={formData.rrSystemic}
                  onChange={(e) => handleInputChange('rrSystemic', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pupillary Size:</label>
                <input
                  type="text"
                  value={formData.pupillarySize}
                  onChange={(e) => handleInputChange('pupillarySize', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">BP:</label>
                <input
                  type="text"
                  value={formData.bpSystemic}
                  onChange={(e) => handleInputChange('bpSystemic', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">ECG:</label>
                <input
                  type="text"
                  value={formData.ecg}
                  onChange={(e) => handleInputChange('ecg', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CXR:</label>
                <input
                  type="text"
                  value={formData.cxr}
                  onChange={(e) => handleInputChange('cxr', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Investigations */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4 print:border-black">
            <h3 className="font-bold text-lg mb-3 text-blue-700 print:text-black">Investigations</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Hb / PCV:</label>
                <input
                  type="text"
                  value={formData.hbPcv}
                  onChange={(e) => handleInputChange('hbPcv', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">TLC:</label>
                <input
                  type="text"
                  value={formData.tlc}
                  onChange={(e) => handleInputChange('tlc', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Platelets:</label>
                <input
                  type="text"
                  value={formData.platelets}
                  onChange={(e) => handleInputChange('platelets', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">CRP:</label>
                <input
                  type="text"
                  value={formData.crp}
                  onChange={(e) => handleInputChange('crp', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">TSH:</label>
                <input
                  type="text"
                  value={formData.tsh}
                  onChange={(e) => handleInputChange('tsh', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">B. Sugar:</label>
                <input
                  type="text"
                  value={formData.bloodSugar}
                  onChange={(e) => handleInputChange('bloodSugar', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SGOT / SGPT:</label>
                <input
                  type="text"
                  value={formData.sgotSgpt}
                  onChange={(e) => handleInputChange('sgotSgpt', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Blood Urea:</label>
                <input
                  type="text"
                  value={formData.bloodUrea}
                  onChange={(e) => handleInputChange('bloodUrea', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Uric Acid:</label>
                <input
                  type="text"
                  value={formData.uricAcid}
                  onChange={(e) => handleInputChange('uricAcid', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Na:</label>
                <input
                  type="text"
                  value={formData.sodium}
                  onChange={(e) => handleInputChange('sodium', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">K:</label>
                <input
                  type="text"
                  value={formData.potassium}
                  onChange={(e) => handleInputChange('potassium', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">HBsAg / HIV / HCV:</label>
                <input
                  type="text"
                  value={formData.hbsAgHivHcv}
                  onChange={(e) => handleInputChange('hbsAgHivHcv', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">APTT:</label>
                <input
                  type="text"
                  value={formData.aptt}
                  onChange={(e) => handleInputChange('aptt', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">PT-INR:</label>
                <input
                  type="text"
                  value={formData.ptInr}
                  onChange={(e) => handleInputChange('ptInr', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">S. Creatinine:</label>
                <input
                  type="text"
                  value={formData.sCreatinine}
                  onChange={(e) => handleInputChange('sCreatinine', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Others:</label>
              <textarea
                value={formData.otherInvestigations}
                onChange={(e) => handleInputChange('otherInvestigations', e.target.value)}
                className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
              />
            </div>
          </div>

          {/* Preanaesthetic Instructions */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4 print:border-black">
            <h3 className="font-bold text-lg mb-3 text-blue-700 print:text-black">Preanaesthetic Instructions</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Preanaesthetic instructions / Medications:</label>
              <textarea
                value={formData.preanaestheticInstructions}
                onChange={(e) => handleInputChange('preanaestheticInstructions', e.target.value)}
                className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={4}
              />
            </div>
          </div>

          {/* PAC Revaluation Section */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4 print:border-black">
            <h3 className="font-bold text-lg mb-3 text-blue-700 print:text-black">PAC Revaluation</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date:</label>
                <input
                  type="date"
                  value={formData.revaluationDate}
                  onChange={(e) => handleInputChange('revaluationDate', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Time:</label>
                <input
                  type="time"
                  value={formData.revaluationTime}
                  onChange={(e) => handleInputChange('revaluationTime', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name and Signature of Anaesthetist:</label>
                <input
                  type="text"
                  value={formData.anaesthetistName1}
                  onChange={(e) => handleInputChange('anaesthetistName1', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Temp:</label>
                <input
                  type="text"
                  value={formData.revaluationTemp}
                  onChange={(e) => handleInputChange('revaluationTemp', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">RR:</label>
                <input
                  type="text"
                  value={formData.revaluationRr}
                  onChange={(e) => handleInputChange('revaluationRr', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Pulse:</label>
                <input
                  type="text"
                  value={formData.revaluationPulse}
                  onChange={(e) => handleInputChange('revaluationPulse', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">BP:</label>
                <input
                  type="text"
                  value={formData.revaluationBp}
                  onChange={(e) => handleInputChange('revaluationBp', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SPO2:</label>
                <input
                  type="text"
                  value={formData.revaluationSpo2}
                  onChange={(e) => handleInputChange('revaluationSpo2', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="mb-4">
              <label className="block text-sm font-medium mb-1">Remarks:</label>
              <textarea
                value={formData.revaluationRemarks}
                onChange={(e) => handleInputChange('revaluationRemarks', e.target.value)}
                className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Date:</label>
                <input
                  type="date"
                  value={formData.finalDate}
                  onChange={(e) => handleInputChange('finalDate', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Time:</label>
                <input
                  type="time"
                  value={formData.finalTime}
                  onChange={(e) => handleInputChange('finalTime', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Name and Signature of Anaesthetist:</label>
                <input
                  type="text"
                  value={formData.anaesthetistName2}
                  onChange={(e) => handleInputChange('anaesthetistName2', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-100 px-6 py-4 flex justify-end space-x-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Print
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save PAC Record
          </button>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .fixed, .fixed * {
            visibility: visible;
          }
          .fixed {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PACRecordForm;