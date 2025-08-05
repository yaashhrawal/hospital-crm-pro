import React, { useState, useEffect } from 'react';
import type { PatientWithRelations } from '../config/supabaseNew';
import toast from 'react-hot-toast';

interface NursesNotesFormProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientWithRelations;
  bedNumber: number;
  ipdNumber?: string;
  onSubmit: (nursesNotesData: any) => void;
  savedData?: any; // Previously saved form data
}

const NursesNotesForm: React.FC<NursesNotesFormProps> = ({
  isOpen,
  onClose,
  patient,
  bedNumber,
  ipdNumber,
  onSubmit,
  savedData
}) => {
  // Get effective IPD number with fallback
  const [effectiveIPDNumber, setEffectiveIPDNumber] = useState<string>('');
  
  useEffect(() => {
    if (ipdNumber && ipdNumber !== 'IPD Number Not Available') {
      setEffectiveIPDNumber(ipdNumber);
    } else {
      // Try to find IPD number from localStorage as fallback
      const bedKeys = Object.keys(localStorage).filter(key => key.includes('-ipdNumber'));
      if (bedKeys.length > 0) {
        const latestKey = bedKeys[bedKeys.length - 1];
        const fallbackIPD = localStorage.getItem(latestKey);
        if (fallbackIPD) {
          setEffectiveIPDNumber(fallbackIPD);
        } else {
          setEffectiveIPDNumber('IPD Number Not Available');
        }
      } else {
        setEffectiveIPDNumber('IPD Number Not Available');
      }
    }
  }, [ipdNumber, isOpen]);

  const [nursesNotes, setNursesNotes] = useState({
    morningNotes: savedData?.nursesNotes?.morningNotes || '',
    morningSign: savedData?.nursesNotes?.morningSign || '',
    eveningNotes: savedData?.nursesNotes?.eveningNotes || '',
    eveningSign: savedData?.nursesNotes?.eveningSign || '',
    nightNotes: savedData?.nursesNotes?.nightNotes || '',
    nightSign: savedData?.nursesNotes?.nightSign || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const nursesNotesData = {
      patientId: patient.id,
      bedNumber,
      nursesNotes,
      submittedAt: new Date().toISOString()
    };

    onSubmit(nursesNotesData);
    toast.success('Nurses Notes saved successfully');
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=700');
    
    if (printWindow) {
      const fullPrintContent = generatePrintContent();
      printWindow.document.write(fullPrintContent);
      printWindow.document.close();
      printWindow.focus();
      
      setTimeout(() => {
        try {
          printWindow.print();
        } catch (error) {
          console.error('Print error:', error);
        }
      }, 500);
    }
  };

  const generatePrintContent = () => {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Nurses Notes - ${patient.first_name} ${patient.last_name}</title>
  <meta charset="utf-8">
  <style>
    @page { margin: 0.5in; size: A4 portrait; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11pt; line-height: 1.4; color: black; }
    .print-header { text-align: center; border-bottom: 2px solid black; margin-bottom: 20pt; padding-bottom: 10pt; }
    .print-header h1 { font-size: 18pt; font-weight: bold; margin-bottom: 4pt; }
    .print-header h2 { font-size: 14pt; font-weight: bold; margin-top: 4pt; }
    .print-header p { font-size: 9pt; margin: 2pt 0; }
    .notes-section { margin-bottom: 20pt; border: 1px solid #ccc; padding: 15pt; }
    .notes-header { font-size: 12pt; font-weight: bold; margin-bottom: 10pt; color: #333; }
    .notes-content { border: 1px solid #999; padding: 10pt; min-height: 100pt; background: white; font-size: 10pt; }
    .signature-line { margin-top: 10pt; display: flex; align-items: center; }
    .signature-label { font-weight: bold; margin-right: 10pt; }
    .signature-box { border-bottom: 1px solid black; flex: 1; height: 20pt; }
  </style>
</head>
<body>
  <div class="print-header">
    <h1>VALANT HOSPITAL</h1>
    <p>A-10, Madhav Vihar, Shobhagpura, Udaipur | +91-911911 8000</p>
    <h2>NURSES NOTES</h2>
    <p>Patient: ${patient.first_name} ${patient.last_name} | Bed: ${bedNumber}</p>
    <p>Date: ${new Date().toLocaleDateString()}</p>
  </div>
  
  <div class="notes-section">
    <div class="notes-header">🌅 MORNING NOTES</div>
    <div class="notes-content">${nursesNotes.morningNotes}</div>
    <div class="signature-line">
      <span class="signature-label">Signature:</span>
      <div class="signature-box">${nursesNotes.morningSign}</div>
    </div>
  </div>

  <div class="notes-section">
    <div class="notes-header">🌇 EVENING NOTES</div>
    <div class="notes-content">${nursesNotes.eveningNotes}</div>
    <div class="signature-line">
      <span class="signature-label">Signature:</span>
      <div class="signature-box">${nursesNotes.eveningSign}</div>
    </div>
  </div>

  <div class="notes-section">
    <div class="notes-header">🌙 NIGHT NOTES</div>
    <div class="notes-content">${nursesNotes.nightNotes}</div>
    <div class="signature-line">
      <span class="signature-label">Signature:</span>
      <div class="signature-box">${nursesNotes.nightSign}</div>
    </div>
  </div>
</body>
</html>`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full max-h-[95vh] overflow-y-auto">
        <div className="flex justify-between items-center p-4 border-b bg-gray-50">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Nurses Notes</h2>
            <p className="text-sm text-gray-600">
              Patient: {patient.first_name} {patient.last_name} | Bed: {bedNumber}
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-2"
            >
              <span>🖨️</span> Print Notes
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="space-y-6">
            {/* Patient Information */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-3">Patient Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID</label>
                  <input
                    type="text"
                    value={patient.patient_id}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">IPD No.</label>
                  <input
                    type="text"
                    value={effectiveIPDNumber || 'IPD Number Not Available'}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bed Number</label>
                  <input
                    type="text"
                    value={bedNumber}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                  />
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold text-gray-800">Shift-Based Nursing Documentation</h3>
            
            {/* Morning Notes */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>🌅</span>
                Morning Notes
              </h4>
              <div className="space-y-3">
                <textarea
                  value={nursesNotes.morningNotes}
                  onChange={(e) => setNursesNotes(prev => ({ ...prev, morningNotes: e.target.value }))}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  placeholder="Enter morning shift nursing observations, patient condition, medications administered, vital signs, procedures performed, patient responses, and any concerns or changes in condition..."
                />
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 min-w-[80px]">Signature:</label>
                  <input
                    type="text"
                    value={nursesNotes.morningSign}
                    onChange={(e) => setNursesNotes(prev => ({ ...prev, morningSign: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Name and signature of morning shift nurse"
                  />
                </div>
              </div>
            </div>

            {/* Evening Notes */}
            <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>🌇</span>
                Evening Notes
              </h4>
              <div className="space-y-3">
                <textarea
                  value={nursesNotes.eveningNotes}
                  onChange={(e) => setNursesNotes(prev => ({ ...prev, eveningNotes: e.target.value }))}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  placeholder="Enter evening shift nursing observations, patient condition, medications administered, vital signs, procedures performed, patient responses, and any concerns or changes in condition..."
                />
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 min-w-[80px]">Signature:</label>
                  <input
                    type="text"
                    value={nursesNotes.eveningSign}
                    onChange={(e) => setNursesNotes(prev => ({ ...prev, eveningSign: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Name and signature of evening shift nurse"
                  />
                </div>
              </div>
            </div>

            {/* Night Notes */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <span>🌙</span>
                Night Notes
              </h4>
              <div className="space-y-3">
                <textarea
                  value={nursesNotes.nightNotes}
                  onChange={(e) => setNursesNotes(prev => ({ ...prev, nightNotes: e.target.value }))}
                  rows={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                  placeholder="Enter night shift nursing observations, patient condition, medications administered, vital signs, procedures performed, patient responses, and any concerns or changes in condition..."
                />
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700 min-w-[80px]">Signature:</label>
                  <input
                    type="text"
                    value={nursesNotes.nightSign}
                    onChange={(e) => setNursesNotes(prev => ({ ...prev, nightSign: e.target.value }))}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Name and signature of night shift nurse"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-8 border-t">
            <button 
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-200 flex items-center gap-2 shadow-md"
            >
              <span>💾</span>
              Save Nurses Notes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NursesNotesForm;