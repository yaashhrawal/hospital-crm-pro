import React from 'react';
import type { PatientWithRelations } from '../config/supabaseNew';
import { getDoctorWithDegree } from '../data/doctorDegrees';

interface ValantPrescriptionProps {
  patient: PatientWithRelations;
  onClose: () => void;
}

const ValantPrescription: React.FC<ValantPrescriptionProps> = ({ patient, onClose }) => {
  const handlePrint = () => {
    window.print();
  };


  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-IN');
  };

  // Get the correct doctor name and degree from patient data
  const getDoctorInfo = () => {
    console.log('🩺 Patient data for prescription:', patient);
    console.log('👨‍⚕️ Patient assigned_doctor field:', patient.assigned_doctor);
    console.log('🏥 Patient assigned_department field:', patient.assigned_department);
    console.log('🎂 Patient age field:', patient.age, 'Type:', typeof patient.age);
    console.log('🔄 Database migration completed - using assigned_doctor column');
    
    const doctorName = patient.assigned_doctor || 'DR. BATUL PEEPAWALA';
    return getDoctorWithDegree(doctorName);
  };

  const getDepartmentName = () => {
    return patient.assigned_department || 'GENERAL PHYSICIAN';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Print-specific styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              margin: 0;
              size: A3;
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
              width: 297mm;
              height: 420mm;
            }
            #prescription-content > div {
              width: 297mm;
              height: 420mm;
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
          className="relative w-full h-[842px] bg-cover bg-center bg-no-repeat print:w-[297mm] print:h-[420mm]"
          style={{ 
            backgroundImage: 'url(/valant-prescription-template.png)',
            backgroundSize: '100% 100%',
            backgroundPosition: 'center'
          }}
        >
          {/* Doctor Name - Top Right for Valant */}
          <div className="absolute top-12 right-12 text-right">
            <div className="font-bold text-3xl uppercase" style={{ fontFamily: 'Canva Sans, sans-serif', color: '#4E1BB2' }}>
              {getDoctorInfo().name}
            </div>
            {getDoctorInfo().degree && (
              <div className="text-lg mt-1 font-medium" style={{ fontFamily: 'Canva Sans, sans-serif', color: '#4E1BB2' }}>
                {getDoctorInfo().degree}
              </div>
            )}
            <div className="text-lg mt-1" style={{ fontFamily: 'Canva Sans, sans-serif', color: '#4E1BB2' }}>
              {getDepartmentName()}
            </div>
          </div>

          {/* Patient Details - Left Side */}
          <div className="absolute top-72 left-12 space-y-2">
            {/* Name */}
            <div className="flex items-center">
              <span className="w-24 text-sm font-medium text-gray-700">Name:</span>
              <span className="text-base font-medium text-gray-900">
                {patient.prefix ? `${patient.prefix} ` : ''}{patient.first_name} {patient.last_name}
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
              <span className="text-base text-gray-900">{getDepartmentName()}</span>
            </div>
          </div>

          {/* Date and Age/Sex - Right Side */}
          <div className="absolute top-72 right-0 mr-12 space-y-2 text-right">
            {/* Date */}
            <div className="flex items-center justify-end">
              <span className="text-sm font-medium text-gray-700 mr-2">Date:</span>
              <span className="text-base text-gray-900">{getCurrentDate()}</span>
            </div>

            {/* Age/Sex */}
            <div className="flex items-center justify-end">
              <span className="text-sm font-medium text-gray-700 mr-2">Age/Sex:</span>
              <span className="text-base text-gray-900">
                {patient.age && patient.age.trim() !== '' ? `${patient.age} years` : 'N/A'} / {patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : patient.gender}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ValantPrescription;