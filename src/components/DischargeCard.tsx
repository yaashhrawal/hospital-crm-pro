import React from 'react';
import { ReceiptData } from './receipts/ReceiptTemplate';

interface DischargeCardProps {
  data: ReceiptData;
  className?: string;
}

const DischargeCard: React.FC<DischargeCardProps> = ({ data, className = '' }) => {
  // Ensure data.medical exists for discharge card
  if (!data.medical) {
    return <div className="p-4 text-red-500">Error: Medical information missing for Discharge Card.</div>;
  }

  return (
    <div className={`discharge-card bg-white p-6 max-w-4xl mx-auto ${className}`}>
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
            .discharge-card, .discharge-card * {
              visibility: visible;
            }
            .discharge-card {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `
      }} />
      
      {/* Header */}
      <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
        <div className="flex items-center justify-center mb-4">
          <img 
            src="/logo.png" 
            alt="VALANT Hospital Logo" 
            className="h-16 w-auto"
            style={{ maxHeight: '64px', height: 'auto', width: 'auto' }}
          />
        </div>
        <div className="text-sm text-gray-700 mt-4">
          <p>{data.hospital.address}</p>
          <p>Phone: {data.hospital.phone} | Email: {data.hospital.email}</p>
          <p>Reg. No: {data.hospital.registration} | GST: {data.hospital.gst}</p>
        </div>
      </div>

      {/* Title */}
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-gray-800">DISCHARGE SUMMARY</h2>
        <p className="text-sm text-gray-600">Date: {data.date} | Time: {data.time}</p>
      </div>

      {/* Patient Information */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-3 text-gray-800">Patient Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>NAME:</strong> {data.patient.name}</p>
            <p><strong>AGE/SEX:</strong> {data.patient.age || 'N/A'} / {data.patient.gender || 'N/A'}</p>
            <p><strong>MOBILE:</strong> {data.patient.phone || 'N/A'}</p>
            <p><strong>ADDRESS:</strong> {data.patient.address || 'N/A'}</p>
          </div>
          <div>
            <p><strong>PATIENT ID:</strong> {data.patient.id}</p>
            <p><strong>BLOOD GROUP:</strong> {data.patient.bloodGroup || 'N/A'}</p>
            <p><strong>ADMISSION DATE:</strong> {data.medical.admissionDate || 'N/A'}</p>
            <p><strong>DISCHARGE DATE:</strong> {data.medical.dischargeDate || 'N/A'}</p>
            <p><strong>STAY DURATION:</strong> {data.medical.stayDuration || 'N/A'} days</p>
          </div>
        </div>
      </div>

      {/* Medical Summary */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-3 text-gray-800">Medical Summary</h3>
        <div className="text-sm space-y-2">
          {data.medical.diagnosis && (
            <p><strong>Diagnosis:</strong> {data.medical.diagnosis}</p>
          )}
          {data.medical.treatment && (
            <p><strong>Treatment:</strong> {data.medical.treatment}</p>
          )}
          {data.medical.condition && (
            <p><strong>Condition at Discharge:</strong> {data.medical.condition}</p>
          )}
          {data.medical.doctor && (
            <p><strong>Attending Doctor:</strong> {data.medical.doctor}</p>
          )}
          {data.medical.followUp && (
            <p><strong>Follow-up Instructions:</strong> {data.medical.followUp}</p>
          )}
          {/* Add more medical fields as needed */}
        </div>
      </div>

      {/* Notes */}
      {data.notes && (
        <div className="mb-6 bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 text-gray-800">Notes:</h3>
          <p className="text-sm text-gray-700">{data.notes}</p>
        </div>
      )}

      {/* Signature Section */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div className="text-center">
          <div className="border-t border-gray-400 mt-12 pt-2">
            <p className="text-sm">Patient/Guardian Signature</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-400 mt-12 pt-2">
            <p className="text-sm">Attending Doctor Signature</p>
            {data.staff.authorizedBy && <p className="text-xs text-gray-600 mt-1">({data.staff.authorizedBy})</p>}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
        <p>Thank you for choosing {data.hospital.name}</p>
        <p className="mt-1">A unit of Neuorth Medicare Pvt Ltd</p>
        <p className="mt-1">Generated on {data.date} at {data.time}</p>
      </div>
    </div>
  );
};

export default DischargeCard;
