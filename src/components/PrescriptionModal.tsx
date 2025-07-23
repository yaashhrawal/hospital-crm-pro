import React, { useState } from 'react';
import { PatientWithRelations } from '../config/supabaseNew';
import PrescriptionTemplate from './PrescriptionTemplate';

interface Medication {
  name: string;
  strength?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface PrescriptionModalProps {
  patient: PatientWithRelations;
  isOpen: boolean;
  onClose: () => void;
  template: 'VALANT' | 'VH';
}

const PrescriptionModal: React.FC<PrescriptionModalProps> = ({
  patient,
  isOpen,
  onClose,
  template
}) => {
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', strength: '', dosage: '', frequency: '', duration: '', instructions: '' }
  ]);
  const [diagnosis, setDiagnosis] = useState('');
  const [advice, setAdvice] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  if (!isOpen) return null;

  const addMedication = () => {
    setMedications([...medications, { name: '', strength: '', dosage: '', frequency: '', duration: '', instructions: '' }]);
  };

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index));
    }
  };

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = medications.map((med, i) => 
      i === index ? { ...med, [field]: value } : med
    );
    setMedications(updated);
  };

  const generatePrescription = () => {
    // Validate required fields
    const validMedications = medications.filter(med => med.name.trim() !== '');
    if (validMedications.length === 0) {
      alert('Please add at least one medication');
      return;
    }

    setShowPreview(true);
  };

  const prescriptionData = {
    patient: {
      patient_id: patient.patient_id,
      first_name: patient.first_name,
      last_name: patient.last_name,
      age: patient.age,
      gender: patient.gender,
      phone: patient.phone,
      address: patient.address,
      assigned_doctor: patient.assigned_doctor,
      assigned_department: patient.assigned_department,
    },
    prescriptionNumber: `${template}-${Date.now().toString().slice(-6)}`,
    date: new Date().toLocaleDateString('en-IN'),
    medications: medications.filter(med => med.name.trim() !== ''),
    diagnosis: diagnosis.trim() || undefined,
    advice: advice.trim() || undefined,
    followUpDate: followUpDate || undefined,
    template
  };

  if (showPreview) {
    return (
      <PrescriptionTemplate
        data={prescriptionData}
        onClose={() => {
          setShowPreview(false);
          onClose();
        }}
      />
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Create {template} Prescription
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Patient: {patient.first_name} {patient.last_name} (ID: {patient.patient_id})
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Patient & Doctor Info Display */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold mb-2 text-gray-800">Patient & Doctor Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Patient:</strong> {patient.first_name} {patient.last_name}</p>
                <p><strong>Age/Gender:</strong> {patient.age} years / {patient.gender}</p>
                <p><strong>Phone:</strong> {patient.phone || 'N/A'}</p>
              </div>
              <div>
                <p><strong>Assigned Doctor:</strong> {patient.assigned_doctor || 'Not Assigned'}</p>
                <p><strong>Department:</strong> {patient.assigned_department || 'General Medicine'}</p>
                <p><strong>Patient ID:</strong> {patient.patient_id}</p>
              </div>
            </div>
          </div>

          {/* Diagnosis */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Diagnosis
            </label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter patient diagnosis..."
            />
          </div>

          {/* Medications */}
          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium text-gray-700">
                Medications
              </label>
              <button
                onClick={addMedication}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
              >
                + Add Medication
              </button>
            </div>
            
            <div className="space-y-4">
              {medications.map((med, index) => (
                <div key={index} className="border border-gray-200 p-4 rounded-lg">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="text-sm font-medium text-gray-700">Medication {index + 1}</h4>
                    {medications.length > 1 && (
                      <button
                        onClick={() => removeMedication(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Medicine Name *
                      </label>
                      <input
                        type="text"
                        value={med.name}
                        onChange={(e) => updateMedication(index, 'name', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g., Paracetamol"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Strength
                      </label>
                      <input
                        type="text"
                        value={med.strength || ''}
                        onChange={(e) => updateMedication(index, 'strength', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g., 500mg"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Dosage *
                      </label>
                      <input
                        type="text"
                        value={med.dosage}
                        onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g., 1 tablet"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Frequency *
                      </label>
                      <select
                        value={med.frequency}
                        onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        required
                      >
                        <option value="">Select</option>
                        <option value="Once daily">Once daily</option>
                        <option value="Twice daily">Twice daily</option>
                        <option value="Three times daily">Three times daily</option>
                        <option value="Four times daily">Four times daily</option>
                        <option value="Every 4 hours">Every 4 hours</option>
                        <option value="Every 6 hours">Every 6 hours</option>
                        <option value="Every 8 hours">Every 8 hours</option>
                        <option value="As needed">As needed</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Duration *
                      </label>
                      <input
                        type="text"
                        value={med.duration}
                        onChange={(e) => updateMedication(index, 'duration', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="e.g., 5 days"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Special Instructions
                    </label>
                    <input
                      type="text"
                      value={med.instructions || ''}
                      onChange={(e) => updateMedication(index, 'instructions', e.target.value)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g., Take after meals"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advice */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medical Advice
            </label>
            <textarea
              value={advice}
              onChange={(e) => setAdvice(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter medical advice, precautions, or general instructions..."
            />
          </div>

          {/* Follow-up Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Follow-up Date (Optional)
            </label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={generatePrescription}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Generate Prescription
          </button>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionModal;