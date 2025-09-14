import React, { useState, useEffect } from 'react';
import type { PatientWithRelations } from '../config/supabaseNew';
import toast from 'react-hot-toast';

interface IPDConsentFormProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientWithRelations;
  bedNumber: number;
  ipdNumber?: string;
  onSubmit: (consentData: any) => void;
  savedData?: any; // Previously saved form data
}

interface ConsentFormData {
  // Patient Information
  patientName: string;
  patientId: string;
  ipdNo: string;
  
  // Consent Point 1 fields
  consentName1: string;
  patientAddress: string;
  admissionDate: string;
  admissionTime: string;
  
  // Patient Signature
  patientSignatureName: string;
  patientSignature: string;
  patientSignatureDate: string;
  patientSignatureTime: string;
  
  // Employee Signature
  employeeName: string;
  employeeSignature: string;
  employeeSignatureDate: string;
  employeeSignatureTime: string;
  
  // Unable to consent (if applicable)
  unableReason: string;
  relativeName: string;
  relationshipToPatient: string;
  relativeName2: string;
  relativeSignature: string;
  relativeSignatureDate: string;
  relativeSignatureTime: string;
}

// Language translations
const translations = {
  english: {
    title: "VALANT HOSPITAL",
    subtitle: "A-10, Madhav Vihar, Shobhagpura, Udaipur | +91-911911 8000",
    formTitle: "General Consent",
    patientInfo: "Patient Information",
    patientName: "Patient's Name:",
    patientId: "Patient ID:",
    ipdNo: "IPD No.:",
    consentDeclaration: "Consent Declaration",
    consentPoint1: "I, {name}, of {address}, give my consent for my own/the patient's admission to Valant Hospital, Udaipur, on {date} at {time}.",
    consentPoint2: "I give my consent to Valant Hospital/Doctors/Staff for the following:",
    consentList: [
      "Medical Advice",
      "Performing all necessary medical examinations (with full confidentiality)",
      "Regular medical tests (physical, pathological, investigation, assessment, medication)",
      "Regular Radiology and Laboratory Tests",
      "Nursing Care and Medication"
    ],
    consentPoint3: "I have been thoroughly explained about the illness, its severity, and potential complications. I am fully satisfied with and agree to all decisions made by the doctors and staff of Valant Hospital.",
    consentPoint4: "I have been informed that I/the patient may need to be admitted to the ICU due to my/the patient's condition. I have been informed about the potential expenses for treatment in the ICU. The doctors will keep me updated on the patient's condition from time to time.",
    consentPoint5: "I have been informed that depending on my/the patient's condition, an operation/blood transfusion may be necessary.",
    consentPoint6: "I give my consent for consultation/discussion with other doctors in the best interest of myself/the patient.",
    consentPoint7: "I take responsibility for the payment of all hospital expenses incurred during my/the patient's treatment.",
    finalDeclaration: "I hereby affirm that I have read and understood the above consent form in my own language. I confirm that I am giving this consent willingly and without any pressure or coercion for my/the patient's treatment. All expenses/risks/responsibilities will be my/patient's.",
    patientConsent: "Patient's Consent",
    employeeName: "Employee's Name:",
    employeeVerification: "Hospital Employee's Verification",
    signature: "Signature:",
    date: "Date:",
    time: "Time:",
    unableToConsent: "If Patient Unable to Give Consent",
    unableReason: "Unable to give consent because:",
    relativeConsent: "Therefore, I, {name}, ({relationship}) give consent on behalf of the patient.",
    relativeWitness: "Patient's Relative/Witness Name:",
    submitForm: "Submit Consent Form",
    printForm: "Print Form",
    close: "Close"
  },
  hindi: {
    title: "वैलेंट हॉस्पिटल",
    subtitle: "ए-10, माधव विहार, शोभागपुरा, उदयपुर | +91-911911 8000",
    formTitle: "सामान्य सहमति",
    patientInfo: "रोगी की जानकारी",
    patientName: "रोगी का नाम:",
    patientId: "रोगी आईडी:",
    ipdNo: "आईपीडी नं.:",
    consentDeclaration: "सहमति घोषणा",
    consentPoint1: "मैं, {name}, निवासी {address}, अपने/रोगी के वैलेंट हॉस्पिटल, उदयपुर में दिनांक {date} को समय {time} पर भर्ती होने की सहमति देता/देती हूं।",
    consentPoint2: "मैं वैलेंट हॉस्पिटल/डॉक्टरों/स्टाफ को निम्नलिखित के लिए अपनी सहमति देता/देती हूं:",
    consentList: [
      "चिकित्सा सलाह",
      "सभी आवश्यक चिकित्सा परीक्षण करना (पूर्ण गोपनीयता के साथ)",
      "नियमित चिकित्सा जांच (शारीरिक, पैथोलॉजिकल, जांच, मूल्यांकन, दवाई)",
      "नियमित रेडियोलॉजी और प्रयोगशाला परीक्षण",
      "नर्सिंग केयर और दवाई"
    ],
    consentPoint3: "मुझे बीमारी, इसकी गंभीरता और संभावित जटिलताओं के बारे में पूरी तरह से समझाया गया है। मैं वैलेंट हॉस्पिटल के डॉक्टरों और स्टाफ द्वारा लिए गए सभी निर्णयों से पूर्णतः संतुष्ट हूं और सहमत हूं।",
    consentPoint4: "मुझे बताया गया है कि मेरी/रोगी की स्थिति के कारण मुझे/रोगी को आईसीयू में भर्ती करने की आवश्यकता हो सकती है। मुझे आईसीयू में इलाज के संभावित खर्च के बारे में जानकारी दी गई है। डॉक्टर समय-समय पर रोगी की स्थिति के बारे में मुझे अपडेट करते रहेंगे।",
    consentPoint5: "मुझे बताया गया है कि मेरी/रोगी की स्थिति के आधार पर ऑपरेशन/रक्त चढ़ाना आवश्यक हो सकता है।",
    consentPoint6: "मैं अपने/रोगी के हित में अन्य डॉक्टरों के साथ परामर्श/चर्चा के लिए अपनी सहमति देता/देती हूं।",
    consentPoint7: "मैं अपने/रोगी के इलाज के दौरान आने वाले सभी अस्पताल के खर्च की जिम्मेदारी लेता/लेती हूं।",
    finalDeclaration: "मैं एतद्द्वारा पुष्टि करता/करती हूं कि मैंने उपरोक्त सहमति फॉर्म को अपनी भाषा में पढ़ा और समझा है। मैं पुष्टि करता/करती हूं कि मैं यह सहमति स्वेच्छा से और बिना किसी दबाव या मजबूरी के अपने/रोगी के इलाज के लिए दे रहा/रही हूं। सभी खर्च/जोखिम/जिम्मेदारियां मेरी/रोगी की होंगी।",
    patientConsent: "रोगी की सहमति",
    employeeName: "कर्मचारी का नाम:",
    employeeVerification: "अस्पताल कर्मचारी की पुष्टि",
    signature: "हस्ताक्षर:",
    date: "दिनांक:",
    time: "समय:",
    unableToConsent: "यदि रोगी सहमति देने में असमर्थ है",
    unableReason: "सहमति देने में असमर्थ क्योंकि:",
    relativeConsent: "इसलिए, मैं, {name}, ({relationship}) रोगी की ओर से सहमति देता/देती हूं।",
    relativeWitness: "रोगी के रिश्तेदार/गवाह का नाम:",
    submitForm: "सहमति फॉर्म जमा करें",
    printForm: "फॉर्म प्रिंट करें",
    close: "बंद करें"
  }
};

