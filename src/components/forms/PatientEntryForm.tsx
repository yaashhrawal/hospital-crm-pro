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

// Validation schema
const patientEntrySchema = z.object({
  prefix: z.enum(['Mr', 'Mrs', 'Ms', 'Dr', 'Prof']),
  first_name: z.string().min(2, 'First name must be at least 2 characters'),
  last_name: z.string().min(2, 'Last name must be at least 2 characters'),
  date_of_birth: z.string().min(1, 'Date of birth is required'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  emergency_contact_name: z.string().min(2, 'Emergency contact name is required'),
  emergency_contact_phone: z.string().min(10, 'Emergency contact phone is required'),
  medical_history: z.string().optional(),
  allergies: z.string().optional(),
  current_medications: z.string().optional(),
  blood_group: z.string().optional(),
  notes: z.string().optional(),
  // New hospital workflow fields
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

// type PatientEntryFormData = z.infer<typeof patientEntrySchema>;

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
    formState: { errors },
  } = useForm({
    resolver: zodResolver(patientEntrySchema),
    defaultValues: {
      gender: 'MALE',
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
        setDoctors(doctorsData);
        setDepartments(departmentsData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load doctors and departments');
      }
    };
    loadData();
  }, []);

  // Filter doctors by department
  useEffect(() => {
    if (watchedDepartment) {
      const filtered = doctors.filter(d => d.department === watchedDepartment);
      setFilteredDoctors(filtered);
      
      // Auto-set consultation fee based on selected doctor
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
      // Step 1: Create Patient
      const patientData = {
        prefix: data.prefix,
        first_name: data.first_name,
        last_name: data.last_name,
        date_of_birth: data.date_of_birth,
        gender: data.gender,
        phone: data.phone,
        email: data.email || undefined,
        address: data.address,
        emergency_contact_name: data.emergency_contact_name,
        emergency_contact_phone: data.emergency_contact_phone,
        medical_history: data.medical_history,
        allergies: data.allergies,
        current_medications: data.current_medications,
        blood_group: data.blood_group,
        notes: data.notes,
        is_active: true,
      };

      const newPatient = await dataService.createPatient(patientData);
      setPatientCreated(newPatient);

      // Step 2: Create Entry Fee Transaction
      await dataService.createTransaction({
        patient_id: newPatient.id,
        transaction_type: 'entry_fee',
        amount: data.entry_fee,
        payment_mode: data.entry_payment_mode,
        doctor_id: data.selected_doctor,
        department: data.selected_department,
        description: 'Hospital Entry Fee',
      });

      // Step 3: Create Consultation Fee Transaction
      await dataService.createTransaction({
        patient_id: newPatient.id,
        transaction_type: 'consultation',
        amount: data.consultation_fee,
        payment_mode: data.consultation_payment_mode,
        doctor_id: data.selected_doctor,
        department: data.selected_department,
        description: `Consultation with Dr. ${doctors.find(d => d.id === data.selected_doctor)?.name}`,
      });

      // Step 4: Handle Admission if required
      if (data.admission_required && data.bed_number && data.room_type && data.daily_rate) {
        await dataService.createAdmission({
          patient_id: newPatient.id,
          bed_number: data.bed_number,
          room_type: data.room_type,
          department: data.selected_department,
          daily_rate: data.daily_rate,
          admission_date: new Date().toISOString().split('T')[0],
          status: 'active',
          total_amount: data.daily_rate, // Initial amount, will be calculated daily
        });

        // Create admission fee transaction
        await dataService.createTransaction({
          patient_id: newPatient.id,
          transaction_type: 'admission',
          amount: data.daily_rate,
          payment_mode: data.consultation_payment_mode, // Use same payment mode
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

      setCurrentStep(2); // Move to summary step
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

  if (currentStep === 2 && patientCreated) {
    return (
      <Card className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-green-600">Patient Registration Complete!</h2>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
            <h3 className="font-semibold mb-2">Patient Summary:</h3>
            <p><strong>Patient ID:</strong> {patientCreated.patient_id}</p>
            <p><strong>Name:</strong> {patientCreated.first_name} {patientCreated.last_name}</p>
            <p><strong>Department:</strong> {watch('selected_department')}</p>
            <p><strong>Doctor:</strong> {doctors.find(d => d.id === watch('selected_doctor'))?.name}</p>
            <p><strong>Total Fees Paid:</strong> ₹{calculateTotalFees()}</p>
            {watchedAdmission && (
              <p><strong>Admission:</strong> {watch('room_type')} room, Bed {watch('bed_number')}</p>
            )}
          </div>

          <div className="flex gap-4 justify-center">
            <Button
              onClick={() => {
                setCurrentStep(1);
                setPatientCreated(null);
                window.location.reload(); // Reset form
              }}
              variant="outline"
            >
              Register Another Patient
            </Button>
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-4xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Patient Registration & Entry</h2>
        <p className="text-gray-600">Complete patient journey from entry to payment tracking</p>
        
        {/* Service Status Indicator */}
        <div className="mt-4 p-2 bg-blue-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${dataService.getServiceStatus().isOnline ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
            <span className="text-sm text-gray-600">
              Running on {dataService.getServiceStatus().service} 
              {!dataService.getServiceStatus().isOnline && ' (Offline Mode)'}
            </span>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Patient Basic Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Patient Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Prefix *</label>
              <select
                {...register('prefix')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Mr">Mr</option>
                <option value="Mrs">Mrs</option>
                <option value="Ms">Ms</option>
                <option value="Dr">Dr</option>
                <option value="Prof">Prof</option>
              </select>
              {errors.prefix && <p className="text-red-500 text-xs mt-1">{errors.prefix.message}</p>}
            </div>
            <div>
              <Input
                label="First Name *"
                {...register('first_name')}
                error={errors.first_name?.message}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <Input
                label="Last Name *"
                {...register('last_name')}
                error={errors.last_name?.message}
                placeholder="Enter last name"
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <Input
                label="Date of Birth *"
                type="date"
                {...register('date_of_birth')}
                error={errors.date_of_birth?.message}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
              <select
                {...register('gender')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="MALE">Male</option>
                <option value="FEMALE">Female</option>
                <option value="OTHER">Other</option>
              </select>
            </div>
            <div>
              <Input
                label="Phone Number *"
                {...register('phone')}
                error={errors.phone?.message}
                placeholder="10-digit phone number"
              />
            </div>
            <div>
              <Input
                label="Email (Optional)"
                type="email"
                {...register('email')}
                error={errors.email?.message}
                placeholder="email@example.com"
              />
            </div>
            <div className="md:col-span-2">
              <Input
                label="Address *"
                {...register('address')}
                error={errors.address?.message}
                placeholder="Complete address"
              />
            </div>
            <div>
              <Input
                label="Emergency Contact Name *"
                {...register('emergency_contact_name')}
                error={errors.emergency_contact_name?.message}
                placeholder="Emergency contact person"
              />
            </div>
            <div>
              <Input
                label="Emergency Contact Phone *"
                {...register('emergency_contact_phone')}
                error={errors.emergency_contact_phone?.message}
                placeholder="Emergency contact number"
              />
            </div>
            <div>
              <Input
                label="Blood Group"
                {...register('blood_group')}
                placeholder="e.g., A+, B-, O+"
              />
            </div>
            <div>
              <Input
                label="Medical History"
                {...register('medical_history')}
                placeholder="Previous medical conditions"
              />
            </div>
            <div>
              <Input
                label="Allergies"
                {...register('allergies')}
                placeholder="Known allergies"
              />
            </div>
            <div>
              <Input
                label="Current Medications"
                {...register('current_medications')}
                placeholder="Current medicines"
              />
            </div>
          </div>
        </div>

        {/* Doctor and Department Assignment */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Doctor & Department Assignment</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select
                {...register('selected_department')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.name}>
                    {dept.name}
                  </option>
                ))}
              </select>
              {errors.selected_department && (
                <p className="text-red-600 text-sm mt-1">{errors.selected_department.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
              <select
                {...register('selected_doctor')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={!watchedDepartment}
              >
                <option value="">Select Doctor</option>
                {filteredDoctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.name} - {doctor.specialization} (₹{doctor.fee})
                  </option>
                ))}
              </select>
              {errors.selected_doctor && (
                <p className="text-red-600 text-sm mt-1">{errors.selected_doctor.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Payment Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Input
                label="Entry Fee (₹) *"
                type="number"
                {...register('entry_fee', { valueAsNumber: true })}
                error={errors.entry_fee?.message}
                placeholder="50-500"
                min={50}
                max={500}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Entry Payment Mode *</label>
              <select
                {...register('entry_payment_mode')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="cash">Cash</option>
                <option value="online">Online</option>
                <option value="card">Card</option>
                <option value="upi">UPI</option>
                <option value="insurance">Insurance</option>
              </select>
            </div>
            <div>
              <Input
                label="Consultation Fee (₹) *"
                type="number"
                {...register('consultation_fee', { valueAsNumber: true })}
                error={errors.consultation_fee?.message}
                placeholder="300-2000"
                min={300}
                max={2000}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Consultation Payment Mode *</label>
              <select
                {...register('consultation_payment_mode')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* Admission Section */}
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-gray-700">Admission Details</h3>
          <div className="mb-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('admission_required')}
                className="w-4 h-4 text-blue-600"
              />
              <span className="text-sm font-medium text-gray-700">Patient requires admission (Inpatient)</span>
            </label>
          </div>

          {watchedAdmission && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bed Number *</label>
                <select
                  {...register('bed_number')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Room Type *</label>
                <select
                  {...register('room_type')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    const roomType = e.target.value;
                    let rate = 1000; // default
                    if (roomType === 'private') rate = 2500;
                    if (roomType === 'icu') rate = 5000;
                    setValue('daily_rate', rate);
                  }}
                >
                  <option value="general">General Ward (₹1,000/day)</option>
                  <option value="private">Private Room (₹2,500/day)</option>
                  <option value="icu">ICU (₹5,000/day)</option>
                </select>
              </div>
              <div>
                <Input
                  label="Daily Rate (₹) *"
                  type="number"
                  {...register('daily_rate', { valueAsNumber: true })}
                  error={errors.daily_rate?.message}
                  placeholder="Daily charges"
                  min={500}
                />
              </div>
            </div>
          )}
        </div>

        {/* Total Summary */}
        <div className="bg-indigo-50 p-4 rounded-lg">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-700">Total Fees Summary</h3>
            <div className="text-2xl font-bold text-indigo-600">
              ₹{calculateTotalFees().toLocaleString()}
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Entry: ₹{watch('entry_fee') || 0} + Consultation: ₹{watch('consultation_fee') || 0}
            {watchedAdmission && ` + Admission: ₹${watch('daily_rate') || 0}`}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
          <textarea
            {...register('notes')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            placeholder="Any additional notes about the patient or treatment"
          ></textarea>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
          {onClose && (
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
          )}
          <Button type="submit" disabled={loading}>
            {loading ? 'Registering...' : `Register Patient & Collect ₹${calculateTotalFees()}`}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default PatientEntryForm;