import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import dataService from '../../services/dataService';
import type { Patient, Doctor, Department } from '../../services/dataService';
import toast from 'react-hot-toast';
import { 
  User, 
  Stethoscope, 
  CreditCard, 
  Bed,
  ChevronRight,
  Check
} from 'lucide-react';

// Validation schema - removed emergency contact fields
const patientEntrySchema = z.object({
  prefix: z.enum(['Mr', 'Mrs', 'Ms', 'Dr', 'Prof']),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['M', 'F', 'OTHER']),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  medical_history: z.string().optional(),
  allergies: z.string().optional(),
  current_medications: z.string().optional(),
  blood_group: z.string().optional(),
  patient_tag: z.string().optional(),
  notes: z.string().optional(),
  // Hospital workflow fields
  selected_doctor: z.string().min(1, 'Please select a doctor'),
  selected_department: z.string().min(1, 'Please select a department'),
  entry_fee: z.number().min(50, 'Entry fee must be at least ₹50').max(500, 'Entry fee cannot exceed ₹500'),
  consultation_fee: z.number().min(300, 'Consultation fee must be at least ₹300'),
  entry_payment_mode: z.enum(['cash', 'online', 'card', 'upi', 'insurance']),
  consultation_payment_mode: z.enum(['cash', 'online', 'card', 'upi', 'insurance']),
  admission_required: z.boolean().default(false),
  // Admission fields (conditional)
  bed_number: z.string().optional(),
  room_type: z.enum(['general', 'private', 'icu']).optional(),
  daily_rate: z.number().optional(),
});

interface PatientEntryFormProps {
  onPatientCreated?: (patient: Patient) => void;
  onClose?: () => void;
}

