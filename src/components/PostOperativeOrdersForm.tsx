import React, { useState } from 'react';
import { X } from 'lucide-react';
import toast from 'react-hot-toast';

interface PostOperativeOrdersFormProps {
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

const PostOperativeOrdersForm: React.FC<PostOperativeOrdersFormProps> = ({
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
    consultantName: savedData?.consultantName || patientData.doctorName || '',
    
    // Main Orders Section
    nbmTillChecked: savedData?.nbmTillChecked || false,
    nbmTillTime: savedData?.nbmTillTime || '',
    nbmTillAmPm: savedData?.nbmTillAmPm || 'am',
    liquidsAfterTime: savedData?.liquidsAfterTime || '',
    liquidsAfterAmPm: savedData?.liquidsAfterAmPm || 'am',
    
    positionChecked: savedData?.positionChecked || false,
    positionDetails: savedData?.positionDetails || '',
    
    vitalsChecked: savedData?.vitalsChecked || false,
    vitalsFrequency: savedData?.vitalsFrequency || '',
    vitalsHourlyTill: savedData?.vitalsHourlyTill || '',
    vitalsAmPm: savedData?.vitalsAmPm || 'am',
    
    intakeOutputChecked: savedData?.intakeOutputChecked || false,
    intakeOutputYesNo: savedData?.intakeOutputYesNo || '',
    
    sitUpStandChecked: savedData?.sitUpStandChecked || false,
    sitUpStandTime: savedData?.sitUpStandTime || '',
    sitUpStandAmPm: savedData?.sitUpStandAmPm || 'am',
    
    // Drugs Section
    drugsSection: savedData?.drugsSection || [
      { drugName: '', dose: '', route: '', frequency: '', duration: '' }
    ],
    
    // Signature Section
    doctorName: savedData?.doctorName || patientData.doctorName || '',
    doctorDate: savedData?.doctorDate || new Date().toISOString().split('T')[0],
    doctorTime: savedData?.doctorTime || '',
    nurseName: savedData?.nurseName || '',
    nurseDate: savedData?.nurseDate || new Date().toISOString().split('T')[0],
    nurseTime: savedData?.nurseTime || ''
  });

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleDrugChange = (index: number, field: string, value: string) => {
    const updatedDrugs = [...formData.drugsSection];
    updatedDrugs[index] = { ...updatedDrugs[index], [field]: value };
    setFormData(prev => ({
      ...prev,
      drugsSection: updatedDrugs
    }));
  };

  const addDrugRow = () => {
    setFormData(prev => ({
      ...prev,
      drugsSection: [...prev.drugsSection, { drugName: '', dose: '', route: '', frequency: '', duration: '' }]
    }));
  };

  const removeDrugRow = (index: number) => {
    if (formData.drugsSection.length > 1) {
      const updatedDrugs = formData.drugsSection.filter((_, i) => i !== index);
      setFormData(prev => ({
        ...prev,
        drugsSection: updatedDrugs
      }));
    }
  };

  const handleSubmit = () => {
    if (onSave) {
      onSave({
        ...formData,
        createdAt: new Date().toISOString(),
        patientId: patientData.ipdNo
      });
    }
    toast.success('Post Operative Orders saved successfully');
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
            box-sizing: border-box;
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
          
          .order-item {
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            flex-wrap: wrap;
            gap: 5px;
          }
          
          .drugs-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8px;
          }
          
          .drugs-table th, .drugs-table td {
            border: 1px solid #333;
            padding: 4px;
            text-align: left;
          }
          
          .drugs-table th {
            background-color: #f0f0f0;
            font-weight: bold;
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
          <h1>POST OPERATIVE ORDERS</h1>
          
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
          
          <!-- Main Orders Section -->
          <div class="section">
            <div class="section-title">POST-OPERATIVE ORDERS</div>
            
            <div class="order-item">
              <span class="checkbox-value">${formData.nbmTillChecked ? '✓' : ''}</span>
              <label>NBM till:</label>
              <span class="value">${formData.nbmTillTime || ''}</span>
              <span>${formData.nbmTillAmPm || ''}</span>
              <label>, Liquids after</label>
              <span class="value">${formData.liquidsAfterTime || ''}</span>
              <span>${formData.liquidsAfterAmPm || ''}</span>
              <label>(if no vomiting)</label>
            </div>
            
            <div class="order-item">
              <span class="checkbox-value">${formData.positionChecked ? '✓' : ''}</span>
              <label>Position:</label>
              <span class="value">${formData.positionDetails || ''}</span>
            </div>
            
            <div class="order-item">
              <span class="checkbox-value">${formData.vitalsChecked ? '✓' : ''}</span>
              <label>Vitals:</label>
              <span class="value">${formData.vitalsFrequency || ''}</span>
              <label>hrly till</label>
              <span class="value">${formData.vitalsHourlyTill || ''}</span>
              <span>${formData.vitalsAmPm || ''}</span>
            </div>
            
            <div class="order-item">
              <span class="checkbox-value">${formData.intakeOutputChecked ? '✓' : ''}</span>
              <label>Record Intake & Output chart:</label>
              <span class="value">${formData.intakeOutputYesNo || ''}</span>
            </div>
            
            <div class="order-item">
              <span class="checkbox-value">${formData.sitUpStandChecked ? '✓' : ''}</span>
              <label>Allow the patient to sit up/stand after:</label>
              <span class="value">${formData.sitUpStandTime || ''}</span>
              <span>${formData.sitUpStandAmPm || ''}</span>
            </div>
          </div>
          
          <!-- Drugs Section -->
          <div class="section">
            <div class="section-title">DRUGS</div>
            <table class="drugs-table">
              <thead>
                <tr>
                  <th>Drug Name</th>
                  <th>Dose</th>
                  <th>Route</th>
                  <th>Frequency</th>
                  <th>Duration</th>
                </tr>
              </thead>
              <tbody>
                ${formData.drugsSection.map(drug => `
                  <tr>
                    <td>${drug.drugName || ''}</td>
                    <td>${drug.dose || ''}</td>
                    <td>${drug.route || ''}</td>
                    <td>${drug.frequency || ''}</td>
                    <td>${drug.duration || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          
          <!-- Signatures -->
          <div class="signatures">
            <div class="signature-section">
              <div style="margin-bottom: 40px; border-bottom: 1px solid #333;"></div>
              <div><strong>Name & Signature of the Doctor</strong></div>
              <div>${formData.doctorName || ''}</div>
              <div>Date: ${formData.doctorDate || ''} Time: ${formData.doctorTime || ''}</div>
            </div>
            <div class="signature-section">
              <div style="margin-bottom: 40px; border-bottom: 1px solid #333;"></div>
              <div><strong>Name & Signature of the Nurse</strong></div>
              <div>${formData.nurseName || ''}</div>
              <div>Date: ${formData.nurseDate || ''} Time: ${formData.nurseTime || ''}</div>
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
          <h2 className="text-xl font-bold">POST OPERATIVE ORDERS</h2>
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

          {/* Main Orders Section */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-lg mb-3 text-green-700">Post-Operative Orders</h3>
            
            <div className="space-y-4">
              {/* NBM till */}
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="checkbox"
                  checked={formData.nbmTillChecked}
                  onChange={(e) => handleInputChange('nbmTillChecked', e.target.checked)}
                  className="mr-2"
                />
                <label className="text-sm font-medium">NBM till:</label>
                <input
                  type="time"
                  value={formData.nbmTillTime}
                  onChange={(e) => handleInputChange('nbmTillTime', e.target.value)}
                  className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <select
                  value={formData.nbmTillAmPm}
                  onChange={(e) => handleInputChange('nbmTillAmPm', e.target.value)}
                  className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="am">AM</option>
                  <option value="pm">PM</option>
                </select>
                <span className="text-sm">, Liquids after</span>
                <input
                  type="time"
                  value={formData.liquidsAfterTime}
                  onChange={(e) => handleInputChange('liquidsAfterTime', e.target.value)}
                  className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <select
                  value={formData.liquidsAfterAmPm}
                  onChange={(e) => handleInputChange('liquidsAfterAmPm', e.target.value)}
                  className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="am">AM</option>
                  <option value="pm">PM</option>
                </select>
                <span className="text-sm">(if no vomiting)</span>
              </div>

              {/* Position */}
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="checkbox"
                  checked={formData.positionChecked}
                  onChange={(e) => handleInputChange('positionChecked', e.target.checked)}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Position:</label>
                <input
                  type="text"
                  value={formData.positionDetails}
                  onChange={(e) => handleInputChange('positionDetails', e.target.value)}
                  className="flex-1 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Position details"
                />
              </div>

              {/* Vitals */}
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="checkbox"
                  checked={formData.vitalsChecked}
                  onChange={(e) => handleInputChange('vitalsChecked', e.target.checked)}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Vitals:</label>
                <input
                  type="text"
                  value={formData.vitalsFrequency}
                  onChange={(e) => handleInputChange('vitalsFrequency', e.target.value)}
                  className="w-16 px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="4"
                />
                <span className="text-sm">hrly till</span>
                <input
                  type="time"
                  value={formData.vitalsHourlyTill}
                  onChange={(e) => handleInputChange('vitalsHourlyTill', e.target.value)}
                  className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <select
                  value={formData.vitalsAmPm}
                  onChange={(e) => handleInputChange('vitalsAmPm', e.target.value)}
                  className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="am">AM</option>
                  <option value="pm">PM</option>
                </select>
              </div>

              {/* Record Intake & Output chart */}
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="checkbox"
                  checked={formData.intakeOutputChecked}
                  onChange={(e) => handleInputChange('intakeOutputChecked', e.target.checked)}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Record Intake & Output chart:</label>
                <select
                  value={formData.intakeOutputYesNo}
                  onChange={(e) => handleInputChange('intakeOutputYesNo', e.target.value)}
                  className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Select</option>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              {/* Allow patient to sit up/stand after */}
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="checkbox"
                  checked={formData.sitUpStandChecked}
                  onChange={(e) => handleInputChange('sitUpStandChecked', e.target.checked)}
                  className="mr-2"
                />
                <label className="text-sm font-medium">Allow the patient to sit up/stand after:</label>
                <input
                  type="time"
                  value={formData.sitUpStandTime}
                  onChange={(e) => handleInputChange('sitUpStandTime', e.target.value)}
                  className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <select
                  value={formData.sitUpStandAmPm}
                  onChange={(e) => handleInputChange('sitUpStandAmPm', e.target.value)}
                  className="px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="am">AM</option>
                  <option value="pm">PM</option>
                </select>
              </div>
            </div>
          </div>

          {/* Drugs Section */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-lg mb-3 text-green-700">Drugs</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-2 py-2 text-left">Drug Name</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">Dose</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">Route</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">Frequency</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">Duration</th>
                    <th className="border border-gray-300 px-2 py-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.drugsSection.map((drug, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="text"
                          value={drug.drugName}
                          onChange={(e) => handleDrugChange(index, 'drugName', e.target.value)}
                          className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="Drug name"
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="text"
                          value={drug.dose}
                          onChange={(e) => handleDrugChange(index, 'dose', e.target.value)}
                          className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="Dose"
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="text"
                          value={drug.route}
                          onChange={(e) => handleDrugChange(index, 'route', e.target.value)}
                          className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="Route"
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="text"
                          value={drug.frequency}
                          onChange={(e) => handleDrugChange(index, 'frequency', e.target.value)}
                          className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="Frequency"
                        />
                      </td>
                      <td className="border border-gray-300 p-1">
                        <input
                          type="text"
                          value={drug.duration}
                          onChange={(e) => handleDrugChange(index, 'duration', e.target.value)}
                          className="w-full px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-green-500"
                          placeholder="Duration"
                        />
                      </td>
                      <td className="border border-gray-300 p-1 text-center">
                        <button
                          onClick={() => removeDrugRow(index)}
                          className="text-red-500 hover:text-red-700 text-sm"
                          disabled={formData.drugsSection.length === 1}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <button
              onClick={addDrugRow}
              className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Add Drug Row
            </button>
          </div>

          {/* Signatures */}
          <div className="border-2 border-gray-300 rounded-lg p-4 mb-4">
            <h3 className="font-bold text-lg mb-3 text-green-700">Signatures</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="text-center">
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1">Name & Signature of the Doctor:</label>
                  <input
                    type="text"
                    value={formData.doctorName}
                    onChange={(e) => handleInputChange('doctorName', e.target.value)}
                    className="w-full px-3 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Date:</label>
                    <input
                      type="date"
                      value={formData.doctorDate}
                      onChange={(e) => handleInputChange('doctorDate', e.target.value)}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium mb-1">Time:</label>
                    <input
                      type="time"
                      value={formData.doctorTime}
                      onChange={(e) => handleInputChange('doctorTime', e.target.value)}
                      className="w-full px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                  </div>
                </div>
              </div>
              
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
            Save Post-Operative Orders
          </button>
        </div>
      </div>
    </div>
  );
};

export default PostOperativeOrdersForm;