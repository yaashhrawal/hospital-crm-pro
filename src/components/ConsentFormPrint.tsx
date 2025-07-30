import React from 'react';

interface ConsentFormPrintProps {
  formData: {
    patientName: string;
    department: string;
    uhidNo: string;
    ipNo: string;
    ageSex: string;
    doctorName: string;
    authorizedDoctor: string;
    procedureReason: string;
    alternatives: string;
    specificRisks: string;
    signatureName: string;
    relationship: string;
    patientSignature: string;
    patientDate: string;
    patientTime: string;
    witnessName: string;
    witnessSignature: string;
    doctorSignatureName: string;
    doctorSignature: string;
    doctorDate: string;
    doctorTime: string;
  };
}

const ConsentFormPrint: React.FC<ConsentFormPrintProps> = ({ formData }) => {
  return (
    <html>
      <head>
        <title>Procedure Consent Form - Print</title>
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            background: white;
            padding: 20px;
          }
          
          .print-container {
            max-width: 8.5in;
            margin: 0 auto;
            background: white;
          }
          
          .header {
            text-align: center;
            margin-bottom: 30px;
            page-break-inside: avoid;
          }
          
          .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          
          .header h2 {
            font-size: 20px;
            font-weight: bold;
            color: #0066cc;
            margin-bottom: 5px;
          }
          
          .header p {
            font-size: 12px;
            margin-bottom: 3px;
          }
          
          .section {
            margin-bottom: 25px;
            page-break-inside: avoid;
          }
          
          .section-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 15px;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
          }
          
          .patient-info {
            border: 1px solid #ddd;
            padding: 15px;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-bottom: 15px;
          }
          
          .info-item {
            margin-bottom: 10px;
          }
          
          .info-label {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 3px;
          }
          
          .info-value {
            border-bottom: 1px solid #000;
            padding: 3px 5px;
            min-height: 20px;
            font-size: 12px;
          }
          
          .consent-text {
            margin-bottom: 15px;
            text-align: justify;
          }
          
          .consent-paragraph {
            border: 1px solid #ddd;
            padding: 15px;
            margin-bottom: 15px;
            page-break-inside: avoid;
          }
          
          .inline-input {
            border-bottom: 1px solid #000;
            padding: 2px 5px;
            margin: 0 3px;
            min-width: 200px;
            display: inline-block;
          }
          
          .signatures {
            page-break-before: always;
            margin-top: 30px;
          }
          
          .signature-block {
            border: 1px solid #ddd;
            padding: 15px;
            margin-bottom: 20px;
            page-break-inside: avoid;
          }
          
          .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin-top: 10px;
          }
          
          .signature-item {
            margin-bottom: 15px;
          }
          
          .signature-line {
            border-bottom: 1px solid #000;
            padding: 5px;
            margin-top: 5px;
            min-height: 25px;
          }
          
          .date-time-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          
          .risk-section {
            background: #f9f9f9;
            border: 1px solid #ddd;
            padding: 15px;
            margin-bottom: 15px;
            page-break-inside: avoid;
          }
          
          .bold {
            font-weight: bold;
          }
          
          @page {
            size: A4;
            margin: 1in;
          }
          
          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        `}</style>
      </head>
      <body>
        <div className="print-container">
          {/* Header */}
          <div className="header">
            <h1>PROCEDURE CONSENT</h1>
            <h2>VALANT HOSPITAL</h2>
            <p>10, Madhav Vihar, Shobhagpura, Udaipur</p>
            <p>+91-911911 8000</p>
          </div>

          {/* Patient Information */}
          <div className="section">
            <div className="section-title">Patient Information</div>
            <div className="patient-info">
              <div className="info-grid">
                <div className="info-item">
                  <div className="info-label">Patient's Name:</div>
                  <div className="info-value">{formData.patientName}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Department:</div>
                  <div className="info-value">{formData.department}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">UHID No.:</div>
                  <div className="info-value">{formData.uhidNo}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">IP No.:</div>
                  <div className="info-value">{formData.ipNo}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Age/Sex:</div>
                  <div className="info-value">{formData.ageSex}</div>
                </div>
                <div className="info-item">
                  <div className="info-label">Name of Doctor:</div>
                  <div className="info-value">{formData.doctorName}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Consent Details */}
          <div className="section">
            <div className="section-title">Consent Details</div>
            
            <div className="consent-text">
              I hereby authorize Dr. <span className="inline-input">{formData.authorizedDoctor}</span> and / or alternative necessary to treat my condition:
            </div>
            
            <div className="consent-text">
              I understand the Name/Reason for the procedure is <span className="inline-input">{formData.procedureReason}</span>
            </div>
            
            <div className="consent-text">
              Alternatives to not performing this procedure include: <span className="inline-input">{formData.alternatives}</span>
            </div>
            
            <div className="consent-text">
              Significant and substantial risk of this particular procedure include: <span className="inline-input">{formData.specificRisks}</span>
            </div>
          </div>

          {/* Detailed Consent Paragraphs */}
          <div className="section">
            <div className="consent-paragraph">
              I understand the reason for the procedure. Treatment is being carried in good faith and in my patient's best interest. 
              All feasible alternative treatments, or procedures, including the option of taking no action, with description of 
              material risk and potential complications associated with the alternatives have been explained to me. The relative 
              probability of success for the treatment of procedure in understandable terms, have been explained to me.
            </div>
            
            <div className="consent-paragraph">
              It has been explained to me that condition may arise during this procedure whereby a different procedure or an 
              additional procedure may need to be performed and I authorize my physician and his assistants to do what they 
              feel is needed and necessary.
            </div>
            
            <div className="consent-paragraph">
              I understand that no guarantee or assurance has been made as to the results of the procedure and that may not 
              cure the condition.
            </div>
          </div>

          {/* Risk Statement */}
          <div className="section">
            <div className="risk-section">
              <p><span className="bold">Risks:</span> This authorization is given with understanding that any procedure involves 
              some risks and hazards. Like infection, bleeding, nerve injury, blood clots, Heart attack, allergic reactions 
              and pneumonia. They can be serious and possibly fatal. My physician has explained specific risk of this 
              procedure to me.</p>
            </div>
          </div>

          {/* HIV/Hepatitis Consent */}
          <div className="section">
            <div className="consent-paragraph">
              <p><span className="bold">HIV Test/Hepatitis B and C:</span> I hereby consent to HIV/Hepatitis B and C testing 
              of my blood if deemed necessary for the procedure subject to maintenance of confidentiality.</p>
            </div>
          </div>

          {/* Medication Consent */}
          <div className="section">
            <div className="consent-paragraph">
              <p>I give my consent to purchase & use medication required during treatment.</p>
            </div>
          </div>

          {/* Declaration */}
          <div className="section">
            <div className="consent-paragraph">
              <p className="bold">
                I certify that I have read and fully understood the above consent after adequate explanations were given to me 
                in a language that I understand and after all blanks were filled in or crossed out before I signed.
              </p>
            </div>
          </div>

          {/* Signatures Section */}
          <div className="signatures">
            <div className="section-title">Signatures</div>
            
            {/* Patient/Relative Signature */}
            <div className="signature-block">
              <div className="bold">Patient/Relative Details</div>
              <div className="signature-grid">
                <div className="signature-item">
                  <div className="info-label">Name of Patient/Relatives:</div>
                  <div className="signature-line">{formData.signatureName}</div>
                </div>
                <div className="signature-item">
                  <div className="info-label">Relationship with patient:</div>
                  <div className="signature-line">{formData.relationship}</div>
                </div>
              </div>
              <div className="signature-grid">
                <div className="signature-item">
                  <div className="info-label">Signature:</div>
                  <div className="signature-line">{formData.patientSignature}</div>
                </div>
                <div className="date-time-grid">
                  <div className="signature-item">
                    <div className="info-label">Date:</div>
                    <div className="signature-line">{formData.patientDate}</div>
                  </div>
                  <div className="signature-item">
                    <div className="info-label">Time:</div>
                    <div className="signature-line">{formData.patientTime}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Witness Signature */}
            <div className="signature-block">
              <div className="bold">Witness Details</div>
              <div className="signature-grid">
                <div className="signature-item">
                  <div className="info-label">Name of Witness:</div>
                  <div className="signature-line">{formData.witnessName}</div>
                </div>
                <div className="signature-item">
                  <div className="info-label">Signature:</div>
                  <div className="signature-line">{formData.witnessSignature}</div>
                </div>
              </div>
            </div>

            {/* Doctor's Signature */}
            <div className="signature-block">
              <div className="bold">Doctor's Details</div>
              <div className="signature-grid">
                <div className="signature-item">
                  <div className="info-label">Name of Doctor:</div>
                  <div className="signature-line">{formData.doctorSignatureName}</div>
                </div>
                <div className="signature-item">
                  <div className="info-label">Signature:</div>
                  <div className="signature-line">{formData.doctorSignature}</div>
                </div>
              </div>
              <div className="signature-grid">
                <div className="signature-item">
                  <div className="info-label">Date:</div>
                  <div className="signature-line">{formData.doctorDate}</div>
                </div>
                <div className="signature-item">
                  <div className="info-label">Time:</div>
                  <div className="signature-line">{formData.doctorTime}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
};

export default ConsentFormPrint;