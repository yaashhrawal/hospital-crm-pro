import React from 'react';

export interface ReceiptData {
  type: 'CONSULTATION' | 'ADMISSION' | 'DISCHARGE' | 'SERVICE' | 'PAYMENT' | 'DAILY_SUMMARY' | 'IP_STICKER';
  receiptNumber: string;
  date: string;
  time: string;
  
  // Hospital Information
  hospital: {
    name: string;
    address: string;
    phone: string;
    email: string;
    registration: string;
    gst: string;
    website?: string;
  };
  
  // Patient Information
  patient: {
    id: string;
    name: string;
    age?: number;
    gender?: string;
    phone?: string;
    address?: string;
    bloodGroup?: string;
    history_present_illness?: string;
    past_medical_history?: string;
    procedure_planned?: string;
  };
  
  // Medical Information (for discharge)
  medical?: {
    diagnosis?: string;
    treatment?: string;
    condition?: string;
    followUp?: string;
    doctor?: string;
    admissionDate?: string;
    dischargeDate?: string;
    stayDuration?: number;
    medications?: string;
  };
  
  // Financial Information
  charges: {
    description: string;
    amount: number;
    quantity?: number;
    rate?: number;
  }[];
  
  payments: {
    mode: 'CASH' | 'ONLINE' | 'INSURANCE';
    amount: number;
    reference?: string;
    date?: string;
  }[];
  
  totals: {
    subtotal: number;
    discount: number;
    insurance: number;
    netAmount: number;
    amountPaid: number;
    balance: number;
  };
  
  // Staff Information
  staff: {
    processedBy?: string;
    authorizedBy?: string;
  };
  
  // Additional Information
  notes?: string;
  isOriginal?: boolean;
}

interface ReceiptTemplateProps {
  data: ReceiptData;
  className?: string;
}

// Function to convert number to words
const convertToWords = (num: number): string => {
  if (num === 0) return 'Zero Rupees Only';
  
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
  
  return result.trim() + ' Rupees Only';
};

const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({ data, className = '' }) => {
  // Get current time when receipt is rendered
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });
  };

  // Calculate totals from charges if not provided
  const calculateTotals = () => {
    const chargesTotal = data.charges.reduce((sum, charge) => sum + (charge.amount || 0), 0);
    const paymentsTotal = data.payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);
    
    return {
      subtotal: data.totals?.subtotal || chargesTotal,
      discount: data.totals?.discount || 0,
      insurance: data.totals?.insurance || 0,
      netAmount: data.totals?.netAmount || (chargesTotal - (data.totals?.discount || 0) - (data.totals?.insurance || 0)),
      amountPaid: data.totals?.amountPaid || paymentsTotal,
      balance: data.totals?.balance || 0
    };
  };

  const totals = calculateTotals();

  const getReceiptTitle = () => {
    switch (data.type) {
      case 'CONSULTATION': return 'CONSULTATION RECEIPT';
      case 'ADMISSION': return 'IPD ADMISSION RECEIPT';
      case 'IP_STICKER': return 'IP STICKER';
      case 'DISCHARGE': return 'DISCHARGE SUMMARY & BILL';
      case 'SERVICE': return 'SERVICE RECEIPT';
      case 'PAYMENT': return 'PAYMENT RECEIPT';
      case 'DAILY_SUMMARY': return 'DAILY SUMMARY REPORT';
      default: return 'RECEIPT';
    }
  };

  const convertCharges = () => {
    return data.charges.map((charge, index) => ({
      sr: index + 1,
      service: charge.description,
      qty: charge.quantity || 1,
      rate: charge.rate || charge.amount / (charge.quantity || 1),
      amount: charge.amount
    }));
  };

  const services = convertCharges();

  return (
    <div className={`receipt-template bg-white p-6 max-w-4xl mx-auto print:p-0 print:max-w-none ${className}`}>
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
            .receipt-template, .receipt-template * {
              visibility: visible !important;
              opacity: 1 !important;
            }
            .receipt-template {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white !important;
            }
            .receipt-template img {
              display: block !important;
              visibility: visible !important;
              opacity: 1 !important;
              max-height: 64px !important;
              height: auto !important;
              width: auto !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            /* Ensure all text and borders are visible */
            .receipt-template p, 
            .receipt-template span, 
            .receipt-template div, 
            .receipt-template h1, 
            .receipt-template h2, 
            .receipt-template h3, 
            .receipt-template table, 
            .receipt-template td, 
            .receipt-template th {
              color: black !important;
              border-color: #333 !important;
            }
            /* Ensure summary section is visible */
            .receipt-template .border-t-2 {
              border-top: 2px solid #333 !important;
            }
            .bg-gray-50, .bg-blue-50, .bg-yellow-50, .bg-gray-100 {
              background-color: #f8f9fa !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            /* Force visibility of totals */
            .receipt-template .font-bold {
              font-weight: bold !important;
            }
            .receipt-template .text-lg {
              font-size: 1.125rem !important;
            }
            /* Ensure table borders are visible */
            .receipt-template table, 
            .receipt-template th, 
            .receipt-template td {
              border-color: #333 !important;
            }
            /* Make sure total amounts are bold and visible */
            .receipt-template .text-right {
              text-align: right !important;
            }
            /* Ensure patient information is visible */
            .receipt-template p,
            .receipt-template strong {
              color: black !important;
            }
            .receipt-template .bg-gray-50 {
              background-color: #f8f9fa !important;
            }
            /* Force visibility of all content */
            .receipt-template * {
              color: black !important;
            }
          }
        `
      }} />
      
      {/* Header */}
      <div className="text-center border-b-2 border-gray-300 pb-4 mb-6 print:border-black">
        <div className="flex flex-col items-center justify-center mb-4">
          {/* Hospital Name - Only show if provided */}
          {data.hospital.name && (
            <h1 className="text-2xl font-bold text-blue-600 mb-2 print:text-black print:block">
              {data.hospital.name}
            </h1>
          )}
          {/* Logo - Optional */}
          <img 
            src="/logo.png" 
            alt="Hospital Logo" 
            className="h-12 w-auto print:block"
            style={{ maxHeight: '48px', height: 'auto', width: 'auto' }}
            onError={(e) => {
              // Hide image if it fails to load
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
            }}
          />
        </div>
        <div className="text-sm text-gray-700 mt-4 print:text-black">
          <p className="print:text-black">{data.hospital.address}</p>
          <p className="print:text-black">Phone: {data.hospital.phone} | Email: {data.hospital.email}</p>
          <p className="print:text-black">Website: www.valanthospital.com</p>
        </div>
      </div>

      {/* Bill Header */}
      <div className="mb-6">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{getReceiptTitle()}</h2>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>RECEIPT NO:</strong> {data.receiptNumber}</p>
            <p><strong>DATE:</strong> {data.date}</p>
            <p><strong>TIME:</strong> {getCurrentTime()}</p>
          </div>
          <div className="text-right">
            <p><strong>Patient ID:</strong> {data.patient.id}</p>
            <p><strong>PAYMENT MODE:</strong> {data.payments[0]?.mode || 'CASH'}</p>
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 print:bg-gray-100 print:p-4">
        <h3 className="font-semibold mb-3 text-gray-800 print:text-black print:font-bold">Patient Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm print:grid-cols-2 print:gap-4">
          <div>
            <p className="print:text-black"><strong>NAME:</strong> {data.patient.name || 'N/A'}</p>
            <p className="print:text-black"><strong>AGE/SEX:</strong> {data.patient.age || 'N/A'} years / {data.patient.gender || 'N/A'}</p>
            <p className="print:text-black"><strong>MOBILE:</strong> {data.patient.phone || 'N/A'}</p>
            {data.type === 'IP_STICKER' && data.patient.history_present_illness && (
              <p><strong>HPI:</strong> {data.patient.history_present_illness}</p>
            )}
            {data.type === 'IP_STICKER' && data.patient.past_medical_history && (
              <p><strong>PMH:</strong> {data.patient.past_medical_history}</p>
            )}
          </div>
          <div>
            {data.staff.processedBy && <p className="print:text-black"><strong>PROCESSED BY:</strong> {data.staff.processedBy}</p>}
            {data.type === 'IP_STICKER' && data.patient.procedure_planned && (
              <p><strong>Procedure:</strong> {data.patient.procedure_planned}</p>
            )}
          </div>
        </div>
      </div>

      {/* Medical Information (for discharge receipts) */}
      {data.medical && data.type === 'DISCHARGE' && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-3 text-gray-800">Medical Summary</h3>
          <div className="text-sm space-y-2">
            {data.medical.diagnosis && (
              <p><strong>Diagnosis:</strong> {data.medical.diagnosis}</p>
            )}
            {data.medical.treatment && (
              <p><strong>Treatment:</strong> {data.medical.treatment}</p>
            )}
            {data.medical.condition && (
              <p><strong>Condition at Discharge:</strong> {data.medical.condition}</p>
            )}
            {data.medical.doctor && (
              <p><strong>Attending Doctor:</strong> {data.medical.doctor}</p>
            )}
            {data.medical.admissionDate && data.medical.dischargeDate && (
              <p>
                <strong>Stay Duration:</strong> {data.medical.admissionDate} to {data.medical.dischargeDate}
                {data.medical.stayDuration && ` (${data.medical.stayDuration} days)`}
              </p>
            )}
            {data.medical.followUp && (
              <p><strong>Follow-up Instructions:</strong> {data.medical.followUp}</p>
            )}
          </div>
        </div>
      )}

      {/* Discharge Medications Table */}
      {data.medical?.medications && data.type === 'DISCHARGE' && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-gray-800">💊 Discharge Medications</h3>
          <div className="border border-gray-300 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border-b border-gray-300 px-3 py-2 text-left font-semibold">Drug Name & Dose</th>
                  <th className="border-b border-gray-300 px-3 py-2 text-center font-semibold">Morning</th>
                  <th className="border-b border-gray-300 px-3 py-2 text-center font-semibold">Afternoon</th>
                  <th className="border-b border-gray-300 px-3 py-2 text-center font-semibold">Night</th>
                  <th className="border-b border-gray-300 px-3 py-2 text-center font-semibold">Days</th>
                </tr>
              </thead>
              <tbody>
                {data.medical.medications.split('\n').filter(line => line.trim()).map((medication, index) => {
                  const parts = medication.trim().split(/\s+/);
                  const drugName = parts.slice(0, -4).join(' ') || parts[0] || '';
                  const morning = parts[parts.length - 4] || '0';
                  const afternoon = parts[parts.length - 3] || '0';
                  const night = parts[parts.length - 2] || '0';
                  const days = parts[parts.length - 1] || '0';
                  
                  return (
                    <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border-b border-gray-200 px-3 py-2">{drugName}</td>
                      <td className="border-b border-gray-200 px-3 py-2 text-center">{morning}</td>
                      <td className="border-b border-gray-200 px-3 py-2 text-center">{afternoon}</td>
                      <td className="border-b border-gray-200 px-3 py-2 text-center">{night}</td>
                      <td className="border-b border-gray-200 px-3 py-2 text-center">{days}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Services Table */}
      <div className="mb-6 print:block">
        <h3 className="font-semibold mb-3 text-gray-800 print:text-black">Services & Charges</h3>
        <table className="w-full border-collapse border border-gray-300 print:border-black">
          <thead>
            <tr className="bg-gray-100 print:bg-gray-200">
              <th className="border border-gray-300 px-3 py-2 text-left print:border-black print:text-black">Sr</th>
              <th className="border border-gray-300 px-3 py-2 text-left print:border-black print:text-black">Service</th>
              <th className="border border-gray-300 px-3 py-2 text-center print:border-black print:text-black">Qty</th>
              <th className="border border-gray-300 px-3 py-2 text-right print:border-black print:text-black">Rate (₹)</th>
              <th className="border border-gray-300 px-3 py-2 text-right print:border-black print:text-black">Discount</th>
              <th className="border border-gray-300 px-3 py-2 text-right print:border-black print:text-black">Amount (₹)</th>
              <th className="border border-gray-300 px-3 py-2 text-center print:border-black print:text-black">Payment Mode</th>
            </tr>
          </thead>
          <tbody>
            {services.length > 0 ? (
              <>
                {services.map((service, index) => (
                  <tr key={service.sr}>
                    <td className="border border-gray-300 px-3 py-2 print:border-black print:text-black">{service.sr}</td>
                    <td className="border border-gray-300 px-3 py-2 print:border-black print:text-black">{service.service}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center print:border-black print:text-black">{service.qty}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right print:border-black print:text-black">₹{service.rate.toFixed(2)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-right print:border-black print:text-black">
                      {totals.discount > 0 && index === 0 ? `₹${totals.discount.toFixed(2)}` : '-'}
                    </td>
                    <td className="border border-gray-300 px-3 py-2 text-right print:border-black print:text-black">₹{service.amount.toFixed(2)}</td>
                    <td className="border border-gray-300 px-3 py-2 text-center print:border-black print:text-black">
                      {data.payments[0]?.mode || 'CASH'}
                    </td>
                  </tr>
                ))}
                {/* Bill Summary Row */}
                <tr className="bg-gray-100 font-bold print:bg-gray-200">
                  <td colSpan={7} className="border border-gray-300 px-3 py-2 text-center print:border-black print:text-black">
                    <div className="text-center">
                      <p className="mb-1">Consultation Fee: ₹{totals.subtotal.toFixed(2)}</p>
                      <p className="mb-1">Subtotal: ₹{totals.subtotal.toFixed(2)}</p>
                      <p className="text-lg font-bold">Net Amount Payable: ₹{totals.netAmount.toFixed(2)}</p>
                      <p className="text-sm mt-1">Amount in Words: {convertToWords(totals.netAmount)}</p>
                    </div>
                  </td>
                </tr>
              </>
            ) : (
              <tr>
                <td colSpan={7} className="border border-gray-300 px-3 py-2 text-center text-gray-500 print:border-black print:text-black">
                  No services recorded
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>


      {/* Notes */}
      {data.notes && (
        <div className="mb-6 bg-yellow-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-2 text-gray-800">Notes:</h3>
          <p className="text-sm text-gray-700">{data.notes}</p>
        </div>
      )}

      {/* Signature Section */}
      <div className="grid grid-cols-2 gap-8 mb-6">
        <div className="text-center">
          <div className="border-t border-gray-400 mt-12 pt-2">
            <p className="text-sm">Patient/Guardian Signature</p>
          </div>
        </div>
        <div className="text-center">
          <div className="border-t border-gray-400 mt-12 pt-2">
            <p className="text-sm">Authorized Signature</p>
            {data.staff.authorizedBy && <p className="text-xs text-gray-600 mt-1">{data.staff.authorizedBy}</p>}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
        <p>Thank you for choosing VALANT HOSPITAL</p>
        <p className="mt-1">A unit of Neuorth Medicare Pvt Ltd</p>
        {data.isOriginal !== false && <p className="font-bold mt-2">** ORIGINAL COPY **</p>}
      </div>
    </div>
  );
};

export default ReceiptTemplate;
export type { ReceiptData };