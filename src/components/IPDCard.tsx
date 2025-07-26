import React, { useState, useEffect } from 'react';
import HospitalService from '../services/hospitalService';
import { supabase } from '../config/supabaseNew';

interface IPDCardProps {
  admission: any;
  onBack: () => void;
}

const IPDCard: React.FC<IPDCardProps> = ({ admission, onBack }) => {
  const [dischargeSummary, setDischargeSummary] = useState<any>(null);
  const [services, setServices] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPatientJourney();
  }, [admission]);

  const loadPatientJourney = async () => {
    try {
      setLoading(true);

      // Load discharge summary if available
      const { data: dischargeData } = await supabase
        .from('discharge_summaries')
        .select('*')
        .eq('admission_id', admission.id)
        .single();

      if (dischargeData) {
        setDischargeSummary(dischargeData);
      }

      // Load all transactions for this admission
      const transactions = await HospitalService.getTransactionsByPatient(admission.patient_id);
      
      // Filter transactions for this admission period
      const admissionTransactions = transactions.filter(t => 
        new Date(t.created_at) >= new Date(admission.admission_date)
      );

      // Separate services and payments
      const serviceTransactions = admissionTransactions.filter(t => 
        t.transaction_type !== 'IPD_PAYMENT' && t.transaction_type !== 'IPD_ADVANCE' && t.amount > 0
      );
      
      const paymentTransactions = admissionTransactions.filter(t => 
        t.transaction_type === 'IPD_PAYMENT' || t.transaction_type === 'IPD_ADVANCE'
      );

      setServices(serviceTransactions);
      setPayments(paymentTransactions);

    } catch (error) {
      console.error('Error loading patient journey:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStayDuration = () => {
    const admissionDate = new Date(admission.admission_date);
    const dischargeDate = admission.actual_discharge_date 
      ? new Date(admission.actual_discharge_date) 
      : new Date();
    const diffTime = Math.abs(dischargeDate.getTime() - admissionDate.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
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

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
            <p>Loading patient journey...</p>
          </div>
        </div>
      </div>
    );
  }

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
            #card-content, #card-content * {
              visibility: visible;
            }
            #card-content {
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

      <div className="bg-white rounded-lg shadow-lg max-w-6xl w-full mx-4 max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="bg-green-600 text-white p-4 rounded-t-lg flex justify-between items-center no-print">
          <div>
            <h2 className="text-xl font-bold">🪪 IPD Patient Journey Card</h2>
            <p className="text-green-100">
              Complete summary from admission to discharge
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={handlePrint}
              className="bg-white text-green-600 px-4 py-2 rounded hover:bg-gray-100"
            >
              🖨️ Print
            </button>
            <button
              onClick={onBack}
              className="text-white hover:text-green-200 text-2xl font-bold"
            >
              ←
            </button>
          </div>
        </div>

        {/* Card Content */}
        <div className="p-8" id="card-content">
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
            <h1 className="text-2xl font-bold text-gray-800 mb-2">VALANT HOSPITAL</h1>
            <div className="text-sm text-gray-600">
              <p>10, Madhav Vihar Shobhagpura, Udaipur (313001)</p>
              <p>Phone: +91 9119118000 | Email: valanthospital@gmail.com</p>
            </div>
            <div className="mt-4">
              <h2 className="text-xl font-bold text-green-600">IPD PATIENT JOURNEY CARD</h2>
            </div>
          </div>

          {/* Patient Demographics */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-3">Patient Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Patient ID:</span>
                  <span className="font-bold">{admission.patient?.patient_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Name:</span>
                  <span className="font-bold">{admission.patient?.first_name} {admission.patient?.last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Age/Gender:</span>
                  <span>{admission.patient?.age || 'N/A'} / {admission.patient?.gender}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Blood Group:</span>
                  <span>{admission.patient?.blood_group || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Contact:</span>
                  <span>{admission.patient?.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Address:</span>
                  <span>{admission.patient?.address || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-bold text-green-800 mb-3">Admission Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">Admission Date:</span>
                  <span className="font-bold">{formatDate(admission.admission_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Bed Number:</span>
                  <span className="font-bold">{admission.bed_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Room Type:</span>
                  <span>{admission.room_type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Department:</span>
                  <span>{admission.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Attending Doctor:</span>
                  <span>{admission.patient?.assigned_doctor || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Stay Duration:</span>
                  <span className="font-bold">{calculateStayDuration()} days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Medical History */}
          {admission.patient?.medical_history && (
            <div className="mb-6">
              <div className="bg-orange-50 p-4 rounded-lg">
                <h3 className="font-bold text-orange-800 mb-3">Medical History</h3>
                <p className="text-sm text-gray-700">{admission.patient.medical_history}</p>
              </div>
            </div>
          )}

          {/* Allergies */}
          {admission.patient?.allergies && (
            <div className="mb-6">
              <div className="bg-red-50 p-4 rounded-lg border-l-4 border-red-400">
                <h3 className="font-bold text-red-800 mb-2">⚠️ Allergies</h3>
                <p className="text-sm text-red-700 font-medium">{admission.patient.allergies}</p>
              </div>
            </div>
          )}

          {/* Services Rendered */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-3">Services Rendered During Stay</h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Service</th>
                    <th className="text-left p-3">Category</th>
                    <th className="text-right p-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {services.length > 0 ? services.map((service, index) => (
                    <tr key={service.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-3">{new Date(service.created_at).toLocaleDateString()}</td>
                      <td className="p-3">{service.description}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                          {service.transaction_type}
                        </span>
                      </td>
                      <td className="p-3 text-right">₹{service.amount.toLocaleString()}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-gray-500">
                        No services recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payment History */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-800 mb-3">Payment History</h3>
            <div className="bg-gray-50 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="text-left p-3">Date</th>
                    <th className="text-left p-3">Description</th>
                    <th className="text-left p-3">Mode</th>
                    <th className="text-right p-3">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length > 0 ? payments.map((payment, index) => (
                    <tr key={payment.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-3">{new Date(payment.created_at).toLocaleDateString()}</td>
                      <td className="p-3">{payment.description}</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                          {payment.payment_mode}
                        </span>
                      </td>
                      <td className="p-3 text-right text-green-600 font-medium">
                        ₹{payment.amount.toLocaleString()}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="p-3 text-center text-gray-500">
                        No payments recorded
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Summary */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-bold text-blue-800 mb-3">Financial Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Services:</span>
                  <span className="font-bold">₹{services.reduce((sum, s) => sum + s.amount, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Payments:</span>
                  <span className="font-bold text-green-600">₹{payments.reduce((sum, p) => sum + p.amount, 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-t pt-2">
                  <span className="font-medium">Balance:</span>
                  <span className="font-bold">
                    ₹{(services.reduce((sum, s) => sum + s.amount, 0) - payments.reduce((sum, p) => sum + p.amount, 0)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-bold text-purple-800 mb-3">Stay Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Total Days:</span>
                  <span className="font-bold">{calculateStayDuration()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Services Count:</span>
                  <span className="font-bold">{services.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Payments Made:</span>
                  <span className="font-bold">{payments.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={`font-bold ${admission.status === 'ACTIVE' ? 'text-green-600' : 'text-blue-600'}`}>
                    {admission.status === 'ACTIVE' ? 'Currently Admitted' : 'Discharged'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Discharge Summary (if available) */}
          {dischargeSummary && (
            <div className="bg-yellow-50 p-4 rounded-lg mb-6">
              <h3 className="font-bold text-yellow-800 mb-3">Discharge Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="mb-2">
                    <span className="font-medium">Discharge Date:</span>
                    <span className="ml-2">{formatDate(admission.actual_discharge_date)}</span>
                  </div>
                  <div className="mb-2">
                    <span className="font-medium">Final Diagnosis:</span>
                    <p className="text-gray-700 mt-1">{dischargeSummary.final_diagnosis}</p>
                  </div>
                  <div className="mb-2">
                    <span className="font-medium">Discharge Condition:</span>
                    <span className="ml-2 font-medium text-green-600">{dischargeSummary.discharge_condition}</span>
                  </div>
                </div>
                <div>
                  <div className="mb-2">
                    <span className="font-medium">Treatment Summary:</span>
                    <p className="text-gray-700 mt-1">{dischargeSummary.treatment_summary}</p>
                  </div>
                  {dischargeSummary.follow_up_instructions && (
                    <div className="mb-2">
                      <span className="font-medium">Follow-up Instructions:</span>
                      <p className="text-gray-700 mt-1">{dischargeSummary.follow_up_instructions}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          <div className="bg-red-50 p-4 rounded-lg mb-6">
            <h3 className="font-bold text-red-800 mb-3">Emergency Contact Information</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="flex justify-between">
                  <span className="font-medium">Contact Person:</span>
                  <span>{admission.patient?.emergency_contact_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-medium">Relationship:</span>
                  <span>{admission.patient?.emergency_contact_relation || 'N/A'}</span>
                </div>
              </div>
              <div>
                <div className="flex justify-between">
                  <span className="font-medium">Phone Number:</span>
                  <span className="font-bold">{admission.patient?.emergency_contact_phone || admission.patient?.phone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Generated on {new Date().toLocaleDateString()} • VALANT HOSPITAL
            </p>
            <p className="text-xs text-gray-500 mt-1">
              A unit of Neuorth Medicare Pvt Ltd • Complete Patient Journey Record
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPDCard;