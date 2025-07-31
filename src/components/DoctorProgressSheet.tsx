import React, { useState, useEffect } from 'react';
import type { PatientWithRelations } from '../config/supabaseNew';
import toast from 'react-hot-toast';

interface DoctorProgressSheetProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientWithRelations;
  bedNumber: number;
  onSubmit: (progressData: any) => void;
}

interface ProgressEntry {
  id: string;
  date: string;
  time: string;
  clinicalNotes: string;
  investigationAdvise: string;
  treatment: string;
  dietAdvise: string;
}

interface ProgressSheetData {
  // Patient Information
  patientName: string;
  ageSex: string;
  ipdNumber: string;
  
  // Progress Entries
  progressEntries: ProgressEntry[];
  
  // Signature
  residentConsultantSignature: string;
  
  // Additional Information
  bedNumber: number;
}

const DoctorProgressSheet: React.FC<DoctorProgressSheetProps> = ({
  isOpen,
  onClose,
  patient,
  bedNumber,
  onSubmit
}) => {
  const [formData, setFormData] = useState<ProgressSheetData>({
    patientName: '',
    ageSex: '',
    ipdNumber: '',
    progressEntries: [],
    residentConsultantSignature: '',
    bedNumber: 0
  });

  // Auto-populate form with patient data when opened
  useEffect(() => {
    if (isOpen && patient) {
      const initialEntry: ProgressEntry = {
        id: `entry-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().split(' ')[0].substring(0, 5),
        clinicalNotes: '',
        investigationAdvise: '',
        treatment: '',
        dietAdvise: ''
      };

      setFormData(prev => ({
        ...prev,
        patientName: `${patient.first_name} ${patient.last_name}`,
        ageSex: `${patient.age || 'N/A'}/${patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : patient.gender}`,
        ipdNumber: `IPD-${bedNumber}-${Date.now().toString().slice(-6)}`,
        bedNumber: bedNumber,
        progressEntries: [initialEntry]
      }));
    }
  }, [isOpen, patient, bedNumber]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProgressEntryChange = (entryId: string, field: keyof ProgressEntry, value: string) => {
    setFormData(prev => ({
      ...prev,
      progressEntries: prev.progressEntries.map(entry =>
        entry.id === entryId ? { ...entry, [field]: value } : entry
      )
    }));
  };

  const addNewProgressEntry = () => {
    const newEntry: ProgressEntry = {
      id: `entry-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().split(' ')[0].substring(0, 5),
      clinicalNotes: '',
      investigationAdvise: '',
      treatment: '',
      dietAdvise: ''
    };

    setFormData(prev => ({
      ...prev,
      progressEntries: [...prev.progressEntries, newEntry]
    }));
  };

  const removeProgressEntry = (entryId: string) => {
    if (formData.progressEntries.length > 1) {
      setFormData(prev => ({
        ...prev,
        progressEntries: prev.progressEntries.filter(entry => entry.id !== entryId)
      }));
    } else {
      toast.error('At least one progress entry is required');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.patientName || !formData.ipdNumber) {
      toast.error('Please fill in all required patient information fields');
      return;
    }

    // Validate progress entries
    const hasEmptyEntries = formData.progressEntries.some(entry => 
      !entry.date || !entry.time || !entry.clinicalNotes.trim()
    );
    
    if (hasEmptyEntries) {
      toast.error('Please fill in Date, Time, and Clinical Notes for all progress entries');
      return;
    }

    // Save progress sheet data
    onSubmit({
      ...formData,
      submittedAt: new Date().toISOString(),
      bedNumber
    });
    
    toast.success('Doctor\'s Progress Sheet saved successfully');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (printWindow) {
      printWindow.document.write(generatePrintContent());
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const generatePrintContent = () => {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Doctor's Progress Sheet - ${formData.patientName}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @page {
            margin: 0.5in;
            size: A4 portrait;
          }
          
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            font-size: 10pt;
            line-height: 1.3;
            color: black;
            background: white;
          }
          
          .print-container {
            max-width: 100%;
            margin: 0 auto;
            padding: 0;
          }
          
          .print-header {
            text-align: center;
            border-bottom: 2px solid black;
            margin-bottom: 15pt;
            padding-bottom: 10pt;
          }
          
          .print-header h1 {
            font-size: 18pt;
            font-weight: bold;
            margin-bottom: 4pt;
          }
          
          .print-header h2 {
            font-size: 14pt;
            font-weight: bold;
            margin-top: 4pt;
          }
          
          .print-header p {
            font-size: 9pt;
            margin: 2pt 0;
          }
          
          .print-section {
            margin-bottom: 10pt;
            page-break-inside: avoid;
          }
          
          .print-field-grid {
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            gap: 15pt;
            margin-bottom: 10pt;
          }
          
          .print-field {
            margin-bottom: 6pt;
            display: flex;
            align-items: center;
          }
          
          .print-field label {
            font-weight: bold;
            font-size: 9pt;
            margin-right: 5pt;
            min-width: 80pt;
          }
          
          .print-field-value {
            border-bottom: 1px solid black;
            padding: 2pt 0;
            font-size: 10pt;
            min-height: 14pt;
            flex: 1;
          }
          
          .progress-table {
            width: 100%;
            border-collapse: collapse;
            margin: 10pt 0;
          }
          
          .progress-table th,
          .progress-table td {
            border: 1px solid black;
            padding: 8pt;
            text-align: left;
            font-size: 9pt;
            vertical-align: top;
            min-height: 40pt;
          }
          
          .progress-table th {
            background: #f0f0f0;
            font-weight: bold;
            text-align: center;
          }
          
          .progress-table .date-time-col {
            width: 15%;
          }
          
          .progress-table .notes-col {
            width: 21.25%;
          }
          
          .signature-section {
            margin-top: 20pt;
            page-break-inside: avoid;
          }
          
          .signature-box {
            border-bottom: 1px solid black;
            height: 25pt;
            margin: 5pt 0;
            width: 200pt;
          }
        </style>
      </head>
      <body>
        <div class="print-container">
          <!-- Header -->
          <div class="print-header">
            <h1>VALANT HOSPITAL</h1>
            <p>A-10, Madhav Vihar, Shobhagpura, Udaipur | +91-911911 8000</p>
            <h2>DOCTOR'S PROGRESS SHEET</h2>
          </div>

          <!-- Patient Information -->
          <div class="print-section">
            <div class="print-field-grid">
              <div class="print-field">
                <label>Patient's Name :</label>
                <span class="print-field-value">${formData.patientName || ''}</span>
              </div>
              <div class="print-field">
                <label>Age/Sex :</label>
                <span class="print-field-value">${formData.ageSex || ''}</span>
              </div>
              <div class="print-field">
                <label>IPD No. :</label>
                <span class="print-field-value">${formData.ipdNumber || ''}</span>
              </div>
            </div>
          </div>

          <!-- Progress Notes Table -->
          <div class="print-section">
            <h3 style="font-size: 12pt; font-weight: bold; margin-bottom: 8pt;">Progress Notes</h3>
            <table class="progress-table">
              <thead>
                <tr>
                  <th class="date-time-col">Date & Time</th>
                  <th class="notes-col">Clinical Notes</th>
                  <th class="notes-col">Investigation Advise</th>
                  <th class="notes-col">Treatment</th>
                  <th class="notes-col">Diet Advise</th>
                </tr>
              </thead>
              <tbody>
                ${formData.progressEntries.map(entry => `
                  <tr>
                    <td class="date-time-col">
                      ${entry.date || ''}<br>
                      ${entry.time || ''}
                    </td>
                    <td class="notes-col">${entry.clinicalNotes || ''}</td>
                    <td class="notes-col">${entry.investigationAdvise || ''}</td>
                    <td class="notes-col">${entry.treatment || ''}</td>
                    <td class="notes-col">${entry.dietAdvise || ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <!-- Signature Section -->
          <div class="signature-section">
            <div class="print-field">
              <label>Sign of Resident / Consultant :</label>
              <div class="signature-box"></div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        {/* Action Buttons */}
        <div className="flex justify-end gap-2 p-4 border-b print-hide">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
          >
            <span>🖨️</span> Print Progress Sheet
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>

        <div className="p-6">
          {/* Header Section */}
          <div className="text-center border-b-2 border-gray-300 pb-6 mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">VALANT HOSPITAL</h1>
            <p className="text-gray-600 text-sm mb-4">
              A-10, Madhav Vihar, Shobhagpura, Udaipur | +91-911911 8000
            </p>
            <h2 className="text-2xl font-semibold text-gray-800 uppercase tracking-wide">Doctor's Progress Sheet</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Patient Information Section */}
            <div className="bg-blue-50 p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 border-b border-gray-300 pb-2">Patient Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex items-center">
                  <label className="font-semibold text-sm w-32 flex-shrink-0">Patient's Name :</label>
                  <input 
                    type="text" 
                    name="patientName" 
                    value={formData.patientName}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
                
                <div className="flex items-center">
                  <label className="font-semibold text-sm w-32 flex-shrink-0">Age/Sex :</label>
                  <input 
                    type="text" 
                    name="ageSex" 
                    value={formData.ageSex}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  />
                </div>
                
                <div className="flex items-center">
                  <label className="font-semibold text-sm w-32 flex-shrink-0">IPD No. :</label>
                  <input 
                    type="text" 
                    name="ipdNumber" 
                    value={formData.ipdNumber}
                    onChange={handleInputChange}
                    className="flex-1 px-3 py-2 text-base border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Progress Notes Section */}
            <div className="bg-green-50 p-6 rounded-lg border shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-300 pb-2">Progress Notes</h3>
                <button
                  type="button"
                  onClick={addNewProgressEntry}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                >
                  <span>➕</span>
                  Add New Entry
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse border border-gray-300 rounded-lg overflow-hidden shadow-sm min-w-[1200px]">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-gray-300 p-4 text-left font-semibold text-sm w-[15%]">Date & Time</th>
                      <th className="border border-gray-300 p-4 text-left font-semibold text-sm w-[21.25%]">Clinical Notes</th>
                      <th className="border border-gray-300 p-4 text-left font-semibold text-sm w-[21.25%]">Investigation Advise</th>
                      <th className="border border-gray-300 p-4 text-left font-semibold text-sm w-[21.25%]">Treatment</th>
                      <th className="border border-gray-300 p-4 text-left font-semibold text-sm w-[21.25%]">Diet Advise</th>
                      <th className="border border-gray-300 p-4 text-center font-semibold text-sm w-[8%]">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.progressEntries.map((entry, index) => (
                      <tr key={entry.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="border border-gray-300 p-4 align-top w-[15%]">
                          <div className="space-y-3">
                            <input
                              type="date"
                              value={entry.date}
                              onChange={(e) => handleProgressEntryChange(entry.id, 'date', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                            <input
                              type="time"
                              value={entry.time}
                              onChange={(e) => handleProgressEntryChange(entry.id, 'time', e.target.value)}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              required
                            />
                          </div>
                        </td>
                        <td className="border border-gray-300 p-4 align-top w-[21.25%]">
                          <textarea
                            value={entry.clinicalNotes}
                            onChange={(e) => handleProgressEntryChange(entry.id, 'clinicalNotes', e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
                            placeholder="Enter detailed clinical observations, vital signs, patient condition, symptoms, and any relevant medical findings..."
                            required
                          />
                        </td>
                        <td className="border border-gray-300 p-4 align-top w-[21.25%]">
                          <textarea
                            value={entry.investigationAdvise}
                            onChange={(e) => handleProgressEntryChange(entry.id, 'investigationAdvise', e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
                            placeholder="Enter recommended investigations, lab tests, imaging studies, diagnostic procedures, and follow-up requirements..."
                          />
                        </td>
                        <td className="border border-gray-300 p-4 align-top w-[21.25%]">
                          <textarea
                            value={entry.treatment}
                            onChange={(e) => handleProgressEntryChange(entry.id, 'treatment', e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
                            placeholder="Enter treatment plan, medications, dosages, procedures, interventions, and care instructions..."
                          />
                        </td>
                        <td className="border border-gray-300 p-4 align-top w-[21.25%]">
                          <textarea
                            value={entry.dietAdvise}
                            onChange={(e) => handleProgressEntryChange(entry.id, 'dietAdvise', e.target.value)}
                            rows={6}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded resize-y focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
                            placeholder="Enter dietary recommendations, nutritional guidelines, food restrictions, fluid intake, and special dietary requirements..."
                          />
                        </td>
                        <td className="border border-gray-300 p-4 text-center align-top w-[8%]">
                          {formData.progressEntries.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeProgressEntry(entry.id)}
                              className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded text-sm shadow-sm"
                            >
                              ❌ Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Signature Section */}
            <div className="bg-yellow-50 p-6 rounded-lg border shadow-sm">
              <h3 className="text-lg font-semibold text-gray-800 mb-6 border-b border-gray-300 pb-2">Authorization</h3>
              
              <div className="flex items-center space-x-4">
                <label className="font-semibold text-sm flex-shrink-0">Sign of Resident / Consultant :</label>
                <div className="border-b-2 border-gray-400 h-16 flex-1 bg-white rounded-md shadow-sm">
                  <p className="text-xs text-gray-500 mt-1 px-2">Signature will be added manually</p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-center pt-8">
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 flex items-center gap-2 shadow-md"
              >
                <span>💾</span>
                Save Progress Sheet
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DoctorProgressSheet;