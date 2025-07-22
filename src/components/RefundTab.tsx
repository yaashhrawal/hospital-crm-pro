import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import HospitalService from '../services/hospitalService';
import { supabase } from '../config/supabaseNew';
import type { PatientWithRelations, CreateTransactionData } from '../config/supabaseNew';

const RefundTab: React.FC = () => {
  const [formData, setFormData] = useState({
    patient_search: '',
    selected_patient_id: '',
    refund_amount: 0,
    refund_reason: '',
    payment_mode: 'CASH',
    refund_date: new Date().toISOString().split('T')[0],
    approval_notes: ''
  });

  const [patients, setPatients] = useState<PatientWithRelations[]>([]);
  const [filteredPatients, setFilteredPatients] = useState<PatientWithRelations[]>([]);
  const [recentRefunds, setRecentRefunds] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingRefunds, setLoadingRefunds] = useState(false);

  useEffect(() => {
    loadPatients();
    loadRecentRefunds();
  }, []);

  useEffect(() => {
    filterPatients();
  }, [formData.patient_search, patients]);

  const paymentModes = [
    { value: 'CASH', label: '💵 Cash Refund' },
    { value: 'CARD', label: '💳 Card Refund' },
    { value: 'UPI', label: '📱 UPI Refund' },
    { value: 'BANK_TRANSFER', label: '🏦 Bank Transfer' },
    { value: 'CHEQUE', label: '📄 Cheque Refund' }
  ];

  const loadPatients = async () => {
    try {
      const patientsData = await HospitalService.getPatients(200);
      setPatients(patientsData);
    } catch (error: any) {
      toast.error(`Failed to load patients: ${error.message}`);
    }
  };

  const loadRecentRefunds = async () => {
    setLoadingRefunds(true);
    try {
      // Get recent refund transactions
      const { data, error } = await supabase
        .from('patient_transactions')
        .select(`
          *,
          patient:patients(first_name, last_name, phone, patient_id)
        `)
        .eq('transaction_type', 'REFUND')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        console.error('Error loading refunds:', error);
        return;
      }

      setRecentRefunds(data || []);
    } catch (error: any) {
      console.error('Error loading refunds:', error);
    } finally {
      setLoadingRefunds(false);
    }
  };

  const filterPatients = () => {
    if (!formData.patient_search.trim()) {
      setFilteredPatients([]);
      return;
    }

    const search = formData.patient_search.toLowerCase();
    const filtered = patients.filter(patient =>
      patient.first_name.toLowerCase().includes(search) ||
      patient.last_name.toLowerCase().includes(search) ||
      patient.phone.includes(search) ||
      patient.patient_id.toLowerCase().includes(search) ||
      (patient.email && patient.email.toLowerCase().includes(search))
    ).slice(0, 10);

    setFilteredPatients(filtered);
  };

  const selectPatient = (patient: PatientWithRelations) => {
    setFormData({
      ...formData,
      patient_search: `${patient.first_name} ${patient.last_name} (${patient.patient_id})`,
      selected_patient_id: patient.id
    });
    setFilteredPatients([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.selected_patient_id) {
      toast.error('Please select a patient');
      return;
    }

    if (formData.refund_amount <= 0) {
      toast.error('Refund amount must be greater than 0');
      return;
    }

    if (!formData.refund_reason.trim()) {
      toast.error('Please provide a reason for the refund');
      return;
    }

    setLoading(true);

    try {
      // Create refund transaction
      const refundData: CreateTransactionData = {
        patient_id: formData.selected_patient_id,
        transaction_type: 'REFUND',
        description: `Refund: ${formData.refund_reason}`,
        amount: -formData.refund_amount, // Negative amount for refund
        payment_mode: formData.payment_mode,
        department: 'Administration',
        status: 'COMPLETED',
        transaction_reference: `REF${Date.now()}`
      };

      await HospitalService.createTransaction(refundData);

      toast.success(`Refund of ₹${formData.refund_amount.toLocaleString()} processed successfully`);

      // Reset form
      setFormData({
        patient_search: '',
        selected_patient_id: '',
        refund_amount: 0,
        refund_reason: '',
        payment_mode: 'CASH',
        refund_date: new Date().toISOString().split('T')[0],
        approval_notes: ''
      });

      // Reload recent refunds
      loadRecentRefunds();

    } catch (error: any) {
      console.error('Error processing refund:', error);
      toast.error(`Failed to process refund: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find(p => p.id === formData.selected_patient_id);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">💰 Patient Refund Processing</h2>
          <p className="text-gray-600">Process refunds for patients and maintain refund records</p>
        </div>

        {/* Refund Form */}
        <div className="p-6 bg-gray-50 border-t">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">💸 Process New Refund</h3>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Patient Search */}
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Patient <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.patient_search}
                onChange={(e) => setFormData({ ...formData, patient_search: e.target.value, selected_patient_id: '' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by name, phone, or patient ID..."
                required
              />
              
              {/* Patient Dropdown */}
              {filteredPatients.length > 0 && (
                <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md mt-1 max-h-60 overflow-y-auto z-10 shadow-lg">
                  {filteredPatients.map((patient) => (
                    <div
                      key={patient.id}
                      className="p-3 hover:bg-gray-100 cursor-pointer border-b border-gray-100"
                      onClick={() => selectPatient(patient)}
                    >
                      <div className="font-medium">{patient.first_name} {patient.last_name}</div>
                      <div className="text-sm text-gray-500">
                        ID: {patient.patient_id} | Phone: {patient.phone} | 
                        Spent: ₹{(patient.totalSpent || 0).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Patient Info */}
            {selectedPatient && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Selected Patient</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {selectedPatient.first_name} {selectedPatient.last_name}
                  </div>
                  <div>
                    <span className="font-medium">Phone:</span> {selectedPatient.phone || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Total Spent:</span> 
                    <span className="text-green-600 font-semibold ml-1">
                      ₹{(selectedPatient.totalSpent || 0).toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Visits:</span> {selectedPatient.visitCount || 0}
                  </div>
                  <div>
                    <span className="font-medium">Last Visit:</span> 
                    {selectedPatient.lastVisit 
                      ? new Date(selectedPatient.lastVisit).toLocaleDateString()
                      : 'Never'
                    }
                  </div>
                  <div>
                    <span className="font-medium">Patient ID:</span> {selectedPatient.patient_id}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.refund_date}
                  onChange={(e) => setFormData({ ...formData, refund_date: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Amount (₹) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.refund_amount}
                  onChange={(e) => setFormData({ ...formData, refund_amount: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  min="0.01"
                  step="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Mode <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.payment_mode}
                  onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  {paymentModes.map(mode => (
                    <option key={mode.value} value={mode.value}>{mode.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Refund Reason <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.refund_reason}
                  onChange={(e) => setFormData({ ...formData, refund_reason: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Cancelled appointment, Service issue, etc."
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Approval Notes</label>
                <textarea
                  value={formData.approval_notes}
                  onChange={(e) => setFormData({ ...formData, approval_notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes for approval and record keeping..."
                  rows={3}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                type="submit"
                disabled={loading || !formData.selected_patient_id}
                className="bg-red-600 text-white py-2 px-6 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {loading ? 'Processing...' : '💰 Process Refund'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Recent Refunds */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">📋 Recent Refunds</h3>
            <button
              onClick={loadRecentRefunds}
              disabled={loadingRefunds}
              className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 disabled:opacity-50"
            >
              {loadingRefunds ? 'Loading...' : '🔄 Refresh'}
            </button>
          </div>

          {loadingRefunds ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-gray-600 mt-2">Loading refunds...</p>
            </div>
          ) : recentRefunds.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-3 font-semibold text-gray-700">Date</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Patient</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Reason</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Amount</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Payment Mode</th>
                    <th className="text-left p-3 font-semibold text-gray-700">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRefunds.map((refund, index) => (
                    <tr key={refund.id} className={`border-b hover:bg-gray-50 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                      <td className="p-3 text-sm">
                        {new Date(refund.created_at).toLocaleDateString()}
                        <div className="text-gray-500 text-xs">
                          {new Date(refund.created_at).toLocaleTimeString()}
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">
                          {refund.patient?.first_name} {refund.patient?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {refund.patient?.patient_id} | {refund.patient?.phone}
                        </div>
                      </td>
                      <td className="p-3">{refund.description}</td>
                      <td className="p-3">
                        <span className="font-semibold text-red-600">
                          ₹{Math.abs(refund.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-3">{refund.payment_mode}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          refund.status === 'COMPLETED' 
                            ? 'bg-green-100 text-green-800' 
                            : refund.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {refund.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">💰</div>
              <p className="text-gray-600">No refunds processed yet</p>
              <p className="text-gray-500 text-sm">Process your first refund above</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RefundTab;