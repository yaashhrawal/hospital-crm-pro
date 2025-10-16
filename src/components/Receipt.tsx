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
  paymentMode?: string;
  discountPercentage?: number;
  discountAmount?: number;
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
      let totalDiscountAmount = 0;
      let discountPercentage = 0;
      let discountReason = '';
      let otherServices = 0;
      const consultationTransactions = [];

      // Filter out cancelled transactions
      const activeTransactions = transactions.filter(t => t.status !== 'CANCELLED');
      
      // Analyze transactions to extract consultation fee and discount details
      activeTransactions.forEach(transaction => {
        
        if (transaction.transaction_type === 'CONSULTATION' || transaction.transaction_type === 'consultation') {
          consultationTransactions.push(transaction);
          
          // Extract original and net amounts from description for multiple doctors
          const description = transaction.description || '';
          const originalMatch = description.match(/Original:\s*₹([\d.]+)/i);
          const netMatch = description.match(/Net:\s*₹([\d.]+)/i);
          const discountMatch = description.match(/Discount:\s*(\d+)%\s*\(₹([\d.]+)\)/i);
          
          if (originalMatch && netMatch && discountMatch) {
            // Multiple doctor format - extract from transaction description
            const transactionOriginal = parseFloat(originalMatch[1]);
            const transactionNet = parseFloat(netMatch[1]);
            const transactionDiscount = parseFloat(discountMatch[2]);
            
            originalConsultationFee += transactionOriginal;
            consultationFee += transactionNet;
            totalDiscountAmount += transactionDiscount;
            
            // Get discount details from the first transaction
            if (discountPercentage === 0) {
              discountPercentage = parseInt(discountMatch[1]);
              const reasonMatch = description.match(/Reason:\s*([^|]+)/i);
              if (reasonMatch) {
                discountReason = reasonMatch[1].trim();
              }
            }
          } else {
            // Single doctor format or old format
            const transactionAmount = transaction.amount;
            originalConsultationFee += transactionAmount;
            consultationFee += transactionAmount;
            
            // Try to extract discount info from description
            if (discountMatch) {
              discountPercentage = parseInt(discountMatch[1]);
              const transactionDiscount = parseFloat(discountMatch[2]);
              totalDiscountAmount += transactionDiscount;
              consultationFee = originalConsultationFee - totalDiscountAmount;
              
              const reasonMatch = description.match(/Reason:\s*([^|]+)/i);
              if (reasonMatch) {
                discountReason = reasonMatch[1].trim();
              }
            }
          }
        } else if (transaction.transaction_type === 'DISCOUNT' || transaction.transaction_type === 'discount') {
          // Handle separate discount transactions
          totalDiscountAmount += Math.abs(transaction.amount);
          
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

      // Use totalDiscountAmount for calculations
      let discountAmount = totalDiscountAmount;

      // Handle old transaction format where discounted amount was stored directly
      if (originalConsultationFee > 0 && discountAmount === 0 && consultationTransactions.length > 0) {
        // Check if this is old format with discount info in description
        const hasOldFormatDiscount = consultationTransactions.some(transaction => {
          const description = transaction.description || '';
          return description.match(/(\d+)%\s*discount\s*applied/i);
        });
        
        if (hasOldFormatDiscount) {
          const firstTransaction = consultationTransactions[0];
          const description = firstTransaction.description || '';
          
          // Look for old format: "Consultation Fee - Dr. X (20% discount applied)"
          const oldDiscountMatch = description.match(/(\d+)%\s*discount\s*applied/i);
          if (oldDiscountMatch) {
            discountPercentage = parseInt(oldDiscountMatch[1]);
            // The transaction amount is the discounted amount, so calculate original
            const currentTotal = consultationFee;
            consultationFee = currentTotal;
            originalConsultationFee = currentTotal / (1 - discountPercentage / 100);
            discountAmount = originalConsultationFee - consultationFee;
          }
        }
      }

      // If no consultation fee found, use the old calculation method
      if (originalConsultationFee === 0) {
        const totalAmount = activeTransactions.reduce((sum, transaction) => {
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
                    activeTransactions.find(t => t.doctor_name)?.doctor_name || 
                    'General Physician';
      
      // Get payment mode from the most recent transaction
      const paymentMode = activeTransactions.length > 0 ? activeTransactions[0].payment_mode || 'Cash' : 'Cash';

      setReceiptData({
        patient,
        transactions: activeTransactions,
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
      .filter(transaction => transaction.status !== 'CANCELLED') // Only non-cancelled (allow 0 amount for 100% discount)
      .forEach(transaction => {
        if (transaction.transaction_type === 'CONSULTATION' || transaction.transaction_type === 'consultation') {
          // CONSULTATION: Use same discount extraction logic as other services
          const description = transaction.description || 'Consultation Fee';
          let originalAmount = transaction.amount;
          let discountAmount = 0;
          let finalAmount = transaction.amount;

          // Extract discount info using same logic as other services
          if (transaction.discount_value && transaction.discount_value > 0) {
            if (transaction.discount_type === 'PERCENTAGE') {
              if (transaction.discount_value >= 100) {
                // 100% discount - extract from description
                const originalFeeMatch = description.match(/Original Fee:\s*₹([\d,]+(?:\.\d{2})?)/);
                const originalMatch = description.match(/Original:\s*₹([\d,]+(?:\.\d{2})?)/);

                if (originalFeeMatch) {
                  originalAmount = parseFloat(originalFeeMatch[1].replace(/,/g, ''));
                } else if (originalMatch) {
                  originalAmount = parseFloat(originalMatch[1].replace(/,/g, ''));
                } else {
                  originalAmount = 0;
                }
                discountAmount = originalAmount;
              } else {
                originalAmount = Math.abs(transaction.amount) / (1 - transaction.discount_value / 100);
                discountAmount = originalAmount - Math.abs(transaction.amount);
              }
            } else if (transaction.discount_type === 'AMOUNT') {
              originalAmount = Math.abs(transaction.amount) + transaction.discount_value;
              discountAmount = transaction.discount_value;
            }
          } else {
            // Try to extract from description
            const originalFeeMatch = description.match(/Original Fee:\s*₹([\d,]+(?:\.\d{2})?)/);
            const originalMatch = description.match(/Original:\s*₹([\d,]+(?:\.\d{2})?)/);
            const discountMatch = description.match(/Discount:\s*(?:(\d+(?:\.\d+)?)%\s*discount\s*\(₹([\d,]+(?:\.\d{2})?)\)|₹([\d,]+(?:\.\d{2})?)\s*discount)/);

            if (originalFeeMatch) {
              originalAmount = parseFloat(originalFeeMatch[1].replace(/,/g, ''));
            } else if (originalMatch) {
              originalAmount = parseFloat(originalMatch[1].replace(/,/g, ''));
            }

            if (discountMatch) {
              if (discountMatch[2]) {
                discountAmount = parseFloat(discountMatch[2].replace(/,/g, ''));
              } else if (discountMatch[3]) {
                discountAmount = parseFloat(discountMatch[3].replace(/,/g, ''));
              }
            }
          }

          finalAmount = Math.max(0, Math.abs(transaction.amount));

          if (originalAmount === 0 && discountAmount > 0) {
            originalAmount = discountAmount;
          }

          // Clean description
          let cleanDescription = description
            .replace(/\s*\|\s*Original:\s*₹[\d,]+(\.\d{2})?\s*\|\s*Discount:\s*\d+%\s*\(₹[\d,]+(\.\d{2})?\)\s*\|\s*Net:\s*₹[\d,]+(\.\d{2})?.*/g, '')
            .replace(/\s*\|\s*Original Fee:\s*₹[\d,]+(\.\d{2})?\s*\|\s*Discount:\s*.*/g, '')
            .replace(/\s*\(Original:\s*₹[\d,]+,\s*Discount:\s*\d+%,\s*Final:\s*₹[\d,]+\)/g, '')
            .trim();

          const calculatedDiscountPercentage = originalAmount > 0
            ? (discountAmount / originalAmount) * 100
            : 0;

          services.push({
            sr: srCounter++,
            service: cleanDescription || 'Consultation Fee',
            qty: 1,
            rate: originalAmount,
            amount: finalAmount,
            paymentMode: transaction.payment_mode,
            discountPercentage: calculatedDiscountPercentage,
            discountAmount: discountAmount
          });
        } else {
          // For other services, extract discount info (SAME LOGIC AS ComprehensivePatientList.tsx)
          const description = transaction.description || transaction.transaction_type;
          let originalAmount = transaction.amount;
          let discountAmount = 0;
          let finalAmount = transaction.amount;

          // Check for discount_type and discount_value fields first
          if (transaction.discount_value && transaction.discount_value > 0) {
            if (transaction.discount_type === 'PERCENTAGE') {
              // Handle 100% discount case
              if (transaction.discount_value >= 100) {
                // For 100% discount, extract original amount from description
                const originalFeeMatch = description.match(/Original Fee:\s*₹([\d,]+(?:\.\d{2})?)/);
                const originalMatch = description.match(/Original:\s*₹([\d,]+(?:\.\d{2})?)/);

                if (originalFeeMatch) {
                  originalAmount = parseFloat(originalFeeMatch[1].replace(/,/g, ''));
                } else if (originalMatch) {
                  originalAmount = parseFloat(originalMatch[1].replace(/,/g, ''));
                } else {
                  originalAmount = 0;
                }
                discountAmount = originalAmount;
              } else {
                // For percentage discount < 100%, calculate from net amount
                originalAmount = Math.abs(transaction.amount) / (1 - transaction.discount_value / 100);
                discountAmount = originalAmount - Math.abs(transaction.amount);
              }
            } else if (transaction.discount_type === 'AMOUNT') {
              // Discount is a fixed amount
              originalAmount = Math.abs(transaction.amount) + transaction.discount_value;
              discountAmount = transaction.discount_value;
            }
          } else {
            // Try to extract from description
            const originalFeeMatch = description.match(/Original Fee:\s*₹([\d,]+(?:\.\d{2})?)/);
            const discountMatch = description.match(/Discount:\s*(?:(\d+(?:\.\d+)?)%\s*discount\s*\(₹([\d,]+(?:\.\d{2})?)\)|₹([\d,]+(?:\.\d{2})?)\s*discount)/);

            if (originalFeeMatch) {
              originalAmount = parseFloat(originalFeeMatch[1].replace(/,/g, ''));
            }

            if (discountMatch) {
              if (discountMatch[2]) {
                discountAmount = parseFloat(discountMatch[2].replace(/,/g, ''));
              } else if (discountMatch[3]) {
                discountAmount = parseFloat(discountMatch[3].replace(/,/g, ''));
              }
            }
          }

          // Ensure amounts are non-negative
          finalAmount = Math.max(0, Math.abs(transaction.amount));

          // If originalAmount is 0 but we have a discount, recalculate
          if (originalAmount === 0 && discountAmount > 0) {
            originalAmount = discountAmount;
          }

          // Clean description - remove discount details
          let cleanDescription = description
            .replace(/\s*\|\s*Original:\s*₹[\d,]+(\.\d{2})?\s*\|\s*Discount:\s*\d+%\s*\(₹[\d,]+(\.\d{2})?\)\s*\|\s*Net:\s*₹[\d,]+(\.\d{2})?.*/g, '')
            .replace(/\s*\|\s*Original Fee:\s*₹[\d,]+(\.\d{2})?\s*\|\s*Discount:\s*.*/g, '')
            .replace(/\s*\(Original:\s*₹[\d,]+,\s*Discount:\s*\d+%,\s*Final:\s*₹[\d,]+\)/g, '')
            .trim();

          const calculatedDiscountPercentage = originalAmount > 0
            ? (discountAmount / originalAmount) * 100
            : 0;

          services.push({
            sr: srCounter++,
            service: cleanDescription || transaction.transaction_type,
            qty: 1,
            rate: originalAmount, // Original rate before discount
            amount: finalAmount, // Final amount after discount
            paymentMode: transaction.payment_mode,
            discountPercentage: calculatedDiscountPercentage,
            discountAmount: discountAmount
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
                <p><strong>NAME:</strong> {patient.prefix ? `${patient.prefix} ` : ''}{patient.first_name} {patient.last_name}</p>
                <p><strong>AGE/SEX:</strong> {patient.age && patient.age.trim() !== '' ? `${patient.age} years` : 'N/A'} / {patient.gender === 'MALE' ? 'M' : patient.gender === 'FEMALE' ? 'F' : patient.gender}</p>
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
                  <th className="border border-gray-300 px-3 py-2 text-right">Discount</th>
                  <th className="border border-gray-300 px-3 py-2 text-right">Amount (₹)</th>
                  <th className="border border-gray-300 px-3 py-2 text-center">Payment Mode</th>
                </tr>
              </thead>
              <tbody>
                {services.length > 0 ? services.map((service) => {
                  const discountDisplay = service.discountPercentage && service.discountPercentage > 0
                    ? `${service.discountPercentage.toFixed(0)}% (₹${service.discountAmount?.toFixed(2) || '0.00'})`
                    : (service.discountAmount && service.discountAmount > 0)
                      ? `₹${service.discountAmount.toFixed(2)}`
                      : '-';

                  return (
                    <tr key={service.sr}>
                      <td className="border border-gray-300 px-3 py-2">{service.sr}</td>
                      <td className="border border-gray-300 px-3 py-2">{service.service}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{service.qty}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right">₹{service.rate.toFixed(2)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right">{discountDisplay}</td>
                      <td className="border border-gray-300 px-3 py-2 text-right">₹{service.amount.toFixed(2)}</td>
                      <td className="border border-gray-300 px-3 py-2 text-center">{service.paymentMode || 'CASH'}</td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={7} className="border border-gray-300 px-3 py-2 text-center text-gray-500">
                      No services recorded
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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