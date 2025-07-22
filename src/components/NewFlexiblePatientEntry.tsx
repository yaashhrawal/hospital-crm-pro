import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import HospitalService from '../services/hospitalService';
import type { CreatePatientData, CreateTransactionData } from '../config/supabaseNew';

const NewFlexiblePatientEntry: React.FC = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    gender: 'MALE',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    blood_group: '',
    medical_history: '',
    allergies: '',
    // Transaction data
    consultation_fee: 0,
    entry_fee: 0,
    discount_amount: 0,
    discount_reason: '',
  });

  const [loading, setLoading] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Connecting...');

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const result = await HospitalService.testConnection();
      setConnectionStatus(result.success ? '🟢 Connected to Supabase' : `🔴 ${result.message}`);
    } catch (error) {
      setConnectionStatus('🔴 Connection failed');
    }
  };

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault();
    
    // Validate minimum required fields
    if (!formData.first_name.trim()) {
      toast.error('First name is required');
      return;
    }

    if (!saveAsDraft && !formData.phone.trim()) {
      toast.error('Phone number is required for final save');
      return;
    }

    setLoading(true);

    try {
      console.log('🚀 Starting patient creation process...');
      
      // Create patient data
      const patientData: CreatePatientData = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender || 'MALE',
        address: formData.address.trim() || undefined,
        emergency_contact_name: formData.emergency_contact_name.trim() || undefined,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || undefined,
        blood_group: formData.blood_group || undefined,
        medical_history: formData.medical_history.trim() || undefined,
        allergies: formData.allergies.trim() || undefined,
        hospital_id: '550e8400-e29b-41d4-a716-446655440000'
      };

      console.log('📤 Creating patient with data:', patientData);
      const newPatient = await HospitalService.createPatient(patientData);
      
      console.log('✅ Patient created:', newPatient);

      // Create transactions if amounts specified
      const transactions = [];

      if (formData.entry_fee > 0) {
        transactions.push({
          patient_id: newPatient.id,
          transaction_type: 'consultation', // Try lowercase
          description: 'Hospital Entry Fee',
          amount: formData.entry_fee,
          payment_mode: 'CASH',
          department: 'General',
          status: 'COMPLETED'
        });
      }

      if (formData.consultation_fee > 0) {
        transactions.push({
          patient_id: newPatient.id,
          transaction_type: 'consultation', // Use same type for both
          description: 'Doctor Consultation Fee',
          amount: formData.consultation_fee,
          payment_mode: 'CASH',
          department: 'General',
          status: 'COMPLETED'
        });
      }

      if (formData.discount_amount > 0) {
        transactions.push({
          patient_id: newPatient.id,
          transaction_type: 'consultation', // Use same type temporarily
          description: `Discount: ${formData.discount_reason || 'General discount'}`,
          amount: -formData.discount_amount,
          payment_mode: 'CASH',
          department: 'General',
          status: 'COMPLETED'
        });
      }

      // Create all transactions
      for (const transactionData of transactions) {
        console.log('💰 Creating transaction:', transactionData);
        await HospitalService.createTransaction(transactionData as CreateTransactionData);
      }

      const totalAmount = formData.entry_fee + formData.consultation_fee - formData.discount_amount;
      
      if (saveAsDraft) {
        toast.success(`Patient draft saved! ${newPatient.first_name} ${newPatient.last_name}`);
      } else {
        toast.success(`Patient registered successfully! ${newPatient.first_name} ${newPatient.last_name} - Total: ₹${totalAmount.toLocaleString()}`);
      }
      
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        date_of_birth: '',
        gender: 'MALE',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        blood_group: '',
        medical_history: '',
        allergies: '',
        consultation_fee: 0,
        entry_fee: 0,
        discount_amount: 0,
        discount_reason: '',
      });
      setShowOptionalFields(false);

    } catch (error: any) {
      console.error('🚨 Patient creation failed:', error);
      toast.error(`Failed to save patient: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = formData.entry_fee + formData.consultation_fee - formData.discount_amount;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">👤 New Flexible Patient Entry</h2>
        <p className="text-gray-600 mt-1">Ultra-flexible patient registration with minimal required fields</p>
        
        {/* Connection Status */}
        <div className="mt-4 p-2 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600">{connectionStatus}</div>
        </div>
      </div>
      
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Essential Information - Always Visible */}
        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-4">✅ Essential Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter first name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter last name (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Charges - Optional */}
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">💰 Quick Charges (Optional)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entry Fee (₹)</label>
              <input
                type="number"
                value={formData.entry_fee}
                onChange={(e) => setFormData({ ...formData, entry_fee: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹)</label>
              <input
                type="number"
                value={formData.consultation_fee}
                onChange={(e) => setFormData({ ...formData, consultation_fee: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount (₹)</label>
              <input
                type="number"
                value={formData.discount_amount}
                onChange={(e) => setFormData({ ...formData, discount_amount: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          {totalAmount > 0 && (
            <div className="mt-4 p-3 bg-white rounded-lg border-2 border-green-300">
              <div className="text-center">
                <span className="text-xl font-bold text-green-700">
                  Total Amount: ₹{totalAmount.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Toggle Optional Fields */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => setShowOptionalFields(!showOptionalFields)}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            {showOptionalFields ? '▲ Hide Additional Fields' : '▼ Show Additional Fields'}
          </button>
        </div>

        {/* Optional Fields - Collapsible */}
        {showOptionalFields && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">📝 Additional Information (All Optional)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="patient@email.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
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

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                <input
                  type="text"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Emergency contact name"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                <input
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Emergency contact phone"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter full address"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
                <textarea
                  value={formData.medical_history}
                  onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Previous medical conditions"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
                <textarea
                  value={formData.allergies}
                  onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Known allergies"
                  rows={2}
                />
              </div>

              {formData.discount_amount > 0 && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Discount Reason</label>
                  <input
                    type="text"
                    value={formData.discount_reason}
                    onChange={(e) => setFormData({ ...formData, discount_reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Reason for discount"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={loading || !formData.first_name.trim()}
            className="bg-gray-600 text-white py-3 px-6 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50"
          >
            {loading ? 'Saving Draft...' : '📝 Save as Draft'}
          </button>
          <button
            type="submit"
            disabled={loading || !formData.first_name.trim()}
            className="bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Registering...' : '✅ Register Patient'}
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-100 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">💡 Ultra-Flexible Entry:</h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• <strong>Only First Name Required:</strong> Minimum entry for quick registration</li>
          <li>• <strong>Save as Draft:</strong> Preserve incomplete information for later</li>
          <li>• <strong>Instant Charging:</strong> Add fees and charges during registration</li>
          <li>• <strong>Optional Everything:</strong> All fields except first name are optional</li>
          <li>• <strong>Direct Supabase:</strong> No LocalStorage fallback - pure database integration</li>
        </ul>
      </div>
    </div>
  );
};

export default NewFlexiblePatientEntry;