import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import HospitalService from '../services/hospitalService';
import type { CreatePatientData, CreateTransactionData, AssignedDoctor } from '../config/supabaseNew';

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
  // Helper functions for date format conversion
  const formatDateToDD_MM_YYYY = (dateString: string): string => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}-${month}-${year}`;
  };

  const formatDateToYYYY_MM_DD = (dateString: string): string => {
    if (!dateString) return '';
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  };

  const getTodayInDD_MM_YYYY = (): string => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const isValidDateFormat = (dateString: string): boolean => {
    // Check if format is DD-MM-YYYY
    const regex = /^(\d{2})-(\d{2})-(\d{4})$/;
    if (!regex.test(dateString)) return false;
    
    const [day, month, year] = dateString.split('-').map(Number);
    
    // Check if date values are valid
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;
    
    // Check days in month
    const daysInMonth = new Date(year, month, 0).getDate();
    if (day > daysInMonth) return false;
    
    return true;
  };

  const [formData, setFormData] = useState({
    prefix: 'Mr',
    full_name: '', // UI field
    first_name: '', // Backend field (hidden)
    last_name: '', // Backend field (hidden)
    phone: '',
    email: '',
    date_of_birth: '',
    date_of_entry: new Date(), // Default to today
    age: '',
    gender: 'MALE',
    address: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    blood_group: '',
    medical_history: '',
    allergies: '',
    current_medications: '',
    patient_tag: '',
    has_reference: 'NO',
    reference_details: '',
    // Doctor and Department (single selection for backward compatibility)
    selected_department: '',
    selected_doctor: '',
    // Multiple doctors selection
    consultation_mode: 'single', // 'single' or 'multiple'
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
  
  // Multiple doctors state
  const [selectedDoctors, setSelectedDoctors] = useState<AssignedDoctor[]>([]);
  const [tempDepartment, setTempDepartment] = useState('');
  const [tempDoctor, setTempDoctor] = useState('');
  const [tempFee, setTempFee] = useState<number>(0);

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

  // Filter doctors for multiple selection based on temp department
  React.useEffect(() => {
    if (tempDepartment) {
      const filtered = DOCTORS_DATA.filter(doc => doc.department === tempDepartment);
      setFilteredDoctors(filtered);
      if (tempDoctor && !filtered.find(doc => doc.name === tempDoctor)) {
        setTempDoctor('');
      }
    } else {
      setFilteredDoctors(DOCTORS_DATA);
    }
  }, [tempDepartment]);

  // Multiple doctors management functions
  const addDoctor = () => {
    if (!tempDoctor || !tempDepartment) {
      toast.error('Please select both department and doctor');
      return;
    }

    if (tempFee <= 0) {
      toast.error('Please enter a valid consultation fee');
      return;
    }

    // Check if doctor already selected
    if (selectedDoctors.some(doc => doc.name === tempDoctor)) {
      toast.error('This doctor is already selected');
      return;
    }

    const newDoctor: AssignedDoctor = {
      name: tempDoctor,
      department: tempDepartment,
      consultationFee: tempFee,
      isPrimary: selectedDoctors.length === 0 // First doctor is primary
    };

    setSelectedDoctors(prev => [...prev, newDoctor]);
    setTempDoctor('');
    setTempDepartment('');
    setTempFee(0);
    toast.success(`${tempDoctor} added successfully with fee ₹${tempFee}`);
  };

  const removeDoctor = (doctorName: string) => {
    setSelectedDoctors(prev => {
      const updated = prev.filter(doc => doc.name !== doctorName);
      // If we removed the primary doctor, make the first remaining doctor primary
      if (updated.length > 0 && !updated.some(doc => doc.isPrimary)) {
        updated[0].isPrimary = true;
      }
      return updated;
    });
  };

  const setPrimaryDoctor = (doctorName: string) => {
    setSelectedDoctors(prev => 
      prev.map(doc => ({
        ...doc,
        isPrimary: doc.name === doctorName
      }))
    );
  };

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
    if (!formData.full_name.trim()) {
      toast.error('Full name is required');
      return;
    }

    if (!saveAsDraft && !formData.phone.trim()) {
      toast.error('Phone number is required for final save');
      return;
    }

    // Date validation is now handled by DatePicker component

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
        date_of_entry: formData.date_of_entry ? formData.date_of_entry.toISOString().split('T')[0] : undefined,
        age: formData.age.trim() || undefined,
        gender: formData.gender || 'MALE',
        address: formData.address.trim() || undefined,
        emergency_contact_name: formData.emergency_contact_name.trim() || undefined,
        emergency_contact_phone: formData.emergency_contact_phone.trim() || undefined,
        blood_group: formData.blood_group || undefined,
        medical_history: formData.medical_history.trim() || undefined,
        allergies: formData.allergies.trim() || undefined,
        current_medications: formData.current_medications.trim() || undefined,
        patient_tag: formData.patient_tag.trim() || undefined,
        // Reference information
        has_reference: formData.has_reference === 'YES',
        reference_details: formData.has_reference === 'YES' ? formData.reference_details.trim() || undefined : undefined,
        // Doctor and Department assignment (backward compatibility + multiple doctors)
        assigned_doctor: formData.consultation_mode === 'single' 
          ? formData.selected_doctor || undefined 
          : selectedDoctors.find(doc => doc.isPrimary)?.name || selectedDoctors[0]?.name || undefined,
        assigned_department: formData.consultation_mode === 'single'
          ? formData.selected_department || undefined
          : selectedDoctors.find(doc => doc.isPrimary)?.department || selectedDoctors[0]?.department || undefined,
        assigned_doctors: formData.consultation_mode === 'multiple' && selectedDoctors.length > 0 
          ? selectedDoctors 
          : undefined,
        hospital_id: '550e8400-e29b-41d4-a716-446655440000'
      };

      console.log('📤 Creating patient with data:', patientData);
      const newPatient = await HospitalService.createPatient(patientData);
      
      console.log('✅ Patient created:', newPatient);

      // Create transactions if amounts specified
      const transactions = [];

      if (formData.consultation_mode === 'single') {
        // Single doctor consultation - original logic
        const originalConsultationFee = formData.consultation_fee;
        const discountAmount = originalConsultationFee * (formData.discount_percentage / 100);
        const finalAmount = originalConsultationFee - discountAmount;

        console.log('🧮 Single Doctor Billing calculation:');
        console.log('- Original consultation fee:', originalConsultationFee);
        console.log('- Discount percentage:', formData.discount_percentage + '%');
        console.log('- Discount amount:', discountAmount);
        console.log('- Final amount:', finalAmount);

        if (originalConsultationFee > 0) {
          transactions.push({
            patient_id: newPatient.id,
            transaction_type: 'CONSULTATION', 
            description: `Consultation Fee${formData.selected_doctor ? ` - ${formData.selected_doctor}` : ''}${formData.selected_department ? ` (${formData.selected_department})` : ''} | Original: ₹${originalConsultationFee} | Discount: ${formData.discount_percentage}% (₹${discountAmount.toFixed(2)}) | Net: ₹${finalAmount.toFixed(2)}${formData.discount_reason ? ` | Reason: ${formData.discount_reason}` : ''}`,
            amount: finalAmount, // Store FINAL amount after discount
            payment_mode: formData.payment_mode === 'ONLINE' ? formData.online_payment_method : formData.payment_mode,
            status: 'COMPLETED',
            doctor_name: formData.selected_doctor || undefined
          });
        }
      } else {
        // Multiple doctors consultation - new logic
        const totalOriginalFee = selectedDoctors.reduce((total, doctor) => total + (doctor.consultationFee || 0), 0);
        const totalDiscountAmount = totalOriginalFee * (formData.discount_percentage / 100);
        const totalFinalAmount = totalOriginalFee - totalDiscountAmount;

        console.log('🧮 Multiple Doctors Billing calculation:');
        console.log('- Total original consultation fees:', totalOriginalFee);
        console.log('- Discount percentage:', formData.discount_percentage + '%');
        console.log('- Total discount amount:', totalDiscountAmount);
        console.log('- Total final amount:', totalFinalAmount);

        // Create separate transaction for each doctor
        if (selectedDoctors.length > 0 && totalOriginalFee > 0) {
          for (const doctor of selectedDoctors) {
            const doctorFee = doctor.consultationFee || 0;
            if (doctorFee > 0) {
              // Calculate proportional discount for this doctor
              const doctorDiscountAmount = (doctorFee / totalOriginalFee) * totalDiscountAmount;
              const doctorFinalAmount = doctorFee - doctorDiscountAmount;

              transactions.push({
                patient_id: newPatient.id,
                transaction_type: 'CONSULTATION',
                description: `Consultation Fee - ${doctor.name} (${doctor.department}) | Original: ₹${doctorFee} | Discount: ${formData.discount_percentage}% (₹${doctorDiscountAmount.toFixed(2)}) | Net: ₹${doctorFinalAmount.toFixed(2)}${formData.discount_reason ? ` | Reason: ${formData.discount_reason}` : ''}`,
                amount: doctorFinalAmount, // Store FINAL amount after proportional discount
                payment_mode: formData.payment_mode === 'ONLINE' ? formData.online_payment_method : formData.payment_mode,
                status: 'COMPLETED',
                doctor_name: doctor.name
              });
            }
          }
        }
      }

      // Create all transactions
      for (const transactionData of transactions) {
        console.log('💰 Creating transaction:', transactionData);
        await HospitalService.createTransaction(transactionData as CreateTransactionData);
      }

      // Calculate total amount based on consultation mode
      const totalAmount = formData.consultation_mode === 'single' 
        ? formData.consultation_fee - (formData.consultation_fee * (formData.discount_percentage / 100))
        : selectedDoctors.reduce((total, doctor) => total + (doctor.consultationFee || 0), 0) - 
          (selectedDoctors.reduce((total, doctor) => total + (doctor.consultationFee || 0), 0) * (formData.discount_percentage / 100));
      
      if (saveAsDraft) {
        toast.success(`Patient draft saved! ${newPatient.first_name} ${newPatient.last_name}`);
      } else {
        const doctorInfo = formData.consultation_mode === 'single' 
          ? (formData.selected_doctor ? ` - ${formData.selected_doctor}` : '')
          : (selectedDoctors.length > 0 ? ` - ${selectedDoctors.length} doctors assigned` : '');
        const deptInfo = formData.consultation_mode === 'single'
          ? (formData.selected_department ? ` (${formData.selected_department})` : '')
          : '';
        toast.success(`Patient registered successfully! ${newPatient.first_name} ${newPatient.last_name}${doctorInfo}${deptInfo} - Total: ₹${totalAmount.toFixed(2)}`);
      }
      
      // Reset form
      setFormData({
        prefix: 'Mr',
        full_name: '',
        first_name: '',
        last_name: '',
        phone: '',
        email: '',
        date_of_birth: '',
        date_of_entry: new Date(), // Reset to today
        age: '',
        gender: 'MALE',
        address: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        blood_group: '',
        medical_history: '',
        allergies: '',
        current_medications: '',
        patient_tag: '',
        has_reference: 'NO',
        reference_details: '',
        // Doctor and Department (single selection for backward compatibility)
        selected_department: '',
        selected_doctor: '',
        // Multiple doctors selection
        consultation_mode: 'single', // 'single' or 'multiple'
        // Transaction data
        consultation_fee: 0,
        discount_percentage: 0,
        discount_reason: '',
        payment_mode: 'CASH',
        online_payment_method: 'UPI',
      });

      // Reset multiple doctors selection
      setSelectedDoctors([]);
      setTempDepartment('');
      setTempDoctor('');

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

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.full_name}
                onChange={(e) => {
                  const fullName = e.target.value;
                  // Split name for backend compatibility
                  const nameParts = fullName.trim().split(' ');
                  const firstName = nameParts[0] || '';
                  const lastName = nameParts.slice(1).join(' ') || '';
                  
                  setFormData({ 
                    ...formData, 
                    full_name: fullName,
                    first_name: firstName,
                    last_name: lastName
                  });
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter full name (e.g., John Doe)"
                required
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Entry</label>
              <DatePicker
                selected={formData.date_of_entry}
                onChange={(date: Date | null) => {
                  if (date) {
                    setFormData({ ...formData, date_of_entry: date });
                  }
                }}
                dateFormat="dd-MM-yyyy"
                maxDate={new Date()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholderText="DD-MM-YYYY"
                showMonthDropdown
                showYearDropdown
                dropdownMode="select"
                calendarClassName="react-datepicker-custom"
                wrapperClassName="w-full"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Patient Tag (Community/Camp)</label>
              <input
                type="text"
                value={formData.patient_tag}
                onChange={(e) => setFormData({ ...formData, patient_tag: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Enter custom tag (e.g., Jain Community, Corporate Camp, etc.)"
                list="new-flexible-patient-tags-suggestions"
              />
              <datalist id="new-flexible-patient-tags-suggestions">
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

        {/* Doctor and Department Assignment */}
        <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
          <h3 className="text-lg font-semibold text-purple-800 mb-4">👩‍⚕️ Doctor & Department Assignment</h3>
          
          {/* Consultation Mode Toggle */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Consultation Mode</label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="consultation_mode"
                  value="single"
                  checked={formData.consultation_mode === 'single'}
                  onChange={(e) => setFormData({ ...formData, consultation_mode: e.target.value })}
                  className="mr-2"
                />
                <span className="text-sm">👨‍⚕️ Single Doctor</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="consultation_mode"
                  value="multiple"
                  checked={formData.consultation_mode === 'multiple'}
                  onChange={(e) => setFormData({ ...formData, consultation_mode: e.target.value })}
                  className="mr-2"
                />
                <span className="text-sm">👨‍⚕️👩‍⚕️ Multiple Doctors</span>
              </label>
            </div>
          </div>

          {formData.consultation_mode === 'single' ? (
            /* Single Doctor Selection */
            <div>
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
          ) : (
            /* Multiple Doctors Selection */
            <div className="space-y-4">
              {/* Add Doctor Form */}
              <div className="bg-white p-4 rounded-lg border border-purple-200">
                <h4 className="text-md font-semibold text-purple-700 mb-3">➕ Add Doctor</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                    <select
                      value={tempDepartment}
                      onChange={(e) => setTempDepartment(e.target.value)}
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
                      value={tempDoctor}
                      onChange={(e) => setTempDoctor(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                      disabled={!tempDepartment}
                    >
                      <option value="">Select Doctor</option>
                      {filteredDoctors.map((doctor) => (
                        <option key={doctor.name} value={doctor.name}>
                          {doctor.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Fee (₹)</label>
                    <input
                      type="number"
                      value={tempFee || ''}
                      onChange={(e) => setTempFee(Number(e.target.value) || 0)}
                      placeholder="Enter fee"
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={addDoctor}
                      disabled={!tempDoctor || !tempDepartment || tempFee <= 0}
                      className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ➕ Add Doctor
                    </button>
                  </div>
                </div>
              </div>

              {/* Selected Doctors List */}
              {selectedDoctors.length > 0 && (
                <div className="bg-white p-4 rounded-lg border border-purple-200">
                  <h4 className="text-md font-semibold text-purple-700 mb-3">
                    👨‍⚕️ Selected Doctors ({selectedDoctors.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedDoctors.map((doctor, index) => (
                      <div
                        key={doctor.name}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          doctor.isPrimary ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-gray-800">{doctor.name}</span>
                            {doctor.isPrimary && (
                              <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-medium">
                                Primary
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">{doctor.department}</div>
                          <div className="text-sm font-medium text-purple-600">
                            💰 Fee: ₹{doctor.consultationFee || 0}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {!doctor.isPrimary && (
                            <button
                              type="button"
                              onClick={() => setPrimaryDoctor(doctor.name)}
                              className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                              title="Set as primary doctor"
                            >
                              Set Primary
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeDoctor(doctor.name)}
                            className="text-red-600 hover:text-red-800 p-1"
                            title="Remove doctor"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-purple-200">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-700">Total Consultation Fees:</span>
                      <span className="text-lg font-bold text-purple-600">
                        ₹{selectedDoctors.reduce((total, doctor) => total + (doctor.consultationFee || 0), 0)}
                      </span>
                    </div>
                    <div className="text-sm text-purple-600">
                      💡 <strong>Primary doctor</strong> will be used for prescriptions and primary consultation records.
                    </div>
                  </div>
                </div>
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