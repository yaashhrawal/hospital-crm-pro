import React, { useState, useEffect } from 'react';
import type { PatientWithRelations } from '../../config/supabaseNew';
import toast from 'react-hot-toast';

interface ConsentVentilatorFormProps {
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
  
  // Ventilator Support Type
  supportType: string;
  indication: string;
  alternativeTreatments: string;
  
  // Risks and Complications
  commonRisks: string;
  seriousRisks: string;
  emergencyComplications: string;
  
  // Duration and Monitoring
  expectedDuration: string;
  monitoringPlan: string;
  weaningPlan: string;
  
  // Consent Acknowledgment
  understandRisks: boolean;
  alternativesDiscussed: boolean;
  questionsAnswered: boolean;
  voluntaryConsent: boolean;
  
  // Signatures
  patientGuardianName: string;
  relationship: string;
  patientSignature: string;
  patientDate: string;
  patientTime: string;
  
  witness1Name: string;
  witness1Signature: string;
  witness1Date: string;
  witness1Time: string;
  
  witness2Name: string;
  witness2Signature: string;
  witness2Date: string;
  witness2Time: string;
  
  doctorName: string;
  doctorSignature: string;
  doctorDate: string;
  doctorTime: string;
  doctorRegNo: string;
}

const ConsentVentilatorForm: React.FC<ConsentVentilatorFormProps> = ({
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
    supportType: initialData?.supportType || '',
    indication: initialData?.indication || '',
    alternativeTreatments: initialData?.alternativeTreatments || '',
    commonRisks: initialData?.commonRisks || '',
    seriousRisks: initialData?.seriousRisks || '',
    emergencyComplications: initialData?.emergencyComplications || '',
    expectedDuration: initialData?.expectedDuration || '',
    monitoringPlan: initialData?.monitoringPlan || '',
    weaningPlan: initialData?.weaningPlan || '',
    understandRisks: initialData?.understandRisks || false,
    alternativesDiscussed: initialData?.alternativesDiscussed || false,
    questionsAnswered: initialData?.questionsAnswered || false,
    voluntaryConsent: initialData?.voluntaryConsent || false,
    patientGuardianName: initialData?.patientGuardianName || '',
    relationship: initialData?.relationship || '',
    patientSignature: initialData?.patientSignature || '',
    patientDate: initialData?.patientDate || '',
    patientTime: initialData?.patientTime || '',
    witness1Name: initialData?.witness1Name || '',
    witness1Signature: initialData?.witness1Signature || '',
    witness1Date: initialData?.witness1Date || '',
    witness1Time: initialData?.witness1Time || '',
    witness2Name: initialData?.witness2Name || '',
    witness2Signature: initialData?.witness2Signature || '',
    witness2Date: initialData?.witness2Date || '',
    witness2Time: initialData?.witness2Time || '',
    doctorName: initialData?.doctorName || '',
    doctorSignature: initialData?.doctorSignature || '',
    doctorDate: initialData?.doctorDate || '',
    doctorTime: initialData?.doctorTime || '',
    doctorRegNo: initialData?.doctorRegNo || ''
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
        witness1Date: today,
        witness1Time: currentTime,
        witness2Date: today,
        witness2Time: currentTime,
        doctorDate: today,
        doctorTime: currentTime
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
        supportType: initialData.supportType || '',
        indication: initialData.indication || '',
        alternativeTreatments: initialData.alternativeTreatments || '',
        commonRisks: initialData.commonRisks || '',
        seriousRisks: initialData.seriousRisks || '',
        emergencyComplications: initialData.emergencyComplications || '',
        expectedDuration: initialData.expectedDuration || '',
        monitoringPlan: initialData.monitoringPlan || '',
        weaningPlan: initialData.weaningPlan || '',
        understandRisks: initialData.understandRisks || false,
        alternativesDiscussed: initialData.alternativesDiscussed || false,
        questionsAnswered: initialData.questionsAnswered || false,
        voluntaryConsent: initialData.voluntaryConsent || false,
        patientGuardianName: initialData.patientGuardianName || '',
        relationship: initialData.relationship || '',
        patientSignature: initialData.patientSignature || '',
        patientDate: initialData.patientDate || '',
        patientTime: initialData.patientTime || '',
        witness1Name: initialData.witness1Name || '',
        witness1Signature: initialData.witness1Signature || '',
        witness1Date: initialData.witness1Date || '',
        witness1Time: initialData.witness1Time || '',
        witness2Name: initialData.witness2Name || '',
        witness2Signature: initialData.witness2Signature || '',
        witness2Date: initialData.witness2Date || '',
        witness2Time: initialData.witness2Time || '',
        doctorName: initialData.doctorName || '',
        doctorSignature: initialData.doctorSignature || '',
        doctorDate: initialData.doctorDate || '',
        doctorTime: initialData.doctorTime || '',
        doctorRegNo: initialData.doctorRegNo || ''
      });
      
      toast.success('Previously saved ventilator consent form data loaded successfully', {
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
      toast.success('Consent for Ventilator/NIV/BI PAP Form saved successfully');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Consent for Ventilator/NIV/BI PAP - ${formData.patientName}</title>
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
        <div class="form-title">CONSENT FOR VENTILATOR/NIV/BI PAP</div>
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
        <div class="section-title">Ventilator Support Details</div>
        <div class="field-row">
          <span class="field-label">Type of Ventilatory Support:</span>
          <span class="field-value">${formData.supportType || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Medical Indication:</span>
        </div>
        <div class="textarea-value">${formData.indication || ''}</div>
        <div class="field-row">
          <span class="field-label">Alternative Treatments:</span>
        </div>
        <div class="textarea-value">${formData.alternativeTreatments || ''}</div>
      </div>

      <div class="section">
        <div class="section-title">Risks and Complications</div>
        <div class="field-row">
          <span class="field-label">Common Risks:</span>
        </div>
        <div class="textarea-value">${formData.commonRisks || ''}</div>
        <div class="field-row">
          <span class="field-label">Serious Risks:</span>
        </div>
        <div class="textarea-value">${formData.seriousRisks || ''}</div>
        <div class="field-row">
          <span class="field-label">Emergency Complications:</span>
        </div>
        <div class="textarea-value">${formData.emergencyComplications || ''}</div>
      </div>

      <div class="section">
        <div class="section-title">Duration and Monitoring Plan</div>
        <div class="field-row">
          <span class="field-label">Expected Duration:</span>
        </div>
        <div class="textarea-value">${formData.expectedDuration || ''}</div>
        <div class="field-row">
          <span class="field-label">Monitoring Plan:</span>
        </div>
        <div class="textarea-value">${formData.monitoringPlan || ''}</div>
        <div class="field-row">
          <span class="field-label">Weaning Plan:</span>
        </div>
        <div class="textarea-value">${formData.weaningPlan || ''}</div>
      </div>

      <div class="section">
        <div class="section-title">Consent Acknowledgment</div>
        <div class="checkbox-item">
          ${formData.understandRisks ? '☑' : '☐'} I understand the risks, benefits, and alternatives of ventilatory support as explained to me.
        </div>
        <div class="checkbox-item">
          ${formData.alternativesDiscussed ? '☑' : '☐'} Alternative treatment options have been discussed with me and I understand them.
        </div>
        <div class="checkbox-item">
          ${formData.questionsAnswered ? '☑' : '☐'} All my questions have been answered to my satisfaction.
        </div>
        <div class="checkbox-item">
          ${formData.voluntaryConsent ? '☑' : '☐'} I voluntarily consent to the ventilatory support and understand that no guarantee has been made regarding the outcome.
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
            <div>Witness 1</div>
            <div class="signature-line">
              ${formData.witness1Name || ''}
            </div>
            <div style="font-size: 9pt; margin-top: 3pt;">Name</div>
          </div>
          <div class="signature-box">
            <div>Signature</div>
            <div class="signature-line">
              ${formData.witness1Signature || ''}
            </div>
          </div>
          <div class="signature-box">
            <div>Date: ${formData.witness1Date || ''}</div>
            <div>Time: ${formData.witness1Time || ''}</div>
          </div>
        </div>

        <div class="signature-row">
          <div class="signature-box">
            <div>Witness 2</div>
            <div class="signature-line">
              ${formData.witness2Name || ''}
            </div>
            <div style="font-size: 9pt; margin-top: 3pt;">Name</div>
          </div>
          <div class="signature-box">
            <div>Signature</div>
            <div class="signature-line">
              ${formData.witness2Signature || ''}
            </div>
          </div>
          <div class="signature-box">
            <div>Date: ${formData.witness2Date || ''}</div>
            <div>Time: ${formData.witness2Time || ''}</div>
          </div>
        </div>

        <div class="signature-row">
          <div class="signature-box">
            <div>Doctor</div>
            <div class="signature-line">
              ${formData.doctorName || ''}
            </div>
            <div style="font-size: 9pt; margin-top: 3pt;">Name</div>
          </div>
          <div class="signature-box">
            <div>Signature</div>
            <div class="signature-line">
              ${formData.doctorSignature || ''}
            </div>
          </div>
          <div class="signature-box">
            <div>Date: ${formData.doctorDate || ''}</div>
            <div>Time: ${formData.doctorTime || ''}</div>
          </div>
        </div>

        <div class="signature-row">
          <div class="signature-box">
            <div>Registration No.:</div>
            <div class="signature-line">
              ${formData.doctorRegNo || ''}
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
          <h2 className="text-xl font-semibold">CONSENT FOR VENTILATOR/NIV/BI PAP</h2>
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

          {/* Ventilator Support Details */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Ventilator Support Details</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type of Ventilatory Support:</label>
                <select
                  value={formData.supportType}
                  onChange={(e) => handleInputChange('supportType', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Support Type</option>
                  <option value="Invasive Mechanical Ventilation">Invasive Mechanical Ventilation</option>
                  <option value="Non-Invasive Ventilation (NIV)">Non-Invasive Ventilation (NIV)</option>
                  <option value="BiPAP">BiPAP (Bilevel Positive Airway Pressure)</option>
                  <option value="CPAP">CPAP (Continuous Positive Airway Pressure)</option>
                  <option value="High Flow Nasal Cannula">High Flow Nasal Cannula</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Medical Indication for Ventilatory Support:</label>
                <textarea
                  value={formData.indication}
                  onChange={(e) => handleInputChange('indication', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Respiratory failure, acute respiratory distress, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Alternative Treatments Discussed:</label>
                <textarea
                  value={formData.alternativeTreatments}
                  onChange={(e) => handleInputChange('alternativeTreatments', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Oxygen therapy, medication management, etc."
                />
              </div>
            </div>
          </div>

          {/* Risks and Complications */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Risks and Complications</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Common Risks and Side Effects:</label>
                <textarea
                  value={formData.commonRisks}
                  onChange={(e) => handleInputChange('commonRisks', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Mouth/throat dryness, skin irritation, gastric distension, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Serious Risks and Complications:</label>
                <textarea
                  value={formData.seriousRisks}
                  onChange={(e) => handleInputChange('seriousRisks', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Pneumothorax, ventilator-associated pneumonia, barotrauma, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Emergency Complications:</label>
                <textarea
                  value={formData.emergencyComplications}
                  onChange={(e) => handleInputChange('emergencyComplications', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Equipment failure, power outage, accidental disconnection, etc."
                />
              </div>
            </div>
          </div>

          {/* Duration and Monitoring */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Duration and Monitoring Plan</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Expected Duration of Support:</label>
                <textarea
                  value={formData.expectedDuration}
                  onChange={(e) => handleInputChange('expectedDuration', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Estimated duration and factors affecting it"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Monitoring Plan:</label>
                <textarea
                  value={formData.monitoringPlan}
                  onChange={(e) => handleInputChange('monitoringPlan', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Continuous monitoring, vital signs, arterial blood gases, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Weaning Plan:</label>
                <textarea
                  value={formData.weaningPlan}
                  onChange={(e) => handleInputChange('weaningPlan', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Gradual reduction of support, assessment criteria, etc."
                />
              </div>
            </div>
          </div>

          {/* Consent Acknowledgment */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Consent Acknowledgment</h3>
            
            <div className="space-y-3">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.understandRisks}
                  onChange={(e) => handleInputChange('understandRisks', e.target.checked)}
                  className="mt-1 w-4 h-4 checkbox-print"
                />
                <span className="text-sm">
                  I understand the risks, benefits, and alternatives of ventilatory support as explained to me.
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.alternativesDiscussed}
                  onChange={(e) => handleInputChange('alternativesDiscussed', e.target.checked)}
                  className="mt-1 w-4 h-4 checkbox-print"
                />
                <span className="text-sm">
                  Alternative treatment options have been discussed with me and I understand them.
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.questionsAnswered}
                  onChange={(e) => handleInputChange('questionsAnswered', e.target.checked)}
                  className="mt-1 w-4 h-4 checkbox-print"
                />
                <span className="text-sm">
                  All my questions have been answered to my satisfaction.
                </span>
              </label>

              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={formData.voluntaryConsent}
                  onChange={(e) => handleInputChange('voluntaryConsent', e.target.checked)}
                  className="mt-1 w-4 h-4 checkbox-print"
                />
                <span className="text-sm">
                  I voluntarily consent to the ventilatory support and understand that no guarantee has been made regarding the outcome.
                </span>
              </label>
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

            {/* Witness 1 */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Witness 1:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name:</label>
                  <input
                    type="text"
                    value={formData.witness1Name}
                    onChange={(e) => handleInputChange('witness1Name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Signature:</label>
                  <input
                    type="text"
                    value={formData.witness1Signature}
                    onChange={(e) => handleInputChange('witness1Signature', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sign here"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date:</label>
                  <input
                    type="date"
                    value={formData.witness1Date}
                    onChange={(e) => handleInputChange('witness1Date', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time:</label>
                  <input
                    type="text"
                    value={formData.witness1Time}
                    onChange={(e) => handleInputChange('witness1Time', e.target.value)}
                    placeholder="12:00 PM"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Witness 2 */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Witness 2:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name:</label>
                  <input
                    type="text"
                    value={formData.witness2Name}
                    onChange={(e) => handleInputChange('witness2Name', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Signature:</label>
                  <input
                    type="text"
                    value={formData.witness2Signature}
                    onChange={(e) => handleInputChange('witness2Signature', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sign here"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date:</label>
                  <input
                    type="date"
                    value={formData.witness2Date}
                    onChange={(e) => handleInputChange('witness2Date', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time:</label>
                  <input
                    type="text"
                    value={formData.witness2Time}
                    onChange={(e) => handleInputChange('witness2Time', e.target.value)}
                    placeholder="12:00 PM"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Doctor */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Doctor:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name:</label>
                  <input
                    type="text"
                    value={formData.doctorName}
                    onChange={(e) => handleInputChange('doctorName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Signature:</label>
                  <input
                    type="text"
                    value={formData.doctorSignature}
                    onChange={(e) => handleInputChange('doctorSignature', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Sign here"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Date:</label>
                  <input
                    type="date"
                    value={formData.doctorDate}
                    onChange={(e) => handleInputChange('doctorDate', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Time:</label>
                  <input
                    type="text"
                    value={formData.doctorTime}
                    onChange={(e) => handleInputChange('doctorTime', e.target.value)}
                    placeholder="12:00 PM"
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Registration No.:</label>
                  <input
                    type="text"
                    value={formData.doctorRegNo}
                    onChange={(e) => handleInputChange('doctorRegNo', e.target.value)}
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

export default ConsentVentilatorForm;