import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import HospitalService from '../../services/hospitalService';
import type { PatientWithRelations, PatientAdmissionWithRelations } from '../../config/supabaseNew';
import { formatDate } from '../../utils/excelExport';

interface IPDBillProps {
  patient: PatientWithRelations;
  onClose: () => void;
}

const IPDBill: React.FC<IPDBillProps> = ({ patient, onClose }) => {
  const [admissions, setAdmissions] = useState<PatientAdmissionWithRelations[]>([]);
  const [selectedAdmission, setSelectedAdmission] = useState<PatientAdmissionWithRelations | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadIPDAdmissions();
  }, [patient.id]);

  const loadIPDAdmissions = async () => {
    try {
      setLoading(true);
      const data = await HospitalService.getPatientAdmissions(patient.id);
      setAdmissions(data);
      if (data.length === 1) {
        setSelectedAdmission(data[0]);
      }
    } catch (error) {
      toast.error('Failed to load IPD admissions');
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

  const calculateBedCharges = (admission: PatientAdmissionWithRelations) => {
    const days = calculateDays(admission);
    const dailyRate = admission.bed?.daily_rate || 0;
    return days * dailyRate;
  };

  const calculateTotal = (admission: PatientAdmissionWithRelations) => {
    const bedCharges = calculateBedCharges(admission);
    const services = admission.services || {};
    const serviceTotal = Object.values(services).reduce((sum: number, service: any) => {
      return sum + (service.amount || 0);
    }, 0);
    return bedCharges + serviceTotal;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl">
        <div className="text-center">Loading IPD admissions...</div>
      </div>
    );
  }

  if (admissions.length === 0) {
    return (
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="text-center">
          <p className="text-gray-600 mb-4">No IPD admissions found for this patient.</p>
          <button
            onClick={onClose}
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
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
            #ipd-bill-content, #ipd-bill-content * {
              visibility: visible;
            }
            #ipd-bill-content {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              background: white;
            }
            .no-print {
              display: none !important;
            }
          }
        `
      }} />

      {!selectedAdmission ? (
        <div className="p-6">
          <div className="flex justify-between items-center mb-6 no-print">
            <h2 className="text-2xl font-bold text-gray-800">🏥 Select IPD Admission</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="space-y-3">
            {admissions.map((admission) => (
              <div
                key={admission.id}
                onClick={() => setSelectedAdmission(admission)}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">Bed: {admission.bed?.bed_number || 'N/A'}</p>
                    <p className="text-sm text-gray-600">
                      Admitted: {formatDate(admission.admission_date)}
                    </p>
                    {admission.actual_discharge_date && (
                      <p className="text-sm text-gray-600">
                        Discharged: {formatDate(admission.actual_discharge_date)}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">
                      ₹{calculateTotal(admission).toLocaleString()}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded ${
                      admission.status === 'ACTIVE' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {admission.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div id="ipd-bill-content" className="p-8">
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
              <h2 className="text-xl font-semibold text-gray-800">IPD BILL</h2>
              <p className="text-gray-600">In-Patient Department</p>
            </div>
          </div>

          {/* Bill Info */}
          <div className="mb-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>BILL NO:</strong> IPD-{selectedAdmission.id.slice(0, 8)}</p>
                <p><strong>DATE:</strong> {new Date().toLocaleDateString('en-IN')}</p>
              </div>
              <div className="text-right">
                <p><strong>Patient ID:</strong> {patient.patient_id}</p>
                <p><strong>Department:</strong> IPD</p>
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
                <p><strong>ADMISSION DATE:</strong> {formatDate(selectedAdmission.admission_date)}</p>
                <p><strong>DISCHARGE DATE:</strong> {selectedAdmission.actual_discharge_date ? formatDate(selectedAdmission.actual_discharge_date) : 'Not Discharged'}</p>
                <p><strong>BED NUMBER:</strong> {selectedAdmission.bed?.bed_number || 'N/A'}</p>
              </div>
            </div>
          </div>

          {/* Billing Details */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">Billing Details</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border p-3 text-left">Description</th>
                  <th className="border p-3 text-center">Quantity</th>
                  <th className="border p-3 text-right">Rate</th>
                  <th className="border p-3 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {/* Bed Charges */}
                <tr>
                  <td className="border p-3">
                    Bed Charges ({selectedAdmission.bed?.room_type})
                  </td>
                  <td className="border p-3 text-center">{calculateDays(selectedAdmission)} days</td>
                  <td className="border p-3 text-right">₹{selectedAdmission.bed?.daily_rate || 0}</td>
                  <td className="border p-3 text-right">₹{calculateBedCharges(selectedAdmission).toLocaleString()}</td>
                </tr>

                {/* Services */}
                {selectedAdmission.services && Object.entries(selectedAdmission.services).map(([key, service]: [string, any]) => (
                  <tr key={key}>
                    <td className="border p-3">{service.name || key}</td>
                    <td className="border p-3 text-center">{service.quantity || 1}</td>
                    <td className="border p-3 text-right">₹{service.rate || service.amount || 0}</td>
                    <td className="border p-3 text-right">₹{(service.amount || 0).toLocaleString()}</td>
                  </tr>
                ))}

                {/* Total */}
                <tr className="bg-gray-100 font-semibold">
                  <td colSpan={3} className="border p-3 text-right">Total Amount</td>
                  <td className="border p-3 text-right text-lg">
                    ₹{calculateTotal(selectedAdmission).toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Payment Summary */}
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-medium">Total Amount:</p>
                <p className="text-lg font-semibold">₹{selectedAdmission.total_amount.toLocaleString()}</p>
              </div>
              <div>
                <p className="font-medium">Amount Paid:</p>
                <p className="text-lg font-semibold text-green-600">₹{selectedAdmission.amount_paid.toLocaleString()}</p>
              </div>
              <div>
                <p className="font-medium">Balance Due:</p>
                <p className="text-lg font-semibold text-red-600">₹{selectedAdmission.balance.toLocaleString()}</p>
              </div>
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
            <p className="font-bold mt-2">** IPD BILL **</p>
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
              onClick={() => setSelectedAdmission(null)}
              className="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300"
            >
              Back to List
            </button>
            <button
              onClick={onClose}
              className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default IPDBill;