import React, { useState, useEffect } from 'react';
import HospitalService from '../services/hospitalService';
import { supabase } from '../config/supabaseNew';
import toast from 'react-hot-toast';

interface IPDSlipProps {
  admission: any;
  onBack: () => void;
}

const IPDSlip: React.FC<IPDSlipProps> = ({ admission, onBack }) => {
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'CARD' | 'UPI' | 'BANK_TRANSFER' | 'INSURANCE'>('CASH');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [hasExistingPayment, setHasExistingPayment] = useState(false);
  const [isEditingPayment, setIsEditingPayment] = useState(false);
  const [lastPaymentDetails, setLastPaymentDetails] = useState<any>(null);
  const [allAdvancePayments, setAllAdvancePayments] = useState<any[]>([]);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [insuranceDetails, setInsuranceDetails] = useState({
    provider: '',
    policyNumber: '',
    policyHolderName: ''
  });

  useEffect(() => {
    loadAdvancePayment();
    generateReceiptNumber();
  }, [admission]);

  const loadAdvancePayment = async () => {
    try {
      const transactions = await HospitalService.getTransactionsByPatient(admission.patient_id);
      console.log('All transactions for patient:', transactions);
      
      // Find all advance payments (look for both IPD_ADVANCE and ADMISSION_FEE)
      const advancePayments = transactions.filter(t => 
        (t.transaction_type === 'ADMISSION_FEE' || t.transaction_type === 'IPD_ADVANCE') &&
        new Date(t.created_at) >= new Date(admission.admission_date) &&
        t.status === 'COMPLETED'
      ).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      console.log('Found advance payments:', advancePayments);
      setAllAdvancePayments(advancePayments);

      if (advancePayments.length > 0) {
        const latestPayment = advancePayments[0];
        setAdvanceAmount(latestPayment.amount.toString());
        setPaymentMode(latestPayment.payment_mode);
        setHasExistingPayment(true);
        setLastPaymentDetails(latestPayment);
        
        // Parse insurance details from description if available
        if (latestPayment.payment_mode === 'INSURANCE' && latestPayment.description) {
          const desc = latestPayment.description;
          const providerMatch = desc.match(/Insurance: ([^|]+)/);
          const policyMatch = desc.match(/Policy: ([^|]+)/);
          
          if (providerMatch && policyMatch) {
            setInsuranceDetails({
              provider: providerMatch[1].trim(),
              policyNumber: policyMatch[1].trim(),
              policyHolderName: admission.patient?.first_name + ' ' + admission.patient?.last_name || ''
            });
          }
        }
      } else {
        // No existing payment found, reset states
        setAdvanceAmount('');
        setPaymentMode('CASH');
        setHasExistingPayment(false);
        setLastPaymentDetails(null);
        setAllAdvancePayments([]);
        setInsuranceDetails({
          provider: '',
          policyNumber: '',
          policyHolderName: ''
        });
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
    const amount = parseFloat(advanceAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid advance amount');
      return;
    }

    if (paymentMode === 'INSURANCE' && (!insuranceDetails.provider || !insuranceDetails.policyNumber || !insuranceDetails.policyHolderName)) {
      toast.error('Please fill all insurance details');
      return;
    }

    setLoading(true);
    try {
      // Create advance payment transaction
      const transactionData: any = {
        patient_id: admission.patient?.id || admission.patient_id,
        transaction_type: 'ADMISSION_FEE',
        amount: parseFloat(advanceAmount),
        description: `IPD Advance Payment - Admission ${admission.bed_number}`,
        payment_mode: paymentMode,
        status: 'COMPLETED',
        doctor_id: null,
        doctor_name: null,
        department: admission.department
      };

      if (paymentMode === 'INSURANCE') {
        transactionData.description += ` | Insurance: ${insuranceDetails.provider} | Policy: ${insuranceDetails.policyNumber}`;
      }

      await HospitalService.createTransaction(transactionData);

      toast.success(isEditingPayment ? 'Advance payment updated successfully' : 'Advance payment recorded successfully');
      setHasExistingPayment(true);
      setIsEditingPayment(false);
      await loadAdvancePayment();
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

  const handlePrintIndividual = (payment: any) => {
    // Create a new window with individual payment receipt
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Advance Payment Receipt</title>
          <style>
            @media print {
              @page { margin: 0.5in; size: A4; }
            }
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 10px; margin-bottom: 20px; }
            .logo { height: 60px; margin-bottom: 10px; }
            .title { font-size: 20px; font-weight: bold; color: #2563eb; }
            .details { margin: 20px 0; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .label { font-weight: bold; }
            .amount { font-size: 24px; font-weight: bold; color: #16a34a; }
            .footer { text-align: center; margin-top: 30px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="/logo.png" alt="Hospital Logo" class="logo" />
            <p>10, Madhav Vihar Shobhagpura, Udaipur (313001)</p>
            <p>Phone: +91 9119118000 | Email: valanthospital@gmail.com</p>
            <div class="title">ADVANCE PAYMENT RECEIPT</div>
          </div>
          
          <div class="details">
            <div class="row">
              <span class="label">Receipt No:</span>
              <span>ADV-${payment.id.slice(-6).toUpperCase()}</span>
            </div>
            <div class="row">
              <span class="label">Patient Name:</span>
              <span>${admission.patient?.first_name} ${admission.patient?.last_name}</span>
            </div>
            <div class="row">
              <span class="label">Patient ID:</span>
              <span>${admission.patient?.patient_id}</span>
            </div>
            <div class="row">
              <span class="label">Payment Date:</span>
              <span>${new Date(payment.created_at).toLocaleDateString('en-IN')} at ${new Date(payment.created_at).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'})}</span>
            </div>
            <div class="row">
              <span class="label">Payment Mode:</span>
              <span>${payment.payment_mode}</span>
            </div>
            <div class="row">
              <span class="label">Amount Paid:</span>
              <span class="amount">₹${payment.amount.toLocaleString()}</span>
            </div>
            <div class="row">
              <span class="label">Amount in Words:</span>
              <span>${convertNumberToWords(payment.amount)} Only</span>
            </div>
            <div class="row">
              <span class="label">Transaction ID:</span>
              <span>${payment.id.slice(-8).toUpperCase()}</span>
            </div>
          </div>
          
          <div class="footer">
            <p>Thank you for choosing our hospital</p>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleDeletePayment = async (paymentId: string, paymentAmount: number) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete this advance payment of ₹${paymentAmount.toLocaleString()}?\n\n` +
      `This action cannot be undone. The payment will be permanently removed from the system.`
    );

    if (!confirmDelete) return;

    setDeletingPaymentId(paymentId);
    setLoading(true);

    try {
      // Delete the transaction from the database
      const { error } = await supabase
        .from('patient_transactions')
        .delete()
        .eq('id', paymentId);

      if (error) {
        throw error;
      }

      toast.success('Advance payment deleted successfully');
      
      // Reload the advance payments
      await loadAdvancePayment();
      
    } catch (error: any) {
      console.error('Error deleting payment:', error);
      toast.error(`Failed to delete payment: ${error.message}`);
    } finally {
      setLoading(false);
      setDeletingPaymentId(null);
    }
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

        {/* Advance Amount Input Section - Show if no payment exists or editing */}
        {(!hasExistingPayment || isEditingPayment) && (
          <div className="p-4 bg-yellow-50 border-b no-print">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-semibold">{isEditingPayment ? 'Edit Advance Payment' : 'Record Advance Payment'}</h3>
              {isEditingPayment && (
                <button
                  onClick={() => {
                    setIsEditingPayment(false);
                    loadAdvancePayment();
                  }}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Advance Amount (₹)
                </label>
                <input
                  type="number"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  step="0.01"
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
                  <option value="INSURANCE">Insurance</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleSaveAdvance}
                  disabled={loading || !advanceAmount || parseFloat(advanceAmount) <= 0}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Saving...' : (isEditingPayment ? 'Update Advance' : 'Save Advance')}
                </button>
              </div>
            </div>

            {/* Insurance Details Section */}
            {paymentMode === 'INSURANCE' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Insurance Provider
                  </label>
                  <input
                    type="text"
                    value={insuranceDetails.provider}
                    onChange={(e) => setInsuranceDetails({...insuranceDetails, provider: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter provider name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Policy Number
                  </label>
                  <input
                    type="text"
                    value={insuranceDetails.policyNumber}
                    onChange={(e) => setInsuranceDetails({...insuranceDetails, policyNumber: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter policy number"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Policy Holder Name
                  </label>
                  <input
                    type="text"
                    value={insuranceDetails.policyHolderName}
                    onChange={(e) => setInsuranceDetails({...insuranceDetails, policyHolderName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter policy holder name"
                  />
                </div>
              </div>
            )}
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
            <div className="text-sm text-gray-600">
              <p>10, Madhav Vihar Shobhagpura, Udaipur (313001)</p>
              <p>Phone: +91 9119118000 | Email: valanthospital@gmail.com</p>
            </div>
            <div className="mt-4">
              <h2 className="text-xl font-bold text-blue-600">IPD ADMISSION SLIP</h2>
              {admission.status === 'DISCHARGED' && (
                <div className="mt-2 inline-block bg-red-100 text-red-800 px-4 py-2 rounded-lg font-bold">
                  🏥 PATIENT DISCHARGED
                </div>
              )}
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
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Patient Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Name:</span>
                  <span className="font-bold">{admission.patient?.first_name} {admission.patient?.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Age:</span>
                  <span>{admission.patient?.age || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Contact:</span>
                  <span>{admission.patient?.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* All Advance Payments Section */}
          {allAdvancePayments.length > 0 && (
          <div className="bg-green-50 border-2 border-green-200 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-green-800 text-lg">ADVANCE PAYMENTS RECEIVED</h3>
              <span className="text-sm text-green-700">Total Payments: {allAdvancePayments.length}</span>
            </div>
            
            {allAdvancePayments.map((payment, index) => (
              <div key={payment.id} className={`border border-green-300 rounded-lg p-4 mb-4 bg-white ${index === 0 ? 'border-2 border-green-500' : ''}`}>
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-green-800">Payment #{index + 1}</span>
                    {index === 0 && <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">Latest</span>}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePrintIndividual(payment)}
                      className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 no-print"
                    >
                      🖨️ Print Receipt
                    </button>
                    {index === 0 && !isEditingPayment && (
                      <button
                        onClick={() => setIsEditingPayment(true)}
                        className="bg-orange-600 text-white px-3 py-1 rounded text-xs hover:bg-orange-700 no-print"
                      >
                        Edit Latest
                      </button>
                    )}
                    <button
                      onClick={() => handleDeletePayment(payment.id, payment.amount)}
                      disabled={deletingPaymentId === payment.id || loading}
                      className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50 no-print"
                    >
                      {deletingPaymentId === payment.id ? '⏳' : '🗑️'} Delete
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="font-medium">Transaction ID:</span>
                      <span className="font-mono text-xs">{payment.id.slice(-8).toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Amount:</span>
                      <span className="font-bold text-lg text-green-600">₹{payment.amount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Payment Mode:</span>
                      <span className="font-semibold">{payment.payment_mode}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Date & Time:</span>
                      <span>{new Date(payment.created_at).toLocaleDateString('en-IN')} at {new Date(payment.created_at).toLocaleTimeString('en-IN', {hour: '2-digit', minute: '2-digit'})}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Status:</span>
                      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">{payment.status}</span>
                    </div>
                  </div>
                  
                  <div className="text-center">
                    <div className="border border-dashed border-green-400 p-2 rounded">
                      <p className="text-xs text-green-700 mb-1">Amount in Words:</p>
                      <p className="text-sm font-medium text-green-800">
                        {convertNumberToWords(payment.amount)} Only
                      </p>
                    </div>
                    {payment.description && (
                      <div className="bg-gray-50 p-2 rounded text-xs mt-2">
                        <p className="font-medium text-gray-700">Description:</p>
                        <p className="text-gray-600">{payment.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            <div className="mt-4 p-3 bg-green-100 rounded border-green-300 border">
              <div className="flex justify-between items-center">
                <span className="font-bold text-green-800">Total Advance Paid:</span>
                <span className="font-bold text-xl text-green-600">
                  ₹{allAdvancePayments.reduce((sum, payment) => sum + payment.amount, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          )}


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
              Generated on {new Date().toLocaleDateString()}
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