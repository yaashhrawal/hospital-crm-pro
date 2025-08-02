import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface SurgicalSafetyChecklistProps {
  isOpen: boolean;
  onClose: () => void;
  patientData: {
    name: string;
    age: string;
    gender: string;
    ipdNo: string;
    roomWardNo?: string;
    patientId?: string;
    doctorName?: string;
  };
  savedData?: any; // Previously saved form data
  onSave?: (data: any) => void;
}

const SurgicalSafetyChecklist: React.FC<SurgicalSafetyChecklistProps> = ({
  isOpen,
  onClose,
  patientData,
  savedData,
  onSave
}) => {
  const [formData, setFormData] = useState({
    // Column 1: Prior to Induction of Anaesthesia
    patientName: savedData?.patientName || patientData.name || '',
    date: savedData?.date || new Date().toISOString().split('T')[0],
    ipNo: savedData?.ipNo || patientData.ipdNo || '',
    age: savedData?.age || patientData.age || '',
    sex: savedData?.sex || patientData.gender || '',
    
    // Patient Has Confirmed checkboxes
    confirmedIdentity: savedData?.confirmedIdentity || false,
    confirmedSite: savedData?.confirmedSite || false,
    confirmedProcedure: savedData?.confirmedProcedure || false,
    confirmedConsent: savedData?.confirmedConsent || false,
    
    // Site Marked checkbox
    siteMarked: savedData?.siteMarked || false,
    
    // Anaesthesia Safety Check
    anaesthesiaSafetyCheck: savedData?.anaesthesiaSafetyCheck || false,
    knownAllergy: savedData?.knownAllergy || '', // 'no' or 'yes'
    
    // Difficult Airway/Aspiration Risk
    difficultAirway: savedData?.difficultAirway || '', // 'no' or 'yes'
    
    // Risk of Blood Loss
    bloodLossRisk: savedData?.bloodLossRisk || '', // 'no' or 'yes'
    
    // Has Implant Available
    hasImplant: savedData?.hasImplant || '', // 'yes' or 'no'
    
    // Column 2: Prior to Incision
    // Circulating Nurse checkboxes
    teamConfirmation: savedData?.teamConfirmation || false,
    sterilityConfirmed: savedData?.sterilityConfirmed || false,
    
    // Surgeon Review
    criticalSteps: savedData?.criticalSteps || '',
    
    // Operative Details
    operativeDuration: savedData?.operativeDuration || '',
    anticipatedBloodLoss: savedData?.anticipatedBloodLoss || '',
    
    // Anaesthesia Team Review
    patientSpecificConcerns: savedData?.patientSpecificConcerns || '',
    
    // Verbal Confirmation checkboxes
    verbalPatient: savedData?.verbalPatient || false,
    verbalSite: savedData?.verbalSite || false,
    verbalProcedure: savedData?.verbalProcedure || false,
    
    // Antibiotic Prophylaxis
    antibioticProphylaxis: savedData?.antibioticProphylaxis || '', // 'yes' or 'not-applicable'
    
    // Essential Imaging
    essentialImaging: savedData?.essentialImaging || '', // 'yes' or 'not-applicable'
    
    // Column 3: Prior to Patient Leaving Operation Room
    // Nurse Verbal Confirmation checkboxes
    procedureRecorded: savedData?.procedureRecorded || false,
    countsCorrect: savedData?.countsCorrect || false,
    specimenLabeled: savedData?.specimenLabeled || false,
    equipmentProblems: savedData?.equipmentProblems || false,
    
    // Anaesthesia Professional checkbox
    recoveryReview: savedData?.recoveryReview || false,
    
    // Remark
    remark: savedData?.remark || '',
    
    // Signatures
    anaesthetistName: savedData?.anaesthetistName || '',
    surgeonName: savedData?.surgeonName || patientData.doctorName || '',
    nurseName: savedData?.nurseName || '',
    signatureDate: savedData?.signatureDate || new Date().toISOString().split('T')[0],
    signatureTime: savedData?.signatureTime || ''
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = () => {
    if (onSave) {
      onSave({
        ...formData,
        createdAt: new Date().toISOString(),
        patientId: patientData.patientId
      });
    }
    toast.success('Surgical Safety Checklist saved successfully');
    onClose();
  };

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=1400,height=900');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the form');
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
            size: A4 landscape;
            margin: 15mm;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              font-size: 9px;
              line-height: 1.1;
            }
            
            .print-button {
              display: none !important;
            }
            
            @page {
              margin: 15mm;
              size: A4 landscape;
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
            line-height: 1.1;
            color: #000;
            margin: 0;
            padding: 15px;
          }
          
          .container {
            width: 100%;
            max-width: 100%;
          }
          
          h1 {
            text-align: center;
            font-size: 14px;
            margin-bottom: 10px;
            text-decoration: underline;
            font-weight: bold;
          }
          
          .three-columns {
            display: flex;
            gap: 10px;
            width: 100%;
          }
          
          .column {
            flex: 1;
            border: 2px solid #000;
            padding: 8px;
            min-height: 500px;
          }
          
          .column-header {
            text-align: center;
            font-weight: bold;
            font-size: 10px;
            margin-bottom: 8px;
            padding: 4px;
            background-color: #f0f0f0;
            border: 1px solid #000;
          }
          
          .section-title {
            text-align: center;
            font-weight: bold;
            font-size: 10px;
            margin: 8px 0 6px 0;
            padding: 3px;
            background-color: #f8f8f8;
            border: 1px solid #333;
          }
          
          .field-group {
            margin-bottom: 6px;
          }
          
          .field {
            margin-bottom: 3px;
            display: flex;
            align-items: center;
          }
          
          label {
            font-weight: bold;
            margin-right: 5px;
            font-size: 8px;
          }
          
          .value {
            border-bottom: 1px solid #333;
            display: inline-block;
            min-width: 80px;
            padding: 1px 3px;
            min-height: 12px;
            font-size: 8px;
          }
          
          .checkbox-field {
            display: flex;
            align-items: center;
            margin-bottom: 4px;
            font-size: 8px;
          }
          
          .checkbox-mark {
            width: 12px;
            height: 12px;
            border: 1px solid #333;
            margin-right: 5px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 10px;
            font-weight: bold;
          }
          
          .radio-group {
            margin: 4px 0;
          }
          
          .radio-option {
            display: inline-flex;
            align-items: center;
            margin-right: 15px;
            font-size: 8px;
          }
          
          .radio-mark {
            width: 10px;
            height: 10px;
            border: 1px solid #333;
            border-radius: 50%;
            margin-right: 4px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
          }
          
          .textarea-value {
            border: 1px solid #333;
            padding: 3px;
            min-height: 30px;
            width: 100%;
            margin-top: 3px;
            font-size: 8px;
          }
          
          .signatures {
            margin-top: 15px;
          }
          
          .signature-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          }
          
          .signature-field {
            flex: 1;
            margin: 0 5px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>SURGICAL SAFETY CHECKLIST</h1>
          
          <div class="three-columns">
            <!-- Column 1: Prior to Induction of Anaesthesia -->
            <div class="column">
              <div class="column-header">PRIOR TO INDUCTION OF ANAESTHESIA</div>
              <div class="section-title">SIGN IN</div>
              
              <!-- Patient Details -->
              <div class="field-group">
                <div class="field">
                  <label>PATIENT NAME:</label>
                  <span class="value">${formData.patientName || ''}</span>
                </div>
                <div class="field">
                  <label>Date:</label>
                  <span class="value">${formData.date || ''}</span>
                </div>
                <div class="field">
                  <label>IP No.:</label>
                  <span class="value">${formData.ipNo || ''}</span>
                </div>
                <div class="field">
                  <label>Age:</label>
                  <span class="value">${formData.age || ''}</span>
                </div>
                <div class="field">
                  <label>Sex:</label>
                  <span class="value">${formData.sex || ''}</span>
                </div>
              </div>
              
              <!-- Patient Has Confirmed -->
              <div class="field-group">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 9px;">PATIENT HAS CONFIRMED</div>
                <div class="checkbox-field">
                  <span class="checkbox-mark">${formData.confirmedIdentity ? '✓' : ''}</span>
                  <span>IDENTITY</span>
                </div>
                <div class="checkbox-field">
                  <span class="checkbox-mark">${formData.confirmedSite ? '✓' : ''}</span>
                  <span>SITE</span>
                </div>
                <div class="checkbox-field">
                  <span class="checkbox-mark">${formData.confirmedProcedure ? '✓' : ''}</span>
                  <span>PROCEDURE</span>
                </div>
                <div class="checkbox-field">
                  <span class="checkbox-mark">${formData.confirmedConsent ? '✓' : ''}</span>
                  <span>CONSENT</span>
                </div>
              </div>
              
              <!-- Site Marked -->
              <div class="field-group">
                <div class="checkbox-field">
                  <span class="checkbox-mark">${formData.siteMarked ? '✓' : ''}</span>
                  <span>SITE MARKED / NOT APPLICABLE</span>
                </div>
              </div>
              
              <!-- Anaesthesia Safety Check -->
              <div class="field-group">
                <div class="checkbox-field">
                  <span class="checkbox-mark">${formData.anaesthesiaSafetyCheck ? '✓' : ''}</span>
                  <span>ANAESTHESIA SAFETY CHECK COMPLETED</span>
                </div>
                <div style="margin-left: 15px; margin-top: 4px;">
                  <div style="font-weight: bold; font-size: 8px;">DOES PATIENT HAVE A KNOWN ALLERGY?</div>
                  <div class="radio-group">
                    <div class="radio-option">
                      <span class="radio-mark">${formData.knownAllergy === 'no' ? '●' : ''}</span>
                      <span>NO</span>
                    </div>
                    <div class="radio-option">
                      <span class="radio-mark">${formData.knownAllergy === 'yes' ? '●' : ''}</span>
                      <span>YES</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Difficult Airway -->
              <div class="field-group">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 8px;">DIFFICULT AIRWAY/ ASPIRATION RISK?</div>
                <div class="radio-group">
                  <div class="radio-option">
                    <span class="radio-mark">${formData.difficultAirway === 'no' ? '●' : ''}</span>
                    <span>NO</span>
                  </div>
                  <div class="radio-option" style="display: block; margin-top: 2px;">
                    <span class="radio-mark">${formData.difficultAirway === 'yes' ? '●' : ''}</span>
                    <span>YES, And Equipment/Assistance Available</span>
                  </div>
                </div>
              </div>
              
              <!-- Blood Loss Risk -->
              <div class="field-group">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 8px;">Risk of &gt; 500ml Blood Loss (7ML/KG in Children)?</div>
                <div class="radio-group">
                  <div class="radio-option">
                    <span class="radio-mark">${formData.bloodLossRisk === 'no' ? '●' : ''}</span>
                    <span>NO</span>
                  </div>
                  <div class="radio-option" style="display: block; margin-top: 2px;">
                    <span class="radio-mark">${formData.bloodLossRisk === 'yes' ? '●' : ''}</span>
                    <span>YES, And Adequate IV Access/ Fluids/Blood Planned & Available</span>
                  </div>
                </div>
              </div>
              
              <!-- Has Implant -->
              <div class="field-group">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 8px;">Has Implant Available</div>
                <div class="radio-group">
                  <div class="radio-option">
                    <span class="radio-mark">${formData.hasImplant === 'yes' ? '●' : ''}</span>
                    <span>Yes</span>
                  </div>
                  <div class="radio-option">
                    <span class="radio-mark">${formData.hasImplant === 'no' ? '●' : ''}</span>
                    <span>No</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Column 2: Prior to Incision -->
            <div class="column">
              <div class="column-header">PRIOR TO INCISION</div>
              <div class="section-title">TIME OUT</div>
              
              <!-- Circulating Nurse Section -->
              <div class="field-group">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 9px;">TO BE FILLED BY CIRCULATING NURSE</div>
                <div class="checkbox-field">
                  <span class="checkbox-mark">${formData.teamConfirmation ? '✓' : ''}</span>
                  <span>SURGEON, ANAESTHESIA PROFESSIONAL & NURSE VERBALLY CONFIRM THEMSELVES BY NAME & ROLE</span>
                </div>
                <div class="checkbox-field">
                  <span class="checkbox-mark">${formData.sterilityConfirmed ? '✓' : ''}</span>
                  <span>HAS STERILITY (INCLUDING INDICATOR RESULT) BEEN CONFIRMED? ARE THERE EQUIPMENT ISSUES OR ANY CONCERN ? KINDLY MENTION</span>
                </div>
              </div>
              
              <!-- Surgeon Review -->
              <div class="field-group">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 9px;">SURGEON REVIEW</div>
                <div style="font-size: 8px; margin-bottom: 2px;">What are the Critical or Unexpected Steps</div>
                <div class="textarea-value">${formData.criticalSteps || ''}</div>
              </div>
              
              <!-- Operative Details -->
              <div class="field-group">
                <div class="field">
                  <label>Operative Duration:</label>
                  <span class="value">${formData.operativeDuration || ''}</span>
                </div>
                <div class="field">
                  <label>Anticipated Blood Loss:</label>
                  <span class="value">${formData.anticipatedBloodLoss || ''}</span>
                </div>
              </div>
              
              <!-- Anaesthesia Team Review -->
              <div class="field-group">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 9px;">ANAESTHESIA TEAM REVIEW</div>
                <div style="font-size: 8px; margin-bottom: 2px;">Are There any Patient Specific Concern?</div>
                <div class="textarea-value">${formData.patientSpecificConcerns || ''}</div>
              </div>
              
              <!-- Verbal Confirmation -->
              <div class="field-group">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 9px;">SURGEON, ANAESTHETIST, SCRUB NURSE VERBALLY CONFIRM</div>
                <div class="checkbox-field">
                  <span class="checkbox-mark">${formData.verbalPatient ? '✓' : ''}</span>
                  <span>PATIENT</span>
                </div>
                <div class="checkbox-field">
                  <span class="checkbox-mark">${formData.verbalSite ? '✓' : ''}</span>
                  <span>SITE</span>
                </div>
                <div class="checkbox-field">
                  <span class="checkbox-mark">${formData.verbalProcedure ? '✓' : ''}</span>
                  <span>PROCEDURE</span>
                </div>
              </div>
              
              <!-- Antibiotic Prophylaxis -->
              <div class="field-group">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 8px;">ANTIBIOTIC PROPHYLAXIS GIVEN IN LAST 60 MINUTES</div>
                <div class="radio-group">
                  <div class="radio-option">
                    <span class="radio-mark">${formData.antibioticProphylaxis === 'yes' ? '●' : ''}</span>
                    <span>YES</span>
                  </div>
                  <div class="radio-option">
                    <span class="radio-mark">${formData.antibioticProphylaxis === 'not-applicable' ? '●' : ''}</span>
                    <span>NOT APPLICABLE</span>
                  </div>
                </div>
              </div>
              
              <!-- Essential Imaging -->
              <div class="field-group">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 8px;">ESSENTIAL IMAGING DISPLAYED</div>
                <div class="radio-group">
                  <div class="radio-option">
                    <span class="radio-mark">${formData.essentialImaging === 'yes' ? '●' : ''}</span>
                    <span>YES</span>
                  </div>
                  <div class="radio-option">
                    <span class="radio-mark">${formData.essentialImaging === 'not-applicable' ? '●' : ''}</span>
                    <span>NOT APPLICABLE</span>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Column 3: Prior to Patient Leaving Operation Room -->
            <div class="column">
              <div class="column-header">PRIOR TO PATIENT LEAVING THE OPERATION ROOM</div>
              <div class="section-title">SIGN OUT</div>
              
              <!-- Nurse Verbal Confirmation -->
              <div class="field-group">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 9px;">NURSES VERBALLY CONFIRM WITH THE TEAM</div>
                <div class="checkbox-field">
                  <span class="checkbox-mark">${formData.procedureRecorded ? '✓' : ''}</span>
                  <span>THE NAME OF THE PROCEDURE RECORDED</span>
                </div>
                <div class="checkbox-field">
                  <span class="checkbox-mark">${formData.countsCorrect ? '✓' : ''}</span>
                  <span>THAT INSTRUMENT, SPONGE AND NEEDLE COUNTS ARE CORRECT (OR NOT APPLICABLE)</span>
                </div>
                <div class="checkbox-field">
                  <span class="checkbox-mark">${formData.specimenLabeled ? '✓' : ''}</span>
                  <span>SPECIMEN IS LABELED (INCLUDING PATIENT NAME)</span>
                </div>
                <div class="checkbox-field">
                  <span class="checkbox-mark">${formData.equipmentProblems ? '✓' : ''}</span>
                  <span>WHETHER THERE ARE ANY EQUIPMENT PROBLEMS TO BE ADDRESSED</span>
                </div>
              </div>
              
              <!-- Anaesthesia Professional -->
              <div class="field-group">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 9px;">TO BE FILLED ANAESTHESIA PROFESSIONAL</div>
                <div class="checkbox-field">
                  <span class="checkbox-mark">${formData.recoveryReview ? '✓' : ''}</span>
                  <span>SURGEON, ANAESTHESIA PROFESSIONAL NURSE REVIEW THE KEY CONCERN FOR RECOVERY AND MANAGEMENT OF THIS PATIENT</span>
                </div>
              </div>
              
              <!-- Remark -->
              <div class="field-group">
                <div style="font-weight: bold; margin-bottom: 4px; font-size: 9px;">REMARK</div>
                <div class="textarea-value">${formData.remark || ''}</div>
              </div>
              
              <!-- Signatures -->
              <div class="signatures">
                <div class="signature-row">
                  <div class="signature-field">
                    <label>NAME OF ANAESTHETIST:</label>
                    <div class="value">${formData.anaesthetistName || ''}</div>
                  </div>
                </div>
                <div class="signature-row">
                  <div class="signature-field">
                    <label>NAME OF SURGEON:</label>
                    <div class="value">${formData.surgeonName || ''}</div>
                  </div>
                </div>
                <div class="signature-row">
                  <div class="signature-field">
                    <label>NAME OF NURSE:</label>
                    <div class="value">${formData.nurseName || ''}</div>
                  </div>
                </div>
                <div class="signature-row">
                  <div class="signature-field">
                    <label>DATE:</label>
                    <span class="value">${formData.signatureDate || ''}</span>
                  </div>
                  <div class="signature-field">
                    <label>TIME:</label>
                    <span class="value">${formData.signatureTime || ''}</span>
                  </div>
                </div>
              </div>
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
      printBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 1000; padding: 10px 20px; background: #059669; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;';
      printBtn.onclick = () => printWindow.print();
      printWindow.document.body.appendChild(printBtn);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-[95vw] max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">SURGICAL SAFETY CHECKLIST</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Three Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Column 1: Prior to Induction of Anaesthesia */}
            <div className="border-2 border-gray-300 rounded-lg p-4">
              <div className="bg-blue-100 text-center font-bold p-2 mb-4 rounded">
                PRIOR TO INDUCTION OF ANAESTHESIA
              </div>
              <div className="bg-gray-100 text-center font-bold p-2 mb-4 rounded">
                SIGN IN
              </div>
              
              {/* Patient Details */}
              <div className="space-y-3 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-1">PATIENT NAME:</label>
                  <input
                    type="text"
                    value={formData.patientName}
                    onChange={(e) => handleInputChange('patientName', e.target.value)}
                    className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Date:</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => handleInputChange('date', e.target.value)}
                      className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">IP No.:</label>
                    <input
                      type="text"
                      value={formData.ipNo}
                      onChange={(e) => handleInputChange('ipNo', e.target.value)}
                      className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Age:</label>
                    <input
                      type="text"
                      value={formData.age}
                      onChange={(e) => handleInputChange('age', e.target.value)}
                      className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Sex:</label>
                    <input
                      type="text"
                      value={formData.sex}
                      onChange={(e) => handleInputChange('sex', e.target.value)}
                      className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
              
              {/* Patient Has Confirmed */}
              <div className="mb-4">
                <div className="font-bold text-sm mb-2">PATIENT HAS CONFIRMED</div>
                <div className="space-y-2">
                  {[
                    { key: 'confirmedIdentity', label: 'IDENTITY' },
                    { key: 'confirmedSite', label: 'SITE' },
                    { key: 'confirmedProcedure', label: 'PROCEDURE' },
                    { key: 'confirmedConsent', label: 'CONSENT' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData[item.key as keyof typeof formData] as boolean}
                        onChange={(e) => handleInputChange(item.key, e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-sm">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Site Marked */}
              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.siteMarked}
                    onChange={(e) => handleInputChange('siteMarked', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">SITE MARKED / NOT APPLICABLE</span>
                </label>
              </div>
              
              {/* Anaesthesia Safety Check */}
              <div className="mb-4">
                <label className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    checked={formData.anaesthesiaSafetyCheck}
                    onChange={(e) => handleInputChange('anaesthesiaSafetyCheck', e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm">ANAESTHESIA SAFETY CHECK COMPLETED</span>
                </label>
                <div className="ml-4">
                  <div className="font-bold text-xs mb-2">DOES PATIENT HAVE A KNOWN ALLERGY?</div>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="knownAllergy"
                        value="no"
                        checked={formData.knownAllergy === 'no'}
                        onChange={(e) => handleInputChange('knownAllergy', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-xs">NO</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="knownAllergy"
                        value="yes"
                        checked={formData.knownAllergy === 'yes'}
                        onChange={(e) => handleInputChange('knownAllergy', e.target.value)}
                        className="mr-1"
                      />
                      <span className="text-xs">YES</span>
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Difficult Airway */}
              <div className="mb-4">
                <div className="font-bold text-xs mb-2">DIFFICULT AIRWAY/ ASPIRATION RISK?</div>
                <div className="space-y-1">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="difficultAirway"
                      value="no"
                      checked={formData.difficultAirway === 'no'}
                      onChange={(e) => handleInputChange('difficultAirway', e.target.value)}
                      className="mr-1"
                    />
                    <span className="text-xs">NO</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="difficultAirway"
                      value="yes"
                      checked={formData.difficultAirway === 'yes'}
                      onChange={(e) => handleInputChange('difficultAirway', e.target.value)}
                      className="mr-1"
                    />
                    <span className="text-xs">YES, And Equipment/Assistance Available</span>
                  </label>
                </div>
              </div>
              
              {/* Blood Loss Risk */}
              <div className="mb-4">
                <div className="font-bold text-xs mb-2">Risk of &gt; 500ml Blood Loss (7ML/KG in Children)?</div>
                <div className="space-y-1">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="bloodLossRisk"
                      value="no"
                      checked={formData.bloodLossRisk === 'no'}
                      onChange={(e) => handleInputChange('bloodLossRisk', e.target.value)}
                      className="mr-1"
                    />
                    <span className="text-xs">NO</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="bloodLossRisk"
                      value="yes"
                      checked={formData.bloodLossRisk === 'yes'}
                      onChange={(e) => handleInputChange('bloodLossRisk', e.target.value)}
                      className="mr-1"
                    />
                    <span className="text-xs">YES, And Adequate IV Access/ Fluids/Blood Planned & Available</span>
                  </label>
                </div>
              </div>
              
              {/* Has Implant */}
              <div className="mb-4">
                <div className="font-bold text-xs mb-2">Has Implant Available</div>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasImplant"
                      value="yes"
                      checked={formData.hasImplant === 'yes'}
                      onChange={(e) => handleInputChange('hasImplant', e.target.value)}
                      className="mr-1"
                    />
                    <span className="text-xs">Yes</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="hasImplant"
                      value="no"
                      checked={formData.hasImplant === 'no'}
                      onChange={(e) => handleInputChange('hasImplant', e.target.value)}
                      className="mr-1"
                    />
                    <span className="text-xs">No</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Column 2: Prior to Incision */}
            <div className="border-2 border-gray-300 rounded-lg p-4">
              <div className="bg-blue-100 text-center font-bold p-2 mb-4 rounded">
                PRIOR TO INCISION
              </div>
              <div className="bg-gray-100 text-center font-bold p-2 mb-4 rounded">
                TIME OUT
              </div>
              
              {/* Circulating Nurse */}
              <div className="mb-4">
                <div className="font-bold text-sm mb-2">TO BE FILLED BY CIRCULATING NURSE</div>
                <div className="space-y-2">
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={formData.teamConfirmation}
                      onChange={(e) => handleInputChange('teamConfirmation', e.target.checked)}
                      className="mr-2 mt-1"
                    />
                    <span className="text-xs">SURGEON, ANAESTHESIA PROFESSIONAL & NURSE VERBALLY CONFIRM THEMSELVES BY NAME & ROLE</span>
                  </label>
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      checked={formData.sterilityConfirmed}
                      onChange={(e) => handleInputChange('sterilityConfirmed', e.target.checked)}
                      className="mr-2 mt-1"
                    />
                    <span className="text-xs">HAS STERILITY (INCLUDING INDICATOR RESULT) BEEN CONFIRMED? ARE THERE EQUIPMENT ISSUES OR ANY CONCERN ? KINDLY MENTION</span>
                  </label>
                </div>
              </div>
              
              {/* Surgeon Review */}
              <div className="mb-4">
                <div className="font-bold text-sm mb-2">SURGEON REVIEW</div>
                <div className="text-xs mb-1">What are the Critical or Unexpected Steps</div>
                <textarea
                  value={formData.criticalSteps}
                  onChange={(e) => handleInputChange('criticalSteps', e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-xs"
                  rows={3}
                />
              </div>
              
              {/* Operative Details */}
              <div className="mb-4 space-y-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Operative Duration:</label>
                  <input
                    type="text"
                    value={formData.operativeDuration}
                    onChange={(e) => handleInputChange('operativeDuration', e.target.value)}
                    className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Anticipated Blood Loss:</label>
                  <input
                    type="text"
                    value={formData.anticipatedBloodLoss}
                    onChange={(e) => handleInputChange('anticipatedBloodLoss', e.target.value)}
                    className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-xs"
                  />
                </div>
              </div>
              
              {/* Anaesthesia Team Review */}
              <div className="mb-4">
                <div className="font-bold text-sm mb-2">ANAESTHESIA TEAM REVIEW</div>
                <div className="text-xs mb-1">Are There any Patient Specific Concern?</div>
                <textarea
                  value={formData.patientSpecificConcerns}
                  onChange={(e) => handleInputChange('patientSpecificConcerns', e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-xs"
                  rows={3}
                />
              </div>
              
              {/* Verbal Confirmation */}
              <div className="mb-4">
                <div className="font-bold text-sm mb-2">SURGEON, ANAESTHETIST, SCRUB NURSE VERBALLY CONFIRM</div>
                <div className="space-y-2">
                  {[
                    { key: 'verbalPatient', label: 'PATIENT' },
                    { key: 'verbalSite', label: 'SITE' },
                    { key: 'verbalProcedure', label: 'PROCEDURE' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData[item.key as keyof typeof formData] as boolean}
                        onChange={(e) => handleInputChange(item.key, e.target.checked)}
                        className="mr-2"
                      />
                      <span className="text-xs">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Antibiotic Prophylaxis */}
              <div className="mb-4">
                <div className="font-bold text-xs mb-2">ANTIBIOTIC PROPHYLAXIS GIVEN IN LAST 60 MINUTES</div>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="antibioticProphylaxis"
                      value="yes"
                      checked={formData.antibioticProphylaxis === 'yes'}
                      onChange={(e) => handleInputChange('antibioticProphylaxis', e.target.value)}
                      className="mr-1"
                    />
                    <span className="text-xs">YES</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="antibioticProphylaxis"
                      value="not-applicable"
                      checked={formData.antibioticProphylaxis === 'not-applicable'}
                      onChange={(e) => handleInputChange('antibioticProphylaxis', e.target.value)}
                      className="mr-1"
                    />
                    <span className="text-xs">NOT APPLICABLE</span>
                  </label>
                </div>
              </div>
              
              {/* Essential Imaging */}
              <div className="mb-4">
                <div className="font-bold text-xs mb-2">ESSENTIAL IMAGING DISPLAYED</div>
                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="essentialImaging"
                      value="yes"
                      checked={formData.essentialImaging === 'yes'}
                      onChange={(e) => handleInputChange('essentialImaging', e.target.value)}
                      className="mr-1"
                    />
                    <span className="text-xs">YES</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="essentialImaging"
                      value="not-applicable"
                      checked={formData.essentialImaging === 'not-applicable'}
                      onChange={(e) => handleInputChange('essentialImaging', e.target.value)}
                      className="mr-1"
                    />
                    <span className="text-xs">NOT APPLICABLE</span>
                  </label>
                </div>
              </div>
            </div>
            
            {/* Column 3: Prior to Patient Leaving Operation Room */}
            <div className="border-2 border-gray-300 rounded-lg p-4">
              <div className="bg-blue-100 text-center font-bold p-2 mb-4 rounded">
                PRIOR TO PATIENT LEAVING THE OPERATION ROOM
              </div>
              <div className="bg-gray-100 text-center font-bold p-2 mb-4 rounded">
                SIGN OUT
              </div>
              
              {/* Nurse Verbal Confirmation */}
              <div className="mb-4">
                <div className="font-bold text-sm mb-2">NURSES VERBALLY CONFIRM WITH THE TEAM</div>
                <div className="space-y-2">
                  {[
                    { key: 'procedureRecorded', label: 'THE NAME OF THE PROCEDURE RECORDED' },
                    { key: 'countsCorrect', label: 'THAT INSTRUMENT, SPONGE AND NEEDLE COUNTS ARE CORRECT (OR NOT APPLICABLE)' },
                    { key: 'specimenLabeled', label: 'SPECIMEN IS LABELED (INCLUDING PATIENT NAME)' },
                    { key: 'equipmentProblems', label: 'WHETHER THERE ARE ANY EQUIPMENT PROBLEMS TO BE ADDRESSED' }
                  ].map((item) => (
                    <label key={item.key} className="flex items-start">
                      <input
                        type="checkbox"
                        checked={formData[item.key as keyof typeof formData] as boolean}
                        onChange={(e) => handleInputChange(item.key, e.target.checked)}
                        className="mr-2 mt-1"
                      />
                      <span className="text-xs">{item.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* Anaesthesia Professional */}
              <div className="mb-4">
                <div className="font-bold text-sm mb-2">TO BE FILLED ANAESTHESIA PROFESSIONAL</div>
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    checked={formData.recoveryReview}
                    onChange={(e) => handleInputChange('recoveryReview', e.target.checked)}
                    className="mr-2 mt-1"
                  />
                  <span className="text-xs">SURGEON, ANAESTHESIA PROFESSIONAL NURSE REVIEW THE KEY CONCERN FOR RECOVERY AND MANAGEMENT OF THIS PATIENT</span>
                </label>
              </div>
              
              {/* Remark */}
              <div className="mb-4">
                <div className="font-bold text-sm mb-2">REMARK</div>
                <textarea
                  value={formData.remark}
                  onChange={(e) => handleInputChange('remark', e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-xs"
                  rows={3}
                />
              </div>
              
              {/* Signatures */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium mb-1">NAME OF ANAESTHETIST:</label>
                  <input
                    type="text"
                    value={formData.anaesthetistName}
                    onChange={(e) => handleInputChange('anaesthetistName', e.target.value)}
                    className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">NAME OF SURGEON:</label>
                  <input
                    type="text"
                    value={formData.surgeonName}
                    onChange={(e) => handleInputChange('surgeonName', e.target.value)}
                    className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">NAME OF NURSE:</label>
                  <input
                    type="text"
                    value={formData.nurseName}
                    onChange={(e) => handleInputChange('nurseName', e.target.value)}
                    className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium mb-1">DATE:</label>
                    <input
                      type="date"
                      value={formData.signatureDate}
                      onChange={(e) => handleInputChange('signatureDate', e.target.value)}
                      className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium mb-1">TIME:</label>
                    <input
                      type="time"
                      value={formData.signatureTime}
                      onChange={(e) => handleInputChange('signatureTime', e.target.value)}
                      className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500 text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-gray-100 px-6 py-4 flex justify-end space-x-3">
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
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Save Surgical Safety Checklist
          </button>
        </div>
      </div>
    </div>
  );
};

export default SurgicalSafetyChecklist;