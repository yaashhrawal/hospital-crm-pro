import React, { useState } from 'react';
import type { Patient, AssignedDoctor } from '../config/supabaseNew';
import ValantPrescription from './ValantPrescription';
import VHPrescription from './VHPrescription';

interface MultiplePrescriptionGeneratorProps {
  patient: Patient;
  prescriptionType: 'valant' | 'vh';
  onClose: () => void;
}

const MultiplePrescriptionGenerator: React.FC<MultiplePrescriptionGeneratorProps> = ({
  patient,
  prescriptionType,
  onClose
}) => {
  const [currentDoctorIndex, setCurrentDoctorIndex] = useState(0);
  const [showPrescription, setShowPrescription] = useState(false);

  // Get assigned doctors from patient data
  const assignedDoctors: AssignedDoctor[] = patient.assigned_doctors || [];
  
  // If no multiple doctors, show single doctor prescription
  if (assignedDoctors.length === 0) {
    // Fallback to single doctor format
    const singleDoctorData: AssignedDoctor = {
      name: patient.assigned_doctor || 'GENERAL PHYSICIAN',
      department: patient.assigned_department || 'GENERAL',
      isPrimary: true
    };
    assignedDoctors.push(singleDoctorData);
  }

  const currentDoctor = assignedDoctors[currentDoctorIndex];

  const handleNextDoctor = () => {
    if (currentDoctorIndex < assignedDoctors.length - 1) {
      setCurrentDoctorIndex(currentDoctorIndex + 1);
      setShowPrescription(false);
      setTimeout(() => setShowPrescription(true), 100);
    }
  };

  const handlePreviousDoctor = () => {
    if (currentDoctorIndex > 0) {
      setCurrentDoctorIndex(currentDoctorIndex - 1);
      setShowPrescription(false);
      setTimeout(() => setShowPrescription(true), 100);
    }
  };

  const handleGenerateAll = () => {
    // Generate all prescriptions sequentially
    assignedDoctors.forEach((doctor, index) => {
      setTimeout(() => {
        setCurrentDoctorIndex(index);
        setShowPrescription(true);
        // Auto-trigger print/download after a short delay
        setTimeout(() => {
          window.print();
        }, 500);
      }, index * 2000); // 2 second delay between each prescription
    });
  };

  // Create a modified patient object with current doctor info
  const modifiedPatient: Patient = {
    ...patient,
    assigned_doctor: currentDoctor.name,
    assigned_department: currentDoctor.department
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-purple-600 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Multiple Doctor Prescriptions</h2>
            <p className="text-purple-100">
              Patient: {patient.first_name} {patient.last_name} • {assignedDoctors.length} Doctor(s)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-purple-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Doctor Navigation */}
        <div className="bg-gray-50 p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm font-medium text-gray-600">
                Doctor {currentDoctorIndex + 1} of {assignedDoctors.length}:
              </span>
              <div className="bg-white px-3 py-1 rounded-lg border">
                <span className="font-semibold text-purple-600">{currentDoctor.name}</span>
                <span className="text-gray-500 ml-2">({currentDoctor.department})</span>
                {currentDoctor.isPrimary && (
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium ml-2">
                    Primary
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePreviousDoctor}
                disabled={currentDoctorIndex === 0}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ← Previous
              </button>
              <button
                onClick={handleNextDoctor}
                disabled={currentDoctorIndex === assignedDoctors.length - 1}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next →
              </button>
              <button
                onClick={handleGenerateAll}
                className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
              >
                📋 Generate All
              </button>
            </div>
          </div>

          {/* Progress Indicator */}
          <div className="mt-3">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentDoctorIndex + 1) / assignedDoctors.length) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Prescription Content */}
        <div className="flex-1 overflow-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
          {prescriptionType === 'valant' ? (
            <ValantPrescription
              patient={modifiedPatient}
              onClose={() => {}}
            />
          ) : (
            <VHPrescription
              patient={modifiedPatient}
              onClose={() => {}}
            />
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 p-4 border-t">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              💡 Use "Generate All" to create all prescriptions sequentially, or navigate individually.
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                🖨️ Print Current
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MultiplePrescriptionGenerator;