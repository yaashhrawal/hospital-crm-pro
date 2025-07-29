import React, { useState } from 'react';
import IPDBill from './IPDBill';
import OPDBill from './OPDBill';
import CombinedBill from './CombinedBill';
import type { PatientWithRelations } from '../../config/supabaseNew';

interface PatientBillingModalProps {
  patient: PatientWithRelations;
  isOpen: boolean;
  onClose: () => void;
}

const PatientBillingModal: React.FC<PatientBillingModalProps> = ({ patient, isOpen, onClose }) => {
  const [selectedBillType, setSelectedBillType] = useState<'IPD' | 'OPD' | 'COMBINED' | null>(null);

  if (!isOpen) return null;

  const handleClose = () => {
    setSelectedBillType(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {!selectedBillType ? (
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              💰 Billing Options
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {patient.first_name} {patient.last_name} (ID: {patient.patient_id})
            </h3>
            <p className="text-sm text-gray-600">Select the type of bill to generate:</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => setSelectedBillType('IPD')}
              className="w-full bg-purple-600 text-white p-4 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-between"
            >
              <div className="text-left">
                <div className="font-semibold">🏥 IPD Bill</div>
                <div className="text-sm text-purple-100">In-Patient Department billing</div>
              </div>
              <span className="text-2xl">→</span>
            </button>

            <button
              onClick={() => setSelectedBillType('OPD')}
              className="w-full bg-green-600 text-white p-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-between"
            >
              <div className="text-left">
                <div className="font-semibold">🏢 OPD Bill</div>
                <div className="text-sm text-green-100">Out-Patient Department billing</div>
              </div>
              <span className="text-2xl">→</span>
            </button>

            <button
              onClick={() => setSelectedBillType('COMBINED')}
              className="w-full bg-blue-600 text-white p-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-between"
            >
              <div className="text-left">
                <div className="font-semibold">📊 Combined Bill</div>
                <div className="text-sm text-blue-100">All services combined</div>
              </div>
              <span className="text-2xl">→</span>
            </button>
          </div>

          <div className="mt-6 pt-4 border-t">
            <button
              onClick={handleClose}
              className="w-full bg-gray-200 text-gray-800 p-3 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <>
          {selectedBillType === 'IPD' && (
            <IPDBill patient={patient} onClose={handleClose} />
          )}
          {selectedBillType === 'OPD' && (
            <OPDBill patient={patient} onClose={handleClose} />
          )}
          {selectedBillType === 'COMBINED' && (
            <CombinedBill patient={patient} onClose={handleClose} />
          )}
        </>
      )}
    </div>
  );
};

export default PatientBillingModal;