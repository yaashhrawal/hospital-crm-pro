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
    discount_reason: '',
    notes: '',
    email: '',
    discount_type: 'amount' as 'amount' | 'percentage',
    discount_value: 0,
  });

  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDraft, setIsDraft] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  // Patient filter states (new)
  const [filterFromDate, setFilterFromDate] = useState<string>('');
  const [filterToDate, setFilterToDate] = useState<string>('');
  const [filteredPatientsList, setFilteredPatientsList] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState<boolean>(false);

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

  // Helper: parse flexible date strings (YYYY-MM-DD or DD-MM-YYYY) to Date at midnight
  const parseDateFlexible = (input: string | Date | undefined | null): Date | null => {
    if (!input) return null;
    if (input instanceof Date && !isNaN(input.getTime())) {
      // clone at midnight
      const d = new Date(input.getTime());
      d.setHours(0,0,0,0);
      return d;
    }

    const s = String(input).trim();
    // If already ISO-like YYYY-MM-DD
    const isoMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (isoMatch) {
      const [_, y, m, d] = isoMatch;
      const dt = new Date(Number(y), Number(m) - 1, Number(d));
      dt.setHours(0,0,0,0);
      return dt;
    }
    // If DD-MM-YYYY
    const dmYMatch = s.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dmYMatch) {
      const [_, d, m, y] = dmYMatch;
      const dt = new Date(Number(y), Number(m) - 1, Number(d));
      dt.setHours(0,0,0,0);
      return dt;
    }
    // Fallback: Date parse
    const parsed = new Date(s);
    if (!isNaN(parsed.getTime())) {
      parsed.setHours(0,0,0,0);
      return parsed;
    }
    return null;
  };

  // Apply inclusive date filter on patients by date_of_entry or created_at
  const applyPatientDateFilter = async () => {
    setLoadingPatients(true);
    try {
      // Try to fetch all patients; dataService.getPatients may exist in your codebase
      let patients: any[] = [];
      if (typeof dataService.getPatients === 'function') {
        patients = await dataService.getPatients?.(10000).catch(() => []);
      } else if (typeof PatientService.getPatients === 'function') {
        patients = await PatientService.getPatients?.(10000).catch(() => []);
      } else {
        patients = [];
      }

      const from = parseDateFlexible(filterFromDate);
      const toRaw = parseDateFlexible(filterToDate);
      // Make 'to' inclusive by setting to end of day if provided
      let to: Date | null = null;
      if (toRaw) {
        const t = new Date(toRaw.getTime());
        t.setHours(23,59,59,999);
        to = t;
      }

      // If no dates provided, show first 50 patients
      if (!from && !to) {
        setFilteredPatientsList(patients.slice(0, 50));
        return;
      }

      const filtered = patients.filter(p => {
        // pick candidate date fields in order of preference
        const dateCandidates = [p.date_of_entry, p.created_at, p.updated_at, p.date];
        let patientDate: Date | null = null;
        for (const c of dateCandidates) {
          patientDate = parseDateFlexible(c);
          if (patientDate) break;
        }
        if (!patientDate) return false;

        // Compare
        if (from && to) {
          return patientDate.getTime() >= from.getTime() && patientDate.getTime() <= to.getTime();
        }
        if (from) {
          return patientDate.getTime() >= from.getTime();
        }
        if (to) {
          return patientDate.getTime() <= to.getTime();
        }
        return false;
      });

      // sort by date desc (most recent first) if possible
      filtered.sort((a,b) => {
        const da = parseDateFlexible(a.date_of_entry) || parseDateFlexible(a.created_at) || new Date(0);
        const db = parseDateFlexible(b.date_of_entry) || parseDateFlexible(b.created_at) || new Date(0);
        return db.getTime() - da.getTime();
      });

      setFilteredPatientsList(filtered.slice(0, 200)); // keep limited for UI
    } catch (err) {
      console.error('Error fetching/filtering patients:', err);
      setFilteredPatientsList([]);
    } finally {
      setLoadingPatients(false);
    }
  };

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

      // Calculate discount amount based on type
      let calculatedDiscountAmount = 0;
      const totalFeesForDiscount = formData.entry_fee + formData.consultation_fee; // Base for percentage calculation
      if (formData.discount_type === 'percentage' && formData.discount_value > 0) {
        calculatedDiscountAmount = (totalFeesForDiscount * formData.discount_value) / 100;
      } else if (formData.discount_type === 'amount' && formData.discount_value > 0) {
        calculatedDiscountAmount = formData.discount_value;
      }

      if (calculatedDiscountAmount > 0) {
        transactions.push({
          patient_id: newPatient.id,
          transaction_type: 'discount' as const,
          amount: -calculatedDiscountAmount, // Use calculated discount
          payment_mode: 'adjustment' as PaymentMode,
          doctor_id: formData.selected_doctor || undefined,
          department: formData.selected_department || 'General',
          description: `Discount (${formData.discount_type === 'percentage' ? `${formData.discount_value}%` : `₹${formData.discount_value}`}): ${formData.discount_reason || 'General discount'}`,
          discount_type: formData.discount_type,
          discount_value: formData.discount_value,
        });
      }

      // Create all transactions
      for (const transaction of transactions) {
        await dataService.createTransaction(transaction);
      }

      const totalAmount = totalFeesForDiscount - calculatedDiscountAmount; // Update total amount calculation
      
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
        discount_reason: '',
        notes: '',
        email: '',
        discount_type: 'amount',
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Type</label>
              <select
                value={formData.discount_type}
                onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as 'amount' | 'percentage' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="amount">Amount (₹)</option>
                <option value="percentage">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Discount Value</label>
              <input
                type="number"
                value={formData.discount_value}
                onChange={(e) => setFormData({ ...formData, discount_value: Number(e.target.value) || 0 })}
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

              {formData.discount_value > 0 && (
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