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
  originalConsultationFee: number;
  consultationFee: number;
  otherServices: number;
  discountAmount: number;
  discountPercentage: number;
  discountReason: string;
  totalAmount: number;
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

      // Calculate detailed totals for proper accounting format
      let consultationFee = 0;
      let originalConsultationFee = 0;
      let discountAmount = 0;
      let discountPercentage = 0;
      let discountReason = '';
      let otherServices = 0;

      // Debug: Log all transactions to see actual data structure
      console.log('🔍 All transactions for receipt:', transactions);
      
      // Analyze transactions to extract consultation fee and discount details
      transactions.forEach(transaction => {
        console.log('📊 Processing transaction:', transaction);
        
        if (transaction.transaction_type === 'CONSULTATION' || transaction.transaction_type === 'consultation') {
          console.log('💰 Found consultation transaction:', transaction);
          // With new structure, consultation transaction contains original amount
          originalConsultationFee = transaction.amount;
          consultationFee = transaction.amount; // Will be adjusted if discount found
          
          // Extract discount information from enhanced description
          const description = transaction.description || '';
          const discountMatch = description.match(/Discount:\s*(\d+)%\s*\(₹([\d.]+)\)/i);
          if (discountMatch) {
            discountPercentage = parseInt(discountMatch[1]);
            discountAmount = parseFloat(discountMatch[2]);
            consultationFee = originalConsultationFee - discountAmount;
            
            // Extract discount reason if available
            const reasonMatch = description.match(/Reason:\s*([^|]+)/i);
            if (reasonMatch) {
              discountReason = reasonMatch[1].trim();
            }
          }
        } else if (transaction.transaction_type === 'DISCOUNT' || transaction.transaction_type === 'discount') {
          console.log('💸 Found discount transaction:', transaction);
          // Handle separate discount transactions
          discountAmount += Math.abs(transaction.amount);
          
          // Extract discount percentage and reason from discount transaction
          const description = transaction.description || '';
          const percentMatch = description.match(/(\d+)%/);
          if (percentMatch) {
            discountPercentage = parseInt(percentMatch[1]);
          }
          
          const reasonMatch = description.match(/-\s*(.+)$/);
          if (reasonMatch) {
            discountReason = reasonMatch[1].trim();
          }
        } else if (transaction.amount > 0) {
          otherServices += transaction.amount;
        }
      });

      console.log('📋 Final calculated values:');
      console.log('- Original consultation fee:', originalConsultationFee);
      console.log('- Consultation fee (after discount):', consultationFee);
      console.log('- Discount amount:', discountAmount);
      console.log('- Discount percentage:', discountPercentage);
      console.log('- Discount reason:', discountReason);
      console.log('- Other services:', otherServices);

      // Handle old transaction format where discounted amount was stored directly
      if (originalConsultationFee > 0 && discountAmount === 0) {
        // Check if this is old format with discount info in description
        const consultationTransaction = transactions.find(t => 
          t.transaction_type === 'CONSULTATION' || t.transaction_type === 'consultation'
        );
        
        if (consultationTransaction) {
          const description = consultationTransaction.description || '';
          console.log('🔍 Checking old format description:', description);
          
          // Look for old format: "Consultation Fee - Dr. X (20% discount applied)"
          const oldDiscountMatch = description.match(/(\d+)%\s*discount\s*applied/i);
          if (oldDiscountMatch) {
            discountPercentage = parseInt(oldDiscountMatch[1]);
            // The transaction amount is the discounted amount, so calculate original
            consultationFee = originalConsultationFee; // This is actually the discounted amount
            originalConsultationFee = consultationFee / (1 - discountPercentage / 100);
            discountAmount = originalConsultationFee - consultationFee;
            
            console.log('📜 Detected old format:');
            console.log('- Stored amount (discounted):', consultationFee);
            console.log('- Calculated original fee:', originalConsultationFee);
            console.log('- Calculated discount:', discountAmount);
          }
        }
      }

      // If no consultation fee found, use the old calculation method
      if (originalConsultationFee === 0) {
        const totalAmount = transactions.reduce((sum, transaction) => {
          return transaction.amount > 0 ? sum + transaction.amount : sum;
        }, 0);
        originalConsultationFee = totalAmount;
        consultationFee = totalAmount;
      }

      const totalAmount = originalConsultationFee + otherServices;
      const netAmount = totalAmount - discountAmount;

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
        originalConsultationFee,
        consultationFee,
        otherServices,
        discountAmount,
        discountPercentage,
        discountReason,
        totalAmount,
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

  // getAge function removed - now using stored patient.age field directly

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

  const convertTransactionsToServices = (
    transactions: PatientTransaction[], 
    receiptData: ReceiptData
  ): ServiceItem[] => {
    const services: ServiceItem[] = [];
    let srCounter = 1;

    transactions
      .filter(transaction => transaction.amount > 0) // Only positive amounts (actual services)
      .forEach(transaction => {
        if (transaction.transaction_type === 'CONSULTATION' || transaction.transaction_type === 'consultation') {
          // For consultation, show original rate and discounted amount
          services.push({
            sr: srCounter++,
            service: transaction.description || 'Consultation Fee',
            qty: 1,
            rate: receiptData.originalConsultationFee, // Original rate (₹750)
            amount: receiptData.originalConsultationFee - receiptData.discountAmount // Discounted amount (₹600)
          });
        } else {
          // For other services, show normal rate = amount
          services.push({
            sr: srCounter++,
            service: transaction.description || transaction.transaction_type,
            qty: 1,
            rate: transaction.amount,
            amount: transaction.amount
          });
        }
      });

    return services;
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
  const services = convertTransactionsToServices(transactions, receiptData);

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
                <p><strong>AGE/SEX:</strong> {patient.age && patient.age.trim() !== '' ? patient.age : 'N/A'} / {patient.gender}</p>
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

          {/* Bill Summary - Proper Accounting Format */}
          <div className="border-t-2 border-gray-300 pt-4">
            <div className="flex justify-end">
              <div className="w-80">
                <h3 className="font-semibold mb-3 text-gray-800">Bill Summary</h3>
                
                {/* Consultation Fee */}
                {receiptData.originalConsultationFee > 0 && (
                  <div className="flex justify-between mb-2">
                    <span>Consultation Fee:</span>
                    <span>₹{receiptData.originalConsultationFee.toFixed(2)}</span>
                  </div>
                )}
                
                {/* Other Services */}
                {receiptData.otherServices > 0 && (
                  <div className="flex justify-between mb-2">
                    <span>Other Services:</span>
                    <span>₹{receiptData.otherServices.toFixed(2)}</span>
                  </div>
                )}
                
                {/* Subtotal */}
                <div className="flex justify-between mb-2 border-t border-gray-200 pt-2">
                  <span className="font-medium">Subtotal:</span>
                  <span className="font-medium">₹{receiptData.totalAmount.toFixed(2)}</span>
                </div>
                
                {/* Discount Details */}
                {receiptData.discountAmount > 0 && (
                  <>
                    <div className="flex justify-between mb-1 text-red-600">
                      <span>Discount ({receiptData.discountPercentage}%):</span>
                      <span>- ₹{receiptData.discountAmount.toFixed(2)}</span>
                    </div>
                    {receiptData.discountReason && (
                      <div className="text-xs text-gray-500 mb-2 text-right italic">
                        Reason: {receiptData.discountReason}
                      </div>
                    )}
                  </>
                )}
                
                {/* Net Amount */}
                <div className="flex justify-between font-bold text-lg border-t-2 border-gray-400 pt-2 mt-2">
                  <span>Net Amount Payable:</span>
                  <span>₹{receiptData.netAmount.toFixed(2)}</span>
                </div>
                
                {/* Amount in Words */}
                <div className="mt-3 text-xs text-gray-600">
                  <span className="font-medium">Amount in Words: </span>
                  <span className="italic">{convertNumberToWords(receiptData.netAmount)} Only</span>
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