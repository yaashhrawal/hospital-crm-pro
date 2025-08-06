import React, { useState, useEffect } from 'react';
import type { PatientWithRelations } from '../../config/supabaseNew';
import toast from 'react-hot-toast';

interface ConsentAnaesthesiaFormProps {
  patient?: PatientWithRelations;
  bedNumber?: number;
  ipdNumber?: string;
  initialData?: FormData;
  onSubmit?: (data: FormData) => void;
}

interface AnaesthesiaType {
  type: string;
  checked: boolean;
  expectedResult: string;
  majorRisks: string;
}

interface FormData {
  // Patient Header
  patientNo: string;
  patientName: string;
  age: string;
  sex: string;
  patientId: string;
  department: string;
  ward: string;
  
  // Consent Text
  consentPatientName: string;
  consentAge: string;
  
  // Anaesthesia Types
  anaesthesiaTypes: AnaesthesiaType[];
  otherSpecification: string;
  
  // Signatures
  patientName_sig: string;
  patientSignature: string;
  
  // Authorization by Patient Representative
  authReason: string;
  representativeName: string;
  witnessName: string;
  interpreterName: string;
  
  anaesthesiologistName: string;
  
  // Signature details
  patientSigName: string;
  patientSigDate: string;
  patientSigTime: string;
  
  representativeSigName: string;
  representativeSignature: string;
  representativeSigDate: string;
  representativeSigTime: string;
  
  witnessSigName: string;
  witnessSignature: string;
  witnessSigDate: string;
  witnessSigTime: string;
  
  anaesthesiologistSigName: string;
  anaesthesiologistSignature: string;
  anaesthesiologistSigDate: string;
  anaesthesiologistSigTime: string;
}

