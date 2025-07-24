import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import HospitalService from '../services/hospitalService';
import type { CreatePatientData, CreateTransactionData } from '../config/supabaseNew';

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

// Get unique departments
const DEPARTMENTS = [...new Set(DOCTORS_DATA.map(doc => doc.department))].sort();

const NewFlexiblePatientEntry: React.FC = () => {
  const [formData, setFormData] = useState({
    prefix: 'Mr',
    first_name: '',
    last_name: '',
    phone: '',
    email: '',
    date_of_birth: '',
    age: '',
    gender: 'MALE',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    blood_group: '',
    medical_history: '',
    allergies: '',
    current_medications: '',
    has_reference: 'NO',
    reference_details: '',
    // Doctor and Department
    selected_department: '',
    selected_doctor: '',
    // Transaction data
    consultation_fee: 0,
    discount_percentage: 0,
    discount_reason: '',
    payment_mode: 'CASH',
    online_payment_method: 'UPI',
  });

  const [loading, setLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Connecting...');
  const [filteredDoctors, setFilteredDoctors] = useState(DOCTORS_DATA);

  useEffect(() => {
    testConnection();
  }, []);

  // Filter doctors based on selected department
  useEffect(() => {
    if (formData.selected_department) {
      const filtered = DOCTORS_DATA.filter(doc => doc.department === formData.selected_department);
      setFilteredDoctors(filtered);
      // Reset doctor selection if current doctor doesn't belong to selected department
      if (formData.selected_doctor && !filtered.find(doc => doc.name === formData.selected_doctor)) {
        setFormData(prev => ({ ...prev, selected_doctor: '' }));
      }
    } else {
      setFilteredDoctors(DOCTORS_DATA);
    }
  }, [formData.selected_department]);

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
        prefix: formData.prefix,
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        email: formData.email.trim() || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        age: formData.age.trim() || undefined,
        gender: formData.gender || 'MALE',
        address: formData.address.trim() || undefined,
        emergency_contact_name: formData.emergency_contact_name.trim() || undefined,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || undefined,
        blood_group: formData.blood_group || undefined,
        medical_history: formData.medical_history.trim() || undefined,
        allergies: formData.allergies.trim() || undefined,
        current_medications: formData.current_medications.trim() || undefined,
        // Reference information
        has_reference: formData.has_reference === 'YES',
        reference_details: formData.has_reference === 'YES' ? formData.reference_details.trim() || undefined : undefined,
        // Doctor and Department assignment
        assigned_doctor: formData.selected_doctor || undefined,
        assigned_department: formData.selected_department || undefined,
        hospital_id: '550e8400-e29b-41d4-a716-446655440000'
      };

      console.log('📤 Creating patient with data:', patientData);
      const newPatient = await HospitalService.createPatient(patientData);
      
      console.log('✅ Patient created:', newPatient);

      // Create transactions if amounts specified
      const transactions = [];

      // Calculate discount amount from percentage
      const originalConsultationFee = formData.consultation_fee;
      const discountAmount = originalConsultationFee * (formData.discount_percentage / 100);
      const finalAmount = originalConsultationFee - discountAmount;

      console.log('🧮 Billing calculation:');
      console.log('- Original consultation fee:', originalConsultationFee);
      console.log('- Discount percentage:', formData.discount_percentage + '%');
      console.log('- Discount amount:', discountAmount);
      console.log('- Final amount:', finalAmount);

      if (originalConsultationFee > 0) {
        // Store the ORIGINAL consultation fee (not discounted amount)
        transactions.push({
          patient_id: newPatient.id,
          transaction_type: 'CONSULTATION', 
          description: `Consultation Fee${formData.selected_doctor ? ` - ${formData.selected_doctor}` : ''}${formData.selected_department ? ` (${formData.selected_department})` : ''} | Original: ₹${originalConsultationFee} | Discount: ${formData.discount_percentage}% (₹${discountAmount.toFixed(2)}) | Net: ₹${finalAmount.toFixed(2)}${formData.discount_reason ? ` | Reason: ${formData.discount_reason}` : ''}`,
          amount: originalConsultationFee, // Store ORIGINAL amount, not discounted
          payment_mode: formData.payment_mode === 'ONLINE' ? formData.online_payment_method : formData.payment_mode,
          status: 'COMPLETED',
          doctor_name: formData.selected_doctor || undefined
        });

        // If there's a discount, add a separate discount transaction
        if (formData.discount_percentage > 0 && discountAmount > 0) {
          transactions.push({
            patient_id: newPatient.id,
            transaction_type: 'DISCOUNT',
            description: `Consultation Discount (${formData.discount_percentage}%)${formData.discount_reason ? ` - ${formData.discount_reason}` : ''}`,
            amount: -discountAmount, // Negative amount for discount
            payment_mode: formData.payment_mode === 'ONLINE' ? formData.online_payment_method : formData.payment_mode,
            status: 'COMPLETED',
            doctor_name: formData.selected_doctor || undefined
          });
        }
      }

      // Create all transactions
      for (const transactionData of transactions) {
        console.log('💰 Creating transaction:', transactionData);
        await HospitalService.createTransaction(transactionData as CreateTransactionData);
      }

      const totalAmount = finalAmount; // Use the calculated final amount
      
      if (saveAsDraft) {
        toast.success(`Patient draft saved! ${newPatient.first_name} ${newPatient.last_name}`);
      } else {
        const doctorInfo = formData.selected_doctor ? ` - ${formData.selected_doctor}` : '';
        const deptInfo = formData.selected_department ? ` (${formData.selected_department})` : '';
        toast.success(`Patient registered successfully! ${newPatient.first_name} ${newPatient.last_name}${doctorInfo}${deptInfo} - Total: ₹${totalAmount.toFixed(2)}`);
      }
      
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        date_of_birth: '',
        age: '',
        gender: 'MALE',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        blood_group: '',
        medical_history: '',
        allergies: '',
        current_medications: '',
        has_reference: 'NO',
        reference_details: '',
        selected_department: '',
        selected_doctor: '',
        consultation_fee: 0,
        discount_percentage: 0,
        discount_reason: '',
        payment_mode: 'CASH',
        online_payment_method: 'UPI',
      });

    } catch (error: any) {
      console.error('🚨 Patient creation failed:', error);
      toast.error(`Failed to save patient: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = formData.consultation_fee - (formData.consultation_fee * (formData.discount_percentage / 100));

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
        {/* Essential Information - All Fields */}
        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
          <h3 className="text-lg font-semibold text-green-800 mb-4">✅ Patient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prefix <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.prefix}
                onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                required
              >
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Ms">Ms</option>
                <option value="Dr">Dr</option>
                <option value="Prof">Prof</option>
              </select>
            </div>

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
                placeholder="Enter last name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
              <input
                type="text"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter age (e.g., 25, 30 years, 6 months)"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="patient@email.com"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter full address"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
              <input
                type="text"
                value={formData.emergency_contact_name}
                onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Emergency contact name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
              <input
                type="tel"
                value={formData.emergency_contact_phone}
                onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Emergency contact phone"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Blood Group</label>
              <select
                value={formData.blood_group}
                onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Reference</label>
              <select
                value={formData.has_reference}
                onChange={(e) => setFormData({ ...formData, has_reference: e.target.value, reference_details: e.target.value === 'NO' ? '' : formData.reference_details })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="NO">No</option>
                <option value="YES">Yes</option>
              </select>
            </div>

            {formData.has_reference === 'YES' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference Details</label>
                <input
                  type="text"
                  value={formData.reference_details}
                  onChange={(e) => setFormData({ ...formData, reference_details: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter reference details (doctor name, hospital, person, etc.)"
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Medical History</label>
              <textarea
                value={formData.medical_history}
                onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Previous medical conditions"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Allergies</label>
              <textarea
                value={formData.allergies}
                onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Known allergies"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Current Medications</label>
              <textarea
                value={formData.current_medications}
                onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Current medicines"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Doctor and Department Assignment */}
        <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
          <h3 className="text-lg font-semibold text-purple-800 mb-4">👩‍⚕️ Doctor & Department Assignment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={formData.selected_department}
                onChange={(e) => setFormData({ ...formData, selected_department: e.target.value })}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
              <select
                value={formData.selected_doctor}
                onChange={(e) => setFormData({ ...formData, selected_doctor: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                disabled={!formData.selected_department}
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
          {formData.selected_department && (
            <div className="mt-2 text-sm text-purple-600">
              💡 Department: <strong>{formData.selected_department}</strong>
              {formData.selected_doctor && (
                <span> • Doctor: <strong>{formData.selected_doctor}</strong></span>
              )}
            </div>
          )}
        </div>

        {/* Payment Information */}
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">💰 Payment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
              <input
                type="number"
                value={formData.discount_percentage}
                onChange={(e) => setFormData({ ...formData, discount_percentage: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0"
                min="0"
                max="100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode</label>
              <select
                value={formData.payment_mode}
                onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="CASH">Cash</option>
                <option value="ONLINE">Online</option>
              </select>
            </div>

            {formData.payment_mode === 'ONLINE' && (
              <div className="lg:col-span-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Online Payment Method</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="online_payment_method"
                      value="UPI"
                      checked={formData.online_payment_method === 'UPI'}
                      onChange={(e) => setFormData({ ...formData, online_payment_method: e.target.value })}
                      className="mr-2"
                    />
                    UPI
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="online_payment_method"
                      value="CARD"
                      checked={formData.online_payment_method === 'CARD'}
                      onChange={(e) => setFormData({ ...formData, online_payment_method: e.target.value })}
                      className="mr-2"
                    />
                    Card
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="online_payment_method"
                      value="BANK_TRANSFER"
                      checked={formData.online_payment_method === 'BANK_TRANSFER'}
                      onChange={(e) => setFormData({ ...formData, online_payment_method: e.target.value })}
                      className="mr-2"
                    />
                    Cheque
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="online_payment_method"
                      value="INSURANCE"
                      checked={formData.online_payment_method === 'INSURANCE'}
                      onChange={(e) => setFormData({ ...formData, online_payment_method: e.target.value })}
                      className="mr-2"
                    />
                    Insurance
                  </label>
                </div>
              </div>
            )}

            {formData.discount_percentage > 0 && (
              <div className="lg:col-span-3">
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

          {formData.consultation_fee > 0 && (
            <div className="mt-4 p-3 bg-white rounded-lg border-2 border-green-300">
              <div className="text-center">
                {formData.discount_percentage > 0 && (
                  <div className="text-sm text-gray-600 mb-1">
                    Original: ₹{formData.consultation_fee.toLocaleString()} - Discount ({formData.discount_percentage}%): ₹{(formData.consultation_fee * (formData.discount_percentage / 100)).toFixed(2)}
                  </div>
                )}
                <span className="text-xl font-bold text-green-700">
                  Total Amount: ₹{totalAmount.toFixed(2)}
                </span>
                <div className="text-sm text-gray-600 mt-1">
                  Payment Method: {formData.payment_mode === 'ONLINE' ? formData.online_payment_method : formData.payment_mode}
                </div>
              </div>
            </div>
          )}
        </div>


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
        <h4 className="font-semibold text-blue-800 mb-2">💡 Enhanced Patient Entry:</h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• <strong>Comprehensive Information:</strong> All patient details in one form</li>
          <li>• <strong>Reference Tracking:</strong> Option to record patient referrals</li>
          <li>• <strong>Flexible Payment:</strong> Cash and online payment options with sub-methods</li>
          <li>• <strong>Essential Details:</strong> Address and date of birth included by default</li>
          <li>• <strong>Database Integration:</strong> Direct Supabase integration for reliable storage</li>
        </ul>
      </div>
    </div>
  );
};

export default NewFlexiblePatientEntry;