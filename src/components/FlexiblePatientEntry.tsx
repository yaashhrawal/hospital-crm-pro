import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import dataService from '../services/dataService';
import PatientService from '../services/patientService';
import FixedPatientService from '../services/patientServiceFixed';
import type { Patient, PatientTransaction, Gender, PaymentMode } from '../types/index';

const FlexiblePatientEntry: React.FC = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    address: '',
    gender: 'M' as 'M' | 'F' | 'OTHER',
    date_of_birth: '',
    patient_tag: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    selected_doctor: '',
    custom_doctor_name: '',
    selected_department: '',
    entry_fee: 0,
    consultation_fee: 0,
    discount_amount: 0,
    discount_reason: '',
    notes: '',
    email: '',
  });

  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [doctorsData, departmentsData] = await Promise.all([
          dataService.getDoctors(),
          dataService.getDepartments(),
        ]);
        setDoctors(doctorsData);
        setDepartments(departmentsData);
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent, saveAsDraft = false) => {
    e.preventDefault();
    
    // Validate minimum required fields
    if (!formData.first_name.trim()) {
      toast.error('First name is required');
      return;
    }

    if (!formData.phone.trim() && !saveAsDraft) {
      toast.error('Phone number is required for final save');
      return;
    }

    setLoading(true);
    setIsDraft(saveAsDraft);

    try {
      // Create patient with only provided information
      const patientData: any = {
        first_name: formData.first_name.trim(),
        last_name: formData.last_name.trim(),
        phone: formData.phone.trim(),
        address: formData.address.trim(),
        gender: formData.gender,
        is_active: true,
      };

      // Add optional fields only if provided
      if (formData.date_of_birth) patientData.date_of_birth = formData.date_of_birth;
      if (formData.patient_tag) patientData.patient_tag = formData.patient_tag;
      if (formData.emergency_contact_name) patientData.emergency_contact_name = formData.emergency_contact_name;
      if (formData.emergency_contact_phone) patientData.emergency_contact_phone = formData.emergency_contact_phone;
      if (formData.email) patientData.email = formData.email;

      // Use the column-compatible patient service
      const newPatient = await FixedPatientService.createPatient(patientData);

      // Create transactions only if amounts are specified
      const transactions = [];

      if (formData.entry_fee > 0) {
        transactions.push({
          patient_id: newPatient.id,
          transaction_type: 'entry_fee' as const,
          amount: formData.entry_fee,
          payment_mode: 'cash' as PaymentMode,
          doctor_id: formData.selected_doctor || undefined,
          department: formData.selected_department || 'General',
          description: 'Hospital Entry Fee',
        });
      }

      if (formData.consultation_fee > 0) {
        const doctorName = formData.selected_doctor === 'custom' 
          ? formData.custom_doctor_name 
          : doctors.find(d => d.id === formData.selected_doctor)?.name || 'Doctor';
        
        transactions.push({
          patient_id: newPatient.id,
          transaction_type: 'consultation' as const,
          amount: formData.consultation_fee,
          payment_mode: 'cash' as PaymentMode,
          doctor_id: formData.selected_doctor === 'custom' ? 'custom' : formData.selected_doctor,
          department: formData.selected_department || 'General',
          description: `Consultation with ${doctorName}`,
        });
      }

      if (formData.discount_amount > 0) {
        transactions.push({
          patient_id: newPatient.id,
          transaction_type: 'discount' as const,
          amount: -formData.discount_amount,
          payment_mode: 'adjustment' as PaymentMode,
          doctor_id: formData.selected_doctor === 'custom' ? 'custom' : formData.selected_doctor,
          department: formData.selected_department || 'General',
          description: `Discount: ${formData.discount_reason || 'General discount'}`,
        });
      }

      // Create all transactions
      for (const transaction of transactions) {
        await dataService.createTransaction(transaction);
      }

      const totalAmount = formData.entry_fee + formData.consultation_fee - formData.discount_amount;
      
      if (saveAsDraft) {
        toast.success(`Patient draft saved! ${formData.first_name} ${formData.last_name}`);
      } else {
        toast.success(`Patient registered successfully! ${formData.first_name} ${formData.last_name} - Total: ₹${totalAmount}`);
      }
      
      // Reset form
      setFormData({
        first_name: '',
        last_name: '',
        phone: '',
        address: '',
        gender: 'M',
        date_of_birth: '',
        patient_tag: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        selected_doctor: '',
        custom_doctor_name: '',
        selected_department: '',
        entry_fee: 0,
        consultation_fee: 0,
        discount_amount: 0,
        discount_reason: '',
        notes: '',
        email: '',
      });
      setShowOptionalFields(false);
    } catch (error) {
      console.error('Error saving patient:', error);
      toast.error('Failed to save patient information');
    } finally {
      setLoading(false);
      setIsDraft(false);
    }
  };

  const totalAmount = formData.entry_fee + formData.consultation_fee - formData.discount_amount;

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800">👤 Flexible Patient Entry</h2>
        <p className="text-gray-600 mt-1">Quick patient registration with minimal required information</p>
      </div>
      
      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Essential Information - Always Visible */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">📋 Essential Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter last name (optional)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'M' | 'F' | 'OTHER' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="M">M</option>
                <option value="F">F</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient Tag (Community/Camp)</label>
              <input
                type="text"
                value={formData.patient_tag}
                onChange={(e) => setFormData({ ...formData, patient_tag: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter custom tag (e.g., Jain Community, Corporate Camp, etc.)"
                list="patient-tags-suggestions"
              />
              <datalist id="patient-tags-suggestions">
                <option value="Jain Community" />
                <option value="Bohara Community" />
                <option value="Corporate Camp" />
                <option value="Medical Camp" />
                <option value="School Camp" />
                <option value="Senior Citizen" />
                <option value="Insurance" />
                <option value="Government Scheme" />
                <option value="VIP" />
                <option value="Regular" />
              </datalist>
              <div className="text-xs text-gray-500 mt-1">
                💡 Start typing for suggestions or enter your own custom tag
              </div>
            </div>
          </div>
        </div>

        {/* Quick Charges - Optional */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-green-800 mb-4">💰 Quick Charges (Optional)</h3>
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
                <span className="text-lg font-semibold text-green-700">
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
            {showOptionalFields ? '▲ Hide Optional Fields' : '▼ Show Optional Fields'}
          </button>
        </div>

        {/* Optional Fields - Collapsible */}
        {showOptionalFields && (
          <div className="bg-gray-50 p-4 rounded-lg space-y-4">
            <h3 className="text-lg font-semibold text-gray-800">📝 Additional Information (Optional)</h3>
            
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                <input
                  type="text"
                  value={formData.emergency_contact_name}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Emergency contact name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                <input
                  type="tel"
                  value={formData.emergency_contact_phone}
                  onChange={(e) => setFormData({ ...formData, emergency_contact_phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Emergency contact phone"
                />
              </div>

              {/* Doctor and Department Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={formData.selected_department}
                  onChange={(e) => setFormData({ ...formData, selected_department: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Doctor</label>
                <select
                  value={formData.selected_doctor}
                  onChange={(e) => setFormData({ ...formData, selected_doctor: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Doctor</option>
                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                  ))}
                  <option value="custom">Custom Doctor Name</option>
                </select>
              </div>

              {formData.selected_doctor === 'custom' && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Custom Doctor Name</label>
                  <input
                    type="text"
                    value={formData.custom_doctor_name}
                    onChange={(e) => setFormData({ ...formData, custom_doctor_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter doctor name"
                  />
                </div>
              )}

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

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Any additional notes about the patient"
                  rows={2}
                />
              </div>
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
            {isDraft ? 'Saving Draft...' : '📝 Save as Draft'}
          </button>
          <button
            type="submit"
            disabled={loading || !formData.first_name.trim()}
            className="bg-blue-600 text-white py-3 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading && !isDraft ? 'Registering...' : '✅ Register Patient'}
          </button>
        </div>
      </form>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-100 rounded-lg">
        <h4 className="font-semibold text-blue-800 mb-2">💡 How it works:</h4>
        <ul className="text-blue-700 text-sm space-y-1">
          <li>• <strong>Minimum Required:</strong> Only first name is required to start</li>
          <li>• <strong>Save as Draft:</strong> Save partial information for later completion</li>
          <li>• <strong>Quick Registration:</strong> Add name, phone, and charges for instant registration</li>
          <li>• <strong>Optional Fields:</strong> Expand for detailed patient information</li>
          <li>• <strong>Flexible Charges:</strong> Add entry fee, consultation, or discount as needed</li>
        </ul>
      </div>
    </div>
  );
};

export default FlexiblePatientEntry;