const ConsentAnaesthesiaForm: React.FC<ConsentAnaesthesiaFormProps> = ({
  patient,
  bedNumber,
  ipdNumber,
  initialData,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<FormData>(() => ({
    patientNo: initialData?.patientNo || '',
    patientName: initialData?.patientName || '',
    age: initialData?.age || '',
    sex: initialData?.sex || '',
    patientId: initialData?.patientId || '',
    department: initialData?.department || '',
    ward: initialData?.ward || '',
    consentPatientName: initialData?.consentPatientName || '',
    consentAge: initialData?.consentAge || '',
    anaesthesiaTypes: initialData?.anaesthesiaTypes || [
      { type: 'General Anaesthesia', checked: false, expectedResult: '', majorRisks: '' },
      { type: 'Spinal or Epidural analgesia/anaesthesia', checked: false, expectedResult: '', majorRisks: '' },
      { type: 'With sedation', checked: false, expectedResult: '', majorRisks: '' },
      { type: 'Without Sedation', checked: false, expectedResult: '', majorRisks: '' },
      { type: 'Nerve Block', checked: false, expectedResult: '', majorRisks: '' },
      { type: 'With sedation (Nerve Block)', checked: false, expectedResult: '', majorRisks: '' },
      { type: 'Other', checked: false, expectedResult: '', majorRisks: '' },
      { type: 'With sedation (Other)', checked: false, expectedResult: '', majorRisks: '' },
      { type: 'Without sedation (Other)', checked: false, expectedResult: '', majorRisks: '' }
    ],
    otherSpecification: initialData?.otherSpecification || '',
    patientName_sig: initialData?.patientName_sig || '',
    patientSignature: initialData?.patientSignature || '',
    authReason: initialData?.authReason || '',
    representativeName: initialData?.representativeName || '',
    witnessName: initialData?.witnessName || '',
    interpreterName: initialData?.interpreterName || '',
    anaesthesiologistName: initialData?.anaesthesiologistName || '',
    patientSigName: initialData?.patientSigName || '',
    patientSigDate: initialData?.patientSigDate || '',
    patientSigTime: initialData?.patientSigTime || '',
    representativeSigName: initialData?.representativeSigName || '',
    representativeSignature: initialData?.representativeSignature || '',
    representativeSigDate: initialData?.representativeSigDate || '',
    representativeSigTime: initialData?.representativeSigTime || '',
    witnessSigName: initialData?.witnessSigName || '',
    witnessSignature: initialData?.witnessSignature || '',
    witnessSigDate: initialData?.witnessSigDate || '',
    witnessSigTime: initialData?.witnessSigTime || '',
    anaesthesiologistSigName: initialData?.anaesthesiologistSigName || '',
    anaesthesiologistSignature: initialData?.anaesthesiologistSignature || '',
    anaesthesiologistSigDate: initialData?.anaesthesiologistSigDate || '',
    anaesthesiologistSigTime: initialData?.anaesthesiologistSigTime || ''
  }));

  // Auto-populate form with patient data only if no initial data is provided
  useEffect(() => {
    if (patient && !initialData) {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });

      setFormData(prev => ({
        ...prev,
        patientName: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
        patientId: patient.patient_id || '',
        patientNo: ipdNumber || '',
        age: patient.age?.toString() || '',
        sex: patient.gender || '',
        consentPatientName: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
        consentAge: patient.age?.toString() || '',
        patientSigDate: today,
        patientSigTime: currentTime,
        representativeSigDate: today,
        representativeSigTime: currentTime,
        witnessSigDate: today,
        witnessSigTime: currentTime,
        anaesthesiologistSigDate: today,
        anaesthesiologistSigTime: currentTime
      }));
    }
  }, [patient, ipdNumber, initialData]);

  // Update form data when initialData changes (when reopening with saved data)
  useEffect(() => {
    if (initialData) {
      setFormData({
        patientNo: initialData.patientNo || '',
        patientName: initialData.patientName || '',
        age: initialData.age || '',
        sex: initialData.sex || '',
        patientId: initialData.patientId || '',
        department: initialData.department || '',
        ward: initialData.ward || '',
        consentPatientName: initialData.consentPatientName || '',
        consentAge: initialData.consentAge || '',
        anaesthesiaTypes: initialData.anaesthesiaTypes || [
          { type: 'General Anaesthesia', checked: false, expectedResult: '', majorRisks: '' },
          { type: 'Spinal or Epidural analgesia/anaesthesia', checked: false, expectedResult: '', majorRisks: '' },
          { type: 'With sedation', checked: false, expectedResult: '', majorRisks: '' },
          { type: 'Without Sedation', checked: false, expectedResult: '', majorRisks: '' },
          { type: 'Nerve Block', checked: false, expectedResult: '', majorRisks: '' },
          { type: 'With sedation (Nerve Block)', checked: false, expectedResult: '', majorRisks: '' },
          { type: 'Other', checked: false, expectedResult: '', majorRisks: '' },
          { type: 'With sedation (Other)', checked: false, expectedResult: '', majorRisks: '' },
          { type: 'Without sedation (Other)', checked: false, expectedResult: '', majorRisks: '' }
        ],
        otherSpecification: initialData.otherSpecification || '',
        patientName_sig: initialData.patientName_sig || '',
        patientSignature: initialData.patientSignature || '',
        authReason: initialData.authReason || '',
        representativeName: initialData.representativeName || '',
        witnessName: initialData.witnessName || '',
        interpreterName: initialData.interpreterName || '',
        anaesthesiologistName: initialData.anaesthesiologistName || '',
        patientSigName: initialData.patientSigName || '',
        patientSigDate: initialData.patientSigDate || '',
        patientSigTime: initialData.patientSigTime || '',
        representativeSigName: initialData.representativeSigName || '',
        representativeSignature: initialData.representativeSignature || '',
        representativeSigDate: initialData.representativeSigDate || '',
        representativeSigTime: initialData.representativeSigTime || '',
        witnessSigName: initialData.witnessSigName || '',
        witnessSignature: initialData.witnessSignature || '',
        witnessSigDate: initialData.witnessSigDate || '',
        witnessSigTime: initialData.witnessSigTime || '',
        anaesthesiologistSigName: initialData.anaesthesiologistSigName || '',
        anaesthesiologistSignature: initialData.anaesthesiologistSignature || '',
        anaesthesiologistSigDate: initialData.anaesthesiologistSigDate || '',
        anaesthesiologistSigTime: initialData.anaesthesiologistSigTime || ''
      });
      
      toast.success('Previously saved anaesthesia consent form data loaded successfully', {
        duration: 3000,
        icon: '📋'
      });
    }
  }, [initialData]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAnaesthesiaTypeChange = (index: number, field: keyof AnaesthesiaType, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      anaesthesiaTypes: prev.anaesthesiaTypes.map((type, i) => 
        i === index ? { ...type, [field]: value } : type
      )
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    } else {
      toast.success('Consent for Anaesthesia Form saved successfully');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Consent for Anaesthesia Form - ${formData.patientName}</title>
          <style>
            ${generatePrintContent()}
          </style>
        </head>
        <body>
          <div class="print-content">
            ${generateFormHTML()}
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 100);
    }
  };

  const generatePrintContent = () => {
    return `
      body {
        font-family: Arial, sans-serif;
        font-size: 12pt;
        line-height: 1.4;
        margin: 0;
        padding: 20pt;
        color: #000;
      }
      .header {
        text-align: center;
        margin-bottom: 20pt;
        border-bottom: 2pt solid #000;
        padding-bottom: 10pt;
      }
      .hospital-name {
        font-size: 18pt;
        font-weight: bold;
        margin-bottom: 5pt;
      }
      .hospital-address {
        font-size: 11pt;
        margin-bottom: 10pt;
      }
      .form-title {
        font-size: 16pt;
        font-weight: bold;
        text-transform: uppercase;
      }
      .section {
        margin-bottom: 15pt;
        page-break-inside: avoid;
      }
      .section-title {
        font-size: 13pt;
        font-weight: bold;
        margin-bottom: 8pt;
        border-bottom: 1pt solid #333;
        padding-bottom: 3pt;
      }
      .field-row {
        display: flex;
        margin-bottom: 8pt;
        align-items: center;
      }
      .field-label {
        font-weight: bold;
        margin-right: 8pt;
        min-width: 120pt;
      }
      .field-value {
        border-bottom: 1pt solid #000;
        min-width: 100pt;
        padding: 2pt 4pt;
        display: inline-block;
      }
      .consent-text {
        text-align: justify;
        line-height: 1.6;
        margin-bottom: 12pt;
      }
      .anaesthesia-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 15pt;
      }
      .anaesthesia-table th, .anaesthesia-table td {
        border: 1pt solid #000;
        padding: 8pt;
        text-align: left;
        vertical-align: top;
      }
      .anaesthesia-table th {
        background-color: #f0f0f0;
        font-weight: bold;
      }
      .checked-type {
        font-weight: bold;
      }
      .signature-section {
        margin-top: 20pt;
        page-break-inside: avoid;
      }
      .signature-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 15pt;
      }
      .signature-box {
        text-align: center;
        min-width: 120pt;
      }
      .signature-line {
        border-top: 1pt solid #000;
        margin-top: 30pt;
        padding-top: 5pt;
        font-size: 10pt;
      }
      @page {
        margin: 0.75in;
        size: A4 portrait;
      }
    `;
  };

  const generateFormHTML = () => {
    const checkedTypes = formData.anaesthesiaTypes.filter(type => type.checked);
    
    return `
      <div class="header">
        <div class="hospital-name">VALANT HOSPITAL</div>
        <div class="hospital-address">A-10, Madhav Vihar, Shobhagpura, Udaipur | +91-911911 8000</div>
        <div class="form-title">CONSENT FOR ANAESTHESIA</div>
      </div>

      <div class="section">
        <div class="section-title">Patient Information</div>
        <div class="field-row">
          <span class="field-label">Patient No./IPD No.:</span>
          <span class="field-value">${formData.patientNo || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Name of Patient:</span>
          <span class="field-value">${formData.patientName || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Age:</span>
          <span class="field-value">${formData.age || ''}</span>
          <span class="field-label" style="margin-left: 20pt;">Sex:</span>
          <span class="field-value">${formData.sex || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Patient ID:</span>
          <span class="field-value">${formData.patientId || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Dept./Unit:</span>
          <span class="field-value">${formData.department || ''}</span>
          <span class="field-label" style="margin-left: 20pt;">Ward/ICU:</span>
          <span class="field-value">${formData.ward || ''}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Consent Text</div>
        <div class="consent-text">
          I, <span class="field-value">${formData.consentPatientName || ''}</span> 
          aged <span class="field-value">${formData.consentAge || ''}</span> years, 
          hereby consent to receive anaesthesia for the planned procedure. I understand that anaesthesia involves certain risks and no guarantee can be made regarding the outcome.
        </div>
      </div>

      <div class="section">
        <div class="section-title">Anaesthesia Types</div>
        <table class="anaesthesia-table">
          <thead>
            <tr>
              <th>Selected Type</th>
              <th>Expected Result</th>
              <th>Major Risks</th>
            </tr>
          </thead>
          <tbody>
            ${checkedTypes.map(type => `
              <tr>
                <td class="checked-type">
                  ✓ ${type.type === 'Other' ? (formData.otherSpecification || 'Other') : type.type}
                </td>
                <td>${type.expectedResult || ''}</td>
                <td>${type.majorRisks || ''}</td>
              </tr>
            `).join('')}
            ${checkedTypes.length === 0 ? '<tr><td colspan="3" style="text-align: center; font-style: italic;">No anaesthesia types selected</td></tr>' : ''}
          </tbody>
        </table>
      </div>

      <div class="section">
        <div class="section-title">Final Consent</div>
        <div class="consent-text">
          I acknowledge that I have been informed about the anaesthetic procedure, its benefits, risks, and alternatives. 
          I understand that complications may occur and that no guarantee can be made regarding the outcome. 
          I consent to the administration of anaesthesia by qualified anaesthesiologists and their assistants.
        </div>
      </div>

      <div class="signature-section">
        <div class="section-title">Signatures</div>
        
        <div class="signature-row">
          <div class="signature-box">
            <div>Patient</div>
            <div class="signature-line">
              ${formData.patientSigName || ''}
            </div>
            <div style="font-size: 9pt; margin-top: 3pt;">Name</div>
          </div>
          <div class="signature-box">
            <div>Signature</div>
            <div class="signature-line">
              ${formData.patientSignature || ''}
            </div>
          </div>
          <div class="signature-box">
            <div>Date: ${formData.patientSigDate || ''}</div>
            <div>Time: ${formData.patientSigTime || ''}</div>
          </div>
        </div>

        ${formData.representativeName ? `
        <div class="signature-row">
          <div class="signature-box">
            <div>Patient Representative</div>
            <div class="signature-line">
              ${formData.representativeName || ''}
            </div>
            <div style="font-size: 9pt; margin-top: 3pt;">Name</div>
          </div>
          <div class="signature-box">
            <div>Signature</div>
            <div class="signature-line">
              ${formData.representativeSignature || ''}
            </div>
          </div>
          <div class="signature-box">
            <div>Date: ${formData.representativeSigDate || ''}</div>
            <div>Time: ${formData.representativeSigTime || ''}</div>
          </div>
        </div>
        ` : ''}

        ${formData.witnessName ? `
        <div class="signature-row">
          <div class="signature-box">
            <div>Witness</div>
            <div class="signature-line">
              ${formData.witnessName || ''}
            </div>
            <div style="font-size: 9pt; margin-top: 3pt;">Name</div>
          </div>
          <div class="signature-box">
            <div>Signature</div>
            <div class="signature-line">
              ${formData.witnessSignature || ''}
            </div>
          </div>
          <div class="signature-box">
            <div>Date: ${formData.witnessSigDate || ''}</div>
            <div>Time: ${formData.witnessSigTime || ''}</div>
          </div>
        </div>
        ` : ''}

        <div class="signature-row">
          <div class="signature-box">
            <div>Anaesthesiologist</div>
            <div class="signature-line">
              ${formData.anaesthesiologistSigName || ''}
            </div>
            <div style="font-size: 9pt; margin-top: 3pt;">Name</div>
          </div>
          <div class="signature-box">
            <div>Signature</div>
            <div class="signature-line">
              ${formData.anaesthesiologistSignature || ''}
            </div>
          </div>
          <div class="signature-box">
            <div>Date: ${formData.anaesthesiologistSigDate || ''}</div>
            <div>Time: ${formData.anaesthesiologistSigTime || ''}</div>
          </div>
        </div>

        ${formData.authReason ? `
        <div style="margin-top: 15pt; padding: 8pt; border: 1pt solid #000;">
          <div style="font-weight: bold; margin-bottom: 5pt;">Authorization Reason:</div>
          <div>${formData.authReason}</div>
        </div>
        ` : ''}
      </div>
    `;
  };

  return (
    <div className="max-w-4xl mx-auto bg-white">
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              margin: 0.75in;
              size: A4 portrait;
            }
            
            body * {
              visibility: hidden;
            }
            
            .print-content, .print-content * {
              visibility: visible;
            }
            
            .print-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            
            .no-print {
              display: none !important;
            }
            
            .print-table {
              border-collapse: collapse;
              width: 100%;
              font-size: 10pt;
            }
            
            .print-table th, .print-table td {
              border: 1px solid black;
              padding: 5pt;
              text-align: left;
            }
            
            .print-field {
              border-bottom: 1px solid black;
              min-width: 100pt;
              display: inline-block;
              padding: 2pt 4pt;
              margin: 0 2pt;
            }
          }
        `
      }} />

      {/* Action Buttons */}
      <div className="no-print flex justify-end gap-4 mb-6">
        <button
          onClick={handlePrint}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          🖨️ Print Form
        </button>
        <button
          onClick={handleSubmit}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors"
        >
          Save Form
        </button>
      </div>

      {/* Form Content */}
      <div className="print-content">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-black pb-4">
          <h1 className="text-2xl font-bold mb-2">VALANT HOSPITAL</h1>
          <p className="text-sm mb-2">A-10, Madhav Vihar, Shobhagpura, Udaipur | +91-911911 8000</p>
          <h2 className="text-xl font-semibold">CONSENT FOR ANAESTHESIA</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Header */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Patient No./IPD No.:</label>
                <input
                  type="text"
                  value={formData.patientNo}
                  onChange={(e) => handleInputChange('patientNo', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Name of Patient:</label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => handleInputChange('patientName', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Age/Sex:</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    placeholder="Age"
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={formData.sex}
                    onChange={(e) => handleInputChange('sex', e.target.value)}
                    className="flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select</option>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Patient ID:</label>
                <input
                  type="text"
                  value={formData.patientId}
                  onChange={(e) => handleInputChange('patientId', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Dept./Unit:</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ward/ICU:</label>
                <input
                  type="text"
                  value={formData.ward}
                  onChange={(e) => handleInputChange('ward', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Consent Text */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Consent Text</h3>
            <p className="text-justify mb-4">
              I, 
              <input
                type="text"
                value={formData.consentPatientName}
                onChange={(e) => handleInputChange('consentPatientName', e.target.value)}
                className="inline-block mx-2 px-2 py-1 border-b border-gray-400 focus:outline-none focus:border-blue-500 bg-transparent min-w-[200px] print-field"
                placeholder="Patient Name"
              />
              aged 
              <input
                type="text"
                value={formData.consentAge}
                onChange={(e) => handleInputChange('consentAge', e.target.value)}
                className="inline-block mx-2 px-2 py-1 border-b border-gray-400 focus:outline-none focus:border-blue-500 bg-transparent min-w-[50px] print-field"
                placeholder="Age"
              />
              years, hereby consent to receive anaesthesia for the planned procedure. I understand that anaesthesia involves certain risks and no guarantee can be made regarding the outcome.
            </p>
          </div>

          {/* Anaesthesia Types Table */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Anaesthesia Types</h3>
            <div className="overflow-x-auto">
              <table className="print-table w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Checked Type (✓)</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Expected Result</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Major Risks</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.anaesthesiaTypes.map((type, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={type.checked}
                            onChange={(e) => handleAnaesthesiaTypeChange(index, 'checked', e.target.checked)}
                            className="w-4 h-4"
                          />
                          <span className="text-sm">
                            {type.type === 'Other' ? (
                              <input
                                type="text"
                                value={formData.otherSpecification}
                                onChange={(e) => handleInputChange('otherSpecification', e.target.value)}
                                placeholder="Specify other type"
                                className="px-2 py-1 border rounded text-xs"
                              />
                            ) : (
                              type.type
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <textarea
                          value={type.expectedResult}
                          onChange={(e) => handleAnaesthesiaTypeChange(index, 'expectedResult', e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1 border rounded text-xs resize-none"
                          placeholder="Expected result"
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <textarea
                          value={type.majorRisks}
                          onChange={(e) => handleAnaesthesiaTypeChange(index, 'majorRisks', e.target.value)}
                          rows={2}
                          className="w-full px-2 py-1 border rounded text-xs resize-none"
                          placeholder="Major risks"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Final Consent Text */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Final Consent</h3>
            <p className="text-justify text-sm">
              I acknowledge that I have been informed about the anaesthetic procedure, its benefits, risks, and alternatives. 
              I understand that complications may occur and that no guarantee can be made regarding the outcome. 
              I consent to the administration of anaesthesia by qualified anaesthesiologists and their assistants.
            </p>
          </div>

          {/* Signatures */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Signatures</h3>
            
            {/* Patient */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Patient:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name:</label>
                  <input
                    type="text"
                    value={formData.patientSigName}
                    onChange={(e) => handleInputChange('patientSigName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Signature:</label>
                  <input
                    type="text"
                    value={formData.patientSignature}
                    onChange={(e) => handleInputChange('patientSignature', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sign here"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date:</label>
                  <input
                    type="date"
                    value={formData.patientSigDate}
                    onChange={(e) => handleInputChange('patientSigDate', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time:</label>
                  <input
                    type="text"
                    value={formData.patientSigTime}
                    onChange={(e) => handleInputChange('patientSigTime', e.target.value)}
                    placeholder="12:00 PM"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Authorization by Patient Representative */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Authorization by Patient Representative:</h4>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Reason (if patient unable to consent):</label>
                <textarea
                  value={formData.authReason}
                  onChange={(e) => handleInputChange('authReason', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Reason for representative consent"
                />
              </div>
              <p className="text-sm mb-4">I confirm that I am giving this consent on behalf of the patient:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Patient Representative Name:</label>
                  <input
                    type="text"
                    value={formData.representativeName}
                    onChange={(e) => handleInputChange('representativeName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Witness Name:</label>
                  <input
                    type="text"
                    value={formData.witnessName}
                    onChange={(e) => handleInputChange('witnessName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Interpreter (if applicable):</label>
                  <input
                    type="text"
                    value={formData.interpreterName}
                    onChange={(e) => handleInputChange('interpreterName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Anaesthesiologist */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Anaesthesiologist:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name:</label>
                  <input
                    type="text"
                    value={formData.anaesthesiologistSigName}
                    onChange={(e) => handleInputChange('anaesthesiologistSigName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Signature:</label>
                  <input
                    type="text"
                    value={formData.anaesthesiologistSignature}
                    onChange={(e) => handleInputChange('anaesthesiologistSignature', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sign here"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date:</label>
                  <input
                    type="date"
                    value={formData.anaesthesiologistSigDate}
                    onChange={(e) => handleInputChange('anaesthesiologistSigDate', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time:</label>
                  <input
                    type="text"
                    value={formData.anaesthesiologistSigTime}
                    onChange={(e) => handleInputChange('anaesthesiologistSigTime', e.target.value)}
                    placeholder="12:00 PM"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Thumb mark section */}
            <div className="text-center text-sm text-gray-600 mt-4">
              <p>Thumb mark - If required</p>
              <div className="border-2 border-dashed border-gray-300 w-24 h-16 mx-auto mt-2"></div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsentAnaesthesiaForm;