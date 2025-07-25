import React, { useState, useEffect } from 'react';
import type { PatientTransaction } from '../config/supabaseNew';
import HospitalService from '../services/hospitalService';
import { supabase } from '../config/supabaseNew';
import toast from 'react-hot-toast';

interface IPDPartialBillingProps {
  patientAdmission: any;
  isOpen: boolean;
  onClose: () => void;
  onBillCreated?: () => void;
}

interface PartialBill {
  id?: string;
  bill_number: string;
  amount: number;
  payment_mode: 'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'INSURANCE';
  description: string;
  created_at: string;
  transaction_id?: string;
}

const IPDPartialBilling: React.FC<IPDPartialBillingProps> = ({
  patientAdmission,
  isOpen,
  onClose,
  onBillCreated
}) => {
  const [partialBills, setPartialBills] = useState<PartialBill[]>([]);
  const [newBill, setNewBill] = useState({
    amount: 0,
    payment_mode: 'CASH' as const,
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [totalServices, setTotalServices] = useState(0);
  const [totalPaid, setTotalPaid] = useState(0);
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    if (isOpen && patientAdmission) {
      loadPartialBills();
      calculateTotals();
    }
  }, [isOpen, patientAdmission]);

  const loadPartialBills = async () => {
    try {
      setLoading(true);
      
      // Load payment transactions for this admission
      const transactions = await HospitalService.getTransactionsByPatient(patientAdmission.patient_id);
      
      // Filter for payment transactions made after admission
      const paymentTransactions = transactions.filter(t => 
        t.transaction_type === 'IPD_PAYMENT' &&
        new Date(t.created_at) >= new Date(patientAdmission.admission_date) &&
        t.status === 'COMPLETED'
      );

      const bills = paymentTransactions.map(t => ({
        id: t.id,
        bill_number: `IPD-${t.id.slice(-6).toUpperCase()}`,
        amount: t.amount,
        payment_mode: t.payment_mode,
        description: t.description || 'IPD Partial Payment',
        created_at: t.created_at,
        transaction_id: t.id
      }));

      setPartialBills(bills);
    } catch (error) {
      console.error('Error loading partial bills:', error);
      toast.error('Failed to load billing history');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotals = async () => {
    try {
      // Get all service transactions for this admission
      const transactions = await HospitalService.getTransactionsByPatient(patientAdmission.patient_id);
      
      // Calculate total services (positive amounts after admission)
      const serviceTransactions = transactions.filter(t => 
        t.amount > 0 &&
        new Date(t.created_at) >= new Date(patientAdmission.admission_date) &&
        t.status === 'COMPLETED' &&
        t.transaction_type !== 'IPD_PAYMENT'
      );
      
      const servicesTotal = serviceTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      // Calculate total payments
      const paymentTransactions = transactions.filter(t => 
        t.transaction_type === 'IPD_PAYMENT' &&
        new Date(t.created_at) >= new Date(patientAdmission.admission_date) &&
        t.status === 'COMPLETED'
      );
      
      const paymentsTotal = paymentTransactions.reduce((sum, t) => sum + t.amount, 0);
      
      setTotalServices(servicesTotal);
      setTotalPaid(paymentsTotal);
      setBalance(servicesTotal - paymentsTotal);
      
      // Update admission record
      await supabase
        .from('patient_admissions')
        .update({
          total_amount: servicesTotal,
          amount_paid: paymentsTotal,
          balance_amount: servicesTotal - paymentsTotal
        })
        .eq('id', patientAdmission.id);

    } catch (error) {
      console.error('Error calculating totals:', error);
    }
  };

  const handleCreatePartialBill = async () => {
    if (newBill.amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (newBill.amount > balance) {
      toast.error('Payment amount cannot exceed balance amount');
      return;
    }

    try {
      // Create payment transaction
      const transactionData = {
        patient_id: patientAdmission.patient_id,
        transaction_type: 'IPD_PAYMENT',
        amount: newBill.amount,
        description: newBill.description || `IPD Partial Payment - Bed ${patientAdmission.bed_number}`,
        payment_mode: newBill.payment_mode,
        status: 'COMPLETED' as const
      };

      const transaction = await HospitalService.createTransaction(transactionData);
      
      // Create bill record
      const bill: PartialBill = {
        id: transaction.id,
        bill_number: `IPD-${transaction.id.slice(-6).toUpperCase()}`,
        amount: newBill.amount,
        payment_mode: newBill.payment_mode,
        description: newBill.description || 'IPD Partial Payment',
        created_at: new Date().toISOString(),
        transaction_id: transaction.id
      };
      
      setPartialBills([...partialBills, bill]);
      
      // Reset form
      setNewBill({
        amount: 0,
        payment_mode: 'CASH',
        description: ''
      });
      
      // Recalculate totals
      await calculateTotals();
      
      toast.success(`Partial bill ${bill.bill_number} created successfully`);
      onBillCreated?.();
    } catch (error) {
      console.error('Error creating partial bill:', error);
      toast.error('Failed to create partial bill');
    }
  };

  const generateBillNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    return `IPD-${timestamp}`;
  };

  const printPartialBill = (bill: PartialBill) => {
    // Create printable receipt
    const printContent = `
      <div style="max-width: 400px; margin: 0 auto; font-family: Arial, sans-serif;">
        <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px;">
          <h2>VALANT HOSPITAL</h2>
          <p>IPD Partial Payment Receipt</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p><strong>Bill Number:</strong> ${bill.bill_number}</p>
          <p><strong>Date:</strong> ${new Date(bill.created_at).toLocaleDateString()}</p>
          <p><strong>Time:</strong> ${new Date(bill.created_at).toLocaleTimeString()}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p><strong>Patient:</strong> ${patientAdmission.patient?.first_name} ${patientAdmission.patient?.last_name}</p>
          <p><strong>Bed Number:</strong> ${patientAdmission.bed_number}</p>
          <p><strong>Room Type:</strong> ${patientAdmission.room_type}</p>
        </div>
        
        <div style="margin-bottom: 20px;">
          <p><strong>Description:</strong> ${bill.description}</p>
          <p><strong>Payment Mode:</strong> ${bill.payment_mode}</p>
          <p style="font-size: 18px;"><strong>Amount Paid: ₹${bill.amount.toLocaleString()}</strong></p>
        </div>
        
        <div style="border-top: 1px solid #333; padding-top: 10px; text-align: center;">
          <p style="margin: 0;">Thank you for choosing VALANT HOSPITAL</p>
        </div>
      </div>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">💰 IPD Partial Billing</h2>
            <p className="text-green-100">
              Bed: {patientAdmission.bed_number} • Patient: {patientAdmission.patient?.first_name} {patientAdmission.patient?.last_name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-green-200 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <div className="flex flex-col h-full" style={{ maxHeight: 'calc(90vh - 80px)' }}>
          {/* Billing Summary */}
          <div className="p-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Billing Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg">
                <div className="text-lg font-bold text-blue-700">₹{totalServices.toLocaleString()}</div>
                <div className="text-blue-600 text-sm">Total Services</div>
              </div>
              <div className="bg-green-50 p-3 rounded-lg">
                <div className="text-lg font-bold text-green-700">₹{totalPaid.toLocaleString()}</div>
                <div className="text-green-600 text-sm">Total Paid</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-lg">
                <div className="text-lg font-bold text-orange-700">₹{balance.toLocaleString()}</div>
                <div className="text-orange-600 text-sm">Balance Due</div>
              </div>
            </div>
          </div>

          {/* Create New Partial Bill */}
          <div className="p-4 border-b">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Create Partial Payment</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={newBill.amount || ''}
                  onChange={(e) => setNewBill({ ...newBill, amount: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  min="0"
                  max={balance}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={newBill.payment_mode}
                  onChange={(e) => setNewBill({ ...newBill, payment_mode: e.target.value as any })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                  <option value="INSURANCE">Insurance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <input
                  type="text"
                  value={newBill.description}
                  onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Payment description"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleCreatePartialBill}
                  disabled={newBill.amount <= 0 || newBill.amount > balance}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  💰 Create Bill
                </button>
              </div>
            </div>
          </div>

          {/* Partial Bills History */}
          <div className="flex-1 overflow-auto p-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Payment History ({partialBills.length})</h3>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading payment history...</p>
              </div>
            ) : partialBills.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No partial payments made yet.
              </div>
            ) : (
              <div className="space-y-2">
                {partialBills.map((bill, index) => (
                  <div
                    key={bill.id || index}
                    className="flex items-center justify-between p-3 bg-white border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <span className="font-medium text-gray-800">{bill.bill_number}</span>
                        <span className="text-lg font-bold text-green-600">₹{bill.amount.toLocaleString()}</span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {bill.payment_mode}
                        </span>
                        <span className="text-xs text-gray-500">
                          {new Date(bill.created_at).toLocaleDateString()} {new Date(bill.created_at).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {bill.description}
                      </div>
                    </div>
                    <button
                      onClick={() => printPartialBill(bill)}
                      className="ml-4 bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700"
                      title="Print Receipt"
                    >
                      🖨️ Print
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-gray-50 border-t">
            <div className="flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-600">
                  {partialBills.length} payment(s) • Balance: ₹{balance.toLocaleString()}
                </span>
              </div>
              <div className="space-x-2">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPDPartialBilling;