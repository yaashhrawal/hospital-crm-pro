import React, { useState, useEffect } from 'react';
import type { PatientWithRelations } from '../config/supabaseNew';
import toast from 'react-hot-toast';
import { getEffectiveIPDNumber } from '../utils/ipdUtils';

interface ClinicalRecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientWithRelations;
  bedNumber: number;
  ipdNumber?: string;
  onSubmit: (clinicalData: any) => void;
}

interface ClinicalRecordData {
  // Patient Information
  patientName: string;
  department: string;
  patientId: string;
  ipNumber: string;
  ageSex: string;
  doctorName: string;
  
  // Medical History
  presentHistory: string;
  pastHistory: string;
  personalHistory: string;
  familyHistory: string;
  
  // Vital Signs
  temperature: string;
  pulse: string;
  respiration: string;
  bloodPressure: string;
  
  // Physical Examination
  systemicExamination: string;
  localExamination: string;
  otherSystem: string;
  
  // Clinical Diagnosis
  provisionalDiagnosis: string;
  finalDiagnosis: string;
  
  // Additional Information
  admissionDate: string;
  admissionTime: string;
  roomBedNumber: string;
  emergencyContact: string;
  
  // Authorization - Consultant Only
  consultantName: string;
  consultantSignature: string;
  consultantDateTime: string;
}

const ClinicalRecordForm: React.FC<ClinicalRecordFormProps> = ({
  isOpen,
  onClose,
  patient,
  bedNumber,
  ipdNumber,
  onSubmit
}) => {
  const [formData, setFormData] = useState<ClinicalRecordData>({
    patientName: '',
    department: '',
    patientId: '',
    ipNumber: '',
    ageSex: '',
    doctorName: '',
    presentHistory: '',
    pastHistory: '',
    personalHistory: '',
    familyHistory: '',
    temperature: '',
    pulse: '',
    respiration: '',
    bloodPressure: '',
    systemicExamination: '',
    localExamination: '',
    otherSystem: '',
    provisionalDiagnosis: '',
    finalDiagnosis: '',
    admissionDate: '',
    admissionTime: '',
    roomBedNumber: '',
    emergencyContact: '',
    consultantName: '',
    consultantSignature: '',
    consultantDateTime: ''
  });

  // Auto-populate form with patient data and current date/time
  useEffect(() => {
    if (isOpen && patient) {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().split(' ')[0].substring(0, 5);
      const currentDateTime = now.toISOString().slice(0, 16);
      
      setFormData(prev => ({
        ...prev,
        patientName: `${patient.first_name} ${patient.last_name}`,
        patientId: patient.patient_id,
        ipNumber: getEffectiveIPDNumber(ipdNumber),
        ageSex: `${patient.age || 'N/A'}/${patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : patient.gender}`,
        department: patient.assigned_department || 'General',
        doctorName: patient.assigned_doctor || '',
        admissionDate: today,
        admissionTime: currentTime,
        roomBedNumber: `Bed ${bedNumber}`,
        emergencyContact: patient.emergency_contact_phone || '',
        consultantName: patient.assigned_doctor || '',
        consultantDateTime: currentDateTime
      }));
    }
  }, [isOpen, patient, bedNumber, ipdNumber]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.patientName || !formData.patientId || !formData.doctorName) {
      toast.error('Please fill in all required fields (Patient Name, Patient ID, and Doctor Name)');
      return;
    }

    // Save clinical record data
    onSubmit({
      ...formData,
      submittedAt: new Date().toISOString(),
      bedNumber
    });
    
    toast.success('Clinical record saved successfully');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    
    if (printWindow) {
      const fullPrintContent = generateFullPrintContent();
      printWindow.document.write(fullPrintContent);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        try {
          printWindow.print();
          // Don't auto-close, let user close manually
          // printWindow.close();
        } catch (error) {
          console.error('Print error:', error);
        }
      }, 500);
    }
  };

  const generateFullPrintContent = () => {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Clinical Record - ${formData.patientName}</title>
  <meta charset="utf-8">
  <style>
            @page {
              margin: 0.5in;
              size: A4 portrait;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
              font-size: 10pt;
              line-height: 1.3;
              color: black;
              background: white;
            }
            
            .print-container {
              max-width: 100%;
              margin: 0 auto;
              padding: 0;
            }
            
            /* First Page Header */
            .page-1-header {
              text-align: center;
              border-bottom: 2px solid black;
              margin-bottom: 12pt;
              padding-bottom: 8pt;
              page-break-after: avoid;
            }
            
            .page-1-header h1 {
              font-size: 18pt;
              font-weight: bold;
              margin-bottom: 4pt;
            }
            
            .page-1-header h2 {
              font-size: 14pt;
              font-weight: bold;
              margin-top: 4pt;
            }
            
            .page-1-header p {
              font-size: 9pt;
              margin: 2pt 0;
            }
            
            /* Page 1 Content Container */
            .page-1-content {
              page-break-after: always;
              height: 100vh;
              display: flex;
              flex-direction: column;
            }
            
            /* Second Page Header */
            .page-2-header {
              text-align: center;
              border-bottom: 2px solid black;
              margin-bottom: 12pt;
              padding-bottom: 8pt;
              page-break-before: always;
              page-break-after: avoid;
            }
            
            .page-2-header h1 {
              font-size: 18pt;
              font-weight: bold;
              margin-bottom: 4pt;
            }
            
            .page-2-header h2 {
              font-size: 14pt;
              font-weight: bold;
              margin-top: 4pt;
            }
            
            .page-2-header p {
              font-size: 9pt;
              margin: 2pt 0;
            }
            
            .print-section {
              margin-bottom: 8pt;
              page-break-inside: avoid;
              border: 1px solid #ccc;
              padding: 6pt;
              background: #f9f9f9;
            }
            
            .print-section h3 {
              font-size: 11pt;
              font-weight: bold;
              margin-bottom: 6pt;
              border-bottom: 1px solid #666;
              padding-bottom: 3pt;
            }
            
            /* Page 1 specific sections - compact spacing */
            .page-1-content .print-section {
              margin-bottom: 6pt;
              padding: 4pt;
            }
            
            .page-1-content .print-section h3 {
              font-size: 10pt;
              margin-bottom: 4pt;
              padding-bottom: 2pt;
            }
            
            .print-field-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 6pt;
              margin-bottom: 6pt;
            }
            
            .print-field {
              margin-bottom: 4pt;
              display: flex;
              align-items: center;
            }
            
            .print-field label {
              font-weight: bold;
              font-size: 8pt;
              margin-right: 3pt;
              min-width: 80pt;
            }
            
            .print-field-value {
              border-bottom: 1px solid black;
              padding: 1pt 0;
              font-size: 9pt;
              min-height: 12pt;
              flex: 1;
            }
            
            .print-textarea {
              border: 1px solid black;
              padding: 4pt;
              min-height: 35pt;
              background: white;
              font-size: 9pt;
              white-space: pre-wrap;
            }
            
            /* Page 1 specific textarea - more compact */
            .page-1-content .print-textarea {
              min-height: 25pt;
              padding: 3pt;
              font-size: 8pt;
            }
            
            .vital-signs-table {
              width: 100%;
              border-collapse: collapse;
              margin: 6pt 0;
            }
            
            .vital-signs-table th,
            .vital-signs-table td {
              border: 1px solid black;
              padding: 4pt;
              text-align: center;
              font-size: 9pt;
            }
            
            .vital-signs-table th {
              background: #f0f0f0;
              font-weight: bold;
            }
            
            .page-2-content {
              page-break-before: always;
            }
            
            .print-signature-section {
              margin-top: 8pt;
              page-break-inside: avoid;
              border: 1px solid black;
              padding: 6pt;
              background: white;
            }
            
            .print-signature-section h3 {
              font-size: 10pt;
              margin-bottom: 6pt;
            }
            
            .print-signature-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 8pt;
            }
            
            .signature-box {
              border-bottom: 1px solid black;
              height: 20pt;
              margin: 3pt 0;
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${generatePrintContent()}
          </div>
        </body>
      </html>`;
  };

  const generatePrintContent = () => {
    return `
      <!-- PAGE 1: CLINICAL RECORD -->
      <div class="page-1-content">
        <!-- First Page Header -->
        <div class="page-1-header">
          <h1>VALANT HOSPITAL</h1>
          <p>A-10, Madhav Vihar, Shobhagpura, Udaipur | +91-911911 8000</p>
          <h2>CLINICAL RECORD</h2>
        </div>

        <!-- Patient Information Section - Page 1 -->
        <div class="print-section">
          <h3>Patient Information</h3>
          <div class="print-field-grid">
            <div class="print-field">
              <label>Patient's Name:</label>
              <span class="print-field-value">${formData.patientName || ''}</span>
            </div>
            <div class="print-field">
              <label>Department:</label>
              <span class="print-field-value">${formData.department || ''}</span>
            </div>
            <div class="print-field">
              <label>Patient Id:</label>
              <span class="print-field-value">${formData.patientId || ''}</span>
            </div>
            <div class="print-field">
              <label>IP No.:</label>
              <span class="print-field-value">${formData.ipNumber || ''}</span>
            </div>
            <div class="print-field">
              <label>Age/Sex:</label>
              <span class="print-field-value">${formData.ageSex || ''}</span>
            </div>
            <div class="print-field">
              <label>Name of Doctor:</label>
              <span class="print-field-value">${formData.doctorName || ''}</span>
            </div>
          </div>
        </div>

        <!-- Medical History Sections - Page 1 -->
        <div class="print-section">
          <h3>Present History</h3>
          <div class="print-textarea">${formData.presentHistory || ''}</div>
        </div>

        <div class="print-section">
          <h3>Past History</h3>
          <div class="print-textarea">${formData.pastHistory || ''}</div>
        </div>

        <div class="print-section">
          <h3>Personal History</h3>
          <div class="print-textarea">${formData.personalHistory || ''}</div>
        </div>

        <div class="print-section">
          <h3>Family History</h3>
          <div class="print-textarea">${formData.familyHistory || ''}</div>
        </div>
      </div>

      <!-- PAGE 2: CLINICAL RECORD (Cont.) -->
      <!-- Second Page Header -->
      <div class="page-2-header">
        <h1>VALANT HOSPITAL</h1>
        <p>A-10, Madhav Vihar, Shobhagpura, Udaipur | +91-911911 8000</p>
        <h2>CLINICAL RECORD (Cont.)</h2>
      </div>

      <!-- Patient Information Section - Page 2 (Repeated) -->
      <div class="print-section">
        <h3>Patient Information</h3>
        <div class="print-field-grid">
          <div class="print-field">
            <label>Patient's Name:</label>
            <span class="print-field-value">${formData.patientName || ''}</span>
          </div>
          <div class="print-field">
            <label>Department:</label>
            <span class="print-field-value">${formData.department || ''}</span>
          </div>
          <div class="print-field">
            <label>Patient Id:</label>
            <span class="print-field-value">${formData.patientId || ''}</span>
          </div>
          <div class="print-field">
            <label>IP No.:</label>
            <span class="print-field-value">${formData.ipNumber || ''}</span>
          </div>
          <div class="print-field">
            <label>Age/Sex:</label>
            <span class="print-field-value">${formData.ageSex || ''}</span>
          </div>
          <div class="print-field">
            <label>Name of Doctor:</label>
            <span class="print-field-value">${formData.doctorName || ''}</span>
          </div>
        </div>
      </div>

      <!-- General Physical Examination - Page 2 -->
      <div class="print-section">
        <h3>General Physical Examination</h3>
        <table class="vital-signs-table">
          <thead>
            <tr>
              <th>TEMP.</th>
              <th>PULSE</th>
              <th>RESP</th>
              <th>BP</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${formData.temperature || ''}</td>
              <td>${formData.pulse || ''}</td>
              <td>${formData.respiration || ''}</td>
              <td>${formData.bloodPressure || ''}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Physical Examination Sections - Page 2 -->
      <div class="print-section">
        <h3>Systemic Examination</h3>
        <div class="print-textarea">${formData.systemicExamination || ''}</div>
      </div>

      <div class="print-section">
        <h3>Local Examination</h3>
        <div class="print-textarea">${formData.localExamination || ''}</div>
      </div>

      <div class="print-section">
        <h3>Other System</h3>
        <div class="print-textarea">${formData.otherSystem || ''}</div>
      </div>

      <!-- Clinical Diagnosis Section - Page 2 -->
      <div class="print-section">
        <h3>Clinical Diagnosis</h3>
        <div style="margin-bottom: 10pt;">
          <div class="print-field">
            <label>Provisional:</label>
            <div class="print-textarea" style="min-height: 40pt;">${formData.provisionalDiagnosis || ''}</div>
          </div>
        </div>
        <div>
          <div class="print-field">
            <label>Final:</label>
            <div class="print-textarea" style="min-height: 40pt;">${formData.finalDiagnosis || ''}</div>
          </div>
        </div>
      </div>

      <!-- Authorization Section - Page 2 -->
      <div class="print-signature-section">
        <h3>Consultant Authorization</h3>
        <div class="print-signature-grid">
          <div>
            <div class="print-field">
              <label>Consultant Name:</label>
              <span class="print-field-value">${formData.consultantName || ''}</span>
            </div>
          </div>
          <div>
            <label>Signature:</label>
            <div class="signature-box"></div>
          </div>
          <div>
            <div class="print-field">
              <label>Date & Time:</label>
              <span class="print-field-value">${formData.consultantDateTime || ''}</span>
            </div>
          </div>
        </div>
      </div>
    `;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Action Buttons - Hidden during print */}
        <div className="flex justify-end gap-2 p-4 border-b print-hide">
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

        <div className="p-6">
          {/* Header Section */}
          <div className="text-center border-b-2 border-gray-300 pb-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">VALANT HOSPITAL</h1>
            <p className="text-gray-600 text-sm mb-4">
              A-10, Madhav Vihar, Shobhagpura, Udaipur | +91-911911 8000
            </p>
            <h2 className="text-2xl font-semibold text-gray-800 uppercase tracking-wide">Clinical Record</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Patient Demographics Section */}
            <div className="bg-blue-50 p-6 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 border-b border-gray-300 pb-2">Patient Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  <div className="flex items-center">
                    <label className="font-semibold text-sm w-32 flex-shrink-0">Patient's Name :</label>
                    <input 
                      type="text" 
                      name="patientName" 
                      value={formData.patientName}
                      onChange={handleInputChange}
                      className="flex-1 px-2 py-1 text-base border-b-2 border-gray-300 bg-transparent focus:border-blue-500 outline-none"
                      required
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <label className="font-semibold text-sm w-32 flex-shrink-0">Department :</label>
                    <input 
                      type="text" 
                      name="department" 
                      value={formData.department}
                      onChange={handleInputChange}
                      className="flex-1 px-2 py-1 text-base border-b-2 border-gray-300 bg-transparent focus:border-blue-500 outline-none"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <label className="font-semibold text-sm w-32 flex-shrink-0">Patient Id :</label>
                    <input 
                      type="text" 
                      name="patientId" 
                      value={formData.patientId}
                      onChange={handleInputChange}
                      className="flex-1 px-2 py-1 text-base border-b-2 border-gray-300 bg-transparent focus:border-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>
                
                {/* Right Column */}
                <div className="space-y-6">
                  <div className="flex items-center">
                    <label className="font-semibold text-sm w-32 flex-shrink-0">IP No. :</label>
                    <input 
                      type="text" 
                      name="ipNumber" 
                      value={formData.ipNumber}
                      onChange={handleInputChange}
                      className="flex-1 px-2 py-1 text-base border-b-2 border-gray-300 bg-transparent focus:border-blue-500 outline-none"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <label className="font-semibold text-sm w-32 flex-shrink-0">Age/Sex :</label>
                    <input 
                      type="text" 
                      name="ageSex" 
                      value={formData.ageSex}
                      onChange={handleInputChange}
                      className="flex-1 px-2 py-1 text-base border-b-2 border-gray-300 bg-transparent focus:border-blue-500 outline-none"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <label className="font-semibold text-sm w-32 flex-shrink-0">Name of Doctor :</label>
                    <input 
                      type="text" 
                      name="doctorName" 
                      value={formData.doctorName}
                      onChange={handleInputChange}
                      className="flex-1 px-2 py-1 text-base border-b-2 border-gray-300 bg-transparent focus:border-blue-500 outline-none"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Medical History Sections */}
            <div className="space-y-8">
              {/* Present History */}
              <div className="bg-yellow-50 p-6 rounded-lg border">
                <div className="mb-4">
                  <label className="font-semibold text-base block mb-3">Present History :</label>
                  <textarea 
                    name="presentHistory" 
                    value={formData.presentHistory}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter details about the patient's current condition, symptoms, duration, and relevant information about the present illness..."
                  />
                </div>
              </div>

              {/* Past History */}
              <div className="bg-green-50 p-6 rounded-lg border">
                <div className="mb-4">
                  <label className="font-semibold text-base block mb-3">Past History :</label>
                  <textarea 
                    name="pastHistory" 
                    value={formData.pastHistory}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter details about previous illnesses, surgeries, hospitalizations, medications, allergies, and other relevant medical history..."
                  />
                </div>
              </div>

              {/* Personal History */}
              <div className="bg-purple-50 p-6 rounded-lg border">
                <div className="mb-4">
                  <label className="font-semibold text-base block mb-3">Personal History :</label>
                  <textarea 
                    name="personalHistory" 
                    value={formData.personalHistory}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter details about lifestyle, habits (smoking, alcohol, diet), occupation, marital status, and other personal factors..."
                  />
                </div>
              </div>

              {/* Family History */}
              <div className="bg-red-50 p-6 rounded-lg border">
                <div className="mb-4">
                  <label className="font-semibold text-base block mb-3">Family History :</label>
                  <textarea 
                    name="familyHistory" 
                    value={formData.familyHistory}
                    onChange={handleInputChange}
                    rows={6}
                    className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter details about family medical history, hereditary conditions, genetic disorders, and relevant family health information..."
                  />
                </div>
              </div>
            </div>

            {/* Second Page Visual Separator */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg text-center my-8">
              <h2 className="text-xl font-bold mb-2">CLINICAL RECORD (Cont.)</h2>
              <p className="text-sm opacity-90">The following sections will appear on page 2 when printed</p>
            </div>

            {/* General Physical Examination */}
            <div className="bg-indigo-50 p-6 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 border-b border-gray-300 pb-2">General Physical Examination</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="font-semibold text-sm block mb-2">TEMP. :</label>
                  <input 
                    type="text" 
                    name="temperature" 
                    value={formData.temperature}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="°F / °C"
                  />
                </div>
                <div>
                  <label className="font-semibold text-sm block mb-2">PULSE :</label>
                  <input 
                    type="text" 
                    name="pulse" 
                    value={formData.pulse}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="bpm"
                  />
                </div>
                <div>
                  <label className="font-semibold text-sm block mb-2">RESP :</label>
                  <input 
                    type="text" 
                    name="respiration" 
                    value={formData.respiration}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="per min"
                  />
                </div>
                <div>
                  <label className="font-semibold text-sm block mb-2">BP :</label>
                  <input 
                    type="text" 
                    name="bloodPressure" 
                    value={formData.bloodPressure}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="mmHg"
                  />
                </div>
              </div>
            </div>

            {/* Systemic Examination */}
            <div className="bg-green-50 p-6 rounded-lg border">
              <div className="mb-4">
                <label className="font-semibold text-base block mb-3">Systemic Examination :</label>
                <textarea 
                  name="systemicExamination" 
                  value={formData.systemicExamination}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter details about cardiovascular, respiratory, gastrointestinal, and other systemic findings..."
                />
              </div>
            </div>

            {/* Local Examination */}
            <div className="bg-orange-50 p-6 rounded-lg border">
              <div className="mb-4">
                <label className="font-semibold text-base block mb-3">Local Examination :</label>
                <textarea 
                  name="localExamination" 
                  value={formData.localExamination}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter details about local examination findings of the affected area..."
                />
              </div>
            </div>

            {/* Other System */}
            <div className="bg-pink-50 p-6 rounded-lg border">
              <div className="mb-4">
                <label className="font-semibold text-base block mb-3">Other System :</label>
                <textarea 
                  name="otherSystem" 
                  value={formData.otherSystem}
                  onChange={handleInputChange}
                  rows={5}
                  className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter details about neurological, musculoskeletal, and other system findings..."
                />
              </div>
            </div>

            {/* Clinical Diagnosis */}
            <div className="bg-red-50 p-6 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 border-b border-gray-300 pb-2">Clinical Diagnosis</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="font-semibold text-base block mb-3">Provisional :</label>
                  <textarea 
                    name="provisionalDiagnosis" 
                    value={formData.provisionalDiagnosis}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter provisional diagnosis..."
                  />
                </div>
                
                <div>
                  <label className="font-semibold text-base block mb-3">Final :</label>
                  <textarea 
                    name="finalDiagnosis" 
                    value={formData.finalDiagnosis}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full p-3 border border-gray-300 rounded-md resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter final diagnosis..."
                  />
                </div>
              </div>
            </div>

            {/* Additional Clinical Information */}
            <div className="bg-gray-50 p-6 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 border-b border-gray-300 pb-2">Additional Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center">
                    <label className="font-semibold text-sm w-32 flex-shrink-0">Date of Admission :</label>
                    <input 
                      type="date" 
                      name="admissionDate" 
                      value={formData.admissionDate}
                      onChange={handleInputChange}
                      className="flex-1 px-2 py-1 text-base border-b-2 border-gray-300 bg-transparent focus:border-blue-500 outline-none"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <label className="font-semibold text-sm w-32 flex-shrink-0">Time of Admission :</label>
                    <input 
                      type="time" 
                      name="admissionTime" 
                      value={formData.admissionTime}
                      onChange={handleInputChange}
                      className="flex-1 px-2 py-1 text-base border-b-2 border-gray-300 bg-transparent focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center">
                    <label className="font-semibold text-sm w-32 flex-shrink-0">Room/Bed No. :</label>
                    <input 
                      type="text" 
                      name="roomBedNumber" 
                      value={formData.roomBedNumber}
                      onChange={handleInputChange}
                      className="flex-1 px-2 py-1 text-base border-b-2 border-gray-300 bg-transparent focus:border-blue-500 outline-none"
                    />
                  </div>
                  
                  <div className="flex items-center">
                    <label className="font-semibold text-sm w-32 flex-shrink-0">Emergency Contact :</label>
                    <input 
                      type="tel" 
                      name="emergencyContact" 
                      value={formData.emergencyContact}
                      onChange={handleInputChange}
                      className="flex-1 px-2 py-1 text-base border-b-2 border-gray-300 bg-transparent focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Consultant Authorization Section */}
            <div className="bg-blue-50 p-6 rounded-lg border">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 border-b border-gray-300 pb-2">Consultant Authorization</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="font-semibold text-sm block mb-2">Consultant Name:</label>
                    <input 
                      type="text" 
                      name="consultantName" 
                      value={formData.consultantName}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 text-base border-b-2 border-gray-300 bg-transparent focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="font-semibold text-sm block mb-2">Signature:</label>
                    <div className="border-b-2 border-gray-300 h-16 w-full bg-white rounded-md"></div>
                    <p className="text-xs text-gray-500 mt-1">Signature will be added manually</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="font-semibold text-sm block mb-2">Date & Time:</label>
                    <input 
                      type="datetime-local" 
                      name="consultantDateTime" 
                      value={formData.consultantDateTime}
                      onChange={handleInputChange}
                      className="w-full px-2 py-1 text-base border-b-2 border-gray-300 bg-transparent focus:border-blue-500 outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-8">
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 flex items-center gap-2"
              >
                <span>💾</span>
                Save Clinical Record
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ClinicalRecordForm;