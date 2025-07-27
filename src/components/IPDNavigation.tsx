import React, { useState } from 'react';
import IPDSlip from './IPDSlip';
import IPDCard from './IPDCard';
import IPDStickers from './IPDStickers';

interface IPDNavigationProps {
  admission: any; // Patient admission data
  onClose?: () => void;
}

const IPDNavigation: React.FC<IPDNavigationProps> = ({ admission, onClose }) => {
  const [activeView, setActiveView] = useState<'navigation' | 'slip' | 'card' | 'stickers'>('navigation');

  const handleBack = () => {
    setActiveView('navigation');
  };

  if (activeView === 'slip') {
    return <IPDSlip admission={admission} onBack={handleBack} />;
  }

  if (activeView === 'card') {
    return <IPDCard admission={admission} onBack={handleBack} />;
  }

  if (activeView === 'stickers') {
    return <IPDStickers admission={admission} onBack={handleBack} />;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="bg-indigo-600 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">🏥 IPD Documents</h2>
            <p className="text-indigo-100">
              Patient: {admission.patient?.first_name} {admission.patient?.last_name} • 
              Bed: {admission.bed?.bed_number || admission.bed_number || 'N/A'}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-white hover:text-indigo-200 text-2xl font-bold"
            >
              ×
            </button>
          )}
        </div>

        {/* Navigation Options */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* IPD Slip */}
            <button
              onClick={() => setActiveView('slip')}
              className="group bg-white border-2 border-blue-200 rounded-lg p-6 hover:border-blue-400 hover:shadow-lg transition-all duration-200"
            >
              <div className="text-center">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  📋
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">IPD Slip</h3>
                <p className="text-sm text-gray-600">
                  Admission slip with advance payment details
                </p>
              </div>
            </button>

            {/* IPD Card */}
            <button
              onClick={() => setActiveView('card')}
              className="group bg-white border-2 border-green-200 rounded-lg p-6 hover:border-green-400 hover:shadow-lg transition-all duration-200"
            >
              <div className="text-center">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  🪪
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">IPD Card</h3>
                <p className="text-sm text-gray-600">
                  Complete patient journey summary
                </p>
              </div>
            </button>

            {/* IPD Stickers */}
            <button
              onClick={() => setActiveView('stickers')}
              className="group bg-white border-2 border-purple-200 rounded-lg p-6 hover:border-purple-400 hover:shadow-lg transition-all duration-200"
            >
              <div className="text-center">
                <div className="text-5xl mb-4 group-hover:scale-110 transition-transform">
                  🏷️
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">IPD Stickers</h3>
                <p className="text-sm text-gray-600">
                  Patient identification labels
                </p>
              </div>
            </button>
          </div>

          {/* Additional Information */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              Select an option above to generate the required IPD document
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPDNavigation;