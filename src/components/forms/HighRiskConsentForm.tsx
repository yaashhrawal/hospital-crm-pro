import React, { useState, useEffect } from 'react';
import type { PatientWithRelations } from '../../config/supabaseNew';
import toast from 'react-hot-toast';

interface HighRiskConsentFormProps {
  patient?: PatientWithRelations;
  bedNumber?: number;
  ipdNumber?: string;
  initialData?: FormData;
  onSubmit?: (data: FormData) => void;
}

interface FormData {
  patientNo: string;
  patientName: string;
  ageSex: string;
  patientId: string;
  deptUnit: string;
  wardICU: string;
  riskFactorA: string;
  riskFactorB: string;
  riskFactorC: string;
  riskFactorD: string;
  patientGuardianName: string;
  relationship: string;
  signatureThumb: string;
  witness1Name: string;
  witness2Name: string;
  doctorName: string;
  dateTime: string;
  regdNo: string;
}

const HighRiskConsentForm: React.FC<HighRiskConsentFormProps> = ({
  patient,
  bedNumber,
  ipdNumber,
  initialData,
  onSubmit,
}) => {
  const [formData, setFormData] = useState<FormData>(() => ({
    patientNo: initialData?.patientNo || '',
    patientName: initialData?.patientName || '',
    ageSex: initialData?.ageSex || '',
    patientId: initialData?.patientId || '',
    deptUnit: initialData?.deptUnit || '',
    wardICU: initialData?.wardICU || '',
    riskFactorA: initialData?.riskFactorA || '',
    riskFactorB: initialData?.riskFactorB || '',
    riskFactorC: initialData?.riskFactorC || '',
    riskFactorD: initialData?.riskFactorD || '',
    patientGuardianName: initialData?.patientGuardianName || '',
    relationship: initialData?.relationship || '',
    signatureThumb: initialData?.signatureThumb || '',
    witness1Name: initialData?.witness1Name || '',
    witness2Name: initialData?.witness2Name || '',
    doctorName: initialData?.doctorName || '',
    dateTime: initialData?.dateTime || '',
    regdNo: initialData?.regdNo || ''
  }));

  // Auto-populate form with patient data only if no initial data is provided
  useEffect(() => {
    if (patient && !initialData) {
      const now = new Date();
      const currentDateTime = now.toISOString().slice(0, 16);
      const ageSex = `${patient.age || ''}/${patient.gender || ''}`;

      setFormData(prev => ({
        ...prev,
        patientName: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
        patientId: patient.patient_id || '',
        patientNo: ipdNumber || '',
        ageSex: ageSex,
        dateTime: currentDateTime
      }));
    }
  }, [patient, ipdNumber, initialData]);

  // Update form data when initialData changes (when reopening with saved data)
  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      
      toast.success('Previously saved high risk consent form data loaded successfully', {
        duration: 3000,
      });
    }
  }, [initialData]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(formData);
    } else {
      toast.success('High Risk Consent Form saved successfully');
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>High Risk Consent Form - ${formData.patientName}</title>
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
      @page {
        margin: 0.75in;
        size: A4 portrait;
      }
      body {
        font-family: Arial, sans-serif;
        font-size: 12pt;
        line-height: 1.6;
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
      .form-title {
        font-size: 14pt;
        font-weight: bold;
        text-transform: uppercase;
      }
      .patient-header {
        margin-bottom: 20pt;
      }
      .field-row {
        display: flex;
        margin-bottom: 10pt;
      }
      .field-label {
        font-weight: normal;
        margin-right: 5pt;
      }
      .field-value {
        border-bottom: 1pt solid #000;
        min-width: 150pt;
        padding: 0 4pt;
        display: inline-block;
      }
      .consent-text {
        margin-bottom: 15pt;
        text-align: justify;
      }
      .numbered-paragraph {
        margin-bottom: 15pt;
        text-align: justify;
      }
      .risk-factors {
        margin-left: 20pt;
        margin-top: 10pt;
      }
      .risk-item {
        margin-bottom: 5pt;
      }
      .declaration {
        margin-top: 20pt;
        margin-bottom: 20pt;
      }
      .signature-section {
        margin-top: 30pt;
      }
      .signature-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 20pt;
      }
      .signature-field {
        min-width: 200pt;
      }
      .signature-label {
        font-size: 10pt;
        margin-bottom: 5pt;
      }
      .signature-line {
        border-bottom: 1pt solid #000;
        min-height: 20pt;
      }
      .hindi-text {
        font-family: 'Noto Sans Devanagari', Arial, sans-serif;
      }
    `;
  };

  const generateFormHTML = () => {
    return `
      <div class="header">
        <div class="hospital-name">VALANT HOSPITAL</div>
        <div class="form-title">HIGH RISK CONSENT</div>
      </div>

      <div class="patient-header">
        <div class="field-row">
          <span class="field-label">Patient No./ IPD No.:</span>
          <span class="field-value">${formData.patientNo || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Name of Patient:</span>
          <span class="field-value">${formData.patientName || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Age/ Sex:</span>
          <span class="field-value">${formData.ageSex || ''}</span>
          <span class="field-label" style="margin-left: 30pt;">Patient ID:</span>
          <span class="field-value">${formData.patientId || ''}</span>
        </div>
        <div class="field-row">
          <span class="field-label">Dept./Unit:</span>
          <span class="field-value">${formData.deptUnit || ''}</span>
          <span class="field-label" style="margin-left: 30pt;">Ward/ICU:</span>
          <span class="field-value">${formData.wardICU || ''}</span>
        </div>
      </div>

      <div class="consent-text">
        <strong>Consent (to be filled in by the Doctor and Patient/ Attendant)/ सहमति (डॉक्टर और रोगी/ अटेंडेंट द्वारा भरा जाने के लिए)</strong>
      </div>

      <div class="numbered-paragraph">
        1. I here by authorize the doctors/ staff to give ventilator support either invasive or non Invasive to save the life of my patient.
      </div>

      <div class="numbered-paragraph">
        2. I have been explained the serious nature of the condition of me /the patient and the grave prognosis there of.<br>
        <span class="hindi-text">मुझे मेरी / रोगी की स्थिति की गंभीर प्रकृति और उसके गंभीर निदान के बारे में बताया गया है।</span>
      </div>

      <div class="numbered-paragraph">
        3. I here by certify that I have read and fully understood the above authorization. I certify that no guarantee or assurances has been made as to the result that may be obtained. The hospital or any of the staff members shall not be liable in any manner, for any consequence arising out of the above or if any treatment results in any damage or death.<br>
        <span class="hindi-text">मैं प्रमाणित करता हूं कि मैंने उपरोक्त प्राधिकरण को पढ़ा और पूरी तरह से समझा है। मैं प्रमाणित करता हूं कि प्राप्त किए जा सकने वाले परिणाम के बारे में कोई गारंटी या आश्वासन नहीं दिया गया है। अस्पताल या कोई भी स्टाफ सदस्य उपरोक्त से उत्पन्न होने वाले किसी भी परिणाम के लिए या यदि कोई उपचार किसी भी क्षति या मृत्यु का कारण बनता है, तो किसी भी तरह से उत्तरदायी नहीं होगा।</span>
      </div>

      <div class="numbered-paragraph">
        4. If has also been explained to me that the risk in my case is high because of following factors:<br>
        <span class="hindi-text">मुझे यह भी बताया गया है कि मेरे मामले में निम्नलिखित कारकों के कारण जोखिम अधिक है:</span>
        <div class="risk-factors">
          <div class="risk-item">a. <span class="field-value">${formData.riskFactorA || ''}</span></div>
          <div class="risk-item">b. <span class="field-value">${formData.riskFactorB || ''}</span></div>
          <div class="risk-item">c. <span class="field-value">${formData.riskFactorC || ''}</span></div>
          <div class="risk-item">d. <span class="field-value">${formData.riskFactorD || ''}</span></div>
        </div>
      </div>

      <div class="declaration">
        <h3>Declaration / घोषणा</h3>
        <p>I Certify that the statements made in this consent from have been read over and explained to me in a language I easily understand. I have fully understood before I signed / applied my thumb impression.</p>
        <p class="hindi-text">मैं घोषणा करता हूँ कि मैंने सहमति प्रपत्र में दिये गये सभी तथ्यों को सावधानी पूर्वक पढ़ लिया है और मुझे मेरी ही भाषा में विस्तारपूर्वक समझा भी दिया है। मैं इस प्रपत्र में दिये गये सभी तथ्यों से पूर्णरूप से अवगत हूँ।</p>
      </div>

      <div class="signature-section">
        <div class="signature-row">
          <div class="signature-field">
            <div class="signature-label">Name of the Patient / Guardian / Relatives</div>
            <div class="signature-label hindi-text">रोगी/अभिभावक/रिश्तेदार का नाम</div>
            <div class="signature-line">${formData.patientGuardianName || ''}</div>
          </div>
        </div>
        <div class="signature-row">
          <div class="signature-field">
            <div class="signature-label">Relationship with Patient</div>
            <div class="signature-label hindi-text">रोगी से संबंध</div>
            <div class="signature-line">${formData.relationship || ''}</div>
          </div>
        </div>
        <div class="signature-row">
          <div class="signature-field">
            <div class="signature-label">Signature / Thumb Impression</div>
            <div class="signature-label hindi-text">हस्ताक्षर / अंगूठे का निशान</div>
            <div class="signature-line">${formData.signatureThumb || ''}</div>
          </div>
        </div>
        <div class="signature-row">
          <div class="signature-field">
            <div class="signature-label">Name & Signature of the Witness 1</div>
            <div class="signature-label hindi-text">गवाह का नाम/हस्ताक्षर</div>
            <div class="signature-line">${formData.witness1Name || ''}</div>
          </div>
        </div>
        <div class="signature-row">
          <div class="signature-field">
            <div class="signature-label">Name & Signature of the Witness 2</div>
            <div class="signature-label hindi-text">गवाह का नाम व हस्ताक्षर</div>
            <div class="signature-line">${formData.witness2Name || ''}</div>
          </div>
        </div>
        <div class="signature-row">
          <div class="signature-field">
            <div class="signature-label">Name & Signature of Doctor</div>
            <div class="signature-label hindi-text">चिकित्सक का नाम व हस्ताक्षर</div>
            <div class="signature-line">${formData.doctorName || ''}</div>
          </div>
        </div>
        <div class="signature-row">
          <div class="signature-field">
            <div class="signature-label">Date & Time</div>
            <div class="signature-line">${formData.dateTime ? new Date(formData.dateTime).toLocaleString() : ''}</div>
          </div>
          <div class="signature-field">
            <div class="signature-label">Regd. No.</div>
            <div class="signature-line">${formData.regdNo || ''}</div>
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
            
            .bilingual-text {
              line-height: 1.6;
            }
            
            .hindi-text {
              font-family: 'Noto Sans Devanagari', Arial, sans-serif;
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
          <h2 className="text-xl font-semibold">HIGH RISK CONSENT FORM</h2>
          <h2 className="text-xl font-semibold hindi-text">उच्च जोखिम सहमति फॉर्म</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Patient Header */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Patient Header</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Patient No./ IPD No.:</label>
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
                <label className="block text-sm font-medium mb-2">Age/ Sex:</label>
                <input
                  type="text"
                  value={formData.ageSex}
                  onChange={(e) => handleInputChange('ageSex', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                  value={formData.deptUnit}
                  onChange={(e) => handleInputChange('deptUnit', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Ward/ICU:</label>
                <input
                  type="text"
                  value={formData.wardICU}
                  onChange={(e) => handleInputChange('wardICU', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Consent Instructions */}
          <div className="border rounded-lg p-4">
            <p className="font-semibold mb-4">Consent (to be filled in by the Doctor and Patient/ Attendant)/ सहमति (डॉक्टर और रोगी/ अटेंडेंट द्वारा भरा जाने के लिए)</p>
            
            {/* Point 1 */}
            <div className="mb-4">
              <p className="text-sm">
                1. I here by authorize the doctors/ staff to give ventilator support either invasive or non Invasive to save the life of my patient.
              </p>
            </div>

            {/* Point 2 */}
            <div className="mb-4">
              <p className="text-sm">
                2. I have been explained the serious nature of the condition of me /the patient and the grave prognosis there of.
              </p>
              <p className="text-sm hindi-text">मुझे मेरी / रोगी की स्थिति की गंभीर प्रकृति और उसके गंभीर निदान के बारे में बताया गया है।</p>
            </div>

            {/* Point 3 */}
            <div className="mb-4">
              <p className="text-sm">
                3. I here by certify that I have read and fully understood the above authorization. I certify that no guarantee or assurances has been made as to the result that may be obtained. The hospital or any of the staff members shall not be liable in any manner, for any consequence arising out of the above or if any treatment results in any damage or death.
              </p>
              <p className="text-sm hindi-text">मैं प्रमाणित करता हूं कि मैंने उपरोक्त प्राधिकरण को पढ़ा और पूरी तरह से समझा है। मैं प्रमाणित करता हूं कि प्राप्त किए जा सकने वाले परिणाम के बारे में कोई गारंटी या आश्वासन नहीं दिया गया है। अस्पताल या कोई भी स्टाफ सदस्य उपरोक्त से उत्पन्न होने वाले किसी भी परिणाम के लिए या यदि कोई उपचार किसी भी क्षति या मृत्यु का कारण बनता है, तो किसी भी तरह से उत्तरदायी नहीं होगा।</p>
            </div>

            {/* Point 4 */}
            <div className="mb-6">
              <p className="text-sm mb-3">
                4. If has also been explained to me that the risk in my case is high because of following factors:
              </p>
              <p className="text-sm hindi-text mb-3">मुझे यह भी बताया गया है कि मेरे मामले में निम्नलिखित कारकों के कारण जोखिम अधिक है:</p>
              
              <div className="ml-6 space-y-3">
                <div className="flex items-start gap-2">
                  <span className="text-sm">a.</span>
                  <input
                    type="text"
                    value={formData.riskFactorA}
                    onChange={(e) => handleInputChange('riskFactorA', e.target.value)}
                    className="flex-1 px-3 py-1 border-b border-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm">b.</span>
                  <input
                    type="text"
                    value={formData.riskFactorB}
                    onChange={(e) => handleInputChange('riskFactorB', e.target.value)}
                    className="flex-1 px-3 py-1 border-b border-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm">c.</span>
                  <input
                    type="text"
                    value={formData.riskFactorC}
                    onChange={(e) => handleInputChange('riskFactorC', e.target.value)}
                    className="flex-1 px-3 py-1 border-b border-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sm">d.</span>
                  <input
                    type="text"
                    value={formData.riskFactorD}
                    onChange={(e) => handleInputChange('riskFactorD', e.target.value)}
                    className="flex-1 px-3 py-1 border-b border-gray-400 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Declaration */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-semibold mb-4">Declaration / घोषणा</h3>
            <div className="space-y-4 text-sm">
              <p>
                I Certify that the statements made in this consent from have been read over and explained to me in a language I easily understand. I have fully understood before I signed / applied my thumb impression.
              </p>
              <p className="hindi-text">
                मैं घोषणा करता हूँ कि मैंने सहमति प्रपत्र में दिये गये सभी तथ्यों को सावधानी पूर्वक पढ़ लिया है और मुझे मेरी ही भाषा में विस्तारपूर्वक समझा भी दिया है। मैं इस प्रपत्र में दिये गये सभी तथ्यों से पूर्णरूप से अवगत हूँ।
              </p>
            </div>
          </div>

          {/* Signatures */}
          <div className="border rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="mb-1">
                  <p className="text-sm">Name of the Patient / Guardian / Relatives</p>
                  <p className="text-sm hindi-text">रोगी/अभिभावक/रिश्तेदार का नाम</p>
                </div>
                <input
                  type="text"
                  value={formData.patientGuardianName}
                  onChange={(e) => handleInputChange('patientGuardianName', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="mb-1">
                  <p className="text-sm">Relationship with Patient</p>
                  <p className="text-sm hindi-text">रोगी से संबंध</p>
                </div>
                <input
                  type="text"
                  value={formData.relationship}
                  onChange={(e) => handleInputChange('relationship', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="mb-1">
                  <p className="text-sm">Signature / Thumb Impression</p>
                  <p className="text-sm hindi-text">हस्ताक्षर / अंगूठे का निशान</p>
                </div>
                <input
                  type="text"
                  value={formData.signatureThumb}
                  onChange={(e) => handleInputChange('signatureThumb', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="mb-1">
                  <p className="text-sm">Name & Signature of the Witness 1</p>
                  <p className="text-sm hindi-text">गवाह का नाम/हस्ताक्षर</p>
                </div>
                <input
                  type="text"
                  value={formData.witness1Name}
                  onChange={(e) => handleInputChange('witness1Name', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="mb-1">
                  <p className="text-sm">Name & Signature of the Witness 2</p>
                  <p className="text-sm hindi-text">गवाह का नाम व हस्ताक्षर</p>
                </div>
                <input
                  type="text"
                  value={formData.witness2Name}
                  onChange={(e) => handleInputChange('witness2Name', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="mb-1">
                  <p className="text-sm">Name & Signature of Doctor</p>
                  <p className="text-sm hindi-text">चिकित्सक का नाम व हस्ताक्षर</p>
                </div>
                <input
                  type="text"
                  value={formData.doctorName}
                  onChange={(e) => handleInputChange('doctorName', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="mb-1">
                  <p className="text-sm">Date & Time</p>
                </div>
                <input
                  type="datetime-local"
                  value={formData.dateTime}
                  onChange={(e) => handleInputChange('dateTime', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <div className="mb-1">
                  <p className="text-sm">Regd. No.</p>
                </div>
                <input
                  type="text"
                  value={formData.regdNo}
                  onChange={(e) => handleInputChange('regdNo', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default HighRiskConsentForm;