import React, { useState, useEffect } from 'react';
import HospitalService from '../services/hospitalService';
import toast from 'react-hot-toast';

interface IPDServiceManagerProps {
  patientAdmission: any;
  isOpen: boolean;
  onClose: () => void;
  onServicesUpdated?: () => void;
}

interface DailyCharge {
  name: string;
  amount: number;
  days: number;
  total: number;
}

const IPDServiceManager: React.FC<IPDServiceManagerProps> = ({
  patientAdmission,
  isOpen,
  onClose,
  onServicesUpdated
}) => {
  const [dailyCharges, setDailyCharges] = useState<DailyCharge[]>([
    { name: "Dr's Daily Charge", amount: 500, days: 1, total: 500 },
    { name: "RMO Daily Charge", amount: 300, days: 1, total: 300 },
    { name: "Nursing Daily Charge", amount: 200, days: 1, total: 200 },
    { name: "Daily Bed Charge", amount: 800, days: 1, total: 800 }
  ]);
  const [loading, setLoading] = useState(false);
  const [stayDays, setStayDays] = useState(1);

  useEffect(() => {
    if (isOpen && patientAdmission) {
      calculateStayDays();
    }
  }, [isOpen, patientAdmission]);

  const calculateStayDays = () => {
    const admissionDate = new Date(patientAdmission.admission_date);
    const currentDate = new Date();
    const daysDiff = Math.ceil((currentDate.getTime() - admissionDate.getTime()) / (1000 * 60 * 60 * 24));
    const days = daysDiff < 1 ? 1 : daysDiff;
    
    setStayDays(days);
    setDailyCharges(prev => prev.map(charge => ({
      ...charge,
      days: days,
      total: charge.amount * days
    })));
  };

  const updateChargeAmount = (index: number, amount: number) => {
    setDailyCharges(prev => prev.map((charge, i) => 
      i === index 
        ? { ...charge, amount, total: amount * charge.days }
        : charge
    ));
  };

  const updateChargeDays = (index: number, days: number) => {
    setDailyCharges(prev => prev.map((charge, i) => 
      i === index 
        ? { ...charge, days, total: charge.amount * days }
        : charge
    ));
  };

  const saveAllCharges = async () => {
    setLoading(true);
    try {
      for (const charge of dailyCharges) {
        if (charge.total > 0) {
          await HospitalService.createTransaction({
            patient_id: patientAdmission.patient?.id || patientAdmission.patient_id,
            transaction_type: 'SERVICE',
            amount: charge.total,
            description: `${charge.name} - ${charge.days} days @ ₹${charge.amount}/day`,
            payment_mode: 'CASH',
            status: 'COMPLETED',
            doctor_id: null,
            doctor_name: null,
            department: patientAdmission.department
          });
        }
      }

      toast.success('Daily charges saved successfully');
      onServicesUpdated?.();
      onClose();
    } catch (error) {
      console.error('Error saving daily charges:', error);
      toast.error('Failed to save daily charges');
    } finally {
      setLoading(false);
    }
  };

  const getTotalAmount = () => {
    return dailyCharges.reduce((sum, charge) => sum + charge.total, 0);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">⚕️ IPD Daily Charges</h2>
            <p className="text-blue-100">
              Patient: {patientAdmission.patient?.first_name} {patientAdmission.patient?.last_name} | 
              Bed: {patientAdmission.bed_number}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-blue-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {/* Stay Information */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Stay Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-600">Admission Date:</span>
                <div className="font-medium">
                  {new Date(patientAdmission.admission_date).toLocaleDateString()}
                </div>
              </div>
              <div>
                <span className="text-sm text-gray-600">Total Days:</span>
                <div className="font-medium text-blue-600">{stayDays} days</div>
              </div>
            </div>
          </div>

          {/* Daily Charges Table */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Daily Charges</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">Service</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Amount/Day (₹)</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-700">Days</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">Total (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {dailyCharges.map((charge, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{charge.name}</td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          value={charge.amount}
                          onChange={(e) => updateChargeAmount(index, Number(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="number"
                          value={charge.days}
                          onChange={(e) => updateChargeDays(index, Number(e.target.value) || 0)}
                          className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ₹{charge.total.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td colSpan={3} className="px-4 py-3 text-right font-bold text-gray-900">
                      Grand Total:
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-blue-600 text-lg">
                      ₹{getTotalAmount().toLocaleString()}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={saveAllCharges}
              disabled={loading || getTotalAmount() <= 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Daily Charges'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPDServiceManager;