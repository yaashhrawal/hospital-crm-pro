import React from 'react';
import type { PatientWithRelations } from '../config/supabaseNew';

interface ValantPrescriptionProps {
  patient: PatientWithRelations;
  onClose: () => void;
}

const ValantPrescription: React.FC<ValantPrescriptionProps> = ({ patient, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const getAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'N/A';
    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      if (isNaN(birthDate.getTime())) return 'N/A';
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (error) {
      return 'N/A';
    }
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-IN');
  };

  // Get the correct doctor name from patient data
  const getDoctorName = () => {
    // For now, return default doctor until we know the exact column names
    return 'DR. BATUL PEEPAWALA';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Print-specific styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              margin: 0;
              size: A4;
            }
            body * {
              visibility: hidden;
            }
            #prescription-content, #prescription-content * {
              visibility: visible;
            }
            #prescription-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              height: 100%;
            }
          }
        `
      }} />
      
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Print and Close buttons */}
        <div className="flex justify-end gap-2 p-4 border-b print:hidden">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-2"
          >
            <span>🖨️</span> Print Prescription
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>

        {/* Prescription Content */}
        <div 
          id="prescription-content" 
          className="relative w-full h-[842px] bg-cover bg-center bg-no-repeat print:h-screen"
          style={{ 
            backgroundImage: 'url(/valant-prescription-template.png)',
            backgroundSize: 'contain',
            backgroundPosition: 'center top'
          }}
        >
          {/* Doctor Name - Top Right for Valant */}
          <div className="absolute top-12 right-12 text-right">
            <div className="text-violet-800 font-bold text-lg uppercase">
              {getDoctorName()}
            </div>
            <div className="text-violet-700 text-sm mt-1">
              GENERAL PHYSICIAN
            </div>
          </div>

          {/* Patient Details - Left Side */}
          <div className="absolute top-40 left-12 space-y-2">
            {/* Name */}
            <div className="flex items-center">
              <span className="w-24 text-sm font-medium text-gray-700">Name:</span>
              <span className="text-base font-medium text-gray-900">
                {patient.first_name} {patient.last_name}
              </span>
            </div>

            {/* Patient No */}
            <div className="flex items-center">
              <span className="w-24 text-sm font-medium text-gray-700">Patient No:</span>
              <span className="text-base text-gray-900">{patient.patient_id}</span>
            </div>

            {/* Department */}
            <div className="flex items-center">
              <span className="w-24 text-sm font-medium text-gray-700">Department:</span>
              <span className="text-base text-gray-900">GENERAL PHYSICIAN</span>
            </div>
          </div>

          {/* Date and Age/Sex - Right Side */}
          <div className="absolute top-40 right-12 space-y-2">
            {/* Date */}
            <div className="flex items-center">
              <span className="w-20 text-sm font-medium text-gray-700">Date:</span>
              <span className="text-base text-gray-900">{getCurrentDate()}</span>
            </div>

            {/* Age/Sex */}
            <div className="flex items-center">
              <span className="w-20 text-sm font-medium text-gray-700">Age/Sex:</span>
              <span className="text-base text-gray-900">
                {getAge(patient.date_of_birth)} / {patient.gender}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValantPrescription;