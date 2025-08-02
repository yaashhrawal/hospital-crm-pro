import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface PreOperativeOrdersFormProps {
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
}

const PreOperativeOrdersForm: React.FC<PreOperativeOrdersFormProps> = ({
  isOpen,
  onClose,
  patientData,
  onSave
}) => {
  const [formData, setFormData] = useState({
    // Patient Header Section
    patientId: patientData.patientId || '',
    ipNo: patientData.ipdNo || '',
    patientName: patientData.name || '',
    ageSex: `${patientData.age || ''} / ${patientData.gender || ''}`,
    date: new Date().toISOString().split('T')[0],
    consultantName: patientData.doctorName || '',
    
    // Orders Section
    writtenConsent: false,
    nbmAfterTime: '',
    nbmAfterDate: '',
    bathShowerTime: '',
    bathShowerYesNo: '',
    enemaType: 'Simple',
    enemaTime: '',
    enemaYesNo: '',
    removeDenturesEtc: false,
    skinPreparation: false,
    transferToOTTime: '',
    specialOrders: '',
    
    // Body Diagram Notes (6 text areas)
    diagramNote1: '',
    diagramNote2: '',
    diagramNote3: '',
    diagramNote4: '',
    diagramNote5: '',
    diagramNote6: '',
    
    // Signatures
    nurseName: '',
    nurseDate: new Date().toISOString().split('T')[0],
    nurseTime: '',
    surgeonName: '',
    surgeonDate: new Date().toISOString().split('T')[0],
    surgeonTime: ''
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
        patientId: patientData.ipdNo
      });
    }
    toast.success('Pre-Operative Orders saved successfully');
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
            margin: 10mm;
          }
          
          @media print {
            body {
              margin: 0;
              padding: 0;
              font-family: Arial, sans-serif;
              font-size: 11px;
              line-height: 1.2;
            }
            
            .print-button {
              display: none !important;
            }
            
            @page {
              margin: 10mm;
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
            font-size: 11px;
            line-height: 1.3;
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
            font-size: 16px;
            margin-bottom: 15px;
            text-decoration: underline;
            font-weight: bold;
          }
          
          .section {
            margin-bottom: 10px;
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
            min-width: 100px;
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
          
          .checkbox-value {
            display: inline-block;
            width: 15px;
            height: 15px;
            border: 1px solid #333;
            margin-right: 5px;
            text-align: center;
            line-height: 13px;
          }
          
          .textarea-value {
            border: 1px solid #333;
            padding: 5px;
            min-height: 40px;
            width: 100%;
            margin-top: 5px;
          }
          
          .diagram-section {
            display: flex;
            gap: 18px;
            margin: 12px 0;
          }
          
          .diagram-area {
            flex: 1;
            text-align: center;
            border: 1px solid #333;
            padding: 7px;
          }
          
          .diagram-title {
            font-weight: bold;
            margin-bottom: 7px;
          }
          
          .diagram-image {
            width: 120px;
            height: 240px;
            border: 1px solid #666;
            margin: 0 auto 7px;
            object-fit: contain;
          }
          
          .notes-section {
            flex: 1;
            margin-left: 18px;
          }
          
          .note-area {
            border: 1px solid #333;
            min-height: 32px;
            margin-bottom: 6px;
            padding: 4px;
          }
          
          .signatures {
            display: flex;
            justify-content: space-between;
            margin-top: 18px;
          }
          
          .signature-section {
            flex: 1;
            margin: 0 12px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>PRE OPERATIVE ORDERS</h1>
          
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
            <div class="field-group">
              <div class="field">
                <label>Consultant Name:</label>
                <span class="value">${formData.consultantName || ''}</span>
              </div>
            </div>
          </div>
          
          <!-- Orders Section -->
          <div class="section">
            <div class="section-title">PRE-OPERATIVE ORDERS</div>
            
            <div style="margin-bottom: 10px;">
              <span class="checkbox-value">${formData.writtenConsent ? '✓' : ''}</span>
              <label>Take written consent for risk of surgery and Anaesthesia</label>
            </div>
            
            <div style="margin-bottom: 10px;">
              <label>N.B.M. after:</label>
              <span class="value">${formData.nbmAfterTime || ''}</span>
              <label>on date</label>
              <span class="value">${formData.nbmAfterDate || ''}</span>
            </div>
            
            <div style="margin-bottom: 10px;">
              <label>Bath Shower at:</label>
              <span class="value">${formData.bathShowerTime || ''}</span>
              <label>yes/No:</label>
              <span class="value">${formData.bathShowerYesNo || ''}</span>
            </div>
            
            <div style="margin-bottom: 10px;">
              <label>Enema: ${formData.enemaType || 'Simple'}/ Glycerine/ Proctolysis at:</label>
              <span class="value">${formData.enemaTime || ''}</span>
              <label>yes/No:</label>
              <span class="value">${formData.enemaYesNo || ''}</span>
            </div>
            
            <div style="margin-bottom: 10px;">
              <span class="checkbox-value">${formData.removeDenturesEtc ? '✓' : ''}</span>
              <label>Remove Dentures, Ornaments & Nail Polish, Spectacles & Contact Lenses</label>
            </div>
            
            <div style="margin-bottom: 10px;">
              <span class="checkbox-value">${formData.skinPreparation ? '✓' : ''}</span>
              <label>Skin preparation, shaving (part of the body as shown in the diagram) & shaving wash</label>
            </div>
            
            <div style="margin-bottom: 10px;">
              <label>Transfer the patient to O.T. with case paper & Investigations Reports at:</label>
              <span class="value">${formData.transferToOTTime || ''}</span>
            </div>
            
            <div style="margin-bottom: 10px;">
              <label>Special order or Pre-Ope Medications:</label>
              <div class="textarea-value">${formData.specialOrders || ''}</div>
            </div>
          </div>
          
          <!-- Body Diagrams and Notes -->
          <div class="section">
            <div class="section-title">BODY DIAGRAMS & SKIN PREPARATION</div>
            <div class="diagram-section">
              <div class="diagram-area">
                <div class="diagram-title">Anterior</div>
                <img src="/anterior-body-diagram.jpg" alt="Anterior Body Diagram" class="diagram-image" />
              </div>
              <div class="diagram-area">
                <div class="diagram-title">Posterior</div>
                <img src="/posterior-body-diagram.jpg" alt="Posterior Body Diagram" class="diagram-image" />
              </div>
              <div class="notes-section">
                <div class="note-area">${formData.diagramNote1 || ''}</div>
                <div class="note-area">${formData.diagramNote2 || ''}</div>
                <div class="note-area">${formData.diagramNote3 || ''}</div>
                <div class="note-area">${formData.diagramNote4 || ''}</div>
                <div class="note-area">${formData.diagramNote5 || ''}</div>
                <div class="note-area">${formData.diagramNote6 || ''}</div>
              </div>
            </div>
          </div>
          
          <!-- Signatures -->
          <div class="signatures">
            <div class="signature-section">
              <div style="margin-bottom: 40px; border-bottom: 1px solid #333;"></div>
              <div><strong>Name & Signature of the Nurse</strong></div>
              <div>${formData.nurseName || ''}</div>
              <div>Date: ${formData.nurseDate || ''} Time: ${formData.nurseTime || ''}</div>
            </div>
            <div class="signature-section">
              <div style="margin-bottom: 40px; border-bottom: 1px solid #333;"></div>
              <div><strong>Name & Signature of the Surgeon</strong></div>
              <div>${formData.surgeonName || ''}</div>
              <div>Date: ${formData.surgeonDate || ''} Time: ${formData.surgeonTime || ''}</div>
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
        <div className="bg-green-600 text-white p-4 flex justify-between items-center">
          <h2 className="text-xl font-bold">PRE OPERATIVE ORDERS</h2>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Patient ID No.:</label>
                <input
                  type="text"
                  value={formData.patientId}
                  onChange={(e) => handleInputChange('patientId', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">I.P. No.:</label>
                <input
                  type="text"
                  value={formData.ipNo}
                  onChange={(e) => handleInputChange('ipNo', e.target.value)}
                  className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            
            <div className="mt-4">
              <label className="block text-sm font-medium mb-1">Consultant Name:</label>
              <input
                type="text"
                value={formData.consultantName}
                onChange={(e) => handleInputChange('consultantName', e.target.value)}
                className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          {/* Orders Section */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-lg mb-3 text-green-700">Pre-Operative Orders</h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.writtenConsent}
                  onChange={(e) => handleInputChange('writtenConsent', e.target.checked)}
                  className="mr-2"
                />
                <label className="text-sm">Take written consent for risk of surgery and Anaesthesia</label>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-sm font-medium">N.B.M. after:</label>
                <input
                  type="time"
                  value={formData.nbmAfterTime}
                  onChange={(e) => handleInputChange('nbmAfterTime', e.target.value)}
                  className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <span className="text-sm">on date</span>
                <input
                  type="date"
                  value={formData.nbmAfterDate}
                  onChange={(e) => handleInputChange('nbmAfterDate', e.target.value)}
                  className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-sm font-medium">Bath Shower at:</label>
                <input
                  type="time"
                  value={formData.bathShowerTime}
                  onChange={(e) => handleInputChange('bathShowerTime', e.target.value)}
                  className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <span className="text-sm">yes/No:</span>
                <select
                  value={formData.bathShowerYesNo}
                  onChange={(e) => handleInputChange('bathShowerYesNo', e.target.value)}
                  className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-sm font-medium">Enema:</label>
                <select
                  value={formData.enemaType}
                  onChange={(e) => handleInputChange('enemaType', e.target.value)}
                  className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Simple">Simple</option>
                  <option value="Glycerine">Glycerine</option>
                  <option value="Proctolysis">Proctolysis</option>
                </select>
                <span className="text-sm">at:</span>
                <input
                  type="time"
                  value={formData.enemaTime}
                  onChange={(e) => handleInputChange('enemaTime', e.target.value)}
                  className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <span className="text-sm">yes/No:</span>
                <select
                  value={formData.enemaYesNo}
                  onChange={(e) => handleInputChange('enemaYesNo', e.target.value)}
                  className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.removeDenturesEtc}
                  onChange={(e) => handleInputChange('removeDenturesEtc', e.target.checked)}
                  className="mr-2"
                />
                <label className="text-sm">Remove Dentures, Ornaments & Nail Polish, Spectacles & Contact Lenses</label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.skinPreparation}
                  onChange={(e) => handleInputChange('skinPreparation', e.target.checked)}
                  className="mr-2"
                />
                <label className="text-sm">Skin preparation, shaving (part of the body as shown in the diagram) & shaving wash</label>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <label className="text-sm font-medium">Transfer the patient to O.T. with case paper & Investigations Reports at:</label>
                <input
                  type="time"
                  value={formData.transferToOTTime}
                  onChange={(e) => handleInputChange('transferToOTTime', e.target.value)}
                  className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Special order or Pre-Ope Medications:</label>
                <textarea
                  value={formData.specialOrders}
                  onChange={(e) => handleInputChange('specialOrders', e.target.value)}
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Body Diagram and Instructions */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-lg mb-3 text-green-700">Skin Preparation & Body Diagrams</h3>
            <div className="flex gap-4">
              {/* Diagrams */}
              <div className="flex gap-4 flex-1">
                <div className="flex-1 text-center border border-gray-300 rounded p-4">
                  <h4 className="font-medium mb-2">Anterior</h4>
                  <img 
                    src="/anterior-body-diagram.jpg" 
                    alt="Anterior Body Diagram" 
                    className="mx-auto border border-gray-400"
                  />
                </div>
                <div className="flex-1 text-center border border-gray-300 rounded p-4">
                  <h4 className="font-medium mb-2">Posterior</h4>
                  <img 
                    src="/posterior-body-diagram.jpg" 
                    alt="Posterior Body Diagram" 
                    className="mx-auto border border-gray-400"
                  />
                </div>
              </div>
              
              {/* Notes */}
              <div className="flex-1 space-y-2">
                <div>
                  <label className="block text-xs font-medium mb-1">Note 1:</label>
                  <textarea
                    value={formData.diagramNote1}
                    onChange={(e) => handleInputChange('diagramNote1', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Note 2:</label>
                  <textarea
                    value={formData.diagramNote2}
                    onChange={(e) => handleInputChange('diagramNote2', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Note 3:</label>
                  <textarea
                    value={formData.diagramNote3}
                    onChange={(e) => handleInputChange('diagramNote3', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Note 4:</label>
                  <textarea
                    value={formData.diagramNote4}
                    onChange={(e) => handleInputChange('diagramNote4', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Note 5:</label>
                  <textarea
                    value={formData.diagramNote5}
                    onChange={(e) => handleInputChange('diagramNote5', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Note 6:</label>
                  <textarea
                    value={formData.diagramNote6}
                    onChange={(e) => handleInputChange('diagramNote6', e.target.value)}
                    className="w-full px-2 py-1 border rounded text-xs focus:outline-none focus:ring-1 focus:ring-green-500"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-lg mb-3 text-green-700">Signatures</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Name & Signature of the Nurse:</label>
                  <input
                    type="text"
                    value={formData.nurseName}
                    onChange={(e) => handleInputChange('nurseName', e.target.value)}
                    className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Date:</label>
                    <input
                      type="date"
                      value={formData.nurseDate}
                      onChange={(e) => handleInputChange('nurseDate', e.target.value)}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Time:</label>
                    <input
                      type="time"
                      value={formData.nurseTime}
                      onChange={(e) => handleInputChange('nurseTime', e.target.value)}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="text-center">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Name & Signature of the Surgeon:</label>
                  <input
                    type="text"
                    value={formData.surgeonName}
                    onChange={(e) => handleInputChange('surgeonName', e.target.value)}
                    className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Date:</label>
                    <input
                      type="date"
                      value={formData.surgeonDate}
                      onChange={(e) => handleInputChange('surgeonDate', e.target.value)}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Time:</label>
                    <input
                      type="time"
                      value={formData.surgeonTime}
                      onChange={(e) => handleInputChange('surgeonTime', e.target.value)}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
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
            Save Pre-Operative Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default PreOperativeOrdersForm;