import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import HospitalService from '../../services/hospitalService';
import type { PatientWithRelations, PatientTransaction } from '../../config/supabaseNew';
import { formatDate } from '../../utils/excelExport';

interface OPDBillProps {
  patient: PatientWithRelations;
  onClose: () => void;
}

const OPDBill: React.FC<OPDBillProps> = ({ patient, onClose }) => {
  const [transactions, setTransactions] = useState<PatientTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: '',
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    // Set default start date to 30 days ago
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    setDateRange(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0]
    }));
  }, []);

  useEffect(() => {
    if (dateRange.startDate) {
      loadOPDTransactions();
    }
  }, [patient.id, dateRange]);

  const loadOPDTransactions = async () => {
    try {
      setLoading(true);
      // Get all transactions for the patient
      const allTransactions = patient.transactions || [];
      
      // Filter OPD transactions (exclude IPD-related transactions)
      const opdTransactions = allTransactions.filter(t => 
        !t.admission_id && 
        t.status === 'COMPLETED' &&
        new Date(t.created_at) >= new Date(dateRange.startDate) &&
        new Date(t.created_at) <= new Date(dateRange.endDate + 'T23:59:59')
      );
      
      setTransactions(opdTransactions.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      toast.error('Failed to load OPD transactions');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateTotal = () => {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  };

  const groupTransactionsByDate = () => {
    const grouped: { [key: string]: PatientTransaction[] } = {};
    transactions.forEach(t => {
      const date = new Date(t.created_at).toLocaleDateString();
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(t);
    });
    return grouped;
  };

  const groupedTransactions = groupTransactionsByDate();

  return (
    <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              margin: 10mm;
              size: A4;
            }
            body * {
              visibility: hidden;
            }
            #opd-bill-content, #opd-bill-content * {
              visibility: visible;
            }
            #opd-bill-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white;
            }
            .no-print {
              display: none !important;
            }
          }
        `
      }} />

      <div id="opd-bill-content" className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">OPD Bill</h1>
          <p className="text-gray-600 mt-2">Out-Patient Department</p>
        </div>

        {/* Date Range Filter */}
        <div className="bg-gray-100 p-4 rounded-lg mb-6 no-print">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border rounded-md"
              />
            </div>
            <div className="pt-6">
              <button
                onClick={loadOPDTransactions}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Hospital and Patient Info */}
        <div className="border-b pb-6 mb-6">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-700 mb-2">Hospital Details</h3>
              <p className="text-sm">City General Hospital</p>
              <p className="text-sm text-gray-600">123 Healthcare Street, Medical City</p>
              <p className="text-sm text-gray-600">Phone: +1-555-HOSPITAL</p>
            </div>
            <div className="text-right">
              <h3 className="font-semibold text-gray-700 mb-2">Bill Details</h3>
              <p className="text-sm">Bill No: OPD-{patient.patient_id}-{new Date().getTime()}</p>
              <p className="text-sm">Date: {new Date().toLocaleDateString()}</p>
              <p className="text-sm">Period: {formatDate(dateRange.startDate)} to {formatDate(dateRange.endDate)}</p>
            </div>
          </div>
        </div>

        {/* Patient Details */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-gray-700 mb-3">Patient Information</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><span className="font-medium">Name:</span> {patient.first_name} {patient.last_name}</p>
              <p><span className="font-medium">Patient ID:</span> {patient.patient_id}</p>
              <p><span className="font-medium">Age/Gender:</span> {patient.age || 'N/A'} / {patient.gender}</p>
            </div>
            <div>
              <p><span className="font-medium">Phone:</span> {patient.phone || 'N/A'}</p>
              <p><span className="font-medium">Email:</span> {patient.email || 'N/A'}</p>
              <p><span className="font-medium">Blood Group:</span> {patient.blood_group || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Billing Details */}
        {loading ? (
          <div className="text-center py-8">Loading transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-600">
            No OPD transactions found for the selected period.
          </div>
        ) : (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">Transaction Details</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-3 text-left">Date</th>
                  <th className="border p-3 text-left">Service</th>
                  <th className="border p-3 text-left">Description</th>
                  <th className="border p-3 text-center">Payment Mode</th>
                  <th className="border p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupedTransactions).map(([date, dayTransactions]) => (
                  <React.Fragment key={date}>
                    <tr className="bg-gray-50">
                      <td colSpan={5} className="border p-2 font-medium text-gray-700">
                        {date}
                      </td>
                    </tr>
                    {dayTransactions.map((transaction) => (
                      <tr key={transaction.id}>
                        <td className="border p-3 text-sm">
                          {new Date(transaction.created_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </td>
                        <td className="border p-3">
                          {transaction.transaction_type.replace(/_/g, ' ')}
                        </td>
                        <td className="border p-3 text-sm">
                          {transaction.description}
                          {transaction.department && (
                            <span className="block text-xs text-gray-600">
                              Dept: {transaction.department}
                            </span>
                          )}
                        </td>
                        <td className="border p-3 text-center">
                          <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-800">
                            {transaction.payment_mode}
                          </span>
                        </td>
                        <td className="border p-3 text-right">
                          ₹{transaction.amount.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}

                {/* Total */}
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={4} className="border p-3 text-right">Total Amount</td>
                  <td className="border p-3 text-right text-lg">
                    ₹{calculateTotal().toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Summary */}
        <div className="bg-green-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-700">Total Services:</p>
              <p className="text-lg font-semibold">{transactions.length}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-700">Total Amount:</p>
              <p className="text-2xl font-bold text-green-600">₹{calculateTotal().toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-600 mt-8">
          <p>Thank you for choosing our hospital</p>
          <p>For any queries, please contact our billing department</p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8 no-print">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            🖨️ Print Bill
          </button>
          <button
            onClick={onClose}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OPDBill;