const IPDConsentForm: React.FC<IPDConsentFormProps> = ({
  isOpen,
  onClose,
  patient,
  bedNumber,
  ipdNumber,
  onSubmit,
  savedData
}) => {
  // Debug logging for IPD number
  console.log(`📄 IPDConsentForm - IPD Number received: ${ipdNumber}`);
  
  // Language selection state
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'hindi'>('english');
  const t = translations[selectedLanguage];
  
  const [formData, setFormData] = useState<ConsentFormData>({
    patientName: '',
    patientId: '',
    ipdNo: '',
    consentName1: savedData?.consentName1 || '',
    patientAddress: savedData?.patientAddress || '',
    admissionDate: savedData?.admissionDate || '',
    admissionTime: savedData?.admissionTime || '',
    patientSignatureName: savedData?.patientSignatureName || '',
    patientSignature: savedData?.patientSignature || '',
    patientSignatureDate: savedData?.patientSignatureDate || '',
    patientSignatureTime: savedData?.patientSignatureTime || '',
    employeeName: savedData?.employeeName || '',
    employeeSignature: savedData?.employeeSignature || '',
    employeeSignatureDate: savedData?.employeeSignatureDate || '',
    employeeSignatureTime: savedData?.employeeSignatureTime || '',
    unableReason: savedData?.unableReason || '',
    relativeName: savedData?.relativeName || '',
    relationshipToPatient: savedData?.relationshipToPatient || '',
    relativeName2: savedData?.relativeName2 || '',
    relativeSignature: savedData?.relativeSignature || '',
    relativeSignatureDate: savedData?.relativeSignatureDate || '',
    relativeSignatureTime: savedData?.relativeSignatureTime || ''
  });

  // Function to convert 24-hour time to 12-hour format
  const formatTimeTo12Hour = (time24: string): string => {
    if (!time24) return '';
    const [hours, minutes] = time24.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Function to get current time in 12-hour format
  const getCurrentTime12Hour = (): string => {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Auto-populate form with patient data and current date/time
  useEffect(() => {
    console.log('🔍 IPDConsentForm Debug:', { 
      isOpen, 
      patient: patient ? { 
        first_name: patient.first_name, 
        last_name: patient.last_name, 
        patient_id: patient.patient_id 
      } : null, 
      ipdNumber, 
      bedNumber 
    });
    
    if (isOpen && patient) {
      console.log('📝 Setting form data with patient:', patient);
      console.log('🔍 Patient admissions data:', patient.admissions);
      
      // Get admission date and time from patient data, fallback to current if not available
      const admissionData = patient.admissions?.[0]; // Get the latest admission
      console.log('🔍 Latest admission data:', admissionData);
      let admissionDate: string;
      let admissionTime: string;
      
      if (admissionData?.admission_date) {
        console.log('🔍 Raw admission_date from database:', admissionData.admission_date);
        // Parse the admission date - handle potential timezone issues
        const admissionDateTime = new Date(admissionData.admission_date);
        console.log('🕰️ Parsed admission DateTime object:', admissionDateTime);
        
        // Use local date formatting to avoid timezone shifts
        const year = admissionDateTime.getFullYear();
        const month = String(admissionDateTime.getMonth() + 1).padStart(2, '0');
        const day = String(admissionDateTime.getDate()).padStart(2, '0');
        admissionDate = `${year}-${month}-${day}`;
        
        admissionTime = admissionDateTime.toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        });
        console.log('🕰️ Formatted admission date/time:', { admissionDate, admissionTime });
        console.log('✅ Using patient admission date/time:', { admissionDate, admissionTime });
      } else {
        // Fallback to current date/time if no admission data
        const now = new Date();
        admissionDate = now.toISOString().split('T')[0];
        admissionTime = getCurrentTime12Hour();
        console.log('⚠️ No admission data found, using current date/time:', { admissionDate, admissionTime });
      }
      
      // For signature dates, use current date/time (when form is being filled)
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime12Hour = getCurrentTime12Hour();
      
      setFormData(prev => ({
        ...prev,
        patientName: `${patient.first_name} ${patient.last_name}`,
        patientId: patient.patient_id,
        ipdNo: ipdNumber || 'IPD Number Not Generated',
        consentName1: `${patient.first_name} ${patient.last_name}`,
        patientAddress: patient.address || '',
        admissionDate: admissionDate,
        admissionTime: admissionTime,
        patientSignatureName: `${patient.first_name} ${patient.last_name}`,
        patientSignatureDate: today,
        patientSignatureTime: currentTime12Hour,
        employeeSignatureDate: today,
        employeeSignatureTime: currentTime12Hour,
        relativeSignatureDate: today,
        relativeSignatureTime: currentTime12Hour
      }));
      
      console.log('✅ Form data set with values:', {
        patientName: `${patient.first_name} ${patient.last_name}`,
        patientId: patient.patient_id,
        ipdNo: ipdNumber || 'IPD Number Not Generated'
      });
    }
  }, [isOpen, patient, ipdNumber, bedNumber]);

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
    if (!formData.patientName || !formData.patientId) {
      toast.error('Please fill in all required patient information');
      return;
    }

    // Save consent data
    onSubmit({
      ...formData,
      submittedAt: new Date().toISOString(),
      bedNumber
    });
    
    toast.success('Consent form submitted successfully');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    const printContent = document.getElementById('consent-form-content');
    
    if (printWindow && printContent) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>IPD Consent Form - ${formData.patientName}</title>
          <style>
            @page {
              margin: 0.75in;
              size: A4 portrait;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
              font-size: 12pt;
              line-height: 1.4;
              color: black;
              background: white;
            }
            
            .print-container {
              max-width: 100%;
              margin: 0 auto;
              padding: 0;
            }
            
            /* Header styling */
            .print-header {
              text-align: center;
              border-bottom: 2px solid black;
              margin-bottom: 20pt;
              padding-bottom: 15pt;
            }
            
            .print-header h1 {
              font-size: 24pt;
              font-weight: bold;
              margin-bottom: 8pt;
            }
            
            .print-header h2 {
              font-size: 18pt;
              font-weight: bold;
              margin-top: 8pt;
            }
            
            .print-header p {
              font-size: 10pt;
              margin: 4pt 0;
            }
            
            /* Section styling */
            .print-section {
              margin-bottom: 15pt;
              page-break-inside: avoid;
              border: 1px solid #ccc;
              padding: 10pt;
              background: #f9f9f9;
            }
            
            .print-section h3 {
              font-size: 14pt;
              font-weight: bold;
              margin-bottom: 10pt;
              border-bottom: 1px solid #666;
              padding-bottom: 5pt;
            }
            
            /* Patient info grid */
            .print-patient-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr;
              gap: 10pt;
              margin-bottom: 10pt;
            }
            
            .print-patient-field {
              margin-bottom: 8pt;
            }
            
            .print-patient-field label {
              font-weight: bold;
              font-size: 10pt;
              display: block;
              margin-bottom: 2pt;
            }
            
            .print-patient-field .field-value {
              border-bottom: 1px solid black;
              padding: 2pt 0;
              font-size: 11pt;
              min-height: 16pt;
              display: block;
            }
            
            /* Consent points */
            .print-consent-point {
              margin-bottom: 12pt;
              page-break-inside: avoid;
              border: 1px solid #ddd;
              padding: 8pt;
              background: #f8f8f8;
            }
            
            .print-consent-number {
              font-weight: bold;
              font-size: 14pt;
              margin-right: 8pt;
              float: left;
            }
            
            .print-consent-text {
              font-size: 11pt;
              line-height: 1.5;
              text-align: justify;
            }
            
            .print-consent-text .field-value {
              border-bottom: 1px solid black;
              padding: 1pt 4pt;
              margin: 0 2pt;
              font-size: 11pt;
              min-width: 100pt;
              display: inline-block;
            }
            
            .print-consent-text ul {
              margin: 8pt 0 8pt 15pt;
              padding: 0;
            }
            
            .print-consent-text li {
              margin-bottom: 4pt;
              font-size: 10pt;
            }
            
            /* Signature sections */
            .print-signature-section {
              margin-top: 15pt;
              page-break-inside: avoid;
              border: 1px solid black;
              padding: 10pt;
              background: white;
            }
            
            .print-signature-section h4 {
              font-size: 12pt;
              font-weight: bold;
              margin-bottom: 8pt;
              border-bottom: 1px solid #666;
              padding-bottom: 3pt;
            }
            
            .print-signature-grid {
              display: grid;
              grid-template-columns: 1fr 1fr 1fr 1fr;
              gap: 10pt;
            }
            
            .print-signature-field {
              margin-bottom: 5pt;
            }
            
            .print-signature-field label {
              font-weight: bold;
              font-size: 9pt;
              display: block;
              margin-bottom: 2pt;
            }
            
            .print-signature-field .field-value {
              border-bottom: 1px solid black;
              padding: 2pt 0;
              font-size: 10pt;
              min-height: 14pt;
              display: block;
            }
            
            /* Highlight section */
            .print-highlight {
              background: #ffffcc;
              border: 2px solid #ff9900;
              padding: 10pt;
              margin: 15pt 0;
              page-break-inside: avoid;
            }
            
            .print-highlight p {
              font-weight: bold;
              font-size: 11pt;
              text-align: justify;
              margin: 0;
            }
            
            /* Page break controls */
            .page-break-before {
              page-break-before: always;
            }
            
            .page-break-after {
              page-break-after: always;
            }
            
            .page-break-avoid {
              page-break-inside: avoid;
            }
            
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            ${generatePrintContent()}
          </div>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const generatePrintContent = () => {
    // Get consent point 1 text for selected language
    const consentPoint1Text = selectedLanguage === 'hindi' 
      ? `मैं, <span class="field-value">${formData.consentName1 || ''}</span>, निवासी <span class="field-value">${formData.patientAddress || ''}</span>, अपने/रोगी के वैलेंट हॉस्पिटल, उदयपुर में दिनांक <span class="field-value">${formData.admissionDate || ''}</span> को समय <span class="field-value">${formData.admissionTime || ''}</span> पर भर्ती होने की सहमति देता/देती हूं।`
      : `I, <span class="field-value">${formData.consentName1 || ''}</span>, of <span class="field-value">${formData.patientAddress || ''}</span>, give my consent for my own/the patient's admission to Valant Hospital, Udaipur, on <span class="field-value">${formData.admissionDate || ''}</span> at <span class="field-value">${formData.admissionTime || ''}</span>.`;

    const relativeConsentText = selectedLanguage === 'hindi'
      ? `इसलिए, मैं, <span class="field-value">${formData.relativeName || ''}</span>, (<span class="field-value">${formData.relationshipToPatient || ''}</span>) रोगी की ओर से सहमति देता/देती हूं।`
      : `Therefore, I, <span class="field-value">${formData.relativeName || ''}</span>, (<span class="field-value">${formData.relationshipToPatient || ''}</span>) give consent on behalf of the patient.`;

    return `
      <!-- Header Section -->
      <div class="print-header">
        <h1>${t.title}</h1>
        <p>${t.subtitle}</p>
        <h2>${t.formTitle}</h2>
      </div>

      <!-- Patient Information Section -->
      <div class="print-section">
        <h3>${t.patientInfo}</h3>
        <div class="print-patient-grid">
          <div class="print-patient-field">
            <label>${t.patientName}</label>
            <span class="field-value">${formData.patientName || ''}</span>
          </div>
          <div class="print-patient-field">
            <label>${t.patientId}</label>
            <span class="field-value">${formData.patientId || ''}</span>
          </div>
          <div class="print-patient-field">
            <label>${t.ipdNo}</label>
            <span class="field-value">${formData.ipdNo || ''}</span>
          </div>
        </div>
      </div>

      <!-- Consent Declaration -->
      <div style="margin-bottom: 15pt;">
        <h3 style="font-size: 14pt; font-weight: bold; margin-bottom: 10pt;">${t.consentDeclaration}</h3>

        <!-- Consent Point 1 -->
        <div class="print-consent-point">
          <span class="print-consent-number">1.</span>
          <div class="print-consent-text">
            <p>${consentPoint1Text}</p>
          </div>
          <div style="clear: both;"></div>
        </div>

        <!-- Consent Point 2 -->
        <div class="print-consent-point">
          <span class="print-consent-number">2.</span>
          <div class="print-consent-text">
            <p style="margin-bottom: 8pt;">${t.consentPoint2}</p>
            <ul>
              ${t.consentList.map(item => `<li>${item}</li>`).join('')}
            </ul>
          </div>
          <div style="clear: both;"></div>
        </div>

        <!-- Consent Point 3 -->
        <div class="print-consent-point">
          <span class="print-consent-number">3.</span>
          <div class="print-consent-text">
            <p>${t.consentPoint3}</p>
          </div>
          <div style="clear: both;"></div>
        </div>

        <!-- Consent Point 4 -->
        <div class="print-consent-point">
          <span class="print-consent-number">4.</span>
          <div class="print-consent-text">
            <p>${t.consentPoint4}</p>
          </div>
          <div style="clear: both;"></div>
        </div>

        <!-- Consent Point 5 -->
        <div class="print-consent-point">
          <span class="print-consent-number">5.</span>
          <div class="print-consent-text">
            <p>${t.consentPoint5}</p>
          </div>
          <div style="clear: both;"></div>
        </div>

        <!-- Consent Point 6 -->
        <div class="print-consent-point">
          <span class="print-consent-number">6.</span>
          <div class="print-consent-text">
            <p>${t.consentPoint6}</p>
          </div>
          <div style="clear: both;"></div>
        </div>

        <!-- Consent Point 7 -->
        <div class="print-consent-point">
          <span class="print-consent-number">7.</span>
          <div class="print-consent-text">
            <p>${t.consentPoint7}</p>
          </div>
          <div style="clear: both;"></div>
        </div>
      </div>

      <!-- Concluding Paragraph -->
      <div class="print-highlight">
        <p>${t.finalDeclaration}</p>
      </div>

      <!-- Patient Signature Section -->
      <div class="print-signature-section">
        <h4>${t.patientConsent}</h4>
        <div class="print-signature-grid">
          <div class="print-signature-field">
            <label>${t.patientName}</label>
            <span class="field-value">${formData.patientSignatureName || ''}</span>
          </div>
          <div class="print-signature-field">
            <label>${t.signature}</label>
            <span class="field-value">${formData.patientSignature || ''}</span>
          </div>
          <div class="print-signature-field">
            <label>${t.date}</label>
            <span class="field-value">${formData.patientSignatureDate || ''}</span>
          </div>
          <div class="print-signature-field">
            <label>${t.time}</label>
            <span class="field-value">${formData.patientSignatureTime || ''}</span>
          </div>
        </div>
      </div>

      <!-- Employee Signature Section -->
      <div class="print-signature-section">
        <h4>${t.employeeVerification}</h4>
        <div class="print-signature-grid">
          <div class="print-signature-field">
            <label>${t.employeeName}</label>
            <span class="field-value">${formData.employeeName || ''}</span>
          </div>
          <div class="print-signature-field">
            <label>${t.signature}</label>
            <span class="field-value">${formData.employeeSignature || ''}</span>
          </div>
          <div class="print-signature-field">
            <label>${t.date}</label>
            <span class="field-value">${formData.employeeSignatureDate || ''}</span>
          </div>
          <div class="print-signature-field">
            <label>${t.time}</label>
            <span class="field-value">${formData.employeeSignatureTime || ''}</span>
          </div>
        </div>
      </div>

      <!-- Unable to Give Consent Section -->
      ${formData.unableReason || formData.relativeName ? `
      <div class="print-signature-section">
        <h4>${t.unableToConsent}</h4>
        ${formData.unableReason ? `
        <div style="margin-bottom: 10pt;">
          <label style="font-weight: bold; font-size: 10pt; display: block; margin-bottom: 2pt;">${t.unableReason}</label>
          <div style="border: 1px solid black; padding: 5pt; min-height: 30pt; background: white;">
            ${formData.unableReason}
          </div>
        </div>
        ` : ''}
        
        ${formData.relativeName ? `
        <div style="margin-bottom: 10pt;">
          <p class="print-consent-text">
            ${relativeConsentText}
          </p>
        </div>
        
        <div class="print-signature-grid">
          <div class="print-signature-field">
            <label>${t.relativeWitness}</label>
            <span class="field-value">${formData.relativeName2 || ''}</span>
          </div>
          <div class="print-signature-field">
            <label>${t.signature}</label>
            <span class="field-value">${formData.relativeSignature || ''}</span>
          </div>
          <div class="print-signature-field">
            <label>${t.date}</label>
            <span class="field-value">${formData.relativeSignatureDate || ''}</span>
          </div>
          <div class="print-signature-field">
            <label>${t.time}</label>
            <span class="field-value">${formData.relativeSignatureTime || ''}</span>
          </div>
        </div>
        ` : ''}
      </div>
      ` : ''}
    `;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Print Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              margin: 0.75in;
              size: A4 portrait;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            
            body {
              margin: 0;
              padding: 0;
              font-size: 12pt;
              line-height: 1.4;
              color: black;
            }
            
            body * {
              visibility: hidden;
            }
            
            #consent-form-content, #consent-form-content * {
              visibility: visible;
            }
            
            #consent-form-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white;
              box-shadow: none;
              border: none;
              border-radius: 0;
              margin: 0;
              padding: 0;
            }
            
            .print-hide {
              display: none !important;
            }
            
            /* Header styling for print */
            .print-header {
              background: white !important;
              color: black !important;
              border-bottom: 2px solid black !important;
              margin-bottom: 20pt;
              padding: 15pt 0;
            }
            
            .print-header h1 {
              color: black !important;
              font-size: 24pt !important;
              font-weight: bold !important;
              margin: 0 0 8pt 0 !important;
            }
            
            .print-header h2 {
              color: black !important;
              font-size: 18pt !important;
              font-weight: bold !important;
              margin: 8pt 0 0 0 !important;
            }
            
            .print-header p {
              color: black !important;
              font-size: 10pt !important;
              margin: 4pt 0 !important;
            }
            
            /* Form sections */
            .print-section {
              margin-bottom: 15pt;
              page-break-inside: avoid;
              border: 1px solid #ccc !important;
              padding: 10pt;
              background: #f9f9f9 !important;
            }
            
            .print-section h3 {
              color: black !important;
              font-size: 14pt !important;
              font-weight: bold !important;
              margin: 0 0 10pt 0 !important;
              border-bottom: 1px solid #666 !important;
              padding-bottom: 5pt !important;
            }
            
            /* Patient info grid */
            .print-patient-grid {
              display: grid !important;
              grid-template-columns: 1fr 1fr 1fr !important;
              gap: 10pt !important;
              margin-bottom: 10pt !important;
            }
            
            .print-patient-field {
              margin-bottom: 8pt !important;
            }
            
            .print-patient-field label {
              font-weight: bold !important;
              font-size: 10pt !important;
              display: block !important;
              margin-bottom: 2pt !important;
            }
            
            .print-patient-field input {
              border: none !important;
              border-bottom: 1px solid black !important;
              background: transparent !important;
              padding: 2pt 0 !important;
              font-size: 11pt !important;
              width: 100% !important;
            }
            
            /* Consent points */
            .print-consent-point {
              margin-bottom: 12pt !important;
              page-break-inside: avoid !important;
              border: 1px solid #ddd !important;
              padding: 8pt !important;
              background: #f8f8f8 !important;
            }
            
            .print-consent-number {
              color: black !important;
              font-weight: bold !important;
              font-size: 14pt !important;
              margin-right: 8pt !important;
            }
            
            .print-consent-text {
              color: black !important;
              font-size: 11pt !important;
              line-height: 1.5 !important;
              text-align: justify !important;
            }
            
            .print-consent-text input {
              border: none !important;
              border-bottom: 1px solid black !important;
              background: transparent !important;
              padding: 1pt 4pt !important;
              margin: 0 2pt !important;
              font-size: 11pt !important;
              min-width: 100pt !important;
            }
            
            .print-consent-text ul {
              margin: 8pt 0 8pt 15pt !important;
              padding: 0 !important;
            }
            
            .print-consent-text li {
              margin-bottom: 4pt !important;
              font-size: 10pt !important;
            }
            
            /* Signature sections */
            .print-signature-section {
              margin-top: 15pt !important;
              page-break-inside: avoid !important;
              border: 1px solid black !important;
              padding: 10pt !important;
              background: white !important;
            }
            
            .print-signature-section h4 {
              color: black !important;
              font-size: 12pt !important;
              font-weight: bold !important;
              margin: 0 0 8pt 0 !important;
              border-bottom: 1px solid #666 !important;
              padding-bottom: 3pt !important;
            }
            
            .print-signature-grid {
              display: grid !important;
              grid-template-columns: 1fr 1fr 1fr 1fr !important;
              gap: 10pt !important;
            }
            
            .print-signature-field {
              margin-bottom: 5pt !important;
            }
            
            .print-signature-field label {
              font-weight: bold !important;
              font-size: 9pt !important;
              display: block !important;
              margin-bottom: 2pt !important;
            }
            
            .print-signature-field input {
              border: none !important;
              border-bottom: 1px solid black !important;
              background: transparent !important;
              padding: 2pt 0 !important;
              font-size: 10pt !important;
              width: 100% !important;
            }
            
            /* Special highlight section */
            .print-highlight {
              background: #ffffcc !important;
              border: 2px solid #ff9900 !important;
              padding: 10pt !important;
              margin: 15pt 0 !important;
              page-break-inside: avoid !important;
            }
            
            .print-highlight p {
              font-weight: bold !important;
              font-size: 11pt !important;
              color: black !important;
              text-align: justify !important;
              margin: 0 !important;
            }
            
            /* Page break controls */
            .page-break-before {
              page-break-before: always !important;
            }
            
            .page-break-after {
              page-break-after: always !important;
            }
            
            .page-break-avoid {
              page-break-inside: avoid !important;
            }
            
            /* Ensure proper margins and spacing */
            .print-form-container {
              padding: 0 !important;
              margin: 0 !important;
            }
            
            /* Table styling for better print */
            table {
              border-collapse: collapse !important;
              width: 100% !important;
              margin: 10pt 0 !important;
            }
            
            th, td {
              border: 1px solid black !important;
              padding: 5pt !important;
              font-size: 10pt !important;
              text-align: left !important;
            }
            
            th {
              background: #f0f0f0 !important;
              font-weight: bold !important;
            }
          }
        `
      }} />

      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        {/* Action Buttons - Hidden during print */}
        <div className="flex justify-between items-center p-4 border-b print-hide">
          {/* Language Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">Language:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedLanguage('english')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedLanguage === 'english' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setSelectedLanguage('hindi')}
                className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                  selectedLanguage === 'hindi' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                हिंदी
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <span>🖨️</span> {t.printForm}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              {t.close}
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div id="consent-form-content" className="print-form-container">
          {/* Header Section */}
          <div className="bg-blue-600 text-white p-6 text-center print-header">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{t.title}</h1>
            <p className="text-blue-100 text-sm sm:text-base mb-2">
              {t.subtitle}
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold">{t.formTitle}</h2>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Patient Information Section */}
            <div className="bg-gray-50 p-4 rounded-lg print-section">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">{t.patientInfo}</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 print-patient-grid">
                <div className="print-patient-field">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.patientName}</label>
                  <input
                    type="text"
                    name="patientName"
                    value={formData.patientName}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="print-patient-field">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.patientId}</label>
                  <input
                    type="text"
                    name="patientId"
                    value={formData.patientId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="print-patient-field">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.ipdNo}</label>
                  <input
                    type="text"
                    name="ipdNo"
                    value={formData.ipdNo}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Consent Points Section */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-800">{t.consentDeclaration}</h3>

              {/* Consent Point 1 */}
              <div className="bg-gray-50 p-4 rounded-lg print-consent-point">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold text-lg mt-1 print-consent-number">1.</span>
                  <div className="flex-1 print-consent-text">
                    <p className="text-gray-800 mb-3">
                      {t.consentPoint1
                        .replace('{name}', '')
                        .split('{name}')[0]}
                      <input
                        type="text"
                        name="consentName1"
                        value={formData.consentName1}
                        onChange={handleInputChange}
                        placeholder={selectedLanguage === 'hindi' ? "आपका नाम/रोगी का नाम" : "Your Name/Patient's Name"}
                        className="inline-block mx-1 px-2 py-1 border-b border-gray-400 focus:outline-none focus:border-blue-500 bg-transparent min-w-[200px]"
                      />
                      {selectedLanguage === 'hindi' ? ', निवासी ' : ', of '}
                      <input
                        type="text"
                        name="patientAddress"
                        value={formData.patientAddress}
                        onChange={handleInputChange}
                        placeholder={selectedLanguage === 'hindi' ? "आपका पता" : "Your Address"}
                        className="inline-block mx-1 px-2 py-1 border-b border-gray-400 focus:outline-none focus:border-blue-500 bg-transparent min-w-[250px]"
                      />
                      {selectedLanguage === 'hindi' ? ', अपने/रोगी के वैलेंट हॉस्पिटल, उदयपुर में दिनांक ' : ', give my consent for my own/the patient\'s admission to Valant Hospital, Udaipur, on '}
                      <input
                        type="date"
                        name="admissionDate"
                        value={formData.admissionDate}
                        onChange={handleInputChange}
                        className="inline-block mx-1 px-2 py-1 border-b border-gray-400 focus:outline-none focus:border-blue-500 bg-transparent"
                      />
                      {selectedLanguage === 'hindi' ? ' को समय ' : ' at '}
                      <input
                        type="text"
                        name="admissionTime"
                        value={formData.admissionTime}
                        onChange={handleInputChange}
                        placeholder="12:00 PM"
                        className="inline-block mx-1 px-2 py-1 border-b border-gray-400 focus:outline-none focus:border-blue-500 bg-transparent min-w-[80px]"
                      />
                      {selectedLanguage === 'hindi' ? ' पर भर्ती होने की सहमति देता/देती हूं।' : '.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Consent Point 2 */}
              <div className="bg-gray-50 p-4 rounded-lg print-consent-point">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold text-lg mt-1 print-consent-number">2.</span>
                  <div className="flex-1 print-consent-text">
                    <p className="text-gray-800 mb-3">{t.consentPoint2}</p>
                    <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                      {t.consentList.map((item, index) => (
                        <li key={index}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg print-consent-point">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold text-lg mt-1 print-consent-number">3.</span>
                  <div className="flex-1 print-consent-text">
                    <p className="text-gray-800">{t.consentPoint3}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg print-consent-point">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold text-lg mt-1 print-consent-number">4.</span>
                  <div className="flex-1 print-consent-text">
                    <p className="text-gray-800">{t.consentPoint4}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg print-consent-point">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold text-lg mt-1 print-consent-number">5.</span>
                  <div className="flex-1 print-consent-text">
                    <p className="text-gray-800">{t.consentPoint5}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg print-consent-point">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold text-lg mt-1 print-consent-number">6.</span>
                  <div className="flex-1 print-consent-text">
                    <p className="text-gray-800">{t.consentPoint6}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg print-consent-point">
                <div className="flex items-start space-x-2">
                  <span className="text-blue-600 font-bold text-lg mt-1 print-consent-number">7.</span>
                  <div className="flex-1 print-consent-text">
                    <p className="text-gray-800">{t.consentPoint7}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Concluding Paragraph */}
            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-400 print-highlight">
              <p className="text-gray-800 font-medium">{t.finalDeclaration}</p>
            </div>

            {/* Patient Signature Section */}
            <div className="bg-blue-50 p-4 rounded-lg print-signature-section">
              <h4 className="text-md font-semibold text-gray-800 mb-4">{t.patientConsent}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print-signature-grid">
                <div className="print-signature-field">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.patientName}</label>
                  <input
                    type="text"
                    name="patientSignatureName"
                    value={formData.patientSignatureName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="print-signature-field">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.signature}</label>
                  <input
                    type="text"
                    name="patientSignature"
                    value={formData.patientSignature}
                    onChange={handleInputChange}
                    placeholder={selectedLanguage === 'hindi' ? "यहां हस्ताक्षर करें" : "Sign here"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="print-signature-field">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.date}</label>
                  <input
                    type="date"
                    name="patientSignatureDate"
                    value={formData.patientSignatureDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="print-signature-field">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.time}</label>
                  <input
                    type="text"
                    name="patientSignatureTime"
                    value={formData.patientSignatureTime}
                    onChange={handleInputChange}
                    placeholder="12:00 PM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Employee Signature Section */}
            <div className="bg-green-50 p-4 rounded-lg print-signature-section">
              <h4 className="text-md font-semibold text-gray-800 mb-4">{t.employeeVerification}</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print-signature-grid">
                <div className="print-signature-field">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.employeeName}</label>
                  <input
                    type="text"
                    name="employeeName"
                    value={formData.employeeName}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="print-signature-field">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.signature}</label>
                  <input
                    type="text"
                    name="employeeSignature"
                    value={formData.employeeSignature}
                    onChange={handleInputChange}
                    placeholder={selectedLanguage === 'hindi' ? "यहां हस्ताक्षर करें" : "Sign here"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="print-signature-field">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.date}</label>
                  <input
                    type="date"
                    name="employeeSignatureDate"
                    value={formData.employeeSignatureDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="print-signature-field">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.time}</label>
                  <input
                    type="text"
                    name="employeeSignatureTime"
                    value={formData.employeeSignatureTime}
                    onChange={handleInputChange}
                    placeholder="12:00 PM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Unable to Give Consent Section */}
            <div className="bg-red-50 p-4 rounded-lg print-signature-section">
              <h4 className="text-md font-semibold text-gray-800 mb-4">{t.unableToConsent}</h4>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">{t.unableReason}</label>
                <textarea
                  name="unableReason"
                  value={formData.unableReason}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Please specify the reason..."
                />
              </div>
              
              <div className="mb-4 print-consent-text">
                <p className="text-gray-800 mb-3">
                  Therefore, I, 
                  <input
                    type="text"
                    name="relativeName"
                    value={formData.relativeName}
                    onChange={handleInputChange}
                    placeholder="Name"
                    className="inline-block mx-1 px-2 py-1 border-b border-gray-400 focus:outline-none focus:border-blue-500 bg-transparent min-w-[150px]"
                  />, 
                  (
                  <input
                    type="text"
                    name="relationshipToPatient"
                    value={formData.relationshipToPatient}
                    onChange={handleInputChange}
                    placeholder="Relationship to patient"
                    className="inline-block mx-1 px-2 py-1 border-b border-gray-400 focus:outline-none focus:border-blue-500 bg-transparent min-w-[200px]"
                  />
                  ) give consent on behalf of the patient.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print-signature-grid">
                <div className="print-signature-field">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.relativeWitness}</label>
                  <input
                    type="text"
                    name="relativeName2"
                    value={formData.relativeName2}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="print-signature-field">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.signature}</label>
                  <input
                    type="text"
                    name="relativeSignature"
                    value={formData.relativeSignature}
                    onChange={handleInputChange}
                    placeholder={selectedLanguage === 'hindi' ? "यहां हस्ताक्षर करें" : "Sign here"}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="print-signature-field">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.date}</label>
                  <input
                    type="date"
                    name="relativeSignatureDate"
                    value={formData.relativeSignatureDate}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="print-signature-field">
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t.time}</label>
                  <input
                    type="text"
                    name="relativeSignatureTime"
                    value={formData.relativeSignatureTime}
                    onChange={handleInputChange}
                    placeholder="12:00 PM"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button - Hidden during print */}
            <div className="flex justify-center pt-6 print-hide">
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-lg"
              >
                {t.submitForm}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default IPDConsentForm;