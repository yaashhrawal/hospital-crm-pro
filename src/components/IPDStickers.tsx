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
              margin: 4mm;
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
            .sticker {
              width: 69mm !important;
              height: 35mm !important;
              font-size: 11px !important;
              page-break-inside: avoid;
              break-inside: avoid;
              padding: 3mm !important;
              overflow: hidden !important;
              margin-bottom: 0 !important;
            }
            .sticker div {
              word-wrap: break-word !important;
              overflow-wrap: break-word !important;
            }
            .grid {
              display: grid !important;
              grid-template-columns: repeat(3, 69mm) !important;
              gap: 2.5mm !important;
              justify-content: center;
              row-gap: 4mm !important;
              padding: 5mm 0 0 0 !important;
              width: 100% !important;
              height: 100% !important;
            }
          }
          .sticker {
            width: 240px;
            height: 125px;
            font-size: 11px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
          }
          .sticker div {
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
        `
      }} />

      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="bg-purple-600 text-white p-4 rounded-t-lg flex justify-between items-center no-print">
          <div>
            <h2 className="text-xl font-bold">🏷️ IPD Sticker</h2>
            <p className="text-purple-100">
              Ready to print bed head card
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
        <div className="p-4" id="stickers-content">
          {/* Multiple IPD Stickers Grid - 3 Columns × 8 Rows Layout for A4 */}
          <div className="grid grid-cols-3 gap-6">
            {/* Generate 24 identical stickers for A4 (3 columns × 8 rows) */}
            {Array.from({ length: 24 }, (_, index) => (
              <div key={index} className={`sticker border ${admission.status === 'DISCHARGED' ? 'border-red-400 bg-red-50' : 'border-gray-400 bg-white'} break-inside-avoid flex flex-col`} style={{ padding: '10px' }}>
                {/* Compact Header with Logo */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-300" style={{ marginBottom: '8px' }}>
                  <img 
                    src="/logo.png" 
                    alt="Logo" 
                    className="h-4"
                    style={{ maxHeight: '16px' }}
                  />
                  <span className="font-bold" style={{ fontSize: '12px' }}>
                    {admission.status === 'DISCHARGED' ? 'DISCHARGED' : 'IPD'}
                  </span>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex">
                  {/* Left Column - Patient Info */}
                  <div className="flex-1 pr-2">
                    <div className="font-bold" style={{ fontSize: '13px', lineHeight: '1.3', marginBottom: '5px' }}>
                      {admission.patient?.first_name} {admission.patient?.last_name}
                    </div>
                    <div style={{ fontSize: '11px', lineHeight: '1.3', marginBottom: '4px' }}>
                      Age: {admission.patient?.age || 'N/A'} {admission.patient?.gender?.charAt(0) || ''}
                    </div>
                    <div style={{ fontSize: '11px', lineHeight: '1.3', marginBottom: '4px' }}>
                      DOA: {new Date(admission.admission_date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit'
                      })}
                    </div>
                    <div style={{ fontSize: '12px', lineHeight: '1.2', marginTop: '5px' }}>
                      {admission.doctor?.name || admission.doctor_name || admission.assigned_doctor || 'TBA'}
                    </div>
                  </div>
                  
                  {/* Right Column - Bed & ID */}
                  <div className="text-right" style={{ width: '38%' }}>
                    <div className={`font-bold ${admission.status === 'DISCHARGED' ? 'text-red-700' : 'text-green-700'}`} style={{ fontSize: '20px', lineHeight: '1.1', marginBottom: '4px' }}>
                      {admission.bed_number}
                    </div>
                    <div style={{ fontSize: '10px', lineHeight: '1.2', marginTop: '4px', marginBottom: '3px' }}>
                      IP: {admission.patient?.patient_id}
                    </div>
                    <div style={{ fontSize: '10px', lineHeight: '1.2' }}>
                      {admission.department || 'General'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};

export default IPDStickers;