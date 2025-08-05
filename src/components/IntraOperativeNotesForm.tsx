import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface IntraOperativeNotesFormProps {
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
  onSave?: (data: any) => void;
  savedData?: any; // Previously saved form data
}

const IntraOperativeNotesForm: React.FC<IntraOperativeNotesFormProps> = ({
  isOpen,
  onClose,
  patientData,
  onSave,
  savedData
}) => {
  const [formData, setFormData] = useState({
    // Patient Header Section
    patientId: savedData?.patientId || patientData.patientId || '',
    ipNo: savedData?.ipNo || patientData.ipdNo || '',
    patientName: savedData?.patientName || patientData.name || '',
    ageSex: savedData?.ageSex || `${patientData.age || ''} / ${patientData.gender || ''}`,
    date: savedData?.date || new Date().toISOString().split('T')[0],
    
    // Patient and Surgical Details
    prePostOperativeDiagnosis: savedData?.prePostOperativeDiagnosis || '',
    nameOfSurgeon: savedData?.nameOfSurgeon || patientData.doctorName || '',
    nameOfSurgery: savedData?.nameOfSurgery || '',
    dateOfSurgery: savedData?.dateOfSurgery || new Date().toISOString().split('T')[0],
    typeOfAnaesthesia: savedData?.typeOfAnaesthesia || '',
    anaesthetist: savedData?.anaesthetist || '',
    scrubNurse: savedData?.scrubNurse || '',
    floorNurse: savedData?.floorNurse || '',
    
    // Tourniquet Times
    tourniquetInflationTime: savedData?.tourniquetInflationTime || '',
    tourniquetDeflationTime: savedData?.tourniquetDeflationTime || '',
    
    // Time and Blood Info
    otStartingTime: savedData?.otStartingTime || '',
    otCompletingTime: savedData?.otCompletingTime || '',
    bloodGroup: savedData?.bloodGroup || '',
    totalDuration: savedData?.totalDuration || '',
    bloodTransfusion: savedData?.bloodTransfusion || '',
    estimatedBloodLoss: savedData?.estimatedBloodLoss || '',
    
    // Operative Steps
    operativeSteps: savedData?.operativeSteps || '',
    
    // Implant Details
    implantDetails: savedData?.implantDetails || '',
    
    // Signature and Date
    consultantSurgeonName: savedData?.consultantSurgeonName || patientData.doctorName || '',
    signatureDate: savedData?.signatureDate || new Date().toISOString().split('T')[0],
    signatureTime: savedData?.signatureTime || ''
  });

  const handleInputChange = (field: string, value: string) => {
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
        patientId: patientData.ipdNo
      });
    }
    toast.success('Intra Operative Notes saved successfully');
    onClose();
  };

  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!printWindow) {
      toast.error('Please allow pop-ups to print the form');
      return;
    }

    // Build the print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>OT NOTES - Intra Operative Note</title>
        <style>
          @page {
            size: A4;
            margin: 15mm;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              font-size: 11px;
              line-height: 1.3;
            }
            
            .print-button {
              display: none !important;
            }
            
            @page {
              margin: 15mm;
              size: A4;
            }
            
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }
          
          body {
            font-family: Arial, sans-serif;
            font-size: 11px;
            line-height: 1.4;
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
            font-size: 18px;
            margin-bottom: 5px;
            font-weight: bold;
            text-decoration: underline;
          }
          
          .subtitle {
            text-align: center;
            font-size: 14px;
            margin-bottom: 20px;
            font-weight: bold;
          }
          
          .section {
            margin-bottom: 8px;
            border: 1px solid #000;
            padding: 8px;
          }
          
          .section-title {
            font-weight: bold;
            font-size: 12px;
            margin-bottom: 8px;
            text-decoration: underline;
          }
          
          .field-group {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            margin-bottom: 6px;
          }
          
          .field {
            flex: 1;
            min-width: 200px;
          }
          
          .field-small {
            flex: 0.5;
            min-width: 150px;
          }
          
          .field-half {
            flex: 0.5;
            min-width: 200px;
          }
          
          label {
            font-weight: bold;
            margin-right: 5px;
          }
          
          .value {
            border-bottom: 1px solid #333;
            display: inline-block;
            min-width: 100px;
            padding: 2px 5px;
            min-height: 16px;
          }
          
          .textarea-value {
            border: 1px solid #333;
            padding: 6px;
            min-height: 100px;
            width: calc(100% - 2px);
            margin: 3px 0 0 0;
            white-space: pre-wrap;
            word-wrap: break-word;
            box-sizing: border-box;
          }
          
          .signature-section {
            margin-top: 25px;
            text-align: center;
          }
          
          .signature-line {
            border-bottom: 1px solid #333;
            width: 300px;
            height: 40px;
            margin: 20px auto 10px;
          }
          
          .signature-fields {
            display: flex;
            justify-content: center;
            gap: 30px;
            margin-top: 10px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>OT NOTES</h1>
          <div class="subtitle">INTRA OPERATIVE NOTE</div>
          
          <!-- Patient Header -->
          <div class="section">
            <div class="field-group">
              <div class="field-small">
                <label>Patient ID No.:</label>
                <span class="value">${formData.patientId || ''}</span>
              </div>
              <div class="field-small">
                <label>I.P. No.:</label>
                <span class="value">${formData.ipNo || ''}</span>
              </div>
            </div>
            <div class="field-group">
              <div class="field">
                <label>Patient's Name:</label>
                <span class="value">${formData.patientName || ''}</span>
              </div>
              <div class="field-small">
                <label>Age/Sex:</label>
                <span class="value">${formData.ageSex || ''}</span>
              </div>
              <div class="field-small">
                <label>Date:</label>
                <span class="value">${formData.date || ''}</span>
              </div>
            </div>
          </div>
          
          <!-- Patient and Surgical Details -->
          <div class="section">
            
            <div class="field-group">
              <div class="field">
                <label>Pre/Post-Operative Diagnosis:</label>
                <span class="value">${formData.prePostOperativeDiagnosis || ''}</span>
              </div>
            </div>
            
            <div class="field-group">
              <div class="field-half">
                <label>Name of Surgeon:</label>
                <span class="value">${formData.nameOfSurgeon || ''}</span>
              </div>
              <div class="field-half">
                <label>Name of Surgery:</label>
                <span class="value">${formData.nameOfSurgery || ''}</span>
              </div>
            </div>
            
            <div class="field-group">
              <div class="field-small">
                <label>Date of Surgery:</label>
                <span class="value">${formData.dateOfSurgery || ''}</span>
              </div>
              <div class="field">
                <label>Type of Anaesthesia:</label>
                <span class="value">${formData.typeOfAnaesthesia || ''}</span>
              </div>
            </div>
            
            <div class="field-group">
              <div class="field">
                <label>Anaesthetist:</label>
                <span class="value">${formData.anaesthetist || ''}</span>
              </div>
            </div>
            
            <div class="field-group">
              <div class="field-half">
                <label>Scrub Nurse:</label>
                <span class="value">${formData.scrubNurse || ''}</span>
              </div>
              <div class="field-half">
                <label>Floor Nurse:</label>
                <span class="value">${formData.floorNurse || ''}</span>
              </div>
            </div>
          </div>
          
          <!-- Tourniquet Times -->
          <div class="section">
            <div class="field-group">
              <div class="field-half">
                <label>Tourniquet Inflation Time:</label>
                <span class="value">${formData.tourniquetInflationTime || ''}</span>
              </div>
              <div class="field-half">
                <label>Tourniquet Deflation Time:</label>
                <span class="value">${formData.tourniquetDeflationTime || ''}</span>
              </div>
            </div>
          </div>
          
          <!-- Time and Blood Info -->
          <div class="section">
            
            <div class="field-group">
              <div class="field-half">
                <label>OT Starting Time:</label>
                <span class="value">${formData.otStartingTime || ''}</span>
              </div>
              <div class="field-half">
                <label>OT Completing Time:</label>
                <span class="value">${formData.otCompletingTime || ''}</span>
              </div>
            </div>
            
            <div class="field-group">
              <div class="field-small">
                <label>Blood Group:</label>
                <span class="value">${formData.bloodGroup || ''}</span>
              </div>
              <div class="field-small">
                <label>Total Duration:</label>
                <span class="value">${formData.totalDuration || ''}</span>
              </div>
            </div>
            
            <div class="field-group">
              <div class="field-half">
                <label>Blood Transfusion:</label>
                <span class="value">${formData.bloodTransfusion || ''}</span>
              </div>
              <div class="field-half">
                <label>Estimated Blood Loss:</label>
                <span class="value">${formData.estimatedBloodLoss || ''}</span>
              </div>
            </div>
          </div>
          
          <!-- Operative Steps -->
          <div class="section">
            <div class="section-title">OPERATIVE STEPS</div>
            <div class="textarea-value">${formData.operativeSteps || ''}</div>
          </div>
          
          <!-- Implant Details -->
          <div class="section">
            <div class="section-title">IMPLANT DETAILS</div>
            <div class="textarea-value" style="min-height: 120px;">${formData.implantDetails || ''}</div>
          </div>
          
          <!-- Signature Section -->
          <div class="signature-section">
            <div class="signature-line"></div>
            <div><strong>Name/ Signature of Consultant Surgeon</strong></div>
            <div style="margin-top: 5px;">${formData.consultantSurgeonName || ''}</div>
            <div class="signature-fields">
              <div>
                <label>Date:</label>
                <span class="value">${formData.signatureDate || ''}</span>
              </div>
              <div>
                <label>Time:</label>
                <span class="value">${formData.signatureTime || ''}</span>
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
      printBtn.style.cssText = 'position: fixed; top: 10px; right: 10px; z-index: 1000; padding: 10px 20px; background: #22c55e; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px;';
      printBtn.onclick = () => printWindow.print();
      printWindow.document.body.appendChild(printBtn);
    }, 500);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">OT NOTES - INTRA OPERATIVE NOTE</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Patient Header Section */}
          <div className="border-2 border-gray-300 rounded-lg p-3 mb-3">
            <h3 className="font-bold text-lg mb-3 text-blue-700">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-sm font-medium mb-1">Patient ID No.:</label>
                <input
                  type="text"
                  value={formData.patientId}
                  onChange={(e) => handleInputChange('patientId', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">I.P. No.:</label>
                <input
                  type="text"
                  value={formData.ipNo}
                  onChange={(e) => handleInputChange('ipNo', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">Patient's Name:</label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => handleInputChange('patientName', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Age/Sex:</label>
                <input
                  type="text"
                  value={formData.ageSex}
                  onChange={(e) => handleInputChange('ageSex', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date:</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Patient and Surgical Details */}
          <div className="border-2 border-gray-300 rounded-lg p-3 mb-3">
            <h3 className="font-bold text-lg mb-2 text-blue-700">Patient and Surgical Details</h3>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Pre/Post-Operative Diagnosis:</label>
                <input
                  type="text"
                  value={formData.prePostOperativeDiagnosis}
                  onChange={(e) => handleInputChange('prePostOperativeDiagnosis', e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name of Surgeon:</label>
                  <input
                    type="text"
                    value={formData.nameOfSurgeon}
                    onChange={(e) => handleInputChange('nameOfSurgeon', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Name of Surgery:</label>
                  <input
                    type="text"
                    value={formData.nameOfSurgery}
                    onChange={(e) => handleInputChange('nameOfSurgery', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date of Surgery:</label>
                  <input
                    type="date"
                    value={formData.dateOfSurgery}
                    onChange={(e) => handleInputChange('dateOfSurgery', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Type of Anaesthesia:</label>
                  <input
                    type="text"
                    value={formData.typeOfAnaesthesia}
                    onChange={(e) => handleInputChange('typeOfAnaesthesia', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Anaesthetist:</label>
                <input
                  type="text"
                  value={formData.anaesthetist}
                  onChange={(e) => handleInputChange('anaesthetist', e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Scrub Nurse:</label>
                  <input
                    type="text"
                    value={formData.scrubNurse}
                    onChange={(e) => handleInputChange('scrubNurse', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Floor Nurse:</label>
                  <input
                    type="text"
                    value={formData.floorNurse}
                    onChange={(e) => handleInputChange('floorNurse', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Tourniquet Times */}
          <div className="border-2 border-gray-300 rounded-lg p-3 mb-3">
            <h3 className="font-bold text-lg mb-3 text-blue-700">Tourniquet Times</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Tourniquet Inflation Time:</label>
                <input
                  type="time"
                  value={formData.tourniquetInflationTime}
                  onChange={(e) => handleInputChange('tourniquetInflationTime', e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Tourniquet Deflation Time:</label>
                <input
                  type="time"
                  value={formData.tourniquetDeflationTime}
                  onChange={(e) => handleInputChange('tourniquetDeflationTime', e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Time and Blood Info */}
          <div className="border-2 border-gray-300 rounded-lg p-3 mb-3">
            <h3 className="font-bold text-lg mb-2 text-blue-700">Time and Blood Information</h3>
            
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">OT Starting Time:</label>
                  <input
                    type="time"
                    value={formData.otStartingTime}
                    onChange={(e) => handleInputChange('otStartingTime', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">OT Completing Time:</label>
                  <input
                    type="time"
                    value={formData.otCompletingTime}
                    onChange={(e) => handleInputChange('otCompletingTime', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Blood Group:</label>
                  <input
                    type="text"
                    value={formData.bloodGroup}
                    onChange={(e) => handleInputChange('bloodGroup', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Total Duration:</label>
                  <input
                    type="text"
                    value={formData.totalDuration}
                    onChange={(e) => handleInputChange('totalDuration', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Blood Transfusion:</label>
                  <input
                    type="text"
                    value={formData.bloodTransfusion}
                    onChange={(e) => handleInputChange('bloodTransfusion', e.target.value)}
                    placeholder="Yes/No"
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Estimated Blood Loss:</label>
                  <input
                    type="text"
                    value={formData.estimatedBloodLoss}
                    onChange={(e) => handleInputChange('estimatedBloodLoss', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Operative Steps */}
          <div className="border-2 border-gray-300 rounded-lg p-3 mb-3">
            <h3 className="font-bold text-lg mb-2 text-blue-700">Operative Steps</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Operative Steps:</label>
              <textarea
                value={formData.operativeSteps}
                onChange={(e) => handleInputChange('operativeSteps', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={6}
                placeholder="Enter detailed operative steps including preparations, findings, procedure steps, and closure..."
              />
            </div>
          </div>

          {/* Implant Details */}
          <div className="border-2 border-gray-300 rounded-lg p-3 mb-3">
            <h3 className="font-bold text-lg mb-2 text-blue-700">Implant Details</h3>
            <div>
              <label className="block text-sm font-medium mb-1">Implant Details:</label>
              <textarea
                value={formData.implantDetails}
                onChange={(e) => handleInputChange('implantDetails', e.target.value)}
                className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={8}
                placeholder="Enter implant details including type, size, manufacturer, serial numbers, batch numbers, and any other relevant implant information..."
              />
            </div>
          </div>

          {/* Signature and Date */}
          <div className="border-2 border-gray-300 rounded-lg p-3 mb-3">
            <h3 className="font-bold text-lg mb-2 text-blue-700">Signature and Date</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Name/ Signature of Consultant Surgeon:</label>
                <input
                  type="text"
                  value={formData.consultantSurgeonName}
                  onChange={(e) => handleInputChange('consultantSurgeonName', e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Date:</label>
                  <input
                    type="date"
                    value={formData.signatureDate}
                    onChange={(e) => handleInputChange('signatureDate', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Time:</label>
                  <input
                    type="time"
                    value={formData.signatureTime}
                    onChange={(e) => handleInputChange('signatureTime', e.target.value)}
                    className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
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
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Save Intra Operative Notes
          </button>
        </div>
      </div>
    </div>
  );
};

export default IntraOperativeNotesForm;