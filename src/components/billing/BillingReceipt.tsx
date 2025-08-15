import React, { useState, useEffect } from 'react';
import HospitalService from '../../services/hospitalService';
import ReceiptTemplate, { type ReceiptData } from '../receipts/ReceiptTemplate';

interface BillingReceiptProps {
  bill: any; // CombinedBill type
  onClose: () => void;
}

const BillingReceipt: React.FC<BillingReceiptProps> = ({ bill, onClose }) => {
  const [patientDetails, setPatientDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        setLoading(true);
        const details = await HospitalService.getPatientById(bill.patientId);
        setPatientDetails(details);
      } catch (error) {
        console.warn('Could not fetch patient details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (bill.patientId) {
      fetchPatientDetails();
    } else {
      setLoading(false);
    }
  }, [bill.patientId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white p-8 rounded-lg">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Loading patient details...</span>
          </div>
        </div>
      </div>
    );
  }

  // Prepare receipt data in the format expected by ReceiptTemplate
  const receiptData: ReceiptData = {
    type: 'PAYMENT',
    receiptNumber: `BILL-${bill.patientId.slice(-6).toUpperCase()}-${Date.now()}`,
    date: new Date().toLocaleDateString('en-IN'),
    time: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }),
    
    hospital: {
      name: 'VALANT HOSPITAL',
      address: 'Madhuban, Siwan, Bihar',
      phone: '+91 99999 99999',
      email: 'info@valanthospital.com',
      registration: 'REG/2024/001',
      gst: 'GST123456789'
    },
    
    patient: {
      id: patientDetails?.patient_id || bill.patientId.slice(-6).toUpperCase(),
      name: patientDetails ? `${patientDetails.first_name} ${patientDetails.last_name || ''}`.trim() : bill.patientName,
      phone: patientDetails?.phone || bill.patientPhone || 'N/A',
      age: patientDetails?.age,
      gender: patientDetails?.gender,
      address: patientDetails?.address,
      bloodGroup: patientDetails?.blood_group
    },
    
    charges: [],
    
    payments: [{
      mode: 'CASH',
      amount: bill.grandTotal || 0,
      date: new Date().toLocaleDateString('en-IN')
    }],
    
    totals: {
      subtotal: bill.grandTotal || 0,
      discount: 0,
      insurance: 0,
      netAmount: bill.grandTotal || 0,
      amountPaid: bill.grandTotal || 0,
      balance: 0
    },
    
    staff: {
      processedBy: 'Billing Department',
      authorizedBy: 'Hospital Administrator'
    },
    
    notes: `Total Visits: ${bill.totalVisits} | First Visit: ${new Date(bill.firstVisit).toLocaleDateString('en-IN')} | Last Visit: ${new Date(bill.lastVisit).toLocaleDateString('en-IN')}`,
    
    isOriginal: true
  };

  // Add OPD charges with detailed breakdown
  if (bill.opdBills && bill.opdBills.length > 0) {
    bill.opdBills.forEach((opdBill: any, index: number) => {
      // Main OPD charge
      receiptData.charges.push({
        description: `OPD Consultation #${index + 1} - Dr. ${opdBill.doctorName}`,
        amount: opdBill.consultationFee,
        quantity: 1,
        rate: opdBill.consultationFee
      });

      // Add service breakdown if available
      if (opdBill.services && opdBill.services.length > 0) {
        opdBill.services.forEach((service: any) => {
          receiptData.charges.push({
            description: `  • ${service.name} (${new Date(service.date).toLocaleDateString('en-IN')})`,
            amount: service.amount,
            quantity: 1,
            rate: service.amount
          });
        });
      }

      // Other charges if any
      if (opdBill.investigationCharges > 0) {
        receiptData.charges.push({
          description: `  • Investigation Charges`,
          amount: opdBill.investigationCharges,
          quantity: 1,
          rate: opdBill.investigationCharges
        });
      }

      if (opdBill.medicineCharges > 0) {
        receiptData.charges.push({
          description: `  • Medicine Charges`,
          amount: opdBill.medicineCharges,
          quantity: 1,
          rate: opdBill.medicineCharges
        });
      }

      if (opdBill.otherCharges > 0) {
        receiptData.charges.push({
          description: `  • Other Charges`,
          amount: opdBill.otherCharges,
          quantity: 1,
          rate: opdBill.otherCharges
        });
      }
    });
  }

  // Add IPD charges with detailed breakdown
  if (bill.ipdBills && bill.ipdBills.length > 0) {
    bill.ipdBills.forEach((ipdBill: any, index: number) => {
      // Admission charges
      if (ipdBill.admissionCharges > 0) {
        receiptData.charges.push({
          description: `IPD Admission #${index + 1} - ${new Date(ipdBill.admissionDate).toLocaleDateString('en-IN')}`,
          amount: ipdBill.admissionCharges,
          quantity: 1,
          rate: ipdBill.admissionCharges
        });
      }

      // Stay charges breakdown
      if (ipdBill.staySegments && ipdBill.staySegments.length > 0) {
        ipdBill.staySegments.forEach((segment: any) => {
          receiptData.charges.push({
            description: `  • ${segment.roomType} Room (${segment.days} days @ ₹${segment.totalCharge / segment.days}/day)`,
            amount: segment.totalCharge,
            quantity: segment.days,
            rate: segment.totalCharge / segment.days
          });
        });
      } else if (ipdBill.totalStayCharges > 0) {
        const days = Math.ceil((new Date(ipdBill.dischargeDate).getTime() - new Date(ipdBill.admissionDate).getTime()) / (1000 * 60 * 60 * 24));
        receiptData.charges.push({
          description: `  • Room Charges (${days} days)`,
          amount: ipdBill.totalStayCharges,
          quantity: days,
          rate: ipdBill.totalStayCharges / days
        });
      }

      // IPD services
      if (ipdBill.services && ipdBill.services.length > 0) {
        ipdBill.services.forEach((service: any) => {
          receiptData.charges.push({
            description: `  • ${service.name}`,
            amount: service.amount,
            quantity: 1,
            rate: service.amount
          });
        });
      } else if (ipdBill.totalServiceCharges > 0) {
        receiptData.charges.push({
          description: `  • Medical Services & Procedures`,
          amount: ipdBill.totalServiceCharges,
          quantity: 1,
          rate: ipdBill.totalServiceCharges
        });
      }
    });
  }

  // If no detailed charges, add summary
  if (receiptData.charges.length === 0) {
    if (bill.totalOPDAmount > 0) {
      receiptData.charges.push({
        description: 'OPD Services Total',
        amount: bill.totalOPDAmount,
        quantity: 1,
        rate: bill.totalOPDAmount
      });
    }
    if (bill.totalIPDAmount > 0) {
      receiptData.charges.push({
        description: 'IPD Services Total',
        amount: bill.totalIPDAmount,
        quantity: 1,
        rate: bill.totalIPDAmount
      });
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-auto">
        {/* Header with print and close buttons */}
        <div className="flex justify-between items-center p-4 border-b print:hidden">
          <h2 className="text-xl font-bold">Billing Receipt</h2>
          <div className="flex gap-2">
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
        </div>
        
        {/* Receipt Content */}
        <div className="p-6">
          <ReceiptTemplate data={receiptData} />
        </div>
      </div>
    </div>
  );
};

export default BillingReceipt;