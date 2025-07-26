import React from 'react';

interface IPDStickersProps {
  admission: any;
  onBack: () => void;
}

const IPDStickers: React.FC<IPDStickersProps> = ({ admission, onBack }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
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
            #stickers-content, #stickers-content * {
              visibility: visible;
            }
            #stickers-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
          }
        `
      }} />

      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="bg-purple-600 text-white p-4 rounded-t-lg flex justify-between items-center no-print">
          <div>
            <h2 className="text-xl font-bold">🏷️ IPD Patient Stickers</h2>
            <p className="text-purple-100">
              Ready to print identification labels
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="bg-white text-purple-600 px-4 py-2 rounded hover:bg-gray-100"
            >
              🖨️ Print
            </button>
            <button
              onClick={onBack}
              className="text-white hover:text-purple-200 text-2xl font-bold"
            >
              ←
            </button>
          </div>
        </div>

        {/* Stickers Content */}
        <div className="p-6" id="stickers-content">
          {/* Main Sticker Sheet */}
          <div className="grid grid-cols-2 gap-4">
            {/* Large Sticker - Bed Head */}
            <div className="border-2 border-dashed border-gray-400 p-4 bg-white">
              <div className="text-center mb-3">
                <h3 className="font-bold text-sm text-gray-600">BED HEAD CARD</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Name:</span>
                  <span className="font-bold">{admission.patient?.first_name} {admission.patient?.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Age/Sex:</span>
                  <span>{admission.patient?.age || 'N/A'} / {admission.patient?.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">DOA:</span>
                  <span>{formatDate(admission.admission_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Doctor:</span>
                  <span>{admission.patient?.assigned_doctor || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Department:</span>
                  <span>{admission.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Ward/Bed No:</span>
                  <span className="font-bold">{admission.room_type} / {admission.bed_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">IP No:</span>
                  <span className="font-bold">{admission.patient?.patient_id}</span>
                </div>
                <div className="mt-3 p-2 bg-green-100 rounded text-center">
                  <span className="text-green-800 font-medium">✓ ADMITTED</span>
                </div>
              </div>
            </div>

            {/* Medicine Label */}
            <div className="border-2 border-dashed border-gray-400 p-4 bg-white">
              <div className="text-center mb-3">
                <h3 className="font-bold text-sm text-gray-600">MEDICINE LABEL</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="text-center">
                  <div className="font-bold text-lg">{admission.patient?.first_name} {admission.patient?.last_name}</div>
                  <div className="text-gray-600">Age: {admission.patient?.age || 'N/A'} | {admission.patient?.gender}</div>
                </div>
                <div className="border-t pt-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Bed:</span>
                    <span className="font-bold">{admission.bed_number}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">IP No:</span>
                    <span>{admission.patient?.patient_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">DOA:</span>
                    <span>{formatDate(admission.admission_date)}</span>
                  </div>
                </div>
                <div className="mt-3 p-1 bg-blue-100 rounded text-center text-xs">
                  <span className="text-blue-800">VALANT HOSPITAL</span>
                </div>
              </div>
            </div>
          </div>

          {/* Small Stickers Row */}
          <div className="grid grid-cols-4 gap-3 mt-6">
            {/* File Sticker */}
            <div className="border-2 border-dashed border-gray-400 p-3 bg-white">
              <div className="text-center text-xs">
                <div className="font-bold text-xs text-gray-600 mb-2">FILE LABEL</div>
                <div className="space-y-1">
                  <div className="font-bold">{admission.patient?.first_name} {admission.patient?.last_name}</div>
                  <div>IP: {admission.patient?.patient_id}</div>
                  <div>Bed: {admission.bed_number}</div>
                  <div className="text-xs text-gray-600">{formatDate(admission.admission_date)}</div>
                </div>
              </div>
            </div>

            {/* Sample Collection */}
            <div className="border-2 border-dashed border-gray-400 p-3 bg-white">
              <div className="text-center text-xs">
                <div className="font-bold text-xs text-gray-600 mb-2">SAMPLE LABEL</div>
                <div className="space-y-1">
                  <div className="font-bold">{admission.patient?.first_name} {admission.patient?.last_name}</div>
                  <div>Age: {admission.patient?.age || 'N/A'}</div>
                  <div>IP: {admission.patient?.patient_id}</div>
                  <div>Bed: {admission.bed_number}</div>
                  <div className="text-xs text-red-600 font-medium">LAB SAMPLE</div>
                </div>
              </div>
            </div>

            {/* Diet Chart */}
            <div className="border-2 border-dashed border-gray-400 p-3 bg-white">
              <div className="text-center text-xs">
                <div className="font-bold text-xs text-gray-600 mb-2">DIET CHART</div>
                <div className="space-y-1">
                  <div className="font-bold">{admission.patient?.first_name} {admission.patient?.last_name}</div>
                  <div>Bed: {admission.bed_number}</div>
                  <div>Ward: {admission.room_type}</div>
                  <div className="text-xs text-green-600 font-medium">DIETARY</div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="border-2 border-dashed border-gray-400 p-3 bg-white">
              <div className="text-center text-xs">
                <div className="font-bold text-xs text-gray-600 mb-2">EMERGENCY</div>
                <div className="space-y-1">
                  <div className="font-bold">{admission.patient?.first_name} {admission.patient?.last_name}</div>
                  <div>Contact: {admission.patient?.phone}</div>
                  <div>Blood: {admission.patient?.blood_group || 'N/A'}</div>
                  <div className="text-xs text-red-600 font-medium">URGENT</div>
                </div>
              </div>
            </div>
          </div>

          {/* Wristband Stickers */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="border-2 border-dashed border-gray-400 p-2 bg-white">
              <div className="text-center text-xs">
                <div className="font-bold text-xs text-gray-600 mb-1">WRISTBAND</div>
                <div className="font-bold">{admission.patient?.first_name} {admission.patient?.last_name}</div>
                <div>DOB: {admission.patient?.date_of_birth ? formatDate(admission.patient.date_of_birth) : 'N/A'}</div>
                <div>ID: {admission.patient?.patient_id}</div>
                <div>Bed: {admission.bed_number}</div>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-400 p-2 bg-white">
              <div className="text-center text-xs">
                <div className="font-bold text-xs text-gray-600 mb-1">ALLERGY BAND</div>
                <div className="font-bold text-red-600">{admission.patient?.first_name} {admission.patient?.last_name}</div>
                <div>Allergies: {admission.patient?.allergies || 'None Known'}</div>
                <div>Blood: {admission.patient?.blood_group || 'N/A'}</div>
                <div className="font-bold text-red-600">⚠️ CHECK ALLERGIES</div>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-400 p-2 bg-white">
              <div className="text-center text-xs">
                <div className="font-bold text-xs text-gray-600 mb-1">FALL RISK</div>
                <div className="font-bold">{admission.patient?.first_name} {admission.patient?.last_name}</div>
                <div>Age: {admission.patient?.age || 'N/A'}</div>
                <div>Bed: {admission.bed_number}</div>
                <div className="font-bold text-orange-600">⚠️ FALL RISK</div>
              </div>
            </div>
          </div>

          {/* Footer Information */}
          <div className="mt-6 text-center text-xs text-gray-500 border-t pt-4">
            <p>VALANT HOSPITAL • Generated on {new Date().toLocaleDateString()}</p>
            <p>Cut along dotted lines • Use appropriate adhesive for patient safety</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPDStickers;