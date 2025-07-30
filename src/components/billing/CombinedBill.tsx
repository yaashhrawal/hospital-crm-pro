import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import HospitalService from '../../services/hospitalService';
import type { PatientWithRelations, PatientTransaction, PatientAdmissionWithRelations } from '../../config/supabaseNew';
import { formatDate } from '../../utils/excelExport';

interface CombinedBillProps {
  patient: PatientWithRelations;
  onClose: () => void;
}

const CombinedBill: React.FC<CombinedBillProps> = ({ patient, onClose }) => {
  const [admissions, setAdmissions] = useState<PatientAdmissionWithRelations[]>([]);
  const [transactions, setTransactions] = useState<PatientTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAllData();
  }, [patient.id]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Load IPD admissions
      const admissionData = await HospitalService.getPatientAdmissions(patient.id);
      setAdmissions(admissionData);
      
      // Get all transactions
      const allTransactions = patient.transactions || [];
      setTransactions(allTransactions.filter(t => t.status === 'COMPLETED'));
    } catch (error) {
      toast.error('Failed to load billing data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const calculateDays = (admission: PatientAdmissionWithRelations) => {
    const admitDate = new Date(admission.admission_date);
    const dischargeDate = admission.actual_discharge_date 
      ? new Date(admission.actual_discharge_date) 
      : new Date();
    const diffTime = Math.abs(dischargeDate.getTime() - admitDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) || 1;
  };

  const calculateIPDTotal = () => {
    return admissions.reduce((total, admission) => {
      const days = calculateDays(admission);
      const bedCharges = days * (admission.bed?.daily_rate || 0);
      const services = admission.services || {};
      const serviceTotal = Object.values(services).reduce((sum: number, service: any) => {
        return sum + (service.amount || 0);
      }, 0);
      return total + bedCharges + serviceTotal;
    }, 0);
  };

  const calculateOPDTotal = () => {
    // Only count non-admission transactions
    return transactions
      .filter(t => !t.admission_id)
      .reduce((sum, t) => sum + t.amount, 0);
  };

  const calculateGrandTotal = () => {
    return calculateIPDTotal() + calculateOPDTotal();
  };

  const groupOPDTransactionsByType = () => {
    const opdTransactions = transactions.filter(t => !t.admission_id);
    const grouped: { [key: string]: { count: number; total: number } } = {};
    
    opdTransactions.forEach(t => {
      const type = t.transaction_type;
      if (!grouped[type]) {
        grouped[type] = { count: 0, total: 0 };
      }
      grouped[type].count++;
      grouped[type].total += t.amount;
    });
    
    return grouped;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
        <div className="text-center">Loading billing data...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
      <style dangerouslySetInnerHTML={{
        __html: `
          @media print {
            @page {
              margin: 10mm;
              size: A4;
            }
            body * {
              visibility: hidden;
            }
            #combined-bill-content, #combined-bill-content * {
              visibility: visible;
            }
            #combined-bill-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white;
            }
            .no-print {
              display: none !important;
            }
            .page-break {
              page-break-before: always;
            }
          }
        `
      }} />

      <div id="combined-bill-content" className="p-8">
        {/* Header with Logo */}
        <div className="text-center border-b-2 border-gray-300 pb-4 mb-6">
          <div className="flex items-center justify-center mb-4">
            <img 
              src="/logo.png" 
              alt="VALANT Hospital Logo" 
              className="h-16 w-auto"
              style={{ maxHeight: '64px', height: 'auto', width: 'auto' }}
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">VALANT HOSPITAL</h1>
          <div className="text-sm text-gray-700">
            <p>10, Madhav Vihar Shobhagpura, Udaipur (313001)</p>
            <p>Phone: +91 9119118000 | Email: valanthospital@gmail.com</p>
            <p>Website: www.valanthospital.com</p>
          </div>
          <div className="mt-4">
            <h2 className="text-xl font-semibold text-gray-800">COMBINED BILL</h2>
          </div>
        </div>

        {/* Bill Info */}
        <div className="mb-6">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>BILL NO:</strong> COMB-{patient.patient_id}-{new Date().getTime()}</p>
              <p><strong>DATE:</strong> {new Date().toLocaleDateString('en-IN')}</p>
            </div>
            <div className="text-right">
              <p><strong>Patient ID:</strong> {patient.patient_id}</p>
              <p><strong>Department Status:</strong> {patient.departmentStatus || 'OPD'}</p>
            </div>
          </div>
        </div>

        {/* Patient Details */}
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
              <p><strong>TOTAL VISITS:</strong> {patient.visitCount || 0}</p>
            </div>
          </div>
        </div>

        {/* Summary Section */}
        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <h3 className="font-bold text-lg text-blue-900 mb-4">Billing Summary</h3>
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">IPD Charges</p>
              <p className="text-2xl font-bold text-purple-600">₹{calculateIPDTotal().toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{admissions.length} admission(s)</p>
            </div>
            <div className="bg-white p-4 rounded-lg">
              <p className="text-sm font-medium text-gray-600">OPD Charges</p>
              <p className="text-2xl font-bold text-green-600">₹{calculateOPDTotal().toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">{transactions.filter(t => !t.admission_id).length} service(s)</p>
            </div>
            <div className="bg-white p-4 rounded-lg border-2 border-blue-500">
              <p className="text-sm font-medium text-gray-600">Grand Total</p>
              <p className="text-2xl font-bold text-blue-600">₹{calculateGrandTotal().toLocaleString()}</p>
              <p className="text-xs text-gray-500 mt-1">All services combined</p>
            </div>
          </div>
        </div>

        {/* IPD Details Section */}
        {admissions.length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-3 text-lg">IPD Services</h3>
            {admissions.map((admission, index) => (
              <div key={admission.id} className={`mb-6 ${index > 0 ? 'page-break' : ''}`}>
                <div className="bg-purple-50 p-3 rounded-t-lg">
                  <p className="font-medium">
                    Admission #{index + 1} - Bed: {admission.bed?.bed_number} 
                    <span className={`ml-3 text-xs px-2 py-1 rounded ${
                      admission.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {admission.status}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatDate(admission.admission_date)} - {
                      admission.actual_discharge_date 
                        ? formatDate(admission.actual_discharge_date)
                        : 'Ongoing'
                    }
                  </p>
                </div>
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border p-2 text-left text-sm">Description</th>
                      <th className="border p-2 text-center text-sm">Days/Qty</th>
                      <th className="border p-2 text-right text-sm">Rate</th>
                      <th className="border p-2 text-right text-sm">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border p-2 text-sm">Bed Charges ({admission.bed?.room_type})</td>
                      <td className="border p-2 text-center text-sm">{calculateDays(admission)}</td>
                      <td className="border p-2 text-right text-sm">₹{admission.bed?.daily_rate || 0}</td>
                      <td className="border p-2 text-right text-sm">
                        ₹{(calculateDays(admission) * (admission.bed?.daily_rate || 0)).toLocaleString()}
                      </td>
                    </tr>
                    {admission.services && Object.entries(admission.services).map(([key, service]: [string, any]) => (
                      <tr key={key}>
                        <td className="border p-2 text-sm">{service.name || key}</td>
                        <td className="border p-2 text-center text-sm">{service.quantity || 1}</td>
                        <td className="border p-2 text-right text-sm">₹{service.rate || service.amount || 0}</td>
                        <td className="border p-2 text-right text-sm">₹{(service.amount || 0).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}

        {/* OPD Details Section */}
        {Object.keys(groupOPDTransactionsByType()).length > 0 && (
          <div className="mb-8">
            <h3 className="font-semibold text-gray-700 mb-3 text-lg">OPD Services Summary</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-3 text-left">Service Type</th>
                  <th className="border p-3 text-center">Count</th>
                  <th className="border p-3 text-right">Total Amount</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(groupOPDTransactionsByType()).map(([type, data]) => (
                  <tr key={type}>
                    <td className="border p-3">{type.replace(/_/g, ' ')}</td>
                    <td className="border p-3 text-center">{data.count}</td>
                    <td className="border p-3 text-right">₹{data.total.toLocaleString()}</td>
                  </tr>
                ))}
                <tr className="bg-gray-50 font-semibold">
                  <td colSpan={2} className="border p-3 text-right">OPD Total</td>
                  <td className="border p-3 text-right">₹{calculateOPDTotal().toLocaleString()}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* Final Total */}
        <div className="bg-gray-100 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-xl font-bold">Grand Total</span>
            <span className="text-2xl font-bold text-blue-600">₹{calculateGrandTotal().toLocaleString()}</span>
          </div>
        </div>

        {/* Signature Section */}
        <div className="mt-12 pt-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <div className="border-t border-gray-400 pt-2">
                <p className="text-sm text-gray-600 text-center">Authorized Signature</p>
              </div>
            </div>
            <div>
              <div className="border-t border-gray-400 pt-2">
                <p className="text-sm text-gray-600 text-center">Patient/Attendant Signature</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500">
          <p>Thank you for choosing VALANT HOSPITAL</p>
          <p className="mt-1">A unit of Neuorth Medicare Pvt Ltd</p>
          <p className="font-bold mt-2">** COMBINED BILL **</p>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-center space-x-4 mt-8 no-print">
          <button
            onClick={handlePrint}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            🖨️ Print Bill
          </button>
          <button
            onClick={onClose}
            className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CombinedBill;