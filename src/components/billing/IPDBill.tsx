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
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">IPD Bill</h1>
            <p className="text-gray-600 mt-2">In-Patient Department</p>
          </div>

          {/* Hospital and Patient Info */}
          <div className="border-b pb-6 mb-6">
            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Hospital Details</h3>
                <p className="text-sm">City General Hospital</p>
                <p className="text-sm text-gray-600">123 Healthcare Street, Medical City</p>
                <p className="text-sm text-gray-600">Phone: +1-555-HOSPITAL</p>
              </div>
              <div className="text-right">
                <h3 className="font-semibold text-gray-700 mb-2">Bill Details</h3>
                <p className="text-sm">Bill No: IPD-{selectedAdmission.id.slice(0, 8)}</p>
                <p className="text-sm">Date: {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Patient Details */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h3 className="font-semibold text-gray-700 mb-3">Patient Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="font-medium">Name:</span> {patient.first_name} {patient.last_name}</p>
                <p><span className="font-medium">Patient ID:</span> {patient.patient_id}</p>
                <p><span className="font-medium">Age/Gender:</span> {patient.age || 'N/A'} / {patient.gender}</p>
              </div>
              <div>
                <p><span className="font-medium">Admission Date:</span> {formatDate(selectedAdmission.admission_date)}</p>
                <p><span className="font-medium">Discharge Date:</span> {selectedAdmission.actual_discharge_date ? formatDate(selectedAdmission.actual_discharge_date) : 'Not Discharged'}</p>
                <p><span className="font-medium">Bed Number:</span> {selectedAdmission.bed?.bed_number || 'N/A'}</p>
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

          {/* Footer */}
          <div className="text-center text-sm text-gray-600 mt-8">
            <p>Thank you for choosing our hospital</p>
            <p>For any queries, please contact our billing department</p>
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