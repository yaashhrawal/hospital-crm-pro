import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import HospitalService from '../services/hospitalService';
import type { PatientWithRelations } from '../config/supabaseNew';
import { supabase } from '../config/supabaseNew';
import { useAuth } from '../contexts/AuthContext';
import { 
  User, 
  Stethoscope, 
  CreditCard,
  X
} from 'lucide-react';

// Doctors and Departments data
const DOCTORS_DATA = [
  { name: 'DR. HEMANT KHAJJA', department: 'ORTHOPAEDIC' },
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
  { name: 'DR. BATUL PEEPAWALA', department: 'GENERAL PHYSICIAN' },
  { name: 'DR. POONAM JAIN', department: 'PHYSIOTHERAPY' }
];

// Get unique departments
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
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [filteredDoctors, setFilteredDoctors] = useState(DOCTORS_DATA);
  const [transactionLoading, setTransactionLoading] = useState(false);
  const [existingPayments, setExistingPayments] = useState<any[]>([]);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    prefix: patient.prefix || 'Mr',
    full_name: `${patient.first_name || ''} ${patient.last_name || ''}`.trim(),
    first_name: patient.first_name || '',
    last_name: patient.last_name || '',
    phone: patient.phone || '',
    email: patient.email || '',
    date_of_birth: patient.date_of_birth || '',
    date_of_entry: patient.date_of_entry ? new Date(patient.date_of_entry) : new Date(),
    age: patient.age || '',
    gender: patient.gender || 'MALE',
    address: patient.address || '',
    blood_group: patient.blood_group || '',
    medical_history: patient.medical_history || '',
    allergies: patient.allergies || '',
    current_medications: patient.current_medications || '',
    patient_tag: patient.patient_tag || '', // Use actual patient_tag field
    has_reference: patient.has_reference ? 'YES' : 'NO',
    reference_details: patient.reference_details || '',
    // Doctor and Department
    selected_department: patient.assigned_department || '',
    selected_doctor: patient.assigned_doctor || '',
    custom_doctor_name: '',
    custom_department_name: '',
  });

  // Payment form data
  const [paymentData, setPaymentData] = useState({
    consultation_fee: 0,
    discount_percentage: 0,
    discount_reason: '',
    payment_mode: 'CASH',
    online_payment_method: 'UPI',
    transaction_type: 'CONSULTATION',
    description: ''
  });

  // Filter doctors when department changes
  useEffect(() => {
    if (formData.selected_department) {
      const filtered = DOCTORS_DATA.filter(doc => 
        doc.department === formData.selected_department
      );
      setFilteredDoctors(filtered);
    } else {
      setFilteredDoctors(DOCTORS_DATA);
    }
  }, [formData.selected_department]);

  // Load existing payments when modal opens
  useEffect(() => {
    if (isOpen && patient.transactions) {
      // Filter for entry fee and consultation transactions (initial payments)
      const initialPayments = patient.transactions.filter((t: any) => 
        t.transaction_type === 'ENTRY_FEE' || 
        t.transaction_type === 'entry_fee' ||
        t.transaction_type === 'CONSULTATION' ||
        t.transaction_type === 'consultation'
      );
      setExistingPayments(initialPayments);
      
      // If there are existing payments, pre-fill the first one
      if (initialPayments.length > 0) {
        const firstPayment = initialPayments[0];
        setSelectedPaymentId(firstPayment.id);
        setPaymentData({
          consultation_fee: firstPayment.amount || 0,
          discount_percentage: 0,
          discount_reason: '',
          payment_mode: firstPayment.payment_mode || 'CASH',
          online_payment_method: 'UPI',
          transaction_type: firstPayment.transaction_type || 'CONSULTATION',
          description: firstPayment.description || ''
        });
      }
    }
  }, [isOpen, patient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name) {
      toast.error('Please enter patient full name');
      return;
    }

    setLoading(true);

    try {
      // Split full name into first and last name
      const nameParts = formData.full_name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const updateData = {
        prefix: formData.prefix as 'Mr' | 'Mrs' | 'Ms' | 'Dr' | 'Prof',
        first_name: firstName,
        last_name: lastName,
        phone: formData.phone || '',
        email: formData.email || undefined,
        address: formData.address || '',
        date_of_birth: formData.date_of_birth || undefined,
        age: formData.age || undefined,
        gender: formData.gender as 'MALE' | 'FEMALE' | 'OTHER',
        blood_group: formData.blood_group || undefined,
        medical_history: formData.medical_history || undefined,
        allergies: formData.allergies || undefined,
        current_medications: formData.current_medications || undefined,
        has_reference: formData.has_reference === 'YES',
        reference_details: formData.has_reference === 'YES' ? formData.reference_details || undefined : undefined,
        patient_tag: formData.patient_tag || undefined,
        date_of_entry: formData.date_of_entry ? formData.date_of_entry.toISOString().split('T')[0] : undefined,
        assigned_doctor: formData.selected_doctor === 'CUSTOM' ? formData.custom_doctor_name : formData.selected_doctor || undefined,
        assigned_department: formData.selected_department === 'CUSTOM' ? formData.custom_department_name : formData.selected_department || undefined,
      };

      console.log('Updating patient with data:', updateData);
      
      const updatedPatient = await HospitalService.updatePatient(patient.id, updateData);
      
      if (updatedPatient) {
        toast.success('Patient updated successfully');
        onPatientUpdated();
        onClose();
      }
    } catch (error: any) {
      console.error('Error updating patient:', error);
      toast.error(`Failed to update patient: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePayment = async () => {
    if (!paymentData.consultation_fee || paymentData.consultation_fee < 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    const finalDoctorName = formData.selected_doctor === 'CUSTOM' ? formData.custom_doctor_name : formData.selected_doctor;
    const finalDepartmentName = formData.selected_department === 'CUSTOM' ? formData.custom_department_name : formData.selected_department;
    
    if (!finalDoctorName && !finalDepartmentName) {
      toast.error('Please select a doctor or department');
      return;
    }
    
    if (formData.selected_doctor === 'CUSTOM' && !formData.custom_doctor_name) {
      toast.error('Please enter custom doctor name');
      return;
    }
    
    if (formData.selected_department === 'CUSTOM' && !formData.custom_department_name) {
      toast.error('Please enter custom department name');
      return;
    }

    setTransactionLoading(true);

    try {
      // Calculate discount amount from percentage
      const originalConsultationFee = paymentData.consultation_fee;
      const discountAmount = originalConsultationFee * (paymentData.discount_percentage / 100);
      const finalAmount = originalConsultationFee - discountAmount;

      console.log('💰 Updating transaction for patient:', patient.id);

      const transactionDescription = paymentData.description || 
        `${paymentData.transaction_type === 'CONSULTATION' ? 'Consultation Fee' : 
          paymentData.transaction_type === 'LAB_TEST' ? 'Lab Test' :
          paymentData.transaction_type === 'XRAY' ? 'X-Ray' :
          paymentData.transaction_type === 'MEDICINE' ? 'Medicine' :
          paymentData.transaction_type === 'PROCEDURE' ? 'Procedure' :
          'Service'}${finalDoctorName ? ` - ${finalDoctorName}` : ''}${finalDepartmentName ? ` (${finalDepartmentName})` : ''}${paymentData.discount_reason ? ` | Reason: ${paymentData.discount_reason}` : ''}`;

      if (selectedPaymentId) {
        // Update existing transaction
        const { error } = await supabase
          .from('patient_transactions')
          .update({
            transaction_type: paymentData.transaction_type,
            description: transactionDescription,
            amount: finalAmount,
            payment_mode: paymentData.payment_mode === 'ONLINE' ? paymentData.online_payment_method : paymentData.payment_mode,
            doctor_name: finalDoctorName,
            department: finalDepartmentName,
            updated_at: new Date().toISOString()
          })
          .eq('id', selectedPaymentId);
        
        if (error) {
          throw error;
        }
        toast.success(`Payment updated successfully! ₹${finalAmount.toFixed(2)}`);
      } else {
        // Create new transaction if none exists
        const mainTransaction = {
          patient_id: patient.id,
          transaction_type: paymentData.transaction_type as any,
          description: transactionDescription,
          amount: finalAmount,
          payment_mode: paymentData.payment_mode === 'ONLINE' ? paymentData.online_payment_method : paymentData.payment_mode,
          status: 'COMPLETED' as any,
          doctor_name: finalDoctorName,
          hospital_id: '550e8400-e29b-41d4-a716-446655440000',
          created_by: 'system'
        };
        
        await HospitalService.createTransaction(mainTransaction as any);
        toast.success(`Payment added successfully! ₹${finalAmount.toFixed(2)}`);
      }
      
      // Refresh parent
      onPatientUpdated();

    } catch (error: any) {
      console.error('🚨 Transaction update failed:', error);
      toast.error(`Failed to update transaction: ${error.message}`);
    } finally {
      setTransactionLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      {/* Modern DatePicker Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
          .react-datepicker-modern {
            border: none !important;
            border-radius: 12px !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15) !important;
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif !important;
          }

          .react-datepicker-calendar-modern {
            border: none !important;
            border-radius: 12px !important;
          }

          .react-datepicker__header {
            background-color: #0056B3 !important;
            border-bottom: none !important;
            border-radius: 12px 12px 0 0 !important;
            padding: 20px 0 !important;
          }

          .react-datepicker__current-month {
            color: white !important;
            font-weight: 600 !important;
            font-size: 16px !important;
            margin-bottom: 10px !important;
          }

          .react-datepicker__day-names {
            background-color: #0056B3 !important;
            margin-bottom: 0 !important;
          }

          .react-datepicker__day-name {
            color: white !important;
            font-weight: 500 !important;
            width: 2.5rem !important;
            line-height: 2.5rem !important;
          }

          .react-datepicker__day {
            width: 2.5rem !important;
            line-height: 2.5rem !important;
            margin: 2px !important;
            border-radius: 8px !important;
            transition: all 0.2s ease !important;
            font-weight: 500 !important;
            cursor: pointer !important;
          }

          .react-datepicker__day--today-custom {
            background-color: #FEF3C7 !important;
            color: #92400E !important;
            font-weight: 600 !important;
            border: 2px solid #F59E0B !important;
          }

          .react-datepicker__day--weekend {
            color: #EF4444 !important;
            background-color: #FEF2F2 !important;
          }

          .react-datepicker__day--normal:hover {
            background-color: #EBF5FF !important;
            color: #0056B3 !important;
          }

          .react-datepicker__day--selected {
            background-color: #0056B3 !important;
            color: white !important;
            font-weight: 600 !important;
          }

          .react-datepicker__day--selected:hover {
            background-color: #004494 !important;
          }

          .react-datepicker__navigation {
            top: 22px !important;
            width: 0 !important;
            height: 0 !important;
            border: 6px solid transparent !important;
          }

          .react-datepicker__navigation--previous {
            border-right-color: white !important;
            left: 20px !important;
          }

          .react-datepicker__navigation--next {
            border-left-color: white !important;
            right: 20px !important;
          }

          .react-datepicker__triangle {
            display: none !important;
          }
        `
      }} />
      
      <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-auto" style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#0056B3', marginBottom: '8px' }}>
              Edit Patient Entry
            </h1>
            <p style={{ color: '#999999', fontSize: '16px' }}>
              Update patient information with comprehensive details
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            style={{ fontSize: '24px' }}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
            {/* Left Column - Patient Information */}
            <div>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                <div className="flex items-center gap-2 mb-6">
                  <User className="w-5 h-5" style={{ color: '#0056B3' }} />
                  <h2 style={{ fontSize: '24px', color: '#0056B3', fontWeight: '600' }}>Patient Information</h2>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-4 gap-4 mb-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Prefix <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <select
                      value={formData.prefix}
                      onChange={(e) => setFormData({ ...formData, prefix: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        backgroundColor: '#FFFFFF',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                      required
                    >
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Dr">Dr</option>
                      <option value="Prof">Prof</option>
                    </select>
                  </div>
                  <div className="col-span-3">
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Full Name <span style={{ color: '#EF4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.full_name}
                      onChange={(e) => {
                        const fullName = e.target.value;
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
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      placeholder="Enter full name"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                      required
                    />
                  </div>
                </div>

                {/* Personal Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Age
                    </label>
                    <input
                      type="text"
                      value={formData.age}
                      onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      placeholder="e.g., 25, 30 years"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Gender
                    </label>
                    <select
                      value={formData.gender}
                      onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        backgroundColor: '#FFFFFF',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    >
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      placeholder="10-digit phone number"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      placeholder="email@example.com"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                </div>

                {/* Date Fields */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Date of Birth
                    </label>
                    <input
                      type="text"
                      value={formData.date_of_birth}
                      onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      placeholder="DD-MM-YYYY"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Date of Entry
                    </label>
                    <DatePicker
                      selected={formData.date_of_entry}
                      onChange={(date: Date | null) => {
                        if (date) {
                          setFormData({ ...formData, date_of_entry: date });
                        }
                      }}
                      dateFormat="dd-MM-yyyy"
                      maxDate={new Date()}
                      className="w-full"
                      customInput={
                        <input
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CCCCCC',
                            fontSize: '16px',
                            color: '#333333',
                            outline: 'none'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                        />
                      }
                      placeholderText="DD-MM-YYYY"
                      showMonthDropdown
                      showYearDropdown
                      dropdownMode="select"
                    />
                  </div>
                </div>

                {/* Address */}
                <div className="mb-4">
                  <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CCCCCC',
                      fontSize: '16px',
                      color: '#333333',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                    rows={2}
                    placeholder="Complete address"
                    onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                  />
                </div>

                {/* Medical Information */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Blood Group
                    </label>
                    <input
                      type="text"
                      value={formData.blood_group}
                      onChange={(e) => setFormData({ ...formData, blood_group: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      placeholder="e.g., A+, B-, O+"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Patient Tag
                    </label>
                    <input
                      type="text"
                      value={formData.patient_tag}
                      onChange={(e) => setFormData({ ...formData, patient_tag: e.target.value })}
                      list="patient-tags-suggestions"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      placeholder="Enter custom tag (e.g., Jain Community, Corporate Camp)"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
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
                  </div>
                </div>

                {/* Medical History */}
                <div className="space-y-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Medical History
                    </label>
                    <textarea
                      value={formData.medical_history}
                      onChange={(e) => setFormData({ ...formData, medical_history: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none',
                        resize: 'vertical'
                      }}
                      rows={2}
                      placeholder="Previous medical conditions"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Allergies
                    </label>
                    <input
                      type="text"
                      value={formData.allergies}
                      onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      placeholder="Known allergies"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Current Medications
                    </label>
                    <input
                      type="text"
                      value={formData.current_medications}
                      onChange={(e) => setFormData({ ...formData, current_medications: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      placeholder="Current medicines"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                </div>

                {/* Reference Section */}
                <div className="mt-4 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
                  <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                    Has Reference?
                  </label>
                  <div className="flex gap-4 mb-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="reference"
                        value="NO"
                        checked={formData.has_reference === 'NO'}
                        onChange={(e) => setFormData({ ...formData, has_reference: e.target.value })}
                        style={{ accentColor: '#0056B3' }}
                      />
                      <span style={{ fontSize: '14px', color: '#333333' }}>No</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="reference"
                        value="YES"
                        checked={formData.has_reference === 'YES'}
                        onChange={(e) => setFormData({ ...formData, has_reference: e.target.value })}
                        style={{ accentColor: '#0056B3' }}
                      />
                      <span style={{ fontSize: '14px', color: '#333333' }}>Yes</span>
                    </label>
                  </div>
                  {formData.has_reference === 'YES' && (
                    <input
                      type="text"
                      value={formData.reference_details}
                      onChange={(e) => setFormData({ ...formData, reference_details: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      placeholder="Reference details (name, contact, etc.)"
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Right Column - Doctor Assignment & Payment Details */}
            <div className="space-y-6">
              {/* Doctor Assignment */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                <div className="flex items-center gap-2 mb-6">
                  <Stethoscope className="w-5 h-5" style={{ color: '#0056B3' }} />
                  <h2 style={{ fontSize: '24px', color: '#0056B3', fontWeight: '600' }}>Doctor & Department Assignment</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Department
                    </label>
                    <select
                      value={formData.selected_department}
                      onChange={(e) => setFormData({ ...formData, selected_department: e.target.value, selected_doctor: '' })}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        backgroundColor: '#FFFFFF',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    >
                      <option value="">Select Department</option>
                      {DEPARTMENTS.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                      <option value="CUSTOM">Custom Department</option>
                    </select>
                    
                    {/* Custom Department Input */}
                    {formData.selected_department === 'CUSTOM' && (
                      <div style={{ marginTop: '8px' }}>
                        <input
                          value={formData.custom_department_name}
                          onChange={(e) => setFormData({ ...formData, custom_department_name: e.target.value })}
                          placeholder="Enter custom department name"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CCCCCC',
                            fontSize: '16px',
                            color: '#333333',
                            backgroundColor: '#FFFFFF',
                            outline: 'none'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#0056B3'}
                          onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Doctor
                    </label>
                    <select
                      value={formData.selected_doctor}
                      onChange={(e) => setFormData({ ...formData, selected_doctor: e.target.value })}
                      disabled={!formData.selected_department}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        backgroundColor: formData.selected_department ? '#FFFFFF' : '#F5F5F5',
                        outline: 'none',
                        cursor: formData.selected_department ? 'pointer' : 'not-allowed'
                      }}
                      onFocus={(e) => formData.selected_department && (e.currentTarget.style.borderColor = '#0056B3')}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                    >
                      <option value="">Select Doctor</option>
                      {filteredDoctors.map(doc => (
                        <option key={doc.name} value={doc.name}>{doc.name}</option>
                      ))}
                      <option value="CUSTOM">Custom Doctor</option>
                    </select>
                    
                    {/* Custom Doctor Input */}
                    {formData.selected_doctor === 'CUSTOM' && (
                      <div style={{ marginTop: '8px' }}>
                        <input
                          value={formData.custom_doctor_name}
                          onChange={(e) => setFormData({ ...formData, custom_doctor_name: e.target.value })}
                          placeholder="Enter custom doctor name"
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CCCCCC',
                            fontSize: '16px',
                            color: '#333333',
                            backgroundColor: '#FFFFFF',
                            outline: 'none'
                          }}
                          onFocus={(e) => e.target.style.borderColor = '#0056B3'}
                          onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Payment Section - Hidden for frontdesk users */}
              {user?.email !== 'frontdesk@valant.com' && (
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                  <div className="flex items-center gap-2 mb-6">
                    <CreditCard className="w-5 h-5" style={{ color: '#0056B3' }} />
                    <h2 style={{ fontSize: '24px', color: '#0056B3', fontWeight: '600' }}>Payment Details</h2>
                  </div>

                  {/* Existing Payments Selector */}
                  {existingPayments.length > 0 ? (
                    <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#EBF5FF', border: '2px solid #0056B3' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#0056B3', marginBottom: '12px' }}>
                        📋 Select Payment to Edit
                      </h3>
                      <select
                        value={selectedPaymentId || ''}
                        onChange={(e) => {
                          const paymentId = e.target.value;
                          setSelectedPaymentId(paymentId);
                          const selectedPayment = existingPayments.find(p => p.id === paymentId);
                          if (selectedPayment) {
                            setPaymentData({
                              consultation_fee: selectedPayment.amount || 0,
                              discount_percentage: 0,
                              discount_reason: '',
                              payment_mode: selectedPayment.payment_mode || 'CASH',
                              online_payment_method: 'UPI',
                              transaction_type: selectedPayment.transaction_type || 'CONSULTATION',
                              description: selectedPayment.description || ''
                            });
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #0056B3',
                          fontSize: '16px',
                          color: '#333333',
                          backgroundColor: '#FFFFFF',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#004494'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                      >
                        <option value="">Select a payment to edit</option>
                        {existingPayments.map((payment: any) => (
                          <option key={payment.id} value={payment.id}>
                            {payment.transaction_type === 'entry_fee' || payment.transaction_type === 'ENTRY_FEE' ? 'Entry Fee' : 'Consultation'} - 
                            ₹{payment.amount} - 
                            {payment.doctor_name || 'No Doctor'} - 
                            {new Date(payment.created_at).toLocaleDateString()}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="mb-6 p-4 rounded-lg" style={{ backgroundColor: '#FEF3C7', border: '2px solid #F59E0B' }}>
                      <p style={{ color: '#92400E' }}>⚠️ No initial payments found. You can create a new payment below.</p>
                    </div>
                  )}

                  {/* Payment Form */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                          Transaction Type
                        </label>
                        <select
                          value={paymentData.transaction_type}
                          onChange={(e) => setPaymentData({ ...paymentData, transaction_type: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CCCCCC',
                            fontSize: '16px',
                            color: '#333333',
                            backgroundColor: '#FFFFFF',
                            outline: 'none'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
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
                        <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                          Amount (₹) <span style={{ color: '#EF4444' }}>*</span>
                        </label>
                        <input
                          type="number"
                          value={paymentData.consultation_fee}
                          onChange={(e) => setPaymentData({ ...paymentData, consultation_fee: Number(e.target.value) || 0 })}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CCCCCC',
                            fontSize: '16px',
                            color: '#333333',
                            outline: 'none'
                          }}
                          placeholder="Enter amount"
                          min="0"
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                          Discount (%)
                        </label>
                        <input
                          type="number"
                          value={paymentData.discount_percentage}
                          onChange={(e) => setPaymentData({ ...paymentData, discount_percentage: Math.min(100, Math.max(0, Number(e.target.value) || 0)) })}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CCCCCC',
                            fontSize: '16px',
                            color: '#333333',
                            outline: 'none'
                          }}
                          placeholder="0"
                          min="0"
                          max="100"
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                        />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                          Payment Mode
                        </label>
                        <select
                          value={paymentData.payment_mode}
                          onChange={(e) => setPaymentData({ ...paymentData, payment_mode: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CCCCCC',
                            fontSize: '16px',
                            color: '#333333',
                            backgroundColor: '#FFFFFF',
                            outline: 'none'
                          }}
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                        >
                          <option value="CASH">Cash</option>
                          <option value="ONLINE">Online</option>
                        </select>
                      </div>
                      {paymentData.payment_mode === 'ONLINE' && (
                        <div>
                          <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                            Online Method
                          </label>
                          <div className="flex gap-2">
                            <label className="flex items-center gap-1 text-sm cursor-pointer">
                              <input
                                type="radio"
                                name="online_payment_method"
                                value="UPI"
                                checked={paymentData.online_payment_method === 'UPI'}
                                onChange={(e) => setPaymentData({ ...paymentData, online_payment_method: e.target.value })}
                                style={{ accentColor: '#0056B3' }}
                              />
                              UPI
                            </label>
                            <label className="flex items-center gap-1 text-sm cursor-pointer">
                              <input
                                type="radio"
                                name="online_payment_method"
                                value="CARD"
                                checked={paymentData.online_payment_method === 'CARD'}
                                onChange={(e) => setPaymentData({ ...paymentData, online_payment_method: e.target.value })}
                                style={{ accentColor: '#0056B3' }}
                              />
                              Card
                            </label>
                          </div>
                        </div>
                      )}
                    </div>

                    {paymentData.discount_percentage > 0 && (
                      <div>
                        <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                          Discount Reason
                        </label>
                        <input
                          type="text"
                          value={paymentData.discount_reason}
                          onChange={(e) => setPaymentData({ ...paymentData, discount_reason: e.target.value })}
                          style={{
                            width: '100%',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid #CCCCCC',
                            fontSize: '16px',
                            color: '#333333',
                            outline: 'none'
                          }}
                          placeholder="Reason for discount"
                          onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                          onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                        />
                      </div>
                    )}

                    {/* Amount Summary */}
                    {paymentData.consultation_fee > 0 && (
                      <div className="p-3 rounded-lg" style={{ backgroundColor: '#F0FDF4', border: '2px solid #10B981' }}>
                        <div className="text-center">
                          {paymentData.discount_percentage > 0 && (
                            <div style={{ fontSize: '14px', color: '#666666', marginBottom: '4px' }}>
                              Original: ₹{paymentData.consultation_fee.toLocaleString()} - Discount ({paymentData.discount_percentage}%): ₹{(paymentData.consultation_fee * (paymentData.discount_percentage / 100)).toFixed(2)}
                            </div>
                          )}
                          <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#059669' }}>
                            Total Amount: ₹{(paymentData.consultation_fee - (paymentData.consultation_fee * (paymentData.discount_percentage / 100))).toFixed(2)}
                          </span>
                          <div style={{ fontSize: '14px', color: '#666666', marginTop: '4px' }}>
                            Payment: {paymentData.payment_mode === 'ONLINE' ? paymentData.online_payment_method : paymentData.payment_mode}
                          </div>
                        </div>
                      </div>
                    )}

                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                        Description (Optional)
                      </label>
                      <textarea
                        value={paymentData.description}
                        onChange={(e) => setPaymentData({ ...paymentData, description: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CCCCCC',
                          fontSize: '16px',
                          color: '#333333',
                          outline: 'none',
                          resize: 'vertical'
                        }}
                        rows={2}
                        placeholder="Additional notes about this transaction"
                        onFocus={(e) => e.currentTarget.style.borderColor = '#0056B3'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#CCCCCC'}
                      />
                    </div>

                    {/* Update Payment Button */}
                    <button
                      type="button"
                      onClick={handleUpdatePayment}
                      disabled={transactionLoading || (!selectedPaymentId && paymentData.consultation_fee === 0)}
                      style={{
                        width: '100%',
                        padding: '12px',
                        borderRadius: '8px',
                        backgroundColor: transactionLoading || (!selectedPaymentId && paymentData.consultation_fee === 0) ? '#999999' : '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        fontWeight: 'bold',
                        cursor: transactionLoading || (!selectedPaymentId && paymentData.consultation_fee === 0) ? 'not-allowed' : 'pointer',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px'
                      }}
                      onMouseEnter={(e) => !transactionLoading && selectedPaymentId && (e.currentTarget.style.backgroundColor = '#059669')}
                      onMouseLeave={(e) => !transactionLoading && selectedPaymentId && (e.currentTarget.style.backgroundColor = '#10B981')}
                    >
                      {transactionLoading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Updating Payment...
                        </>
                      ) : (
                        selectedPaymentId ? '💳 Update Payment' : '💳 Add Payment'
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="px-6 pb-6">
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    backgroundColor: '#E0E0E0',
                    color: '#333333',
                    border: '1px solid #CCCCCC',
                    fontWeight: '600',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#D0D0D0'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#E0E0E0'}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    padding: '12px 32px',
                    borderRadius: '8px',
                    backgroundColor: loading ? '#999999' : '#0056B3',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                  onMouseEnter={(e) => !loading && (e.currentTarget.style.backgroundColor = '#004494')}
                  onMouseLeave={(e) => !loading && (e.currentTarget.style.backgroundColor = '#0056B3')}
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Updating Patient...
                    </>
                  ) : (
                    'Update Patient'
                  )}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditPatientModal;