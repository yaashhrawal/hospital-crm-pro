import React, { useState, useEffect } from 'react';
import type { PatientWithRelations } from '../../config/supabaseNew';
import toast from 'react-hot-toast';

interface ProcedureConsentFormProps {
  patient?: PatientWithRelations;
  bedNumber?: number;
  ipdNumber?: string;
  initialData?: FormData;
  onSubmit?: (data: FormData) => void;
}

interface FormData {
  // Patient Header
  patientName: string;
  department: string;
  patientId: string;
  ipdNo: string;
  ageSex: string;
  doctorName: string;
  
  // Authorization Section
  doctorNameAuth: string;
  conditionDetails: string;
  procedureName: string;
  procedureReason: string;
  alternatives: string;
  
  // Signatures
  patientRelativeName: string;
  relationship: string;
  patientSignature: string;
  patientDate: string;
  patientTime: string;
  
  doctorSignatureName: string;
  doctorSignature: string;
  doctorDate: string;
  doctorTime: string;
  
  witnessName: string;
  witnessSignature: string;
}

const ProcedureConsentForm: React.FC<ProcedureConsentFormProps> = ({
  patient,
  bedNumber,
  ipdNumber,
  initialData,
  onSubmit,
}) => {
  // Initialize form data with saved data if available, otherwise empty
  const getInitialFormData = (): FormData => ({
    patientName: initialData?.patientName || '',
    department: initialData?.department || '',
    patientId: initialData?.patientId || '',
    ipdNo: initialData?.ipdNo || '',
    ageSex: initialData?.ageSex || '',
    doctorName: initialData?.doctorName || '',
    doctorNameAuth: initialData?.doctorNameAuth || '',
    conditionDetails: initialData?.conditionDetails || '',
    procedureName: initialData?.procedureName || '',
    procedureReason: initialData?.procedureReason || '',
    alternatives: initialData?.alternatives || '',
    patientRelativeName: initialData?.patientRelativeName || '',
    relationship: initialData?.relationship || '',
    patientSignature: initialData?.patientSignature || '',
    patientDate: initialData?.patientDate || '',
    patientTime: initialData?.patientTime || '',
    doctorSignatureName: initialData?.doctorSignatureName || '',
    doctorSignature: initialData?.doctorSignature || '',
    doctorDate: initialData?.doctorDate || '',
    doctorTime: initialData?.doctorTime || '',
    witnessName: initialData?.witnessName || '',
    witnessSignature: initialData?.witnessSignature || ''
  });

  const [formData, setFormData] = useState<FormData>(getInitialFormData());

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

      // Get doctor name from patient data
      let doctorName = '';
      if (patient.assigned_doctor) {
        doctorName = patient.assigned_doctor;
      } else if (patient.assigned_doctors && patient.assigned_doctors.length > 0) {
        // Get the primary doctor or first doctor from assigned_doctors array
        const primaryDoctor = patient.assigned_doctors.find(doc => doc.isPrimary);
        doctorName = primaryDoctor ? primaryDoctor.name : patient.assigned_doctors[0].name;
      }

      const ageSex = `${patient.age || ''}/${patient.gender || ''}`;

      setFormData(prev => ({
        ...prev,
        patientName: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
        patientId: patient.patient_id || '',
        ipdNo: ipdNumber || '',
        ageSex: ageSex,
        department: patient.assigned_department || '',
        doctorName: doctorName,
        doctorNameAuth: doctorName,
        patientDate: today,
        patientTime: currentTime,
        doctorDate: today,
        doctorTime: currentTime
      }));
    }
  }, [patient, ipdNumber, initialData]);

  // Show notification when saved data is loaded (only on mount)
  useEffect(() => {
    if (initialData) {
      console.log('ProcedureConsentForm loaded with saved data:', initialData);
      toast.success('Previously saved form data loaded successfully', {
        duration: 3000,
        icon: '📋'
      });
    }
  }, []); // Only run on mount

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    if (onSubmit) {
      onSubmit(formData);
    } else {
      toast.success('Procedure Consent Form saved successfully');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Procedure Consent Form - ${formData.patientName}</title>
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
        font-size: 9pt;
        line-height: 1.2;
        margin: 0;
        padding: 8pt;
        color: #000;
      }
      .header {
        text-align: center;
        margin-bottom: 8pt;
        border-bottom: 1pt solid #000;
        padding-bottom: 4pt;
      }
      .hospital-name {
        font-size: 12pt;
        font-weight: bold;
        margin-bottom: 2pt;
      }
      .hospital-address {
        font-size: 8pt;
        margin-bottom: 4pt;
      }
      .form-title {
        font-size: 11pt;
        font-weight: bold;
        text-transform: uppercase;
      }
      .section {
        margin-bottom: 6pt;
        page-break-inside: avoid;
      }
      .section-title {
        font-size: 10pt;
        font-weight: bold;
        margin-bottom: 3pt;
        border-bottom: 1pt solid #333;
        padding-bottom: 1pt;
      }
      .field-row {
        display: flex;
        margin-bottom: 3pt;
        align-items: center;
      }
      .field-label {
        font-weight: bold;
        margin-right: 4pt;
        min-width: 80pt;
        font-size: 8pt;
      }
      .field-value {
        border-bottom: 1pt solid #000;
        min-width: 60pt;
        padding: 1pt 2pt;
        display: inline-block;
        font-size: 8pt;
      }
      .textarea-value {
        border: 1pt solid #000;
        min-height: 15pt;
        padding: 2pt;
        display: block;
        width: 100%;
        margin-top: 2pt;
        font-size: 8pt;
      }
      .signature-section {
        margin-top: 8pt;
        page-break-inside: avoid;
      }
      .signature-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 6pt;
      }
      .signature-box {
        text-align: center;
        min-width: 80pt;
        font-size: 8pt;
      }
      .signature-line {
        border-top: 1pt solid #000;
        margin-top: 15pt;
        padding-top: 2pt;
        font-size: 7pt;
      }
      .consent-text {
        text-align: justify;
        line-height: 1.3;
        margin-bottom: 4pt;
        font-size: 8pt;
      }
      .consent-text p {
        margin-bottom: 2pt;
      }
      @page {
        margin: 0.3in;
        size: A4 portrait;
      }
    `;
  };

  const generateFormHTML = () => {
    return `
      <div class="header">
        <div class="hospital-name">VALANT HOSPITAL</div>
        <div class="hospital-address">A-10, Madhav Vihar, Shobhagpura, Udaipur | +91-911911 8000</div>
        <div class="form-title">PROCEDURE CONSENT FORM</div>
      </div>

      <div class="section">
        <div class="section-title">Patient Header</div>
        <div class="field-row">
          <span class="field-label">Patient's Name:</span>
          <span class="field-value">${formData.patientName || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Department:</span>
          <span class="field-value">${formData.department || ''}</span>
          <span class="field-label" style="margin-left: 20pt;">Patient ID:</span>
          <span class="field-value">${formData.patientId || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">IPD No.:</span>
          <span class="field-value">${formData.ipdNo || ''}</span>
          <span class="field-label" style="margin-left: 20pt;">Age/Sex:</span>
          <span class="field-value">${formData.ageSex || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Name of Doctor:</span>
          <span class="field-value">${formData.doctorName || ''}</span>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Authorization</div>
        <div class="consent-text">
          <p>I hereby authorize Dr. <span class="field-value">${formData.doctorNameAuth || ''}</span> 
          and / or alternative necessary to treat my condition:</p>
          <div class="textarea-value">${formData.conditionDetails || ''}</div>
          <p>I understand the Name/Reason for the procedure is:</p>
          <div class="textarea-value">${formData.procedureName || ''}</div>
        </div>
        <div class="consent-text">
          <p>Alternatives to not performing this procedure include:</p>
          <div class="textarea-value">${formData.alternatives || ''}</div>
        </div>
        <div class="consent-text">
          <p>Significant and substantial risk of this particular procedure include:</p>
          <div class="textarea-value">${formData.procedureReason || ''}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title">Consent Details</div>
        <div class="consent-text">
          <p>I understand the reason for the procedure. Treatment is being carried in good faith and in my patient's best interest. All feasible alternative treatments or procedures, including the option of taking no action, with description of material risk and potential complications associated with the alternatives have been explained to me. The relative probability of success for the treatment of procedure in understandable terms, have been explained to me.</p>
          <p>It has been explained to me that condition may arise during this procedure whereby a different procedure or an additional procedure may need to be performed and I authorize my physician and his assistants to do what they feel is needed and necessary.</p>
          <p>I understand that no guarantee or assurance has been made as to the results of the procedure and that may not cure the condition.</p>
          <p><strong>Risks:</strong> This authorization is given with understanding that any procedure involves some risks and hazards. like infection, bleeding, nerve injury, blood clots, Heart attack, allergic reactions and pneumonia. They can be serious and possibly fatal. My physician has explained specific risk of this procedure to me.</p>
          <p>HIV test/Hepatitis B and C: I hereby consent to HIV/Hepatitis B and C testing of my blood if deemed necessary for the procedure subject to maintenance of confidentiality.</p>
          <p>I give my consent to purchase & use medication required during treatment.</p>
          <p>I certify that I have read and fully understood the above consent after adequate explanations were given to me in a language that I understand and after all blanks were filled in or crossed out before I signed.</p>
        </div>
      </div>

      <div class="signature-section">
        <div class="section-title">Signatures</div>
        
        <div class="signature-row">
          <div class="signature-box">
            <div>Patient/Relatives</div>
            <div class="signature-line">
              ${formData.patientRelativeName || ''}
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
            <div>Doctor</div>
            <div class="signature-line">
              ${formData.doctorSignatureName || ''}
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
            
            .print-header {
              text-align: center;
              margin-bottom: 20pt;
              border-bottom: 2px solid black;
              padding-bottom: 10pt;
            }
            
            .print-section {
              margin-bottom: 15pt;
              page-break-inside: avoid;
            }
            
            .print-field {
              display: inline-block;
              border-bottom: 1px solid black;
              min-width: 100pt;
              padding: 2pt 4pt;
              margin: 0 2pt;
            }
            
            .signature-section {
              margin-top: 30pt;
              page-break-inside: avoid;
            }
            
            .signature-line {
              border-bottom: 1px solid black;
              min-width: 150pt;
              display: inline-block;
              margin: 0 10pt;
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
        <div className="print-header text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">VALANT HOSPITAL</h1>
          <p className="text-sm mb-2">A-10, Madhav Vihar, Shobhagpura, Udaipur | +91-911911 8000</p>
          <h2 className="text-xl font-semibold">PROCEDURE CONSENT FORM</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Header */}
          <div className="print-section border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Patient Header</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Patient's Name:</label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => handleInputChange('patientName', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 print-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Department:</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => handleInputChange('department', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 print-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Patient ID:</label>
                <input
                  type="text"
                  value={formData.patientId}
                  onChange={(e) => handleInputChange('patientId', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 print-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">IPD No.:</label>
                <input
                  type="text"
                  value={formData.ipdNo}
                  onChange={(e) => handleInputChange('ipdNo', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 print-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Age/Sex:</label>
                <input
                  type="text"
                  value={formData.ageSex}
                  onChange={(e) => handleInputChange('ageSex', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 print-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Name of Doctor:</label>
                <input
                  type="text"
                  value={formData.doctorName}
                  onChange={(e) => handleInputChange('doctorName', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 print-field"
                />
              </div>
            </div>
          </div>

          {/* Authorization Section */}
          <div className="print-section border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Authorization</h3>
            <div className="space-y-4 mb-6 border-b pb-4 border-gray-200">
              <p className="text-sm text-gray-800">
                I hereby authorize Dr. 
                <input
                  type="text"
                  value={formData.doctorNameAuth}
                  onChange={(e) => handleInputChange('doctorNameAuth', e.target.value)}
                  className="inline-block w-1/3 rounded-md border-gray-300 shadow-sm px-3 py-1 print:border-gray-800 mx-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                and / or alternative necessary to treat my condition:
                <input
                  type="text"
                  value={formData.conditionDetails}
                  onChange={(e) => handleInputChange('conditionDetails', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm px-3 py-1 mt-1 print:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                I understand the Name/Reason for the procedure is:
                <input
                  type="text"
                  value={formData.procedureName}
                  onChange={(e) => handleInputChange('procedureName', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm px-3 py-1 mt-1 print:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </p>
              <p className="text-sm text-gray-800">
                Alternatives to not performing this procedure include:
                <input
                  type="text"
                  value={formData.alternatives}
                  onChange={(e) => handleInputChange('alternatives', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm px-3 py-1 mt-1 print:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </p>
              <p className="text-sm text-gray-800">
                Significant and substantial risk of this particular procedure include:
                <input
                  type="text"
                  value={formData.procedureReason}
                  onChange={(e) => handleInputChange('procedureReason', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm px-3 py-1 mt-1 print:border-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </p>
            </div>
          </div>

          {/* Consent Details */}
          <div className="print-section border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Consent Details</h3>
            <div className="space-y-4 mb-6 text-sm text-gray-800">
              <p>I understand the reason for the procedure. Treatment is being carried in good faith and in my patient's best interest. All feasible alternative treatments or procedures, including the option of taking no action, with description of material risk and potential complications associated with the alternatives have been explained to me. The relative probability of success for the treatment of procedure in understandable terms, have been explained to me.</p>
              <p>It has been explained to me that condition may arise during this procedure whereby a different procedure or an additional procedure may need to be performed and I authorize my physician and his assistants to do what they feel is needed and necessary.</p>
              <p>I understand that no guarantee or assurance has been made as to the results of the procedure and that may not cure the condition.</p>
              <p><span className="font-semibold">Risks:</span> This authorization is given with understanding that any procedure involves some risks and hazards. like infection, bleeding, nerve injury, blood clots, Heart attack, allergic reactions and pneumonia. They can be serious and possibly fatal. My physician has explained specific risk of this procedure to me.</p>
              <p>HIV test/Hepatitis B and C: I hereby consent to HIV/Hepatitis B and C testing of my blood if deemed necessary for the procedure subject to maintenance of confidentiality.</p>
              <p>I give my consent to purchase & use medication required during treatment.</p>
              <p>I certify that I have read and fully understood the above consent after adequate explanations were given to me in a language that I understand and after all blanks were filled in or crossed out before I signed.</p>
            </div>
          </div>

          {/* Signatures */}
          <div className="signature-section border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Signatures</h3>
            
            {/* Patient/Relatives */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Patient/Relatives:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name:</label>
                  <input
                    type="text"
                    value={formData.patientRelativeName}
                    onChange={(e) => handleInputChange('patientRelativeName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 signature-line"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Relationship with Patient:</label>
                  <input
                    type="text"
                    value={formData.relationship}
                    onChange={(e) => handleInputChange('relationship', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 signature-line"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Signature:</label>
                  <input
                    type="text"
                    value={formData.patientSignature}
                    onChange={(e) => handleInputChange('patientSignature', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 signature-line"
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

            {/* Doctor */}
            <div className="mb-6">
              <h4 className="font-medium mb-3">Doctor:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name:</label>
                  <input
                    type="text"
                    value={formData.doctorSignatureName}
                    onChange={(e) => handleInputChange('doctorSignatureName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 signature-line"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Signature:</label>
                  <input
                    type="text"
                    value={formData.doctorSignature}
                    onChange={(e) => handleInputChange('doctorSignature', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 signature-line"
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
              </div>
            </div>

            {/* Witness */}
            <div>
              <h4 className="font-medium mb-3">Witness:</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name:</label>
                  <input
                    type="text"
                    value={formData.witnessName}
                    onChange={(e) => handleInputChange('witnessName', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 signature-line"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Signature:</label>
                  <input
                    type="text"
                    value={formData.witnessSignature}
                    onChange={(e) => handleInputChange('witnessSignature', e.target.value)}
                    className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 signature-line"
                    placeholder="Sign here"
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

export default ProcedureConsentForm;