const PatientEntryForm: React.FC<PatientEntryFormProps> = ({ onPatientCreated, onClose }) => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [patientCreated, setPatientCreated] = useState<Patient | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(patientEntrySchema),
    defaultValues: {
      gender: 'M',
      prefix: 'Mr',
      entry_fee: 100,
      entry_payment_mode: 'cash',
      consultation_payment_mode: 'cash',
      admission_required: false,
      room_type: 'general',
      daily_rate: 1000,
    },
  });

  const watchedDepartment = watch('selected_department');
  const watchedDoctor = watch('selected_doctor');
  const watchedAdmission = watch('admission_required');

  // Load doctors and departments
  useEffect(() => {
    const loadData = async () => {
      try {
        const [doctorsData, departmentsData] = await Promise.all([
          dataService.getDoctors(),
          dataService.getDepartments(),
        ]);
        setDoctors(doctorsData || []);
        setDepartments(departmentsData || []);
      } catch (error) {
        console.error('Error loading data:', error);
        setDoctors([]);
        setDepartments([]);
      }
    };
    loadData();
  }, []);

  // Filter doctors by department
  useEffect(() => {
    if (watchedDepartment) {
      const filtered = doctors.filter(d => d.department === watchedDepartment);
      setFilteredDoctors(filtered);
      
      if (watchedDoctor) {
        const selectedDoc = doctors.find(d => d.id === watchedDoctor);
        if (selectedDoc) {
          setValue('consultation_fee', selectedDoc.fee);
        }
      }
    } else {
      setFilteredDoctors(doctors);
    }
  }, [watchedDepartment, watchedDoctor, doctors, setValue]);

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      // Create Patient with dummy emergency contact info (since it's removed from UI)
      const patientData = {
        prefix: data.prefix,
        first_name: data.first_name,
        last_name: data.last_name,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address,
        emergency_contact_name: data.first_name + ' ' + data.last_name, // Use patient's own name as fallback
        emergency_contact_phone: data.phone, // Use patient's phone as fallback
        medical_history: data.medical_history,
        allergies: data.allergies,
        current_medications: data.current_medications,
        blood_group: data.blood_group,
        patient_tag: data.patient_tag,
        notes: data.notes,
        is_active: true,
      };

      const newPatient = await dataService.createPatient(patientData);
      setPatientCreated(newPatient);

      // Create Entry Fee Transaction
      await dataService.createTransaction({
        patient_id: newPatient.id,
        transaction_type: 'entry_fee',
        amount: data.entry_fee,
        payment_mode: data.entry_payment_mode,
        doctor_id: data.selected_doctor,
        department: data.selected_department,
        description: 'Hospital Entry Fee',
      });

      // Create Consultation Fee Transaction
      await dataService.createTransaction({
        patient_id: newPatient.id,
        transaction_type: 'consultation',
        amount: data.consultation_fee,
        payment_mode: data.consultation_payment_mode,
        doctor_id: data.selected_doctor,
        department: data.selected_department,
        description: `Consultation with Dr. ${doctors.find(d => d.id === data.selected_doctor)?.name}`,
      });

      // Handle Admission if required
      if (data.admission_required && data.bed_number && data.room_type && data.daily_rate) {
        await dataService.createAdmission({
          patient_id: newPatient.id,
          bed_number: data.bed_number,
          room_type: data.room_type,
          department: data.selected_department,
          daily_rate: data.daily_rate,
          admission_date: new Date().toISOString().split('T')[0],
          status: 'active',
          total_amount: data.daily_rate,
        });

        // Create admission fee transaction
        await dataService.createTransaction({
          patient_id: newPatient.id,
          transaction_type: 'admission',
          amount: data.daily_rate,
          payment_mode: data.consultation_payment_mode,
          doctor_id: data.selected_doctor,
          department: data.selected_department,
          description: `Admission - ${data.room_type} room, Bed ${data.bed_number}`,
        });
      }

      toast.success(
        `Patient registered successfully! Total fees: ₹${
          data.entry_fee + data.consultation_fee + (data.admission_required ? data.daily_rate || 0 : 0)
        }`
      );

      if (onPatientCreated) {
        onPatientCreated(newPatient);
      }

      setCurrentStep(2);
    } catch (error) {
      console.error('Error creating patient:', error);
      toast.error('Failed to register patient');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotalFees = () => {
    const entryFee = watch('entry_fee') || 0;
    const consultationFee = watch('consultation_fee') || 0;
    const dailyRate = watchedAdmission ? (watch('daily_rate') || 0) : 0;
    return entryFee + consultationFee + dailyRate;
  };

  const generateBedOptions = () => {
    const beds = [];
    for (let i = 1; i <= 50; i++) {
      beds.push(`BED-${i.toString().padStart(3, '0')}`);
    }
    return beds;
  };

  // Success Screen
  if (currentStep === 2 && patientCreated) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F5F7FA', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
        <div className="max-w-2xl mx-auto p-6">
          <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '48px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: '#E8F5E9', borderRadius: '50%' }}>
                  <Check className="w-10 h-10" style={{ color: '#4CAF50' }} />
                </div>
                <h2 className="text-3xl font-bold mb-2" style={{ color: '#0056B3' }}>Registration Complete!</h2>
                <p style={{ color: '#999999' }}>Patient has been successfully registered</p>
              </div>

              <div style={{ backgroundColor: '#F5F7FA', borderRadius: '8px', padding: '24px', marginBottom: '32px', textAlign: 'left' }}>
                <h3 className="font-semibold mb-4" style={{ color: '#333333', fontSize: '18px' }}>Patient Summary</h3>
                <div className="space-y-2">
                  <p style={{ color: '#333333' }}><strong>Patient ID:</strong> {patientCreated.patient_id}</p>
                  <p style={{ color: '#333333' }}><strong>Name:</strong> {patientCreated.first_name} {patientCreated.last_name}</p>
                  <p style={{ color: '#333333' }}><strong>Department:</strong> {watch('selected_department')}</p>
                  <p style={{ color: '#333333' }}><strong>Doctor:</strong> {doctors.find(d => d.id === watch('selected_doctor'))?.name}</p>
                  <p style={{ color: '#333333' }}><strong>Total Fees Paid:</strong> ₹{calculateTotalFees().toLocaleString()}</p>
                  {watchedAdmission && (
                    <p style={{ color: '#333333' }}><strong>Admission:</strong> {watch('room_type')} room, Bed {watch('bed_number')}</p>
                  )}
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setCurrentStep(1);
                    setPatientCreated(null);
                    reset();
                  }}
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
                  Register Another Patient
                </button>
                <button
                  onClick={onClose}
                  style={{
                    padding: '12px 24px',
                    borderRadius: '8px',
                    backgroundColor: '#0056B3',
                    color: '#FFFFFF',
                    border: 'none',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontSize: '16px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#004494'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#0056B3'}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Main Form
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F7FA', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#0056B3', marginBottom: '8px' }}>
            New Patient Entry
          </h1>
          <p style={{ color: '#999999', fontSize: '16px' }}>
            Complete patient registration and appointment booking
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Patient Information */}
            <div>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                <div className="flex items-center gap-2 mb-6">
                  <User className="w-5 h-5" style={{ color: '#0056B3' }} />
                  <h2 style={{ fontSize: '24px', color: '#0056B3', fontWeight: '600' }}>Patient Information</h2>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Prefix *
                    </label>
                    <select
                      {...register('prefix')}
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
                    >
                      <option value="Mr">Mr</option>
                      <option value="Mrs">Mrs</option>
                      <option value="Ms">Ms</option>
                      <option value="Dr">Dr</option>
                      <option value="Prof">Prof</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      First Name *
                    </label>
                    <input
                      {...register('first_name')}
                      type="text"
                      placeholder="First name"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
                    />
                    {errors.first_name && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.first_name.message}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Last Name *
                    </label>
                    <input
                      {...register('last_name')}
                      type="text"
                      placeholder="Last name"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
                    />
                    {errors.last_name && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.last_name.message}</p>}
                  </div>
                </div>

                {/* Personal Details */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Date of Birth *
                    </label>
                    <input
                      {...register('date_of_birth')}
                      type="date"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
                    />
                    {errors.date_of_birth && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.date_of_birth.message}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Gender *
                    </label>
                    <select
                      {...register('gender')}
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
                    >
                      <option value="M">Male</option>
                      <option value="F">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Phone Number *
                    </label>
                    <input
                      {...register('phone')}
                      type="tel"
                      placeholder="10-digit phone number"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
                    />
                    {errors.phone && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.phone.message}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Email (Optional)
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="email@example.com"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
                    />
                    {errors.email && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.email.message}</p>}
                  </div>
                </div>

                {/* Address */}
                <div className="mb-4">
                  <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                    Address *
                  </label>
                  <input
                    {...register('address')}
                    type="text"
                    placeholder="Complete address"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: '1px solid #CCCCCC',
                      fontSize: '16px',
                      color: '#333333',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#0056B3'}
                    onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
                  />
                  {errors.address && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.address.message}</p>}
                </div>

                {/* Medical Information */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Blood Group
                    </label>
                    <input
                      {...register('blood_group')}
                      type="text"
                      placeholder="e.g., A+, B-, O+"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Patient Tag
                    </label>
                    <input
                      {...register('patient_tag')}
                      type="text"
                      placeholder="e.g., VIP, Insurance, Camp"
                      list="patient-tags-list"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
                    />
                    <datalist id="patient-tags-list">
                      <option value="Jain Community" />
                      <option value="Corporate Camp" />
                      <option value="Medical Camp" />
                      <option value="Senior Citizen" />
                      <option value="Insurance" />
                      <option value="VIP" />
                    </datalist>
                  </div>
                </div>

                {/* Medical History Fields */}
                <div className="space-y-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Medical History
                    </label>
                    <textarea
                      {...register('medical_history')}
                      placeholder="Previous medical conditions"
                      rows={2}
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
                      onFocus={(e) => e.target.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Allergies
                    </label>
                    <input
                      {...register('allergies')}
                      type="text"
                      placeholder="Known allergies"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Current Medications
                    </label>
                    <input
                      {...register('current_medications')}
                      type="text"
                      placeholder="Current medicines"
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Doctor, Payment, and Admission */}
            <div className="space-y-6">
              {/* Doctor & Department Assignment */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                <div className="flex items-center gap-2 mb-6">
                  <Stethoscope className="w-5 h-5" style={{ color: '#0056B3' }} />
                  <h2 style={{ fontSize: '24px', color: '#0056B3', fontWeight: '600' }}>Doctor & Department Assignment</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Department *
                    </label>
                    <select
                      {...register('selected_department')}
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
                    >
                      <option value="">Select Department</option>
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.name}>
                          {dept.name}
                        </option>
                      ))}
                    </select>
                    {errors.selected_department && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.selected_department.message}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Doctor *
                    </label>
                    <select
                      {...register('selected_doctor')}
                      disabled={!watchedDepartment}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        backgroundColor: watchedDepartment ? '#FFFFFF' : '#F5F5F5',
                        outline: 'none',
                        cursor: watchedDepartment ? 'pointer' : 'not-allowed'
                      }}
                      onFocus={(e) => watchedDepartment && (e.target.style.borderColor = '#0056B3')}
                      onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
                    >
                      <option value="">Select Doctor</option>
                      {filteredDoctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          {doctor.name} - {doctor.specialization} (₹{doctor.fee})
                        </option>
                      ))}
                    </select>
                    {errors.selected_doctor && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.selected_doctor.message}</p>}
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                <div className="flex items-center gap-2 mb-6">
                  <CreditCard className="w-5 h-5" style={{ color: '#0056B3' }} />
                  <h2 style={{ fontSize: '24px', color: '#0056B3', fontWeight: '600' }}>Payment Details</h2>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Entry Fee (₹) *
                    </label>
                    <input
                      {...register('entry_fee', { valueAsNumber: true })}
                      type="number"
                      placeholder="50-500"
                      min={50}
                      max={500}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
                    />
                    {errors.entry_fee && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.entry_fee.message}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Entry Payment Mode *
                    </label>
                    <select
                      {...register('entry_payment_mode')}
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
                    >
                      <option value="cash">Cash</option>
                      <option value="online">Online</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="insurance">Insurance</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Consultation Fee (₹) *
                    </label>
                    <input
                      {...register('consultation_fee', { valueAsNumber: true })}
                      type="number"
                      placeholder="300-2000"
                      min={300}
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: '1px solid #CCCCCC',
                        fontSize: '16px',
                        color: '#333333',
                        outline: 'none'
                      }}
                      onFocus={(e) => e.target.style.borderColor = '#0056B3'}
                      onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
                    />
                    {errors.consultation_fee && <p style={{ color: '#EF4444', fontSize: '12px', marginTop: '4px' }}>{errors.consultation_fee.message}</p>}
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                      Consultation Payment Mode *
                    </label>
                    <select
                      {...register('consultation_payment_mode')}
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
                    >
                      <option value="cash">Cash</option>
                      <option value="online">Online</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="insurance">Insurance</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Appointment Management / Admission */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                <div className="flex items-center gap-2 mb-6">
                  <Bed className="w-5 h-5" style={{ color: '#0056B3' }} />
                  <h2 style={{ fontSize: '24px', color: '#0056B3', fontWeight: '600' }}>Appointment Management</h2>
                </div>

                <div className="mb-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      {...register('admission_required')}
                      className="w-5 h-5"
                      style={{ accentColor: '#0056B3' }}
                    />
                    <span style={{ fontSize: '14px', color: '#333333', fontWeight: '500' }}>
                      Patient requires admission (Inpatient)
                    </span>
                  </label>
                </div>

                {watchedAdmission && (
                  <div className="grid grid-cols-1 gap-4 mt-4 pt-4" style={{ borderTop: '1px solid #E5E7EB' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                        Bed Number *
                      </label>
                      <select
                        {...register('bed_number')}
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
                      >
                        <option value="">Select Bed</option>
                        {generateBedOptions().map((bed) => (
                          <option key={bed} value={bed}>
                            {bed}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                        Room Type *
                      </label>
                      <select
                        {...register('room_type')}
                        onChange={(e) => {
                          const roomType = e.target.value;
                          let rate = 1000;
                          if (roomType === 'private') rate = 2500;
                          if (roomType === 'icu') rate = 5000;
                          setValue('daily_rate', rate);
                        }}
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
                      >
                        <option value="general">General Ward (₹1,000/day)</option>
                        <option value="private">Private Room (₹2,500/day)</option>
                        <option value="icu">ICU (₹5,000/day)</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                        Daily Rate (₹) *
                      </label>
                      <input
                        {...register('daily_rate', { valueAsNumber: true })}
                        type="number"
                        placeholder="Daily charges"
                        min={500}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          borderRadius: '8px',
                          border: '1px solid #CCCCCC',
                          fontSize: '16px',
                          color: '#333333',
                          outline: 'none'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#0056B3'}
                        onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
                <label style={{ display: 'block', fontSize: '14px', color: '#333333', marginBottom: '6px', fontWeight: '500' }}>
                  Additional Notes
                </label>
                <textarea
                  {...register('notes')}
                  rows={3}
                  placeholder="Any additional notes about the patient or treatment"
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
                  onFocus={(e) => e.target.style.borderColor = '#0056B3'}
                  onBlur={(e) => e.target.style.borderColor = '#CCCCCC'}
                />
              </div>
            </div>
          </div>

          {/* Total Summary and Actions */}
          <div className="mt-6" style={{ backgroundColor: '#FFFFFF', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)' }}>
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#333333', marginBottom: '4px' }}>
                  Total Fees Summary
                </h3>
                <p style={{ fontSize: '14px', color: '#999999' }}>
                  Entry: ₹{watch('entry_fee') || 0} + Consultation: ₹{watch('consultation_fee') || 0}
                  {watchedAdmission && ` + Admission: ₹${watch('daily_rate') || 0}`}
                </p>
              </div>
              <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#0056B3' }}>
                ₹{calculateTotalFees().toLocaleString()}
              </div>
            </div>

            <div className="flex justify-end gap-4">
              {onClose && (
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
              )}
              <button
                type="button"
                onClick={() => reset()}
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
                Reset
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
                {loading ? 'Registering...' : 'Save Patient'}
                {!loading && <ChevronRight className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PatientEntryForm;