import React from 'react';

interface PrescriptionData {
  patient: {
    patient_id: string;
    first_name: string;
    last_name?: string;
    age?: number;
    gender?: string;
    phone?: string;
    address?: string;
    assigned_doctor?: string;
    assigned_department?: string;
  };
  prescriptionNumber: string;
  date: string;
  medications: Medication[];
  diagnosis?: string;
  advice?: string;
  followUpDate?: string;
  template: 'VALANT' | 'VH';
}

interface Medication {
  name: string;
  strength?: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface PrescriptionTemplateProps {
  data: PrescriptionData;
  onClose: () => void;
}

const PrescriptionTemplate: React.FC<PrescriptionTemplateProps> = ({ data, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const getAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return data.patient.age || 'N/A';
    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      if (isNaN(birthDate.getTime())) return data.patient.age || 'N/A';
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (error) {
      return data.patient.age || 'N/A';
    }
  };

  const renderValantTemplate = () => (
    <div className="prescription-template bg-white p-8 max-w-4xl mx-auto">
      {/* Print-specific styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              margin: 0.5in;
              size: A4;
            }
            body * {
              visibility: hidden;
            }
            .prescription-template, .prescription-template * {
              visibility: visible;
            }
            .prescription-template {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .print\\\\:hidden {
              display: none !important;
            }
          }
        `
      }} />

      {/* Header */}
      <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
        <div className="flex items-center justify-center mb-4">
          <img 
            src="/logo.png" 
            alt="VALANT Hospital Logo" 
            className="h-20 w-auto"
            style={{ maxHeight: '80px', height: 'auto', width: 'auto' }}
          />
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">VALANT HOSPITAL</h1>
        <div className="text-sm text-gray-600">
          <p>10, Madhav Vihar Shobhagpura, Udaipur (313001)</p>
          <p>Phone: +91 9119118000 | Email: valanthospital@gmail.com</p>
          <p>Website: www.valanthospital.com</p>
        </div>
      </div>

      {/* Prescription Header */}
      <div className="mb-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">PRESCRIPTION</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Prescription No:</strong> {data.prescriptionNumber}</p>
            <p><strong>Date:</strong> {data.date}</p>
          </div>
          <div className="text-right">
            <p><strong>Patient ID:</strong> {data.patient.patient_id}</p>
            <p><strong>Department:</strong> {data.patient.assigned_department || 'General Medicine'}</p>
          </div>
        </div>
      </div>

      {/* Doctor Information */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-2 text-gray-800">Doctor Information</h3>
        <div className="text-sm">
          <p><strong>Dr. {data.patient.assigned_doctor || 'Not Assigned'}</strong></p>
          <p>Department: {data.patient.assigned_department || 'General Medicine'}</p>
        </div>
      </div>

      {/* Patient Information */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-3 text-gray-800">Patient Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Name:</strong> {data.patient.first_name} {data.patient.last_name || ''}</p>
            <p><strong>Age/Gender:</strong> {getAge('')} years / {data.patient.gender || 'N/A'}</p>
            <p><strong>Phone:</strong> {data.patient.phone || 'N/A'}</p>
          </div>
          <div>
            <p><strong>Address:</strong> {data.patient.address || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Diagnosis */}
      {data.diagnosis && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-gray-800">Diagnosis:</h3>
          <p className="text-sm bg-yellow-50 p-3 rounded border-l-4 border-yellow-400">
            {data.diagnosis}
          </p>
        </div>
      )}

      {/* Medications */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3 text-gray-800">Rx (Medications)</h3>
        <div className="space-y-3">
          {data.medications.map((med, index) => (
            <div key={index} className="border border-gray-200 p-3 rounded">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {index + 1}. {med.name} {med.strength && `(${med.strength})`}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    <strong>Dosage:</strong> {med.dosage} | <strong>Frequency:</strong> {med.frequency} | <strong>Duration:</strong> {med.duration}
                  </p>
                  {med.instructions && (
                    <p className="text-sm text-blue-600 mt-1">
                      <strong>Instructions:</strong> {med.instructions}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advice */}
      {data.advice && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-gray-800">Advice:</h3>
          <p className="text-sm bg-green-50 p-3 rounded border-l-4 border-green-400">
            {data.advice}
          </p>
        </div>
      )}

      {/* Follow-up */}
      {data.followUpDate && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-gray-800">Follow-up:</h3>
          <p className="text-sm bg-blue-50 p-3 rounded border-l-4 border-blue-400">
            Next visit: {data.followUpDate}
          </p>
        </div>
      )}

      {/* Signature */}
      <div className="mt-8 text-right">
        <div className="inline-block">
          <div className="border-t border-gray-400 pt-2 mt-12" style={{ minWidth: '200px' }}>
            <p className="text-sm font-medium">Dr. {data.patient.assigned_doctor || 'Not Assigned'}</p>
            <p className="text-xs text-gray-600">{data.patient.assigned_department || 'General Medicine'}</p>
            <p className="text-xs text-gray-600 mt-1">VALANT HOSPITAL</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
        <p>This is a computer-generated prescription</p>
        <p className="mt-1">Generated on {data.date}</p>
      </div>
    </div>
  );

  const renderVHTemplate = () => (
    <div className="prescription-template bg-white p-8 max-w-4xl mx-auto">
      {/* Print-specific styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              margin: 0.5in;
              size: A4;
            }
            body * {
              visibility: hidden;
            }
            .prescription-template, .prescription-template * {
              visibility: visible;
            }
            .prescription-template {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .print\\\\:hidden {
              display: none !important;
            }
          }
        `
      }} />

      {/* Header */}
      <div className="text-center border-b-2 border-green-500 pb-6 mb-6">
        <h1 className="text-2xl font-bold text-green-700 mb-2">V+H HOSPITAL</h1>
        <div className="text-sm text-gray-600">
          <p>Healthcare Excellence & Innovation</p>
          <p>10, Madhav Vihar Shobhagpura, Udaipur (313001)</p>
          <p>Phone: +91 9119118000 | Email: contact@vhhospital.com</p>
        </div>
      </div>

      {/* Prescription Header */}
      <div className="mb-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">MEDICAL PRESCRIPTION</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Prescription No:</strong> {data.prescriptionNumber}</p>
            <p><strong>Date:</strong> {data.date}</p>
          </div>
          <div className="text-right">
            <p><strong>Patient ID:</strong> {data.patient.patient_id}</p>
            <p><strong>Department:</strong> {data.patient.assigned_department || 'General Medicine'}</p>
          </div>
        </div>
      </div>

      {/* Doctor Information */}
      <div className="bg-green-50 p-4 rounded-lg mb-6 border-l-4 border-green-500">
        <h3 className="font-semibold mb-2 text-gray-800">Consulting Doctor</h3>
        <div className="text-sm">
          <p><strong>Dr. {data.patient.assigned_doctor || 'Not Assigned'}</strong></p>
          <p>Department of {data.patient.assigned_department || 'General Medicine'}</p>
          <p>V+H Hospital</p>
        </div>
      </div>

      {/* Patient Information */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-3 text-gray-800">Patient Details</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Name:</strong> {data.patient.first_name} {data.patient.last_name || ''}</p>
            <p><strong>Age/Gender:</strong> {getAge('')} years / {data.patient.gender || 'N/A'}</p>
            <p><strong>Contact:</strong> {data.patient.phone || 'N/A'}</p>
          </div>
          <div>
            <p><strong>Address:</strong> {data.patient.address || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Diagnosis */}
      {data.diagnosis && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-gray-800 border-b border-gray-300 pb-1">Clinical Diagnosis:</h3>
          <p className="text-sm bg-yellow-50 p-3 rounded border border-yellow-200">
            {data.diagnosis}
          </p>
        </div>
      )}

      {/* Medications */}
      <div className="mb-6">
        <h3 className="font-semibold mb-3 text-gray-800 border-b border-gray-300 pb-1">Treatment Prescribed:</h3>
        <div className="space-y-4">
          {data.medications.map((med, index) => (
            <div key={index} className="border-l-4 border-green-400 pl-4 py-2">
              <p className="font-medium text-gray-900 mb-1">
                {index + 1}. {med.name} {med.strength && `${med.strength}`}
              </p>
              <div className="text-sm text-gray-700 space-y-1">
                <p><strong>Sig:</strong> {med.dosage} - {med.frequency} - {med.duration}</p>
                {med.instructions && (
                  <p className="text-blue-600"><strong>Special Instructions:</strong> {med.instructions}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Advice */}
      {data.advice && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-gray-800 border-b border-gray-300 pb-1">Medical Advice:</h3>
          <p className="text-sm bg-blue-50 p-3 rounded border border-blue-200">
            {data.advice}
          </p>
        </div>
      )}

      {/* Follow-up */}
      {data.followUpDate && (
        <div className="mb-6">
          <h3 className="font-semibold mb-2 text-gray-800 border-b border-gray-300 pb-1">Follow-up Schedule:</h3>
          <p className="text-sm bg-green-50 p-3 rounded border border-green-200">
            <strong>Next Appointment:</strong> {data.followUpDate}
          </p>
        </div>
      )}

      {/* Signature */}
      <div className="mt-12 text-right">
        <div className="inline-block">
          <div className="border-t-2 border-green-500 pt-3 mt-8" style={{ minWidth: '220px' }}>
            <p className="text-base font-bold text-green-700">Dr. {data.patient.assigned_doctor || 'Not Assigned'}</p>
            <p className="text-sm text-gray-600">Consultant, {data.patient.assigned_department || 'General Medicine'}</p>
            <p className="text-sm text-green-600 font-medium">V+H HOSPITAL</p>
            <p className="text-xs text-gray-500 mt-1">Reg. No: MCI-{data.patient.assigned_doctor ? data.patient.assigned_doctor.replace(/\s/g, '').toUpperCase().slice(0, 6) : 'XXXXXX'}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
        <p>This prescription is valid for 30 days from the date of issue</p>
        <p className="mt-1">Generated on {data.date} | V+H Hospital - Your Health, Our Priority</p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[95vh] overflow-auto">
        {/* Action Buttons */}
        <div className="flex justify-end gap-2 p-4 border-b print:hidden sticky top-0 bg-white">
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

        {/* Template Content */}
        <div className="p-4">
          {data.template === 'VALANT' ? renderValantTemplate() : renderVHTemplate()}
        </div>
      </div>
    </div>
  );
};

export default PrescriptionTemplate;