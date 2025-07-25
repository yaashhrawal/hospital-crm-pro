import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';
import type { PatientWithRelations } from '../config/supabaseNew';
import HospitalService from '../services/hospitalService';

// Doctors and Departments data
const DOCTORS_DATA = [
  { name: 'DR. HEMANT KHAJJA', department: 'ORTHOPEDIC' },
  { name: 'DR. LALITA SUWALKA', department: 'DIETICIAN' },
  { name: 'DR. MILIND KIRIT AKHANI', department: 'GASTRO' },
  { name: 'DR MEETU BABLE', department: 'GYN.' },
  { name: 'DR. AMIT PATANVADIYA', department: 'NEUROLOGY' },
  { name: 'DR. KISHAN PATEL', department: 'UROLOGY' },
  { name: 'DR. PARTH SHAH', department: 'SURGICAL ONCOLOGY' },
  { name: 'DR.RAJEEDP GUPTA', department: 'MEDICAL ONCOLOGY' },
  { name: 'DR. KULDDEP VALA', department: 'NEUROSURGERY' },
  { name: 'DR. KURNAL PATEL', department: 'UROLOGY' },
  { name: 'DR. SAURABH GUPTA', department: 'ENDOCRINOLOGY' },
  { name: 'DR. BATUL PEEPAWALA', department: 'GENERAL PHYSICIAN' }
];

const DEPARTMENTS = [...new Set(DOCTORS_DATA.map(doc => doc.department))].sort();

interface EditPatientModalProps {
  patient: PatientWithRelations;
  isOpen: boolean;
  onClose: () => void;
  onPatientUpdated: () => void;
}

const EditPatientModal: React.FC<EditPatientModalProps> = ({
  patient,
  isOpen,
  onClose,
  onPatientUpdated
}) => {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'payment'>('details');
  const [transactionLoading, setTransactionLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: patient.first_name || '',
    last_name: patient.last_name || '',
    age: patient.age || '',
    gender: patient.gender || 'MALE',
    phone: patient.phone || '',
    email: patient.email || '',
    address: patient.address || '',
    emergency_contact_name: patient.emergency_contact_name || '',
    emergency_contact_phone: patient.emergency_contact_phone || '',
    blood_group: patient.blood_group || '',
    medical_history: patient.medical_history || '',
    allergies: patient.allergies || '',
    current_medications: patient.current_medications || '',
    notes: patient.notes || '',
  });

  // Transaction form data
  const [transactionData, setTransactionData] = useState({
    selected_department: patient.assigned_department || '',
    selected_doctor: patient.assigned_doctor || '',
    consultation_fee: 0,
    discount_percentage: 0,
    discount_reason: '',
    payment_mode: 'CASH',
    online_payment_method: 'UPI',
    transaction_type: 'CONSULTATION',
    description: ''
  });

  const [filteredDoctors, setFilteredDoctors] = useState(DOCTORS_DATA);

  // Filter doctors based on selected department
  React.useEffect(() => {
    if (transactionData.selected_department) {
      const filtered = DOCTORS_DATA.filter(doc => doc.department === transactionData.selected_department);
      setFilteredDoctors(filtered);
      // Reset doctor selection if current doctor doesn't belong to selected department
      if (transactionData.selected_doctor && !filtered.find(doc => doc.name === transactionData.selected_doctor)) {
        setTransactionData(prev => ({ ...prev, selected_doctor: '' }));
      }
    } else {
      setFilteredDoctors(DOCTORS_DATA);
    }
  }, [transactionData.selected_department]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // No validation required - all fields optional

    setLoading(true);

    try {
      const updateData = {
        first_name: (formData.first_name || '').trim(),
        last_name: (formData.last_name || '').trim(),
        age: formData.age && formData.age.trim() !== '' ? formData.age.trim() : null,
        gender: formData.gender || 'MALE',
        phone: (formData.phone || '').trim(),
        email: (formData.email || '').trim() || null,
        address: (formData.address || '').trim(),
        emergency_contact_name: (formData.emergency_contact_name || '').trim(),
        emergency_contact_phone: (formData.emergency_contact_phone || '').trim(),
        blood_group: formData.blood_group || null,
        medical_history: formData.medical_history || null,
        allergies: formData.allergies || null
      };

      console.log('🎂 Age from form data:', formData.age, 'Type:', typeof formData.age);
      console.log('🎂 Age in updateData:', updateData.age, 'Type:', typeof updateData.age);
      console.log('Updating patient with data:', updateData);
      console.log('Patient ID:', patient.id);

      const { data: updatedPatient, error } = await supabase
        .from('patients')
        .update(updateData)
        .eq('id', patient.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating patient:', error);
        console.error('Error details:', error.message, error.details, error.hint);
        toast.error(`Failed to update patient: ${error.message}`);
        return;
      }

      console.log('Patient updated successfully');
      console.log('🎂 Age in updated patient:', updatedPatient?.age, 'Type:', typeof updatedPatient?.age);

      toast.success('Patient updated successfully');
      onPatientUpdated();
      onClose();
    } catch (error: any) {
      console.error('Error updating patient:', error);
      toast.error(`Failed to update patient: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!transactionData.consultation_fee || transactionData.consultation_fee <= 0) {
      toast.error('Please enter a valid consultation fee');
      return;
    }

    if (!transactionData.selected_doctor) {
      toast.error('Please select a doctor');
      return;
    }

    setTransactionLoading(true);

    try {
      // Calculate discount amount from percentage
      const originalConsultationFee = transactionData.consultation_fee;
      const discountAmount = originalConsultationFee * (transactionData.discount_percentage / 100);
      const finalAmount = originalConsultationFee - discountAmount;

      console.log('💰 Adding transaction for patient:', patient.id);
      console.log('🧮 Billing calculation:');
      console.log('- Original consultation fee:', originalConsultationFee);
      console.log('- Discount percentage:', transactionData.discount_percentage + '%');
      console.log('- Discount amount:', discountAmount);
      console.log('- Final amount:', finalAmount);

      const transactions = [];

      // Create single transaction with final discounted amount
      // Store discount details in description instead of separate transaction
      const transactionDescription = transactionData.description || 
        `${transactionData.transaction_type === 'CONSULTATION' ? 'Consultation Fee' : 
          transactionData.transaction_type === 'LAB_TEST' ? 'Lab Test' :
          transactionData.transaction_type === 'XRAY' ? 'X-Ray' :
          transactionData.transaction_type === 'MEDICINE' ? 'Medicine' :
          transactionData.transaction_type === 'PROCEDURE' ? 'Procedure' :
          'Service'}${transactionData.selected_doctor ? ` - ${transactionData.selected_doctor}` : ''}${transactionData.selected_department ? ` (${transactionData.selected_department})` : ''}${
          transactionData.discount_percentage > 0 ? 
          ` | Original: ₹${originalConsultationFee} | Discount: ${transactionData.discount_percentage}% (₹${discountAmount.toFixed(2)}) | Net: ₹${finalAmount.toFixed(2)}${transactionData.discount_reason ? ` | Reason: ${transactionData.discount_reason}` : ''}` :
          ` | Amount: ₹${finalAmount.toFixed(2)}`
        }`;

      const mainTransaction = {
        patient_id: patient.id,
        transaction_type: transactionData.transaction_type as any,
        description: transactionDescription,
        amount: finalAmount, // Store FINAL discounted amount
        payment_mode: transactionData.payment_mode === 'ONLINE' ? transactionData.online_payment_method : transactionData.payment_mode,
        status: 'COMPLETED' as any,
        doctor_name: transactionData.selected_doctor,
        hospital_id: '550e8400-e29b-41d4-a716-446655440000',
        created_by: 'system'
      };

      await HospitalService.createTransaction(mainTransaction as any);
      console.log('✅ Transaction created with final amount:', finalAmount);

      toast.success(`Transaction added successfully! ₹${finalAmount.toFixed(2)} - ${transactionData.selected_doctor}`);
      
      // Reset transaction form
      setTransactionData({
        selected_department: patient.assigned_department || '',
        selected_doctor: patient.assigned_doctor || '',
        consultation_fee: 0,
        discount_percentage: 0,
        discount_reason: '',
        payment_mode: 'CASH',
        online_payment_method: 'UPI',
        transaction_type: 'CONSULTATION',
        description: ''
      });

      // Switch back to details tab and refresh parent
      setActiveTab('details');
      onPatientUpdated();

    } catch (error: any) {
      console.error('🚨 Transaction creation failed:', error);
      toast.error(`Failed to add transaction: ${error.message}`);
    } finally {
      setTransactionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-screen overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">✏️ Edit Patient - {patient.first_name} {patient.last_name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            👤 Patient Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payment')}
            className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
              activeTab === 'payment'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            💰 Add Payment
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'details' ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="border-b pb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Age
                </label>
                <input
                  type="text"
                  value={formData.age || ''}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter age (e.g., 25, 30 years, 6 months)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gender                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Blood Group
                </label>
                <select
                  value={formData.blood_group}
                  onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Blood Group</option>
                  <option value="A+">A+</option>
                  <option value="A-">A-</option>
                  <option value="B+">B+</option>
                  <option value="B-">B-</option>
                  <option value="AB+">AB+</option>
                  <option value="AB-">AB-</option>
                  <option value="O+">O+</option>
                  <option value="O-">O-</option>
                </select>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address                </label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                                  />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="border-b pb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Contact Name                </label>
                <input
                  type="text"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Contact Phone                </label>
                <input
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  />
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Medical Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Medical History
                </label>
                <textarea
                  value={formData.medical_history}
                  onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Previous surgeries, chronic conditions, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allergies
                </label>
                <textarea
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Drug allergies, food allergies, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Current Medications
                </label>
                <textarea
                  value={formData.current_medications}
                  onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Current medications and dosages"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Any additional notes about the patient"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </div>
              ) : (
                '💾 Update Patient'
              )}
            </button>
          </div>
        </form>
        ) : (
          /* Payment Tab */
          <form onSubmit={handleAddTransaction} className="space-y-6">
            {/* Transaction Type */}
            <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
              <h3 className="text-lg font-semibold text-green-800 mb-4">💳 Add Payment/Transaction</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Type</label>
                  <select
                    value={transactionData.transaction_type}
                    onChange={(e) => setTransactionData({ ...transactionData, transaction_type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="CONSULTATION">Consultation Fee</option>
                    <option value="LAB_TEST">Lab Test</option>
                    <option value="XRAY">X-Ray</option>
                    <option value="MEDICINE">Medicine</option>
                    <option value="PROCEDURE">Procedure</option>
                    <option value="SERVICE">Other Service</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹) *</label>
                  <input
                    type="number"
                    value={transactionData.consultation_fee}
                    onChange={(e) => setTransactionData({ ...transactionData, consultation_fee: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter amount"
                    min="0"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Doctor and Department */}
            <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
              <h3 className="text-lg font-semibold text-purple-800 mb-4">👩‍⚕️ Doctor & Department</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={transactionData.selected_department}
                    onChange={(e) => setTransactionData({ ...transactionData, selected_department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
                  <select
                    value={transactionData.selected_doctor}
                    onChange={(e) => setTransactionData({ ...transactionData, selected_doctor: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="">Select Doctor</option>
                    {filteredDoctors.map((doctor) => (
                      <option key={doctor.name} value={doctor.name}>
                        {doctor.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
              <h3 className="text-lg font-semibold text-blue-800 mb-4">💰 Payment & Discount</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                  <input
                    type="number"
                    value={transactionData.discount_percentage}
                    onChange={(e) => setTransactionData({ ...transactionData, discount_percentage: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
                  <select
                    value={transactionData.payment_mode}
                    onChange={(e) => setTransactionData({ ...transactionData, payment_mode: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CASH">Cash</option>
                    <option value="ONLINE">Online</option>
                  </select>
                </div>

                {transactionData.payment_mode === 'ONLINE' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Online Method</label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="online_payment_method"
                          value="UPI"
                          checked={transactionData.online_payment_method === 'UPI'}
                          onChange={(e) => setTransactionData({ ...transactionData, online_payment_method: e.target.value })}
                          className="mr-2"
                        />
                        UPI
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="online_payment_method"
                          value="CARD"
                          checked={transactionData.online_payment_method === 'CARD'}
                          onChange={(e) => setTransactionData({ ...transactionData, online_payment_method: e.target.value })}
                          className="mr-2"
                        />
                        Card
                      </label>
                    </div>
                  </div>
                )}

                {transactionData.discount_percentage > 0 && (
                  <div className="lg:col-span-3">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Discount Reason</label>
                    <input
                      type="text"
                      value={transactionData.discount_reason}
                      onChange={(e) => setTransactionData({ ...transactionData, discount_reason: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Reason for discount"
                    />
                  </div>
                )}
              </div>

              {/* Amount Summary */}
              {transactionData.consultation_fee > 0 && (
                <div className="mt-4 p-3 bg-white rounded-lg border-2 border-green-300">
                  <div className="text-center">
                    {transactionData.discount_percentage > 0 && (
                      <div className="text-sm text-gray-600 mb-1">
                        Original: ₹{transactionData.consultation_fee.toLocaleString()} - Discount ({transactionData.discount_percentage}%): ₹{(transactionData.consultation_fee * (transactionData.discount_percentage / 100)).toFixed(2)}
                      </div>
                    )}
                    <span className="text-xl font-bold text-green-700">
                      Total Amount: ₹{(transactionData.consultation_fee - (transactionData.consultation_fee * (transactionData.discount_percentage / 100))).toFixed(2)}
                    </span>
                    <div className="text-sm text-gray-600 mt-1">
                      Payment: {transactionData.payment_mode === 'ONLINE' ? transactionData.online_payment_method : transactionData.payment_mode}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea
                value={transactionData.description}
                onChange={(e) => setTransactionData({ ...transactionData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={2}
                placeholder="Additional notes about this transaction"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-6 border-t">
              <button
                type="button"
                onClick={() => setActiveTab('details')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                ← Back to Details
              </button>
              <button
                type="submit"
                disabled={transactionLoading || !transactionData.consultation_fee || !transactionData.selected_doctor}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {transactionLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Adding Transaction...
                  </div>
                ) : (
                  '💳 Add Transaction'
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditPatientModal;