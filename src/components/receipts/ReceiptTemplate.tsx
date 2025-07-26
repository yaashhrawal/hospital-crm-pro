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

const ReceiptTemplate: React.FC<ReceiptTemplateProps> = ({ data, className = '' }) => {
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
    <div className={`receipt-template bg-white p-6 max-w-4xl mx-auto ${className}`}>
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
              visibility: visible;
            }
            .receipt-template {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .print\\:hidden {
              display: none !important;
            }
          }
        `
      }} />
      
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
          <p>{data.hospital.address}</p>
          <p>Phone: {data.hospital.phone} | Email: {data.hospital.email}</p>
          <p>Reg. No: {data.hospital.registration} | GST: {data.hospital.gst}</p>
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
            <p><strong>TIME:</strong> {data.time}</p>
          </div>
          <div className="text-right">
            <p><strong>Patient ID:</strong> {data.patient.id}</p>
            <p><strong>PAYMENT MODE:</strong> {data.payments[0]?.mode || 'CASH'}</p>
          </div>
        </div>
      </div>

      {/* Patient Information */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-3 text-gray-800">Patient Information</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>NAME:</strong> {data.patient.name}</p>
            <p><strong>AGE/SEX:</strong> {data.patient.age || 'N/A'} / {data.patient.gender || 'N/A'}</p>
            <p><strong>MOBILE:</strong> {data.patient.phone || 'N/A'}</p>
            {data.type === 'IP_STICKER' && data.patient.history_present_illness && (
              <p><strong>HPI:</strong> {data.patient.history_present_illness}</p>
            )}
            {data.type === 'IP_STICKER' && data.patient.past_medical_history && (
              <p><strong>PMH:</strong> {data.patient.past_medical_history}</p>
            )}
          </div>
          <div>
            <p><strong>BLOOD GROUP:</strong> {data.patient.bloodGroup || 'N/A'}</p>
            <p><strong>ADDRESS:</strong> {data.patient.address || 'N/A'}</p>
            {data.staff.processedBy && <p><strong>PROCESSED BY:</strong> {data.staff.processedBy}</p>}
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
                <td className="border border-gray-300 px-3 py-2 text-right">₹{service.rate}</td>
                <td className="border border-gray-300 px-3 py-2 text-right">₹{service.amount}</td>
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

      {/* Payment Details & Summary (Hidden for IP Sticker/Admission) */}
      {(data.type !== 'IP_STICKER' && data.type !== 'ADMISSION') && (
        <>
          {data.payments.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold mb-3 text-gray-800">Payment Details</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                {data.payments.map((payment, index) => (
                  <div key={index} className="flex justify-between text-sm mb-1">
                    <span><strong>{payment.mode}:</strong> {payment.reference ? `(Ref: ${payment.reference})` : ''}</span>
                    <span>₹{payment.amount}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="border-t-2 border-gray-300 pt-4 mb-6">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between mb-2">
                  <span>Total Amount:</span>
                  <span>₹{data.totals.subtotal}</span>
                </div>
                {data.totals.discount > 0 && (
                  <div className="flex justify-between mb-2 text-red-600">
                    <span>Discount:</span>
                    <span>- ₹{data.totals.discount}</span>
                  </div>
                )}
                {data.totals.insurance > 0 && (
                  <div className="flex justify-between mb-2 text-blue-600">
                    <span>Insurance Covered:</span>
                    <span>- ₹{data.totals.insurance}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t border-gray-300 pt-2">
                  <span>Net Amount:</span>
                  <span>₹{data.totals.netAmount}</span>
                </div>
                <div className="flex justify-between mt-2">
                  <span>Amount Paid:</span>
                  <span>₹{data.totals.amountPaid}</span>
                </div>
                {data.totals.balance !== 0 && (
                  <div className={`flex justify-between mt-2 font-semibold ${data.totals.balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    <span>{data.totals.balance > 0 ? 'Balance Due:' : 'Excess Paid:'}</span>
                    <span>₹{Math.abs(data.totals.balance)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

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
        <p>Thank you for choosing {data.hospital.name}</p>
        <p className="mt-1">A unit of Neuorth Medicare Pvt Ltd</p>
        {data.isOriginal !== false && <p className="font-bold mt-2">** ORIGINAL COPY **</p>}
        <p className="mt-1">Generated on {data.date} at {data.time}</p>
      </div>
    </div>
  );
};

export default ReceiptTemplate;
export type { ReceiptData };