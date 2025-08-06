import React, { useState, useEffect } from 'react';
import type { PatientWithRelations } from '../../config/supabaseNew';
import toast from 'react-hot-toast';

interface ConsentSurgeryProcedureFormProps {
  patient?: PatientWithRelations;
  bedNumber?: number;
  ipdNumber?: string;
  initialData?: FormData;
  onSubmit?: (data: FormData) => void;
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
  
  // Surgery/Procedure Details
  surgeonName: string;
  procedureName: string;
  indication: string;
  procedureDetails: string;
  alternativeTreatments: string;
  
  // Risks and Complications
  generalRisks: string;
  specificRisks: string;
  anaesthesiaRisks: string;
  postOperativeRisks: string;
  
  // Additional Consents
  bloodTransfusion: boolean;
  additionalProcedures: boolean;
  tissueRemoval: boolean;
  photographyConsent: boolean;
  
  // Financial Consent
  financialResponsibility: boolean;
  estimatedCost: string;
  
  // Signatures
  patientGuardianName: string;
  relationship: string;
  patientSignature: string;
  patientDate: string;
  patientTime: string;
  
  witnessName: string;
  witnessSignature: string;
  witnessDate: string;
  witnessTime: string;
  
  surgeonName_sig: string;
  surgeonSignature: string;
  surgeonDate: string;
  surgeonTime: string;
  surgeonRegNo: string;
  
  anaesthetistName: string;
  anaesthetistSignature: string;
  anaesthetistDate: string;
  anaesthetistTime: string;
  anaesthetistRegNo: string;
}

const ConsentSurgeryProcedureForm: React.FC<ConsentSurgeryProcedureFormProps> = ({
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
    surgeonName: initialData?.surgeonName || '',
    procedureName: initialData?.procedureName || '',
    indication: initialData?.indication || '',
    procedureDetails: initialData?.procedureDetails || '',
    alternativeTreatments: initialData?.alternativeTreatments || '',
    generalRisks: initialData?.generalRisks || '',
    specificRisks: initialData?.specificRisks || '',
    anaesthesiaRisks: initialData?.anaesthesiaRisks || '',
    postOperativeRisks: initialData?.postOperativeRisks || '',
    bloodTransfusion: initialData?.bloodTransfusion || false,
    additionalProcedures: initialData?.additionalProcedures || false,
    tissueRemoval: initialData?.tissueRemoval || false,
    photographyConsent: initialData?.photographyConsent || false,
    financialResponsibility: initialData?.financialResponsibility || false,
    estimatedCost: initialData?.estimatedCost || '',
    patientGuardianName: initialData?.patientGuardianName || '',
    relationship: initialData?.relationship || '',
    patientSignature: initialData?.patientSignature || '',
    patientDate: initialData?.patientDate || '',
    patientTime: initialData?.patientTime || '',
    witnessName: initialData?.witnessName || '',
    witnessSignature: initialData?.witnessSignature || '',
    witnessDate: initialData?.witnessDate || '',
    witnessTime: initialData?.witnessTime || '',
    surgeonName_sig: initialData?.surgeonName_sig || '',
    surgeonSignature: initialData?.surgeonSignature || '',
    surgeonDate: initialData?.surgeonDate || '',
    surgeonTime: initialData?.surgeonTime || '',
    surgeonRegNo: initialData?.surgeonRegNo || '',
    anaesthetistName: initialData?.anaesthetistName || '',
    anaesthetistSignature: initialData?.anaesthetistSignature || '',
    anaesthetistDate: initialData?.anaesthetistDate || '',
    anaesthetistTime: initialData?.anaesthetistTime || '',
    anaesthetistRegNo: initialData?.anaesthetistRegNo || ''
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
        patientGuardianName: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
        patientDate: today,
        patientTime: currentTime,
        witnessDate: today,
        witnessTime: currentTime,
        surgeonDate: today,
        surgeonTime: currentTime,
        anaesthetistDate: today,
        anaesthetistTime: currentTime
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
        surgeonName: initialData.surgeonName || '',
        procedureName: initialData.procedureName || '',
        indication: initialData.indication || '',
        procedureDetails: initialData.procedureDetails || '',
        alternativeTreatments: initialData.alternativeTreatments || '',
        generalRisks: initialData.generalRisks || '',
        specificRisks: initialData.specificRisks || '',
        anaesthesiaRisks: initialData.anaesthesiaRisks || '',
        postOperativeRisks: initialData.postOperativeRisks || '',
        bloodTransfusion: initialData.bloodTransfusion || false,
        additionalProcedures: initialData.additionalProcedures || false,
        tissueRemoval: initialData.tissueRemoval || false,
        photographyConsent: initialData.photographyConsent || false,
        financialResponsibility: initialData.financialResponsibility || false,
        estimatedCost: initialData.estimatedCost || '',
        patientGuardianName: initialData.patientGuardianName || '',
        relationship: initialData.relationship || '',
        patientSignature: initialData.patientSignature || '',
        patientDate: initialData.patientDate || '',
        patientTime: initialData.patientTime || '',
        witnessName: initialData.witnessName || '',
        witnessSignature: initialData.witnessSignature || '',
        witnessDate: initialData.witnessDate || '',
        witnessTime: initialData.witnessTime || '',
        surgeonName_sig: initialData.surgeonName_sig || '',
        surgeonSignature: initialData.surgeonSignature || '',
        surgeonDate: initialData.surgeonDate || '',
        surgeonTime: initialData.surgeonTime || '',
        surgeonRegNo: initialData.surgeonRegNo || '',
        anaesthetistName: initialData.anaesthetistName || '',
        anaesthetistSignature: initialData.anaesthetistSignature || '',
        anaesthetistDate: initialData.anaesthetistDate || '',
        anaesthetistTime: initialData.anaesthetistTime || '',
        anaesthetistRegNo: initialData.anaesthetistRegNo || ''
      });
      
      toast.success('Previously saved surgery consent form data loaded successfully', {
        duration: 3000,
        icon: '📋'
      });
    }
  }, [initialData]);

  const handleInputChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    } else {
      toast.success('Consent for Surgery/Procedure Form saved successfully');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Consent for Surgery/Procedure - ${formData.patientName}</title>
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
      .textarea-value {
        border: 1pt solid #000;
        min-height: 30pt;
        padding: 4pt;
        display: block;
        width: 100%;
        margin-top: 4pt;
      }
      .checkbox-item {
        margin-bottom: 8pt;
      }
      .consent-terms li {
        margin-bottom: 8pt;
        text-align: justify;
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
    return `
      <div class="header">
        <div class="hospital-name">VALANT HOSPITAL</div>
        <div class="hospital-address">A-10, Madhav Vihar, Shobhagpura, Udaipur | +91-911911 8000</div>
        <div class="form-title">CONSENT FOR SURGERY/PROCEDURE</div>
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
        <div class="section-title">Surgery/Procedure Details</div>
        <div class="field-row">
          <span class="field-label">Name of Surgeon/Doctor:</span>
          <span class="field-value">${formData.surgeonName || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Name of Procedure/Surgery:</span>
          <span class="field-value">${formData.procedureName || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Indication for Surgery/Procedure:</span>
        </div>
        <div class="textarea-value">${formData.indication || ''}</div>
        <div class="field-row">
          <span class="field-label">Detailed Procedure Description:</span>
        </div>
        <div class="textarea-value">${formData.procedureDetails || ''}</div>
        <div class="field-row">
          <span class="field-label">Alternative Treatments Discussed:</span>
        </div>
        <div class="textarea-value">${formData.alternativeTreatments || ''}</div>
      </div>

      <div class="section">
        <div class="section-title">Risks and Complications</div>
        <div class="field-row">
          <span class="field-label">General Surgical Risks:</span>
        </div>
        <div class="textarea-value">${formData.generalRisks || ''}</div>
        <div class="field-row">
          <span class="field-label">Specific Procedure Risks:</span>
        </div>
        <div class="textarea-value">${formData.specificRisks || ''}</div>
        <div class="field-row">
          <span class="field-label">Anaesthesia Risks:</span>
        </div>
        <div class="textarea-value">${formData.anaesthesiaRisks || ''}</div>
        <div class="field-row">
          <span class="field-label">Post-operative Risks:</span>
        </div>
        <div class="textarea-value">${formData.postOperativeRisks || ''}</div>
      </div>

      <div class="section">
        <div class="section-title">Additional Consents</div>
        <div class="checkbox-item">
          ${formData.bloodTransfusion ? '☑' : '☐'} I consent to blood transfusion and blood products if required during or after the procedure.
        </div>
        <div class="checkbox-item">
          ${formData.additionalProcedures ? '☑' : '☐'} I consent to additional procedures that may become necessary during surgery.
        </div>
        <div class="checkbox-item">
          ${formData.tissueRemoval ? '☑' : '☐'} I consent to removal and disposal of tissue, organs, or body parts as necessary.
        </div>
        <div class="checkbox-item">
          ${formData.photographyConsent ? '☑' : '☐'} I consent to photography or video recording for medical documentation and education purposes.
        </div>
      </div>

      <div class="section">
        <div class="section-title">Financial Responsibility</div>
        <div class="field-row">
          <span class="field-label">Estimated Cost of Procedure:</span>
          <span class="field-value">${formData.estimatedCost || ''}</span>
        </div>
        <div class="checkbox-item">
          ${formData.financialResponsibility ? '☑' : '☐'} I understand and accept financial responsibility for all charges related to this procedure, including additional costs that may arise during treatment.
        </div>
      </div>

      <div class="section">
        <div class="section-title">Final Acknowledgment</div>
        <div class="consent-terms">
          <ul>
            <li>I acknowledge that I have read and understood this consent form. The procedure, its benefits, risks, alternatives, and possible complications have been explained to me in a language I understand.</li>
            <li>I understand that no guarantee has been made regarding the outcome of this procedure. I have had the opportunity to ask questions, and all my questions have been answered to my satisfaction.</li>
            <li>I voluntarily consent to the proposed surgery/procedure and understand that unexpected findings may require additional procedures.</li>
          </ul>
        </div>
      </div>

      <div class="signature-section">
        <div class="section-title">Signatures</div>
        
        <div class="signature-row">
          <div class="signature-box">
            <div>Patient/Guardian/Relatives</div>
            <div class="signature-line">
              ${formData.patientGuardianName || ''}
            </div>
            <div style="font-size: 9pt; margin-top: 3pt;">Name</div>
          </div>
          <div class="signature-box">
            <div>Relationship</div>
            <div class="signature-line">
              ${formData.relationship || ''}
            </div>
          </div>
          <div class="signature-box">
            <div>Signature</div>
            <div class="signature-line">
              ${formData.patientSignature || ''}
            </div>
          </div>
        </div>
        
        <div class="signature-row">
          <div class="signature-box">
            <div>Date: ${formData.patientDate || ''}</div>
          </div>
          <div class="signature-box">
            <div>Time: ${formData.patientTime || ''}</div>
          </div>
        </div>

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
            <div>Date: ${formData.witnessDate || ''}</div>
            <div>Time: ${formData.witnessTime || ''}</div>
          </div>
        </div>

        <div class="signature-row">
          <div class="signature-box">
            <div>Surgeon</div>
            <div class="signature-line">
              ${formData.surgeonName_sig || ''}
            </div>
            <div style="font-size: 9pt; margin-top: 3pt;">Name</div>
          </div>
          <div class="signature-box">
            <div>Signature</div>
            <div class="signature-line">
              ${formData.surgeonSignature || ''}
            </div>
          </div>
          <div class="signature-box">
            <div>Date: ${formData.surgeonDate || ''}</div>
            <div>Time: ${formData.surgeonTime || ''}</div>
          </div>
        </div>

        <div class="signature-row">
          <div class="signature-box">
            <div>Registration No.:</div>
            <div class="signature-line">
              ${formData.surgeonRegNo || ''}
            </div>
          </div>
        </div>

        <div class="signature-row">
          <div class="signature-box">
            <div>Anaesthetist</div>
            <div class="signature-line">
              ${formData.anaesthetistName || ''}
            </div>
            <div style="font-size: 9pt; margin-top: 3pt;">Name</div>
          </div>
          <div class="signature-box">
            <div>Signature</div>
            <div class="signature-line">
              ${formData.anaesthetistSignature || ''}
            </div>
          </div>
          <div class="signature-box">
            <div>Date: ${formData.anaesthetistDate || ''}</div>
            <div>Time: ${formData.anaesthetistTime || ''}</div>
          </div>
        </div>

        <div class="signature-row">
          <div class="signature-box">
            <div>Registration No.:</div>
            <div class="signature-line">
              ${formData.anaesthetistRegNo || ''}
            </div>
          </div>
        </div>
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
            
            .checkbox-print {
              width: 12pt;
              height: 12pt;
              border: 1px solid black;
              display: inline-block;
              margin-right: 5pt;
            }
            
            .signature-section {
              page-break-inside: avoid;
              margin-top: 20pt;
            }
            
            .risk-section {
              page-break-inside: avoid;
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
          <h2 className="text-xl font-semibold">CONSENT FOR SURGERY/PROCEDURE</h2>
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

          {/* Surgery/Procedure Details */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Surgery/Procedure Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Name of Surgeon/Doctor:</label>
                <input
                  type="text"
                  value={formData.surgeonName}
                  onChange={(e) => handleInputChange('surgeonName', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Name of Procedure/Surgery:</label>
                <input
                  type="text"
                  value={formData.procedureName}
                  onChange={(e) => handleInputChange('procedureName', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Indication for Surgery/Procedure:</label>
                <textarea
                  value={formData.indication}
                  onChange={(e) => handleInputChange('indication', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Medical condition requiring surgical intervention"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Detailed Procedure Description:</label>
                <textarea
                  value={formData.procedureDetails}
                  onChange={(e) => handleInputChange('procedureDetails', e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Step-by-step description of the planned procedure"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Alternative Treatments Discussed:</label>
                <textarea
                  value={formData.alternativeTreatments}
                  onChange={(e) => handleInputChange('alternativeTreatments', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Non-surgical options, conservative treatment, etc."
                />
              </div>
            </div>
          </div>

          {/* Risks and Complications */}
          <div className="risk-section border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Risks and Complications</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">General Surgical Risks:</label>
                <textarea
                  value={formData.generalRisks}
                  onChange={(e) => handleInputChange('generalRisks', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Infection, bleeding, blood clots, reaction to medications, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Specific Procedure Risks:</label>
                <textarea
                  value={formData.specificRisks}
                  onChange={(e) => handleInputChange('specificRisks', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Risks specific to this particular surgery/procedure"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Anaesthesia Risks:</label>
                <textarea
                  value={formData.anaesthesiaRisks}
                  onChange={(e) => handleInputChange('anaesthesiaRisks', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Risks associated with anaesthesia administration"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Post-operative Risks and Complications:</label>
                <textarea
                  value={formData.postOperativeRisks}
                  onChange={(e) => handleInputChange('postOperativeRisks', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Recovery complications, long-term effects, rehabilitation needs"
                />
              </div>
            </div>
          </div>

          {/* Additional Consents */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Additional Consents</h3>
            
            <div className="space-y-3">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.bloodTransfusion}
                  onChange={(e) => handleInputChange('bloodTransfusion', e.target.checked)}
                  className="mt-1 w-4 h-4 checkbox-print"
                />
                <span className="text-sm">
                  I consent to blood transfusion and blood products if required during or after the procedure.
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.additionalProcedures}
                  onChange={(e) => handleInputChange('additionalProcedures', e.target.checked)}
                  className="mt-1 w-4 h-4 checkbox-print"
                />
                <span className="text-sm">
                  I consent to additional procedures that may become necessary during surgery.
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.tissueRemoval}
                  onChange={(e) => handleInputChange('tissueRemoval', e.target.checked)}
                  className="mt-1 w-4 h-4 checkbox-print"
                />
                <span className="text-sm">
                  I consent to removal and disposal of tissue, organs, or body parts as necessary.
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.photographyConsent}
                  onChange={(e) => handleInputChange('photographyConsent', e.target.checked)}
                  className="mt-1 w-4 h-4 checkbox-print"
                />
                <span className="text-sm">
                  I consent to photography or video recording for medical documentation and education purposes.
                </span>
              </label>
            </div>
          </div>

          {/* Financial Consent */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Financial Responsibility</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Estimated Cost of Procedure:</label>
                <input
                  type="text"
                  value={formData.estimatedCost}
                  onChange={(e) => handleInputChange('estimatedCost', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="₹ Amount"
                />
              </div>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.financialResponsibility}
                  onChange={(e) => handleInputChange('financialResponsibility', e.target.checked)}
                  className="mt-1 w-4 h-4 checkbox-print"
                />
                <span className="text-sm">
                  I understand and accept financial responsibility for all charges related to this procedure, including additional costs that may arise during treatment.
                </span>
              </label>
            </div>
          </div>

          {/* Final Acknowledgment */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Final Acknowledgment</h3>
            <div className="space-y-3 text-sm text-justify">
              <p>
                I acknowledge that I have read and understood this consent form. The procedure, its benefits, risks, alternatives, and possible complications have been explained to me in a language I understand.
              </p>
              <p>
                I understand that no guarantee has been made regarding the outcome of this procedure. I have had the opportunity to ask questions, and all my questions have been answered to my satisfaction.
              </p>
              <p>
                I voluntarily consent to the proposed surgery/procedure and understand that unexpected findings may require additional procedures.
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div className="signature-section border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Signatures</h3>
            
            {/* Patient/Guardian */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Patient/Guardian/Relatives:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name:</label>
                  <input
                    type="text"
                    value={formData.patientGuardianName}
                    onChange={(e) => handleInputChange('patientGuardianName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Relationship with Patient:</label>
                  <input
                    type="text"
                    value={formData.relationship}
                    onChange={(e) => handleInputChange('relationship', e.target.value)}
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
                    value={formData.patientDate}
                    onChange={(e) => handleInputChange('patientDate', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time:</label>
                  <input
                    type="text"
                    value={formData.patientTime}
                    onChange={(e) => handleInputChange('patientTime', e.target.value)}
                    placeholder="12:00 PM"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Witness */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Witness:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name:</label>
                  <input
                    type="text"
                    value={formData.witnessName}
                    onChange={(e) => handleInputChange('witnessName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Signature:</label>
                  <input
                    type="text"
                    value={formData.witnessSignature}
                    onChange={(e) => handleInputChange('witnessSignature', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sign here"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date:</label>
                  <input
                    type="date"
                    value={formData.witnessDate}
                    onChange={(e) => handleInputChange('witnessDate', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time:</label>
                  <input
                    type="text"
                    value={formData.witnessTime}
                    onChange={(e) => handleInputChange('witnessTime', e.target.value)}
                    placeholder="12:00 PM"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Surgeon */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Surgeon:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name:</label>
                  <input
                    type="text"
                    value={formData.surgeonName_sig}
                    onChange={(e) => handleInputChange('surgeonName_sig', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Signature:</label>
                  <input
                    type="text"
                    value={formData.surgeonSignature}
                    onChange={(e) => handleInputChange('surgeonSignature', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sign here"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date:</label>
                  <input
                    type="date"
                    value={formData.surgeonDate}
                    onChange={(e) => handleInputChange('surgeonDate', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time:</label>
                  <input
                    type="text"
                    value={formData.surgeonTime}
                    onChange={(e) => handleInputChange('surgeonTime', e.target.value)}
                    placeholder="12:00 PM"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Registration No.:</label>
                  <input
                    type="text"
                    value={formData.surgeonRegNo}
                    onChange={(e) => handleInputChange('surgeonRegNo', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Anaesthetist */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Anaesthetist:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name:</label>
                  <input
                    type="text"
                    value={formData.anaesthetistName}
                    onChange={(e) => handleInputChange('anaesthetistName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Signature:</label>
                  <input
                    type="text"
                    value={formData.anaesthetistSignature}
                    onChange={(e) => handleInputChange('anaesthetistSignature', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sign here"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date:</label>
                  <input
                    type="date"
                    value={formData.anaesthetistDate}
                    onChange={(e) => handleInputChange('anaesthetistDate', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time:</label>
                  <input
                    type="text"
                    value={formData.anaesthetistTime}
                    onChange={(e) => handleInputChange('anaesthetistTime', e.target.value)}
                    placeholder="12:00 PM"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Registration No.:</label>
                  <input
                    type="text"
                    value={formData.anaesthetistRegNo}
                    onChange={(e) => handleInputChange('anaesthetistRegNo', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ConsentSurgeryProcedureForm;