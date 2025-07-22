import React from 'react';

export interface ReceiptData {
  type: 'CONSULTATION' | 'ADMISSION' | 'DISCHARGE' | 'SERVICE' | 'PAYMENT' | 'DAILY_SUMMARY';
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
      case 'DISCHARGE': return 'DISCHARGE SUMMARY & BILL';
      case 'SERVICE': return 'SERVICE RECEIPT';
      case 'PAYMENT': return 'PAYMENT RECEIPT';
      case 'DAILY_SUMMARY': return 'DAILY SUMMARY REPORT';
      default: return 'RECEIPT';
    }
  };

  return (
    <div className={`receipt-template bg-white p-6 text-sm font-mono ${className}`}>
      {/* Hospital Header */}
      <div className="text-center border-b-2 border-black pb-4 mb-4">
        <h1 className="text-2xl font-bold text-black">{data.hospital.name}</h1>
        <div className="mt-2 text-xs">
          <div>{data.hospital.address}</div>
          <div>Phone: {data.hospital.phone} | Email: {data.hospital.email}</div>
          <div>Reg. No: {data.hospital.registration} | GST: {data.hospital.gst}</div>
        </div>
      </div>

      {/* Receipt Title & Number */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-bold underline">{getReceiptTitle()}</h2>
        <div className="mt-2 flex justify-between text-xs">
          <span>Receipt No: <strong>{data.receiptNumber}</strong></span>
          <span>Date: <strong>{data.date}</strong></span>
          <span>Time: <strong>{data.time}</strong></span>
        </div>
      </div>

      {/* Patient Information */}
      <div className="mb-4 border border-black p-2">
        <h3 className="font-bold underline mb-2">PATIENT DETAILS:</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div>Patient ID: <strong>{data.patient.id}</strong></div>
          <div>Name: <strong>{data.patient.name}</strong></div>
          {data.patient.age && <div>Age: <strong>{data.patient.age} years</strong></div>}
          {data.patient.gender && <div>Gender: <strong>{data.patient.gender}</strong></div>}
          {data.patient.phone && <div>Phone: <strong>{data.patient.phone}</strong></div>}
          {data.patient.bloodGroup && <div>Blood Group: <strong>{data.patient.bloodGroup}</strong></div>}
        </div>
        {data.patient.address && (
          <div className="mt-2 text-xs">
            Address: <strong>{data.patient.address}</strong>
          </div>
        )}
      </div>

      {/* Medical Information (for discharge receipts) */}
      {data.medical && data.type === 'DISCHARGE' && (
        <div className="mb-4 border border-black p-2">
          <h3 className="font-bold underline mb-2">MEDICAL SUMMARY:</h3>
          <div className="text-xs space-y-1">
            {data.medical.diagnosis && (
              <div><strong>Diagnosis:</strong> {data.medical.diagnosis}</div>
            )}
            {data.medical.treatment && (
              <div><strong>Treatment:</strong> {data.medical.treatment}</div>
            )}
            {data.medical.condition && (
              <div><strong>Condition at Discharge:</strong> {data.medical.condition}</div>
            )}
            {data.medical.doctor && (
              <div><strong>Attending Doctor:</strong> {data.medical.doctor}</div>
            )}
            {data.medical.admissionDate && data.medical.dischargeDate && (
              <div>
                <strong>Admission:</strong> {data.medical.admissionDate} to {data.medical.dischargeDate}
                {data.medical.stayDuration && ` (${data.medical.stayDuration} days)`}
              </div>
            )}
            {data.medical.followUp && (
              <div><strong>Follow-up:</strong> {data.medical.followUp}</div>
            )}
          </div>
        </div>
      )}

      {/* Charges Table */}
      <div className="mb-4">
        <h3 className="font-bold underline mb-2">CHARGES:</h3>
        <table className="w-full border-collapse border border-black text-xs">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-black p-1 text-left">Description</th>
              <th className="border border-black p-1 text-center">Qty</th>
              <th className="border border-black p-1 text-right">Rate</th>
              <th className="border border-black p-1 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.charges.map((charge, index) => (
              <tr key={index}>
                <td className="border border-black p-1">{charge.description}</td>
                <td className="border border-black p-1 text-center">{charge.quantity || 1}</td>
                <td className="border border-black p-1 text-right">
                  ₹{(charge.rate || charge.amount).toLocaleString('en-IN')}
                </td>
                <td className="border border-black p-1 text-right">
                  ₹{charge.amount.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-gray-100 font-bold">
              <td colSpan={3} className="border border-black p-1 text-right">SUBTOTAL:</td>
              <td className="border border-black p-1 text-right">
                ₹{data.totals.subtotal.toLocaleString('en-IN')}
              </td>
            </tr>
            {data.totals.discount > 0 && (
              <tr>
                <td colSpan={3} className="border border-black p-1 text-right">Discount:</td>
                <td className="border border-black p-1 text-right">
                  -₹{data.totals.discount.toLocaleString('en-IN')}
                </td>
              </tr>
            )}
            {data.totals.insurance > 0 && (
              <tr>
                <td colSpan={3} className="border border-black p-1 text-right">Insurance Covered:</td>
                <td className="border border-black p-1 text-right">
                  -₹{data.totals.insurance.toLocaleString('en-IN')}
                </td>
              </tr>
            )}
            <tr className="bg-gray-200 font-bold">
              <td colSpan={3} className="border border-black p-1 text-right">NET AMOUNT:</td>
              <td className="border border-black p-1 text-right">
                ₹{data.totals.netAmount.toLocaleString('en-IN')}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Payment Information */}
      {data.payments.length > 0 && (
        <div className="mb-4">
          <h3 className="font-bold underline mb-2">PAYMENT DETAILS:</h3>
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-black p-1 text-left">Mode</th>
                <th className="border border-black p-1 text-left">Reference</th>
                <th className="border border-black p-1 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.map((payment, index) => (
                <tr key={index}>
                  <td className="border border-black p-1">{payment.mode}</td>
                  <td className="border border-black p-1">{payment.reference || '-'}</td>
                  <td className="border border-black p-1 text-right">
                    ₹{payment.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-gray-100 font-bold">
                <td colSpan={2} className="border border-black p-1 text-right">TOTAL PAID:</td>
                <td className="border border-black p-1 text-right">
                  ₹{data.totals.amountPaid.toLocaleString('en-IN')}
                </td>
              </tr>
              {data.totals.balance !== 0 && (
                <tr className="font-bold">
                  <td colSpan={2} className="border border-black p-1 text-right">
                    {data.totals.balance > 0 ? 'BALANCE DUE:' : 'EXCESS PAID:'}
                  </td>
                  <td className="border border-black p-1 text-right">
                    ₹{Math.abs(data.totals.balance).toLocaleString('en-IN')}
                  </td>
                </tr>
              )}
            </tfoot>
          </table>
        </div>
      )}

      {/* Additional Notes */}
      {data.notes && (
        <div className="mb-4 border border-black p-2">
          <h3 className="font-bold underline mb-2">NOTES:</h3>
          <div className="text-xs">{data.notes}</div>
        </div>
      )}

      {/* Signatures Section */}
      <div className="mb-6 grid grid-cols-2 gap-8 text-xs">
        <div>
          <div className="border-t border-black pt-1 mt-8">Patient/Attendant Signature</div>
        </div>
        <div>
          <div className="border-t border-black pt-1 mt-8">Authorized Signature</div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t-2 border-black pt-2 text-center">
        <div className="text-xs">
          <div className="font-bold">Thank you for choosing {data.hospital.name}</div>
          <div className="mt-1">
            {data.isOriginal !== false && '★ ORIGINAL COPY ★'}
          </div>
          <div className="mt-1">Computer Generated Receipt - No signature required</div>
          <div>Printed on: {new Date().toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Staff Information */}
      {(data.staff.processedBy || data.staff.authorizedBy) && (
        <div className="mt-4 text-xs text-gray-600 border-t pt-2">
          {data.staff.processedBy && <div>Processed by: {data.staff.processedBy}</div>}
          {data.staff.authorizedBy && <div>Authorized by: {data.staff.authorizedBy}</div>}
        </div>
      )}
    </div>
  );
};

export default ReceiptTemplate;
export type { ReceiptData };