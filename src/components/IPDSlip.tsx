import React, { useState, useEffect } from 'react';
import HospitalService from '../services/hospitalService';
import toast from 'react-hot-toast';

interface IPDSlipProps {
  admission: any;
  onBack: () => void;
}

const IPDSlip: React.FC<IPDSlipProps> = ({ admission, onBack }) => {
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER'>('CASH');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAdvancePayment();
    generateReceiptNumber();
  }, [admission]);

  const loadAdvancePayment = async () => {
    try {
      const transactions = await HospitalService.getTransactionsByPatient(admission.patient_id);
      
      // Find advance payment made at admission
      const advancePayment = transactions.find(t => 
        t.transaction_type === 'IPD_ADVANCE' &&
        new Date(t.created_at).toDateString() === new Date(admission.admission_date).toDateString()
      );

      if (advancePayment) {
        setAdvanceAmount(advancePayment.amount);
        setPaymentMode(advancePayment.payment_mode);
      }
    } catch (error) {
      console.error('Error loading advance payment:', error);
    }
  };

  const generateReceiptNumber = () => {
    const timestamp = Date.now().toString().slice(-6);
    setReceiptNumber(`ADV-${timestamp}`);
  };

  const handleSaveAdvance = async () => {
    if (advanceAmount <= 0) {
      toast.error('Please enter a valid advance amount');
      return;
    }

    setLoading(true);
    try {
      // Create advance payment transaction
      await HospitalService.createTransaction({
        patient_id: admission.patient_id,
        transaction_type: 'IPD_ADVANCE',
        amount: advanceAmount,
        description: `IPD Advance Payment - Admission ${admission.bed_number}`,
        payment_mode: paymentMode,
        status: 'COMPLETED'
      });

      toast.success('Advance payment recorded successfully');
    } catch (error) {
      console.error('Error saving advance payment:', error);
      toast.error('Failed to save advance payment');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
            #slip-content, #slip-content * {
              visibility: visible;
            }
            #slip-content {
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
        <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center no-print">
          <div>
            <h2 className="text-xl font-bold">📋 IPD Admission Slip</h2>
            <p className="text-blue-100">
              Advance payment receipt and admission details
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100"
            >
              🖨️ Print
            </button>
            <button
              onClick={onBack}
              className="text-white hover:text-blue-200 text-2xl font-bold"
            >
              ←
            </button>
          </div>
        </div>

        {/* Advance Amount Input Section - Only show if no advance recorded */}
        {advanceAmount === 0 && (
          <div className="p-4 bg-yellow-50 border-b no-print">
            <h3 className="font-semibold mb-3">Record Advance Payment</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Advance Amount (₹)
                </label>
                <input
                  type="number"
                  value={advanceAmount || ''}
                  onChange={(e) => setAdvanceAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                  <option value="BANK_TRANSFER">Bank Transfer</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSaveAdvance}
                  disabled={loading || advanceAmount <= 0}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : 'Save Advance'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* IPD Slip Content */}
        <div className="p-8" id="slip-content">
          {/* Hospital Header */}
          <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
            <div className="flex items-center justify-center mb-4">
              <img 
                src="/logo.png" 
                alt="VALANT Hospital Logo" 
                className="h-16 w-auto"
                style={{ maxHeight: '64px', height: 'auto', width: 'auto' }}
              />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">VALANT HOSPITAL</h1>
            <div className="text-sm text-gray-600">
              <p>10, Madhav Vihar Shobhagpura, Udaipur (313001)</p>
              <p>Phone: +91 9119118000 | Email: valanthospital@gmail.com</p>
            </div>
            <div className="mt-4">
              <h2 className="text-xl font-bold text-blue-600">IPD ADMISSION SLIP</h2>
            </div>
          </div>

          {/* Receipt Details */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Admission Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Receipt No:</span>
                  <span>{receiptNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Date & Time:</span>
                  <span>{formatDate(admission.admission_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Bed Number:</span>
                  <span className="font-bold">{admission.bed_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Room Type:</span>
                  <span>{admission.room_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Department:</span>
                  <span>{admission.department}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Patient Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Patient ID:</span>
                  <span>{admission.patient?.patient_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Name:</span>
                  <span className="font-bold">{admission.patient?.first_name} {admission.patient?.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Age/Gender:</span>
                  <span>{admission.patient?.age || 'N/A'} / {admission.patient?.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Contact:</span>
                  <span>{admission.patient?.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Blood Group:</span>
                  <span>{admission.patient?.blood_group || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Advance Payment Section */}
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
            <h3 className="font-bold text-green-800 text-lg mb-4 text-center">ADVANCE PAYMENT RECEIVED</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-medium">Amount Paid:</span>
                  <span className="font-bold text-xl text-green-600">₹{advanceAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Payment Mode:</span>
                  <span>{paymentMode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Received By:</span>
                  <span>Front Desk</span>
                </div>
              </div>
              <div className="text-center">
                <div className="border-2 border-dashed border-green-400 p-4 rounded">
                  <p className="text-sm text-green-700 mb-2">Amount in Words:</p>
                  <p className="font-medium text-green-800">
                    {convertNumberToWords(advanceAmount)} Only
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Doctor Information */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Attending Doctor</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Doctor Name:</span>
                  <span>{admission.patient?.assigned_doctor || 'To be assigned'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Specialization:</span>
                  <span>{admission.department}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Emergency Contact</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Contact Person:</span>
                  <span>{admission.patient?.emergency_contact_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Relation:</span>
                  <span>{admission.patient?.emergency_contact_relation || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Phone:</span>
                  <span>{admission.patient?.emergency_contact_phone || admission.patient?.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Important Instructions */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <h3 className="font-bold text-yellow-800 mb-2">Important Instructions:</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Please keep this slip safe for all IPD related transactions</li>
              <li>• Advance amount will be adjusted in final bill at discharge</li>
              <li>• Visiting hours: 10:00 AM - 12:00 PM & 4:00 PM - 7:00 PM</li>
              <li>• Please follow hospital rules and regulations</li>
              <li>• In case of emergency, contact nursing station immediately</li>
            </ul>
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-3 gap-6 mt-8">
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2">
                <p className="text-sm font-medium">Patient/Attendant Signature</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2">
                <p className="text-sm font-medium">Cashier Signature</p>
              </div>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 pt-2">
                <p className="text-sm font-medium">Authorized Signature</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Generated on {new Date().toLocaleDateString()} • VALANT HOSPITAL
            </p>
            <p className="text-xs text-gray-500 mt-1">
              A unit of Neuorth Medicare Pvt Ltd • www.valanthospital.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Number to words conversion function
const convertNumberToWords = (num: number): string => {
  if (num === 0) return 'Zero';
  
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
  const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const convertHundreds = (n: number): string => {
    let result = '';
    if (n >= 100) {
      result += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      result += tens[Math.floor(n / 10)] + ' ';
      n %= 10;
    } else if (n >= 10) {
      result += teens[n - 10] + ' ';
      return result;
    }
    if (n > 0) {
      result += ones[n] + ' ';
    }
    return result;
  };
  
  let result = '';
  const crores = Math.floor(num / 10000000);
  if (crores > 0) {
    result += convertHundreds(crores) + 'Crore ';
    num %= 10000000;
  }
  
  const lakhs = Math.floor(num / 100000);
  if (lakhs > 0) {
    result += convertHundreds(lakhs) + 'Lakh ';
    num %= 100000;
  }
  
  const thousands = Math.floor(num / 1000);
  if (thousands > 0) {
    result += convertHundreds(thousands) + 'Thousand ';
    num %= 1000;
  }
  
  if (num > 0) {
    result += convertHundreds(num);
  }
  
  return result.trim() + ' Rupees';
};

export default IPDSlip;