import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface PreOpChecklistFormProps {
  isOpen: boolean;
  onClose: () => void;
  patient: {
    first_name: string;
    last_name?: string;
    age: string | number;
    gender: string;
    patient_id: string;
    assigned_doctor?: string;
  };
  bedNumber: string;
  ipdNumber?: string;
  onSubmit?: (data: any) => void;
  savedData?: any; // Previously saved form data
}

const PreOpChecklistForm: React.FC<PreOpChecklistFormProps> = ({
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
    patientName: savedData?.patientName || `${patient.first_name} ${patient.last_name || ''}`.trim() || '',
    ageSex: savedData?.ageSex || `${patient.age || ''} / ${patient.gender || ''}`,
    date: savedData?.date || new Date().toISOString().split('T')[0],
    nameOfSurgery: savedData?.nameOfSurgery || '',
    patientId: savedData?.patientId || patient.patient_id || '',
    ipdNo: savedData?.ipdNo || ipdNumber || patient.patient_id || '',
    consultantName: savedData?.consultantName || patient.assigned_doctor || '',
    
    // Checklist items (Yes/No)
    consentTaken: savedData?.consentTaken || '',
    preparationOfOperationSite: savedData?.preparationOfOperationSite || '',
    nilByMouthSince: savedData?.nilByMouthSince || '',
    nilByMouthTime: savedData?.nilByMouthTime || '',
    investigationReportsAttached: savedData?.investigationReportsAttached || '',
    removalOfDentureJewellery: savedData?.removalOfDentureJewellery || '',
    removalOfNailPolishHairPin: savedData?.removalOfNailPolishHairPin || '',
    enemaGivenBladderEmptied: savedData?.enemaGivenBladderEmptied || '',
    surgicalSiteMarkingDone: savedData?.surgicalSiteMarkingDone || '',
    arrangementOfBlood: savedData?.arrangementOfBlood || '',
    physicianFitnessTaken: savedData?.physicianFitnessTaken || '',
    clearanceSlipReceived: savedData?.clearanceSlipReceived || '',
    
    // Vitals
    temperature: savedData?.temperature || '',
    pulse: savedData?.pulse || '',
    bloodPressure: savedData?.bloodPressure || '',
    respiratoryRate: savedData?.respiratoryRate || '',
    spo2: savedData?.spo2 || '',
    
    // Medication and Patient Details
    antibioticGiven: savedData?.antibioticGiven || '',
    whichAntibiotic: savedData?.whichAntibiotic || '',
    antibioticTime: savedData?.antibioticTime || '',
    nameTagApplied: savedData?.nameTagApplied || '',
    weightInKg: savedData?.weightInKg || '',
    patientReceivedInOTAt: savedData?.patientReceivedInOTAt || '',
    
    // Signatures
    wardStaffSignature: savedData?.wardStaffSignature || '',
    otStaffSignature: savedData?.otStaffSignature || ''
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
    toast.success('Pre-OP-Check List saved successfully');
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
        <title></title>
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
              font-size: 10px;
              line-height: 1.2;
            }
            
            .print-button {
              display: none !important;
            }
            
            @page {
              margin: 15mm;
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
            font-size: 10px;
            line-height: 1.2;
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
            margin-bottom: 8px;
            text-decoration: underline;
            font-weight: bold;
          }
          
          .section {
            margin-bottom: 6px;
            border: 1px solid #000;
            padding: 4px;
          }
          
          .section-title {
            font-weight: bold;
            font-size: 11px;
            margin-bottom: 4px;
            text-decoration: underline;
          }
          
          .field-group {
            display: flex;
            flex-wrap: wrap;
            gap: 10px;
            margin-bottom: 4px;
          }
          
          .field {
            flex: 1;
            min-width: 150px;
          }
          
          .field-small {
            flex: 0.5;
            min-width: 100px;
          }
          
          label {
            font-weight: bold;
            margin-right: 5px;
          }
          
          .value {
            border-bottom: 1px solid #333;
            display: inline-block;
            min-width: 80px;
            padding: 2px 4px;
            min-height: 14px;
          }
          
          .checklist-table {
            width: 100%;
            border-collapse: collapse;
            margin: 8px 0;
          }
          
          .checklist-table th,
          .checklist-table td {
            border: 1px solid #333;
            padding: 4px;
            text-align: left;
          }
          
          .checklist-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }
          
          .checkbox-cell {
            text-align: center;
            width: 40px;
          }
          
          .checkbox-mark {
            font-size: 14px;
            font-weight: bold;
          }
          
          .vitals-grid {
            display: grid;
            grid-template-columns: repeat(5, 1fr);
            gap: 8px;
            margin: 8px 0;
          }
          
          .vital-item {
            text-align: center;
          }
          
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
          }
          
          .signature-section {
            flex: 1;
            margin: 0 10px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>PRE-OP-CHECK LIST</h1>
          
          <!-- Patient Header -->
          <div class="section">
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
            <div class="field-group">
              <div class="field">
                <label>Name of Surgery:</label>
                <span class="value">${formData.nameOfSurgery || ''}</span>
              </div>
              <div class="field-small">
                <label>Patient ID:</label>
                <span class="value">${formData.patientId || ''}</span>
              </div>
              <div class="field-small">
                <label>IPD No.:</label>
                <span class="value">${formData.ipdNo || ''}</span>
              </div>
            </div>
            <div class="field-group">
              <div class="field">
                <label>Consultant Name:</label>
                <span class="value">${formData.consultantName || ''}</span>
              </div>
            </div>
          </div>
          
          <!-- Checklist Table -->
          <div class="section">
            <div class="section-title">Pre-Operative Checklist</div>
            <table class="checklist-table">
              <thead>
                <tr>
                  <th style="width: 60%;">Checklist Items</th>
                  <th style="width: 20%;">Yes</th>
                  <th style="width: 20%;">No</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Consent Taken</td>
                  <td class="checkbox-cell">${formData.consentTaken === 'yes' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                  <td class="checkbox-cell">${formData.consentTaken === 'no' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                </tr>
                <tr>
                  <td>Preparation of Operation Site</td>
                  <td class="checkbox-cell">${formData.preparationOfOperationSite === 'yes' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                  <td class="checkbox-cell">${formData.preparationOfOperationSite === 'no' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                </tr>
                <tr>
                  <td>Nil by Mouth Since: <strong>${formData.nilByMouthTime || '............'}</strong> (Time)</td>
                  <td class="checkbox-cell">${formData.nilByMouthSince === 'yes' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                  <td class="checkbox-cell">${formData.nilByMouthSince === 'no' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                </tr>
                <tr>
                  <td>Investigation Reports Attached (Blood, ECG, X-Ray, Others)</td>
                  <td class="checkbox-cell">${formData.investigationReportsAttached === 'yes' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                  <td class="checkbox-cell">${formData.investigationReportsAttached === 'no' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                </tr>
                <tr>
                  <td>Removal of Denture/Jewellery</td>
                  <td class="checkbox-cell">${formData.removalOfDentureJewellery === 'yes' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                  <td class="checkbox-cell">${formData.removalOfDentureJewellery === 'no' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                </tr>
                <tr>
                  <td>Removal of Nail Polish/Hair Pin</td>
                  <td class="checkbox-cell">${formData.removalOfNailPolishHairPin === 'yes' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                  <td class="checkbox-cell">${formData.removalOfNailPolishHairPin === 'no' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                </tr>
                <tr>
                  <td>Enema Given / Bladder Emptied</td>
                  <td class="checkbox-cell">${formData.enemaGivenBladderEmptied === 'yes' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                  <td class="checkbox-cell">${formData.enemaGivenBladderEmptied === 'no' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                </tr>
                <tr>
                  <td>Surgical Site Marking Done</td>
                  <td class="checkbox-cell">${formData.surgicalSiteMarkingDone === 'yes' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                  <td class="checkbox-cell">${formData.surgicalSiteMarkingDone === 'no' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                </tr>
                <tr>
                  <td>Arrangement Of Blood</td>
                  <td class="checkbox-cell">${formData.arrangementOfBlood === 'yes' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                  <td class="checkbox-cell">${formData.arrangementOfBlood === 'no' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                </tr>
                <tr>
                  <td>Physician Fitness Taken</td>
                  <td class="checkbox-cell">${formData.physicianFitnessTaken === 'yes' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                  <td class="checkbox-cell">${formData.physicianFitnessTaken === 'no' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                </tr>
                <tr>
                  <td>Clearance Slip Received</td>
                  <td class="checkbox-cell">${formData.clearanceSlipReceived === 'yes' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                  <td class="checkbox-cell">${formData.clearanceSlipReceived === 'no' ? '<span class="checkbox-mark">✓</span>' : ''}</td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Vitals Section -->
          <div class="section">
            <div class="section-title">Vitals Taken at the time of Shifting</div>
            <div class="vitals-grid">
              <div class="vital-item">
                <label>T:</label>
                <span class="value">${formData.temperature || ''}</span> °F
              </div>
              <div class="vital-item">
                <label>P:</label>
                <span class="value">${formData.pulse || ''}</span> /min.
              </div>
              <div class="vital-item">
                <label>BP:</label>
                <span class="value">${formData.bloodPressure || ''}</span> mm of Hg
              </div>
              <div class="vital-item">
                <label>RR:</label>
                <span class="value">${formData.respiratoryRate || ''}</span> /min
              </div>
              <div class="vital-item">
                <label>SpO2:</label>
                <span class="value">${formData.spo2 || ''}</span> %
              </div>
            </div>
          </div>
          
          <!-- Medication and Patient Details -->
          <div class="section">
            <div class="section-title">Pre medication Given</div>
            <div class="field-group">
              <div class="field">
                <label>Antibiotic Given:</label>
                <span class="value">${formData.antibioticGiven || ''}</span>
              </div>
              <div class="field">
                <label>Which Antibiotic:</label>
                <span class="value">${formData.whichAntibiotic || ''}</span>
              </div>
              <div class="field-small">
                <label>Time:</label>
                <span class="value">${formData.antibioticTime || ''}</span>
              </div>
            </div>
            <div class="field-group">
              <div class="field">
                <label>Name Tag Applied:</label>
                <span class="value">${formData.nameTagApplied || ''}</span>
              </div>
              <div class="field">
                <label>Weight (in Kg):</label>
                <span class="value">${formData.weightInKg || ''}</span>
              </div>
              <div class="field">
                <label>Patient Received in OT at:</label>
                <span class="value">${formData.patientReceivedInOTAt || ''}</span>
              </div>
            </div>
          </div>
          
          <!-- Signatures -->
          <div class="signatures">
            <div class="signature-section">
              <div style="margin-bottom: 30px; border-bottom: 1px solid #333;"></div>
              <div><strong>Signature with Name (Ward Staff)</strong></div>
              <div>${formData.wardStaffSignature || ''}</div>
            </div>
            <div class="signature-section">
              <div style="margin-bottom: 30px; border-bottom: 1px solid #333;"></div>
              <div><strong>Signature with Name (OT Staff)</strong></div>
              <div>${formData.otStaffSignature || ''}</div>
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
      <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">PRE-OP-CHECK LIST</h2>
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
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-lg mb-3 text-green-700">Patient Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient's Name:</label>
                <input
                  type="text"
                  value={formData.patientName}
                  onChange={(e) => handleInputChange('patientName', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Age/Sex:</label>
                <input
                  type="text"
                  value={formData.ageSex}
                  onChange={(e) => handleInputChange('ageSex', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date:</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleInputChange('date', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name of Surgery:</label>
                <input
                  type="text"
                  value={formData.nameOfSurgery}
                  onChange={(e) => handleInputChange('nameOfSurgery', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Patient ID:</label>
                <input
                  type="text"
                  value={formData.patientId}
                  onChange={(e) => handleInputChange('patientId', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">IPD No.:</label>
                <input
                  type="text"
                  value={formData.ipdNo}
                  onChange={(e) => handleInputChange('ipdNo', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Consultant Name:</label>
              <input
                type="text"
                value={formData.consultantName}
                onChange={(e) => handleInputChange('consultantName', e.target.value)}
                className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Checklist Table */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-lg mb-3 text-green-700">Pre-Operative Checklist</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Checklist Items</th>
                    <th className="border border-gray-300 px-4 py-2 text-center w-20">Yes</th>
                    <th className="border border-gray-300 px-4 py-2 text-center w-20">No</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { key: 'consentTaken', label: 'Consent Taken' },
                    { key: 'preparationOfOperationSite', label: 'Preparation of Operation Site' },
                    { 
                      key: 'nilByMouthSince', 
                      label: 'Nil by Mouth Since',
                      hasInput: true,
                      inputKey: 'nilByMouthTime',
                      inputPlaceholder: 'Time'
                    },
                    { key: 'investigationReportsAttached', label: 'Investigation Reports Attached (Blood, ECG, X-Ray, Others)' },
                    { key: 'removalOfDentureJewellery', label: 'Removal of Denture/Jewellery' },
                    { key: 'removalOfNailPolishHairPin', label: 'Removal of Nail Polish/Hair Pin' },
                    { key: 'enemaGivenBladderEmptied', label: 'Enema Given / Bladder Emptied' },
                    { key: 'surgicalSiteMarkingDone', label: 'Surgical Site Marking Done' },
                    { key: 'arrangementOfBlood', label: 'Arrangement Of Blood' },
                    { key: 'physicianFitnessTaken', label: 'Physician Fitness Taken' },
                    { key: 'clearanceSlipReceived', label: 'Clearance Slip Received' }
                  ].map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2">
                        {item.label}
                        {item.hasInput && (
                          <span className="ml-2">
                            <input
                              type="text"
                              value={formData[item.inputKey as keyof typeof formData] as string}
                              onChange={(e) => handleInputChange(item.inputKey!, e.target.value)}
                              placeholder={item.inputPlaceholder}
                              className="inline-block w-20 px-2 py-1 border rounded text-sm"
                            />
                            <span className="ml-1">(Time)</span>
                          </span>
                        )}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <input
                          type="radio"
                          name={item.key}
                          value="yes"
                          checked={formData[item.key as keyof typeof formData] === 'yes'}
                          onChange={(e) => handleInputChange(item.key, e.target.value)}
                          className="w-4 h-4"
                        />
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-center">
                        <input
                          type="radio"
                          name={item.key}
                          value="no"
                          checked={formData[item.key as keyof typeof formData] === 'no'}
                          onChange={(e) => handleInputChange(item.key, e.target.value)}
                          className="w-4 h-4"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Vitals Section */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-lg mb-3 text-green-700">Vitals Taken at the time of Shifting</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">T:</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={formData.temperature}
                    onChange={(e) => handleInputChange('temperature', e.target.value)}
                    className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm">°F</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">P:</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={formData.pulse}
                    onChange={(e) => handleInputChange('pulse', e.target.value)}
                    className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm">/min.</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">BP:</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={formData.bloodPressure}
                    onChange={(e) => handleInputChange('bloodPressure', e.target.value)}
                    className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm">mm of Hg</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">RR:</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={formData.respiratoryRate}
                    onChange={(e) => handleInputChange('respiratoryRate', e.target.value)}
                    className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm">/min</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">SpO2:</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    value={formData.spo2}
                    onChange={(e) => handleInputChange('spo2', e.target.value)}
                    className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <span className="ml-2 text-sm">%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Medication and Patient Details */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-lg mb-3 text-green-700">Pre medication Given</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Antibiotic Given:</label>
                <input
                  type="text"
                  value={formData.antibioticGiven}
                  onChange={(e) => handleInputChange('antibioticGiven', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Which Antibiotic:</label>
                <input
                  type="text"
                  value={formData.whichAntibiotic}
                  onChange={(e) => handleInputChange('whichAntibiotic', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Time:</label>
                <input
                  type="time"
                  value={formData.antibioticTime}
                  onChange={(e) => handleInputChange('antibioticTime', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name Tag Applied:</label>
                <input
                  type="text"
                  value={formData.nameTagApplied}
                  onChange={(e) => handleInputChange('nameTagApplied', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Weight (in Kg):</label>
                <input
                  type="text"
                  value={formData.weightInKg}
                  onChange={(e) => handleInputChange('weightInKg', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Patient Received in OT at:</label>
                <input
                  type="text"
                  value={formData.patientReceivedInOTAt}
                  onChange={(e) => handleInputChange('patientReceivedInOTAt', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-lg mb-3 text-green-700">Signatures</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-1">Signature with Name (Ward Staff):</label>
                <input
                  type="text"
                  value={formData.wardStaffSignature}
                  onChange={(e) => handleInputChange('wardStaffSignature', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Signature with Name (OT Staff):</label>
                <input
                  type="text"
                  value={formData.otStaffSignature}
                  onChange={(e) => handleInputChange('otStaffSignature', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
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
            Save Pre-OP-Check List
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreOpChecklistForm;