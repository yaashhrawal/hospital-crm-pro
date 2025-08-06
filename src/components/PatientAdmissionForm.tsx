import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface PatientAdmissionFormProps {
  isOpen: boolean;
  onClose: () => void;
  patient?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    age?: number;
    gender?: string;
    phone?: string;
    patient_id?: string;
  };
  bedNumber?: number;
  ipdNumber?: string;
  onSubmit?: (formData: any) => void;
}

interface FormData {
  // Patient Details
  patientId: string;
  ipNo: string;
  patientFullName: string;
  typeOfAdmission: string;
  otherAdmissionType: string;
  fatherHusbandName: string;
  age: string;
  gender: string;
  religion: string;
  nationality: string;
  occupation: string;
  contactNo: string;
  aadharNo: string;
  fullAddress: string;

  // Advance Deposit Details
  depositDate: string;
  receiptNo: string;
  receivedFrom: string;
  amount: string;
  receivedBy: string;

  // Medical Legal Case
  isMlcCase: string; // 'yes' or 'no'
  casualtyNo: string;
  mlcNo: string;
  subInspector: string;
  policeStation: string;

  // Discharge Details
  finalDiagnosis: string;
  conditionOnDischarge: string;
  status: string;
  dateOfDischarge: string;
  dischargeTime: string;
  relativeSign: string;
  drSign: string;

  // Expired Patients
  expiredWithin24hrs: string;
  expiredDate: string;
  expiredTime: string;
  bodyHandoveredTo: string;
  declaredBy: string;
  doctorSign: string;
}

const PatientAdmissionForm: React.FC<PatientAdmissionFormProps> = ({
  isOpen,
  onClose,
  patient,
  bedNumber,
  ipdNumber,
  onSubmit
}) => {
  const [formData, setFormData] = useState<FormData>({
    patientId: '',
    ipNo: '',
    patientFullName: '',
    typeOfAdmission: 'Cash',
    otherAdmissionType: '',
    fatherHusbandName: '',
    age: '',
    gender: '',
    religion: '',
    nationality: 'Indian',
    occupation: '',
    contactNo: '',
    aadharNo: '',
    fullAddress: '',
    depositDate: new Date().toISOString().split('T')[0],
    receiptNo: '',
    receivedFrom: '',
    amount: '',
    receivedBy: '',
    isMlcCase: 'no',
    casualtyNo: '',
    mlcNo: '',
    subInspector: '',
    policeStation: '',
    finalDiagnosis: '',
    conditionOnDischarge: 'Unchanged',
    status: 'Normal',
    dateOfDischarge: '',
    dischargeTime: '',
    relativeSign: '',
    drSign: '',
    expiredWithin24hrs: 'Expired within 24 hrs.',
    expiredDate: '',
    expiredTime: '',
    bodyHandoveredTo: '',
    declaredBy: '',
    doctorSign: ''
  });

  // Auto-populate form with patient data when modal opens
  useEffect(() => {
    console.log('🔍 PatientAdmissionForm Debug:', { 
      isOpen, 
      patient: patient ? { 
        first_name: patient.first_name, 
        last_name: patient.last_name, 
        patient_id: patient.patient_id,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone
      } : null, 
      ipdNumber, 
      bedNumber 
    });
    
    if (isOpen && patient) {
      console.log('📝 Setting PatientAdmissionForm data with patient:', patient);
      
      setFormData(prev => ({
        ...prev,
        patientId: patient.patient_id || '',
        ipNo: ipdNumber || '',
        patientFullName: patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : '',
        age: patient.age?.toString() || '',
        gender: patient.gender || '',
        contactNo: patient.phone || ''
      }));
      
      console.log('✅ PatientAdmissionForm data set with values:', {
        patientId: patient.patient_id || '',
        ipNo: ipdNumber || '',
        patientFullName: patient ? `${patient.first_name || ''} ${patient.last_name || ''}`.trim() : ''
      });
    }
  }, [isOpen, patient, ipdNumber, bedNumber]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    }
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b bg-gradient-to-r from-blue-600 to-blue-700 text-white">
          <div>
            <h2 className="text-2xl font-bold">PATIENT ADMISSION FORM</h2>
            <p className="text-blue-100 text-sm mt-1">
              {patient && `Patient: ${formData.patientFullName}`} 
              {bedNumber && ` | Bed: ${bedNumber}`}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              🖨️ Print
            </button>
            <button
              onClick={onClose}
              className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-lg transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* Patient's Detail Section */}
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
              📋 PATIENT'S DETAIL
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient ID *
                </label>
                <input
                  type="text"
                  value={formData.patientId}
                  onChange={(e) => handleInputChange('patientId', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  IP No. *
                </label>
                <input
                  type="text"
                  value={formData.ipNo}
                  onChange={(e) => handleInputChange('ipNo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Patient's Full Name *
                </label>
                <input
                  type="text"
                  value={formData.patientFullName}
                  onChange={(e) => handleInputChange('patientFullName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Father's/Husband Name
                </label>
                <input
                  type="text"
                  value={formData.fatherHusbandName}
                  onChange={(e) => handleInputChange('fatherHusbandName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Age
                </label>
                <input
                  type="text"
                  value={formData.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Religion
                </label>
                <input
                  type="text"
                  value={formData.religion}
                  onChange={(e) => handleInputChange('religion', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nationality
                </label>
                <input
                  type="text"
                  value={formData.nationality}
                  onChange={(e) => handleInputChange('nationality', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Occupation
                </label>
                <input
                  type="text"
                  value={formData.occupation}
                  onChange={(e) => handleInputChange('occupation', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contact No.
                </label>
                <input
                  type="tel"
                  value={formData.contactNo}
                  onChange={(e) => handleInputChange('contactNo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Aadhar No.
                </label>
                <input
                  type="text"
                  value={formData.aadharNo}
                  onChange={(e) => handleInputChange('aadharNo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  maxLength={12}
                />
              </div>
            </div>

            {/* Type of Admission */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Type of Admission *
              </label>
              <div className="flex flex-wrap gap-4">
                {['Cash', 'RGHS', 'TPA', 'Other'].map((type) => (
                  <label key={type} className="flex items-center">
                    <input
                      type="radio"
                      name="typeOfAdmission"
                      value={type}
                      checked={formData.typeOfAdmission === type}
                      onChange={(e) => handleInputChange('typeOfAdmission', e.target.value)}
                      className="mr-2 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{type}</span>
                  </label>
                ))}
              </div>
              {formData.typeOfAdmission === 'Other' && (
                <input
                  type="text"
                  placeholder="Please specify..."
                  value={formData.otherAdmissionType}
                  onChange={(e) => handleInputChange('otherAdmissionType', e.target.value)}
                  className="mt-2 w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}
            </div>

            {/* Full Address */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Address
              </label>
              <textarea
                value={formData.fullAddress}
                onChange={(e) => handleInputChange('fullAddress', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter complete address..."
              />
            </div>
          </div>

          {/* Advance Deposit Detail Section */}
          <div className="bg-yellow-50 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
              💰 ADVANCE DEPOSIT DETAIL
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.depositDate}
                  onChange={(e) => handleInputChange('depositDate', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Receipt No.
                </label>
                <input
                  type="text"
                  value={formData.receiptNo}
                  onChange={(e) => handleInputChange('receiptNo', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Received From
                </label>
                <input
                  type="text"
                  value={formData.receivedFrom}
                  onChange={(e) => handleInputChange('receivedFrom', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (Rs.)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) => handleInputChange('amount', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Received By
                </label>
                <input
                  type="text"
                  value={formData.receivedBy}
                  onChange={(e) => handleInputChange('receivedBy', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Medical Legal Case */}
            <div className="border-t pt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
                🚨 MEDICAL LEGAL CASE
              </h4>
              
              {/* MLC Yes/No Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Is this a Medical Legal Case? *
                </label>
                <div className="flex gap-6">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="isMlcCase"
                      value="yes"
                      checked={formData.isMlcCase === 'yes'}
                      onChange={(e) => handleInputChange('isMlcCase', e.target.value)}
                      className="mr-2 text-red-600 focus:ring-red-500"
                    />
                    <span className="text-sm text-gray-700 font-medium">✅ YES</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="isMlcCase"
                      value="no"
                      checked={formData.isMlcCase === 'no'}
                      onChange={(e) => handleInputChange('isMlcCase', e.target.value)}
                      className="mr-2 text-green-600 focus:ring-green-500"
                    />
                    <span className="text-sm text-gray-700 font-medium">❌ NO</span>
                  </label>
                </div>
              </div>

              {/* MLC Details - Only show when YES is selected */}
              {formData.isMlcCase === 'yes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 p-4 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Casualty No.
                    </label>
                    <input
                      type="text"
                      value={formData.casualtyNo}
                      onChange={(e) => handleInputChange('casualtyNo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      MLC No.
                    </label>
                    <input
                      type="text"
                      value={formData.mlcNo}
                      onChange={(e) => handleInputChange('mlcNo', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Sub Inspector
                    </label>
                    <input
                      type="text"
                      value={formData.subInspector}
                      onChange={(e) => handleInputChange('subInspector', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Police Station
                    </label>
                    <input
                      type="text"
                      value={formData.policeStation}
                      onChange={(e) => handleInputChange('policeStation', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}

              {/* Non-MLC Message - Show when NO is selected */}
              {formData.isMlcCase === 'no' && (
                <div className="p-4 bg-green-50 rounded-lg border border-green-200 text-center">
                  <p className="text-green-700 font-medium">✅ This is a Non-MLC case</p>
                  <p className="text-green-600 text-sm mt-1">No additional legal documentation required</p>
                </div>
              )}
            </div>
          </div>

          {/* Discharge Detail Section */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-gray-800 mb-6 border-b pb-2">
              🏥 DISCHARGE DETAIL
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Final Diagnosis
                </label>
                <textarea
                  value={formData.finalDiagnosis}
                  onChange={(e) => handleInputChange('finalDiagnosis', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter final diagnosis..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Condition on Discharge
                  </label>
                  <div className="space-y-2">
                    {['Unchanged', 'Relieved', 'Cured'].map((condition) => (
                      <label key={condition} className="flex items-center">
                        <input
                          type="radio"
                          name="conditionOnDischarge"
                          value={condition}
                          checked={formData.conditionOnDischarge === condition}
                          onChange={(e) => handleInputChange('conditionOnDischarge', e.target.value)}
                          className="mr-2 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{condition}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Status
                  </label>
                  <div className="space-y-2">
                    {['Normal', 'Expired', 'Absconded', 'LAMA', 'Transferred'].map((status) => (
                      <label key={status} className="flex items-center">
                        <input
                          type="radio"
                          name="status"
                          value={status}
                          checked={formData.status === status}
                          onChange={(e) => handleInputChange('status', e.target.value)}
                          className="mr-2 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Discharge
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfDischarge}
                    onChange={(e) => handleInputChange('dateOfDischarge', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Time
                  </label>
                  <input
                    type="time"
                    value={formData.dischargeTime}
                    onChange={(e) => handleInputChange('dischargeTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Relative Sign
                  </label>
                  <input
                    type="text"
                    value={formData.relativeSign}
                    onChange={(e) => handleInputChange('relativeSign', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dr. Sign
                  </label>
                  <input
                    type="text"
                    value={formData.drSign}
                    onChange={(e) => handleInputChange('drSign', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Expired Patients Section */}
              {formData.status === 'Expired' && (
                <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                  <h4 className="text-lg font-semibold text-red-800 mb-4">
                    ⚠️ EXPIRED PATIENTS
                  </h4>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Expired within 24 hrs./After 24hrs.
                      </label>
                      <div className="flex gap-6">
                        {['Expired within 24 hrs.', 'After 24hrs.'].map((option) => (
                          <label key={option} className="flex items-center">
                            <input
                              type="radio"
                              name="expiredWithin24hrs"
                              value={option}
                              checked={formData.expiredWithin24hrs === option}
                              onChange={(e) => handleInputChange('expiredWithin24hrs', e.target.value)}
                              className="mr-2 text-red-600 focus:ring-red-500"
                            />
                            <span className="text-sm text-gray-700">{option}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Expired Date
                        </label>
                        <input
                          type="date"
                          value={formData.expiredDate}
                          onChange={(e) => handleInputChange('expiredDate', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Time
                        </label>
                        <input
                          type="time"
                          value={formData.expiredTime}
                          onChange={(e) => handleInputChange('expiredTime', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Body Handovered To
                        </label>
                        <input
                          type="text"
                          value={formData.bodyHandoveredTo}
                          onChange={(e) => handleInputChange('bodyHandoveredTo', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Declared By
                        </label>
                        <input
                          type="text"
                          value={formData.declaredBy}
                          onChange={(e) => handleInputChange('declaredBy', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Doctor's Sign
                        </label>
                        <input
                          type="text"
                          value={formData.doctorSign}
                          onChange={(e) => handleInputChange('doctorSign', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Save Admission Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientAdmissionForm;