import React, { useState, useEffect } from 'react';
import HospitalService from '../services/hospitalService';
import type { Patient, PatientTransaction } from '../config/supabaseNew';
import toast from 'react-hot-toast';

interface ReceiptData {
  patient: Patient;
  transactions: PatientTransaction[];
  billNo: string;
  date: string;
  regDate: string;
  doctor: string;
  paymentMode: string;
  totalAmount: number;
  discount: number;
  netAmount: number;
}

interface ReceiptProps {
  patientId: string;
  onClose: () => void;
}

interface ServiceItem {
  sr: number;
  service: string;
  qty: number;
  rate: number;
  amount: number;
}

const Receipt: React.FC<ReceiptProps> = ({ patientId, onClose }) => {
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReceiptData();
  }, [patientId]);

  const fetchReceiptData = async () => {
    try {
      setLoading(true);
      
      // Fetch patient data and transactions
      const patient = await HospitalService.getPatientById(patientId);
      const transactions = await HospitalService.getTransactionsByPatient(patientId);
      
      if (!patient) {
        toast.error('Patient not found');
        return;
      }

      // Calculate totals
      const totalAmount = transactions.reduce((sum, transaction) => {
        return transaction.amount > 0 ? sum + transaction.amount : sum;
      }, 0);

      const discount = transactions.reduce((sum, transaction) => {
        return transaction.amount < 0 ? sum + Math.abs(transaction.amount) : sum;
      }, 0);

      const netAmount = totalAmount - discount;

      // Generate bill number (could be enhanced with actual sequence)
      const billNo = `BILL-${Date.now().toString().slice(-6)}`;
      
      // Get doctor name from patient assignment or transactions  
      const doctor = patient.assigned_doctor || 
                    transactions.find(t => t.doctor_name)?.doctor_name || 
                    'General Physician';
      
      // Get payment mode from the most recent transaction
      const paymentMode = transactions.length > 0 ? transactions[0].payment_mode || 'Cash' : 'Cash';

      setReceiptData({
        patient,
        transactions,
        billNo,
        date: new Date().toLocaleDateString('en-IN'),
        regDate: new Date(patient.created_at).toLocaleDateString('en-IN'),
        doctor,
        paymentMode,
        totalAmount,
        discount,
        netAmount
      });

    } catch (error) {
      console.error('Error fetching receipt data:', error);
      toast.error('Failed to load receipt data');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return 'N/A';
    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);
      if (isNaN(birthDate.getTime())) return 'N/A';
      
      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    } catch (error) {
      return 'N/A';
    }
  };

  const convertTransactionsToServices = (transactions: PatientTransaction[]): ServiceItem[] => {
    return transactions
      .filter(transaction => transaction.amount > 0) // Only positive amounts (actual services)
      .map((transaction, index) => ({
        sr: index + 1,
        service: transaction.description || transaction.transaction_type,
        qty: 1,
        rate: transaction.amount,
        amount: transaction.amount
      }));
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading receipt...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-8 rounded-lg">
          <p>Failed to load receipt data</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded">
            Close
          </button>
        </div>
      </div>
    );
  }

  const { patient, transactions } = receiptData;
  const services = convertTransactionsToServices(transactions);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
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
            #receipt-content, #receipt-content * {
              visibility: visible;
            }
            #receipt-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
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
            <span>🖨️</span> Print Receipt
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Close
          </button>
        </div>

        {/* Receipt Content */}
        <div className="p-8 print:p-6" id="receipt-content">
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
              <p>10, Madhav Vihar Shobhagpura, Udaipur (313001)</p>
              <p>Phone: +91 9119118000 | Email: valanthospital@gmail.com</p>
              <p>Website: www.valanthospital.com</p>
            </div>
          </div>

          {/* Bill Header */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>BILL NO:</strong> {receiptData.billNo}</p>
                <p><strong>DATE:</strong> {receiptData.date}</p>
                <p><strong>REG DATE:</strong> {receiptData.regDate}</p>
              </div>
              <div className="text-right">
                <p><strong>Patient ID:</strong> {patient.patient_id}</p>
                <p><strong>PAYMENT MODE:</strong> {receiptData.paymentMode}</p>
              </div>
            </div>
          </div>

          {/* Patient Information */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold mb-3 text-gray-800">Patient Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>NAME:</strong> {patient.first_name} {patient.last_name}</p>
                <p><strong>AGE/SEX:</strong> {getAge(patient.date_of_birth)} / {patient.gender}</p>
                <p><strong>MOBILE:</strong> {patient.phone || 'N/A'}</p>
              </div>
              <div>
                <p><strong>ADDRESS:</strong> {patient.address || 'N/A'}</p>
                <p><strong>EMAIL:</strong> {patient.email || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Services Table */}
          <div className="mb-6">
            <h3 className="font-semibold mb-3 text-gray-800">Services & Charges</h3>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-3 py-2 text-left">Sr</th>
                  <th className="border border-gray-300 px-3 py-2 text-left">Service</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Qty</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Rate (₹)</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Amount (₹)</th>
                </tr>
              </thead>
              <tbody>
                {services.length > 0 ? services.map((service) => (
                  <tr key={service.sr}>
                    <td className="border border-gray-300 px-3 py-2">{service.sr}</td>
                    <td className="border border-gray-300 px-3 py-2">{service.service}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center">{service.qty}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right">₹{service.rate.toFixed(2)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right">₹{service.amount.toFixed(2)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="border border-gray-300 px-3 py-2 text-center text-gray-500">
                      No services recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="border-t-2 border-gray-300 pt-4">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between mb-2">
                  <span>Total Amount:</span>
                  <span>₹{receiptData.totalAmount.toFixed(2)}</span>
                </div>
                {receiptData.discount > 0 && (
                  <div className="flex justify-between mb-2 text-red-600">
                    <span>Discount:</span>
                    <span>- ₹{receiptData.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2">
                  <span>Net Amount:</span>
                  <span>₹{receiptData.netAmount.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
            <p>Thank you for choosing VALANT HOSPITAL</p>
            <p className="mt-1">A unit of Neuorth Medicare Pvt Ltd</p>
            <p className="font-bold mt-2">** ORIGINAL COPY **</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Receipt;