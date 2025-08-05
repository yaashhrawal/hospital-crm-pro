import React, { useState } from 'react';
import { X, Plus, Printer } from 'lucide-react';
import toast from 'react-hot-toast';

interface PhysiotherapyNote {
  id: string;
  dateTime: string;
  notes: string;
  initials: string;
}

interface PhysiotherapyFormData {
  patientName: string;
  roomBedNo: string;
  consultant: string;
  physiotherapist: string;
  diagnosisSurgery: string;
  notes: PhysiotherapyNote[];
}

interface PhysiotherapyNotesFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PhysiotherapyFormData) => void;
  patientName?: string;
  bedNumber?: string;
  initialData?: PhysiotherapyFormData;
}

const PhysiotherapyNotesForm: React.FC<PhysiotherapyNotesFormProps> = ({
  isOpen,
  onClose,
  onSubmit,
  patientName = '',
  bedNumber = '',
  initialData
}) => {
  const [formData, setFormData] = useState<PhysiotherapyFormData>(() => ({
    patientName: initialData?.patientName || patientName,
    roomBedNo: initialData?.roomBedNo || bedNumber,
    consultant: initialData?.consultant || '',
    physiotherapist: initialData?.physiotherapist || '',
    diagnosisSurgery: initialData?.diagnosisSurgery || '',
    notes: initialData?.notes || [
      {
        id: '1',
        dateTime: new Date().toISOString().slice(0, 16), // Format for datetime-local
        notes: '',
        initials: ''
      }
    ]
  }));

  const handleInputChange = (field: keyof PhysiotherapyFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNoteChange = (noteId: string, field: keyof PhysiotherapyNote, value: string) => {
    setFormData(prev => ({
      ...prev,
      notes: prev.notes.map(note =>
        note.id === noteId ? { ...note, [field]: value } : note
      )
    }));
  };

  const addNewRow = () => {
    const newNote: PhysiotherapyNote = {
      id: Date.now().toString(),
      dateTime: new Date().toISOString().slice(0, 16),
      notes: '',
      initials: ''
    };
    
    setFormData(prev => ({
      ...prev,
      notes: [...prev.notes, newNote]
    }));
  };

  const removeRow = (noteId: string) => {
    if (formData.notes.length > 1) {
      setFormData(prev => ({
        ...prev,
        notes: prev.notes.filter(note => note.id !== noteId)
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!formData.patientName.trim()) {
      toast.error('Patient name is required');
      return;
    }
    
    if (!formData.physiotherapist.trim()) {
      toast.error('Physiotherapist name is required');
      return;
    }

    // Check if at least one note has content
    const hasValidNotes = formData.notes.some(note => 
      note.notes.trim() || note.initials.trim()
    );
    
    if (!hasValidNotes) {
      toast.error('Please add at least one physiotherapy note');
      return;
    }

    onSubmit(formData);
    toast.success('Physiotherapy Notes saved successfully!');
    onClose();
  };

  const handlePrint = () => {
    const printContent = `
      <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
          <h1 style="margin: 0; color: #333; font-size: 28px;">PHYSIOTHERAPY NOTES</h1>
          <p style="margin: 5px 0; color: #666;">Comprehensive Physiotherapy Assessment & Treatment Record</p>
        </div>
        
        <div style="margin-bottom: 30px;">
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 15px;">
            <div><strong>Pt. Name:</strong> ${formData.patientName}</div>
            <div><strong>Room/Bed No.:</strong> ${formData.roomBedNo}</div>
            <div><strong>Consultant:</strong> ${formData.consultant}</div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
            <div><strong>Physiotherapist:</strong> ${formData.physiotherapist}</div>
            <div><strong>Diagnosis/Surgery:</strong> ${formData.diagnosisSurgery}</div>
          </div>
        </div>

        <table style="width: 100%; border-collapse: collapse; margin-bottom: 30px;">
          <thead>
            <tr style="background-color: #f8f9fa;">
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Date & Time</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Physiotherapy Notes</th>
              <th style="border: 1px solid #ddd; padding: 12px; text-align: left; font-weight: bold;">Physiotherapist's Initials</th>
            </tr>
          </thead>
          <tbody>
            ${formData.notes.map(note => `
              <tr>
                <td style="border: 1px solid #ddd; padding: 12px; vertical-align: top; width: 150px;">
                  ${note.dateTime ? new Date(note.dateTime).toLocaleDateString('en-IN', { 
                    day: '2-digit', 
                    month: '2-digit', 
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : ''}
                </td>
                <td style="border: 1px solid #ddd; padding: 12px; vertical-align: top;">
                  ${note.notes.replace(/\n/g, '<br>')}
                </td>
                <td style="border: 1px solid #ddd; padding: 12px; vertical-align: top; width: 120px; text-align: center;">
                  ${note.initials}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div style="margin-top: 40px; display: flex; justify-content: space-between; align-items: center;">
          <div style="text-align: left;">
            <p style="margin: 0;"><strong>Form Generated:</strong> ${new Date().toLocaleDateString('en-IN')}</p>
          </div>
          <div style="text-align: right;">
            <div style="border-top: 1px solid #000; width: 200px; margin-top: 40px; padding-top: 5px;">
              <p style="margin: 0; text-align: center; font-size: 12px;">Authorized Signature</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Physiotherapy Notes - ${formData.patientName}</title>
          <style>
            @media print {
              body { margin: 0; }
              @page { margin: 1cm; }
            }
          </style>
        </head>
        <body>
          ${printContent}
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <span className="text-2xl">🏥</span>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">Physiotherapy Notes</h2>
              <p className="text-sm text-gray-600">Comprehensive physiotherapy assessment and treatment record</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 transition-colors"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Form Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Patient Details Header */}
            <div className="bg-gray-50 p-4 rounded-lg space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-2">
                Patient Details
              </h3>
              
              {/* First Row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pt. Name *
                  </label>
                  <input
                    type="text"
                    value={formData.patientName}
                    onChange={(e) => handleInputChange('patientName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter patient name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room/Bed No.
                  </label>
                  <input
                    type="text"
                    value={formData.roomBedNo}
                    onChange={(e) => handleInputChange('roomBedNo', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter room/bed number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Consultant
                  </label>
                  <input
                    type="text"
                    value={formData.consultant}
                    onChange={(e) => handleInputChange('consultant', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter consultant name"
                  />
                </div>
              </div>

              {/* Second Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Physiotherapist *
                  </label>
                  <input
                    type="text"
                    value={formData.physiotherapist}
                    onChange={(e) => handleInputChange('physiotherapist', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter physiotherapist name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Diagnosis/Surgery
                  </label>
                  <input
                    type="text"
                    value={formData.diagnosisSurgery}
                    onChange={(e) => handleInputChange('diagnosisSurgery', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter diagnosis or surgery details"
                  />
                </div>
              </div>
            </div>

            {/* Notes Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-800">Physiotherapy Notes</h3>
                <button
                  type="button"
                  onClick={addNewRow}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  Add New Row
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                        Date & Time
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                        Physiotherapy Notes
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200">
                        Physiotherapist's Initials
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 border-b border-gray-200 w-16">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {formData.notes.map((note, index) => (
                      <tr key={note.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-4 py-3 border-b border-gray-200">
                          <input
                            type="datetime-local"
                            value={note.dateTime}
                            onChange={(e) => handleNoteChange(note.id, 'dateTime', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          />
                        </td>
                        <td className="px-4 py-3 border-b border-gray-200">
                          <textarea
                            value={note.notes}
                            onChange={(e) => handleNoteChange(note.id, 'notes', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                            rows={3}
                            placeholder="Enter physiotherapy notes, observations, treatments, exercises prescribed, patient progress, etc."
                          />
                        </td>
                        <td className="px-4 py-3 border-b border-gray-200">
                          <input
                            type="text"
                            value={note.initials}
                            onChange={(e) => handleNoteChange(note.id, 'initials', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-sm text-center"
                            placeholder="Initials"
                            maxLength={10}
                          />
                        </td>
                        <td className="px-4 py-3 border-b border-gray-200">
                          {formData.notes.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeRow(note.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Remove row"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {formData.notes.length === 0 && (
                <div className="text-center py-8 text-gray-500 border border-dashed border-gray-300 rounded-lg">
                  <p>No notes added yet. Click "Add New Row" to start.</p>
                </div>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Save Physiotherapy Notes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PhysiotherapyNotesForm;