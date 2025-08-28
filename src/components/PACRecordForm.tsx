import React, { useState } from 'react';
import { X } from 'lucide-react';

interface PACRecordFormProps {
  isOpen: boolean;
  onClose: () => void;
  patient: {
    first_name: string;
    last_name?: string;
    age: string | number;
    gender: string;
    patient_id: string;
  };
  bedNumber: string;
  ipdNumber?: string;
  onSubmit?: (data: any) => void;
  savedData?: any; // Previously saved form data
}

const PACRecordForm: React.FC<PACRecordFormProps> = ({
  isOpen,
  onClose,
  patient,
  bedNumber,
  ipdNumber,
  onSubmit,
  savedData
}) => {
  const [formData, setFormData] = useState({
    // Patient Header Section
    name: `${patient.first_name} ${patient.last_name || ''}`.trim() || '',
    ageSex: `${patient.age || ''} / ${patient.gender || ''}`,
    ipdNo: ipdNumber || patient.patient_id || '',
    roomWardNo: bedNumber || '',
    operation: savedData?.operation || '',
    alertAllergiesMedications: savedData?.alertAllergiesMedications || '',
    anaestheticPlan: savedData?.anaestheticPlan || '',
    drugToBeUsed: savedData?.drugToBeUsed || '',
    
    // Patient Vitals and History
    anaesthesiaType: savedData?.anaesthesiaType || '',
    asaGrade: savedData?.asaGrade || '',
    consent: savedData?.consent || '',
    bloodGroup: savedData?.bloodGroup || '',
    height: savedData?.height || '',
    weight: savedData?.weight || '',
    temp: savedData?.temp || '',
    hrRhythm: savedData?.hrRhythm || '',
    bp: savedData?.bp || '',
    rr: savedData?.rr || '',
    presentIllness: savedData?.presentIllness || '',
    pastIllness: savedData?.pastIllness || '',
    previousSurgery: savedData?.previousSurgery || '',
    personalHistory: savedData?.personalHistory || '',
    
    // General Examination
    generalCondition: savedData?.generalCondition || '',
    pallor: savedData?.pallor || '',
    cyanosis: savedData?.cyanosis || '',
    icterus: savedData?.icterus || '',
    exerciseTolerance: savedData?.exerciseTolerance || '',
    edema: savedData?.edema || '',
    oralHygiene: savedData?.oralHygiene || '',
    dentures: savedData?.dentures || '',
    airway: savedData?.airway || '',
    mouthOpening: savedData?.mouthOpening || '',
    neckMovement: savedData?.neckMovement || '',
    mallampatiGrade: savedData?.mallampatiGrade || '',
    mentothyroidDistance: savedData?.mentothyroidDistance || '',
    dentition: savedData?.dentition || '',
    bht: savedData?.bht || '',
    spinal: savedData?.spinal || '',
    
    // Systemic Examination
    cns: savedData?.cns || '',
    gcs: savedData?.gcs || '',
    cvs: savedData?.cvs || '',
    pulse: savedData?.pulse || '',
    echo: savedData?.echo || '',
    resp: savedData?.resp || '',
    rrSystemic: savedData?.rrSystemic || '',
    pupillarySize: savedData?.pupillarySize || '',
    bpSystemic: savedData?.bpSystemic || '',
    ecg: savedData?.ecg || '',
    cxr: savedData?.cxr || '',
    
    // Investigations
    hbPcv: savedData?.hbPcv || '',
    tlc: savedData?.tlc || '',
    platelets: savedData?.platelets || '',
    crp: savedData?.crp || '',
    tsh: savedData?.tsh || '',
    bloodSugar: savedData?.bloodSugar || '',
    sgotSgpt: savedData?.sgotSgpt || '',
    bloodUrea: savedData?.bloodUrea || '',
    uricAcid: savedData?.uricAcid || '',
    sodium: savedData?.sodium || '',
    potassium: savedData?.potassium || '',
    hbsAgHivHcv: savedData?.hbsAgHivHcv || '',
    aptt: savedData?.aptt || '',
    ptInr: savedData?.ptInr || '',
    sCreatinine: savedData?.sCreatinine || '',
    otherInvestigations: savedData?.otherInvestigations || '',
    
    // Preanaesthetic Instructions
    preanaestheticInstructions: savedData?.preanaestheticInstructions || '',
    
    // PAC Revaluation
    revaluationDate: savedData?.revaluationDate || '',
    revaluationTime: savedData?.revaluationTime || '',
    anaesthetistName1: savedData?.anaesthetistName1 || '',
    revaluationTemp: savedData?.revaluationTemp || '',
    revaluationRr: savedData?.revaluationRr || '',
    revaluationPulse: savedData?.revaluationPulse || '',
    revaluationBp: savedData?.revaluationBp || '',
    revaluationSpo2: savedData?.revaluationSpo2 || '',
    revaluationRemarks: savedData?.revaluationRemarks || '',
    finalDate: savedData?.finalDate || '',
    finalTime: savedData?.finalTime || '',
    anaesthetistName2: savedData?.anaesthetistName2 || ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit({
        ...formData,
        createdAt: new Date().toISOString(),
        patientId: patient.patient_id
      });
    }
    onClose();
  };

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      alert('Please allow pop-ups to print the form');
      return;
    }

    // Build the print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title></title>
        <style>
          @page {
            size: A4;
            margin: 5mm;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              font-size: 10px;
              line-height: 1.3;
            }
            
            .print-button {
              display: none !important;
            }
            
            @page {
              margin: 5mm;
              size: A4;
              @top-left { content: ""; }
              @top-center { content: ""; }
              @top-right { content: ""; }
              @bottom-left { content: ""; }
              @bottom-center { content: ""; }
              @bottom-right { content: ""; }
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 9px;
            line-height: 1.2;
            color: #000;
            margin: 0;
            padding: 8px;
          }
          
          .container {
            width: 100%;
            max-width: 100%;
          }
          
          h1 {
            text-align: center;
            font-size: 13px;
            margin-bottom: 6px;
            text-decoration: underline;
            font-weight: bold;
          }
          
          .section {
            margin-bottom: 3px;
            border: 1px solid #000;
            padding: 4px;
            box-sizing: border-box;
          }
          
          .section-title {
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 3px;
            text-decoration: underline;
          }
          
          .field-group {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 3px;
          }
          
          .field {
            flex: 1;
            min-width: 120px;
          }
          
          .field-small {
            flex: 0.5;
            min-width: 80px;
          }
          
          label {
            font-weight: bold;
            margin-right: 4px;
          }
          
          .value {
            border-bottom: 1px solid #333;
            display: inline-block;
            min-width: 60px;
            padding: 2px 4px;
            min-height: 12px;
          }
          
          .checkbox-value {
            display: inline-block;
            width: 10px;
            height: 10px;
            border: 1px solid #333;
            margin-right: 4px;
            text-align: center;
            line-height: 8px;
          }
          
          .textarea-value {
            border: 1px solid #333;
            padding: 3px;
            min-height: 20px;
            width: calc(100% - 2px);
            margin-top: 2px;
            box-sizing: border-box;
            word-wrap: break-word;
          }
          
          .two-column {
            display: flex;
            gap: 8px;
          }
          
          .column {
            flex: 1;
            box-sizing: border-box;
            min-width: 0;
          }
          
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 8px;
          }
          
          .signature-section {
            flex: 1;
            margin: 0 8px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>PRE ANAESTHESIA CHECK UP (PAC) Record</h1>
          
          <!-- Patient Header -->
          <div class="section">
            <div class="field-group">
              <div class="field">
                <label>Name:</label>
                <span class="value">${formData.name || ''}</span>
              </div>
              <div class="field-small">
                <label>Age/Sex:</label>
                <span class="value">${formData.ageSex || ''}</span>
              </div>
              <div class="field-small">
                <label>IPD No.:</label>
                <span class="value">${formData.ipdNo || ''}</span>
              </div>
            </div>
            <div class="field-group">
              <div class="field">
                <label>Room/Ward No.:</label>
                <span class="value">${formData.roomWardNo || ''}</span>
              </div>
              <div class="field">
                <label>Operation:</label>
                <span class="value">${formData.operation || ''}</span>
              </div>
            </div>
            <div class="field-group">
              <div class="field">
                <label>Alert/Allergies/Medications:</label>
                <span class="value">${formData.alertAllergiesMedications || ''}</span>
              </div>
            </div>
            <div class="field-group">
              <div class="field">
                <label>Anaesthetic Plan:</label>
                <span class="value">${formData.anaestheticPlan || ''}</span>
              </div>
              <div class="field">
                <label>Drug to be used:</label>
                <span class="value">${formData.drugToBeUsed || ''}</span>
              </div>
            </div>
          </div>
          
          <!-- Patient Details -->
          <div class="two-column">
            <div class="column">
              <div class="section">
                <div class="section-title">Patient Details</div>
                <div class="field-group">
                  <div class="field-small">
                    <label>Type of Anaesthesia:</label>
                    <span class="value">${formData.anaesthesiaType || ''}</span>
                  </div>
                  <div class="field-small">
                    <label>ASA Grade:</label>
                    <span class="value">${formData.asaGrade || ''}</span>
                  </div>
                </div>
                <div class="field-group">
                  <div class="field-small">
                    <label>Consent:</label>
                    <span class="value">${formData.consent || ''}</span>
                  </div>
                  <div class="field-small">
                    <label>Blood Group:</label>
                    <span class="value">${formData.bloodGroup || ''}</span>
                  </div>
                </div>
                <div class="field-group">
                  <div class="field-small">
                    <label>Height:</label>
                    <span class="value">${formData.height || ''}</span>
                  </div>
                  <div class="field-small">
                    <label>Weight:</label>
                    <span class="value">${formData.weight || ''}</span>
                  </div>
                </div>
                <div class="field-group">
                  <div class="field-small">
                    <label>Temp:</label>
                    <span class="value">${formData.temp || ''}</span>
                  </div>
                  <div class="field-small">
                    <label>HR & Rhythm:</label>
                    <span class="value">${formData.hrRhythm || ''}</span>
                  </div>
                </div>
                <div class="field-group">
                  <div class="field-small">
                    <label>BP:</label>
                    <span class="value">${formData.bp || ''}</span>
                  </div>
                  <div class="field-small">
                    <label>RR:</label>
                    <span class="value">${formData.rr || ''}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div class="column">
              <div class="section">
                <div class="section-title">Medical History</div>
                <div style="margin-bottom: 4px;">
                  <label>Present Illness:</label>
                  <div class="textarea-value">${formData.presentIllness || ''}</div>
                </div>
                <div style="margin-bottom: 4px;">
                  <label>Past Illness:</label>
                  <div class="textarea-value">${formData.pastIllness || ''}</div>
                </div>
                <div style="margin-bottom: 4px;">
                  <label>Previous Surgery:</label>
                  <div class="textarea-value">${formData.previousSurgery || ''}</div>
                </div>
                <div style="margin-bottom: 4px;">
                  <label>Personal History:</label>
                  <div class="textarea-value">${formData.personalHistory || ''}</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- General Examination -->
          <div class="section">
            <div class="section-title">General Examination</div>
            <div class="field-group">
              <div class="field">
                <label>General Condition:</label>
                <span class="value">${formData.generalCondition || ''}</span>
              </div>
              <div class="field">
                <label>Pallor:</label>
                <span class="value">${formData.pallor || ''}</span>
              </div>
              <div class="field">
                <label>Cyanosis:</label>
                <span class="value">${formData.cyanosis || ''}</span>
              </div>
            </div>
            <div class="field-group">
              <div class="field">
                <label>Icterus:</label>
                <span class="value">${formData.icterus || ''}</span>
              </div>
              <div class="field">
                <label>Exercise Tolerance:</label>
                <span class="value">${formData.exerciseTolerance || ''}</span>
              </div>
              <div class="field">
                <label>Edema:</label>
                <span class="value">${formData.edema || ''}</span>
              </div>
            </div>
            <div class="field-group">
              <div class="field">
                <label>Oral Hygiene:</label>
                <span class="value">${formData.oralHygiene || ''}</span>
              </div>
              <div class="field">
                <label>Dentures:</label>
                <span class="value">${formData.dentures || ''}</span>
              </div>
              <div class="field">
                <label>Airway:</label>
                <span class="value">${formData.airway || ''}</span>
              </div>
            </div>
            <div class="field-group">
              <div class="field">
                <label>Mouth Opening:</label>
                <span class="value">${formData.mouthOpening || ''}</span>
              </div>
              <div class="field">
                <label>Neck Movement:</label>
                <span class="value">${formData.neckMovement || ''}</span>
              </div>
              <div class="field">
                <label>Mallampati Grade:</label>
                <span class="value">${formData.mallampatiGrade || ''}</span>
              </div>
            </div>
            <div class="field-group">
              <div class="field">
                <label>Mentothyroid Distance:</label>
                <span class="value">${formData.mentothyroidDistance || ''}</span>
              </div>
              <div class="field">
                <label>Dentition:</label>
                <span class="value">${formData.dentition || ''}</span>
              </div>
              <div class="field">
                <label>BHT (Breath Holding Rate):</label>
                <span class="value">${formData.bht || ''}</span>
              </div>
            </div>
            <div style="margin-bottom: 4px;">
              <label>Spinal:</label>
              <div class="textarea-value">${formData.spinal || ''}</div>
            </div>
          </div>
          
          <!-- Systemic Examination -->
          <div class="section">
            <div class="section-title">Systemic Examination</div>
            <div class="field-group">
              <div class="field">
                <label>CNS:</label>
                <span class="value">${formData.cns || ''}</span>
              </div>
              <div class="field">
                <label>GCS:</label>
                <span class="value">${formData.gcs || ''}</span>
              </div>
              <div class="field">
                <label>CVS:</label>
                <span class="value">${formData.cvs || ''}</span>
              </div>
              <div class="field">
                <label>Pulse:</label>
                <span class="value">${formData.pulse || ''}</span>
              </div>
            </div>
            <div class="field-group">
              <div class="field">
                <label>ECHO:</label>
                <span class="value">${formData.echo || ''}</span>
              </div>
              <div class="field">
                <label>Resp:</label>
                <span class="value">${formData.resp || ''}</span>
              </div>
              <div class="field">
                <label>RR:</label>
                <span class="value">${formData.rrSystemic || ''}</span>
              </div>
              <div class="field">
                <label>Pupillary Size:</label>
                <span class="value">${formData.pupillarySize || ''}</span>
              </div>
            </div>
            <div class="field-group">
              <div class="field">
                <label>BP:</label>
                <span class="value">${formData.bpSystemic || ''}</span>
              </div>
              <div class="field">
                <label>ECG:</label>
                <span class="value">${formData.ecg || ''}</span>
              </div>
              <div class="field">
                <label>CXR:</label>
                <span class="value">${formData.cxr || ''}</span>
              </div>
            </div>
          </div>
          
          
          <!-- Investigations -->
          <div class="section">
            <div class="section-title">Investigations</div>
            <div class="field-group">
              <div class="field">
                <label>Hb / PCV:</label>
                <span class="value">${formData.hbPcv || ''}</span>
              </div>
              <div class="field">
                <label>TLC:</label>
                <span class="value">${formData.tlc || ''}</span>
              </div>
              <div class="field">
                <label>Platelets:</label>
                <span class="value">${formData.platelets || ''}</span>
              </div>
              <div class="field">
                <label>CRP:</label>
                <span class="value">${formData.crp || ''}</span>
              </div>
            </div>
            <div class="field-group">
              <div class="field">
                <label>TSH:</label>
                <span class="value">${formData.tsh || ''}</span>
              </div>
              <div class="field">
                <label>B. Sugar:</label>
                <span class="value">${formData.bloodSugar || ''}</span>
              </div>
              <div class="field">
                <label>SGOT / SGPT:</label>
                <span class="value">${formData.sgotSgpt || ''}</span>
              </div>
              <div class="field">
                <label>Blood Urea:</label>
                <span class="value">${formData.bloodUrea || ''}</span>
              </div>
            </div>
            <div class="field-group">
              <div class="field">
                <label>Uric Acid:</label>
                <span class="value">${formData.uricAcid || ''}</span>
              </div>
              <div class="field">
                <label>Na:</label>
                <span class="value">${formData.sodium || ''}</span>
              </div>
              <div class="field">
                <label>K:</label>
                <span class="value">${formData.potassium || ''}</span>
              </div>
              <div class="field">
                <label>HBsAg / HIV / HCV:</label>
                <span class="value">${formData.hbsAgHivHcv || ''}</span>
              </div>
            </div>
            <div class="field-group">
              <div class="field">
                <label>APTT:</label>
                <span class="value">${formData.aptt || ''}</span>
              </div>
              <div class="field">
                <label>PT-INR:</label>
                <span class="value">${formData.ptInr || ''}</span>
              </div>
              <div class="field">
                <label>S. Creatinine:</label>
                <span class="value">${formData.sCreatinine || ''}</span>
              </div>
              <div class="field">
                <label>ECG:</label>
                <span class="value">${formData.ecg || ''}</span>
              </div>
            </div>
            <div style="margin-bottom: 4px;">
              <label>Others:</label>
              <div class="textarea-value">${formData.otherInvestigations || ''}</div>
            </div>
          </div>
          
          <!-- Preanaesthetic Instructions -->
          <div class="section">
            <div class="section-title">Preanaesthetic Instructions</div>
            <div style="margin-bottom: 4px;">
              <label>Preanaesthetic instructions / Medications:</label>
              <div class="textarea-value">${formData.preanaestheticInstructions || ''}</div>
            </div>
          </div>
          
          <!-- PAC Revaluation -->
          <div class="section">
            <div class="section-title">PAC Revaluation</div>
            <div class="field-group">
              <div class="field-small">
                <label>Date:</label>
                <span class="value">${formData.revaluationDate || ''}</span>
              </div>
              <div class="field-small">
                <label>Time:</label>
                <span class="value">${formData.revaluationTime || ''}</span>
              </div>
              <div class="field">
                <label>Name and Signature of Anaesthetist:</label>
                <span class="value">${formData.anaesthetistName1 || ''}</span>
              </div>
            </div>
            <div class="field-group">
              <div class="field-small">
                <label>Temp:</label>
                <span class="value">${formData.revaluationTemp || ''}</span>
              </div>
              <div class="field-small">
                <label>RR:</label>
                <span class="value">${formData.revaluationRr || ''}</span>
              </div>
              <div class="field-small">
                <label>Pulse:</label>
                <span class="value">${formData.revaluationPulse || ''}</span>
              </div>
              <div class="field-small">
                <label>BP:</label>
                <span class="value">${formData.revaluationBp || ''}</span>
              </div>
              <div class="field-small">
                <label>SPO2:</label>
                <span class="value">${formData.revaluationSpo2 || ''}</span>
              </div>
            </div>
            <div style="margin-bottom: 4px;">
              <label>Remarks:</label>
              <div class="textarea-value">${formData.revaluationRemarks || ''}</div>
            </div>
            <div class="field-group">
              <div class="field-small">
                <label>Date:</label>
                <span class="value">${formData.finalDate || ''}</span>
              </div>
              <div class="field-small">
                <label>Time:</label>
                <span class="value">${formData.finalTime || ''}</span>
              </div>
              <div class="field">
                <label>Name and Signature of Anaesthetist:</label>
                <span class="value">${formData.anaesthetistName2 || ''}</span>
              </div>
            </div>
          </div>
          
          <!-- Signatures -->
          <div class="signatures">
            <div class="signature-section">
              <div style="margin-bottom: 20px; border-bottom: 1px solid #333;"></div>
              <div><strong>Primary Anaesthetist's Name & Signature</strong></div>
              <div>${formData.anaesthetistName1 || ''}</div>
              <div>Date: ${formData.revaluationDate || ''} Time: ${formData.revaluationTime || ''}</div>
            </div>
            <div class="signature-section">
              <div style="margin-bottom: 20px; border-bottom: 1px solid #333;"></div>
              <div><strong>Final Anaesthetist's Name & Signature</strong></div>
              <div>${formData.anaesthetistName2 || ''}</div>
              <div>Date: ${formData.finalDate || ''} Time: ${formData.finalTime || ''}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Write content to the new window
    printWindow.document.write(printContent);
    printWindow.document.close();

    // Focus the new window and let user control printing
    setTimeout(() => {
      printWindow.focus();
      
      // Add script to handle print settings
      const script = printWindow.document.createElement('script');
      script.innerHTML = `
        // Remove title from the document to avoid showing in print header
        document.title = '';
        
        // Override print to ensure clean printing
        window.originalPrint = window.print;
        window.print = function() {
          // Hide the print button during printing
          const btn = document.querySelector('.print-button');
          if (btn) btn.style.display = 'none';
          
          // Call original print
          window.originalPrint();
          
          // Show button again after print dialog
          setTimeout(() => {
            if (btn) btn.style.display = 'block';
          }, 1000);
        };
      `;
      printWindow.document.head.appendChild(script);
      
      // Add a print button to the new window for user control
      const printBtn = printWindow.document.createElement('button');
      printBtn.innerHTML = 'Print Document';
      printBtn.className = 'print-button';
      printBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 1000; padding: 10px 20px; background: #2563eb; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;';
      printBtn.onclick = () => printWindow.print();
      printWindow.document.body.appendChild(printBtn);
    }, 500);
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 box-border">
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 box-border">
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
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 box-border">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 box-border">
              <div>
                <label className="block text-sm font-medium mb-1">H/O PRESENT ILLNESS:</label>
                <textarea
                  value={formData.presentIllness}
                  onChange={(e) => handleInputChange('presentIllness', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">H/O PAST ILLNESS:</label>
                <textarea
                  value={formData.pastIllness}
                  onChange={(e) => handleInputChange('pastIllness', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">PREVIOUS SURGERY:</label>
                <textarea
                  value={formData.previousSurgery}
                  onChange={(e) => handleInputChange('previousSurgery', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
                  rows={3}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">PERSONAL HISTORY:</label>
                <textarea
                  value={formData.personalHistory}
                  onChange={(e) => handleInputChange('personalHistory', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* General Examination */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4 print:border-black">
            <h3 className="font-bold text-lg mb-3 text-blue-700 print:text-black">General Examination</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 box-border">
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
                className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
                rows={2}
              />
            </div>
          </div>

          {/* Systemic Examination */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4 print:border-black">
            <h3 className="font-bold text-lg mb-3 text-blue-700 print:text-black">Systemic Examination</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 box-border">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 box-border">
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
                className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
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
                className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
                rows={4}
              />
            </div>
          </div>

          {/* PAC Revaluation Section */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4 print:border-black">
            <h3 className="font-bold text-lg mb-3 text-blue-700 print:text-black">PAC Revaluation</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4 box-border">
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
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 box-border">
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
                className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 box-border"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 box-border">
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