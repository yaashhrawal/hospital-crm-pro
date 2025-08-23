import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import dataService from '../services/dataService';
import HospitalService from '../services/hospitalService';
import type { Patient, Doctor, Department } from '../services/dataService';
import type { PatientWithRelations, CreateTransactionData } from '../config/supabaseNew';

// Doctors and Departments data (same as NewFlexiblePatientEntry)
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
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import ReceiptTemplate, { type ReceiptData } from './receipts/ReceiptTemplate';

const visitAgainSchema = z.object({
  selected_doctor: z.string().min(1, 'Please select a doctor'),
  selected_department: z.string().min(1, 'Please select a department'),
  visit_date: z.string().min(1, 'Please select a visit date'),
  consultation_fee: z.number().min(300, 'Consultation fee must be at least ₹300'),
  consultation_payment_mode: z.enum(['cash', 'online', 'card', 'upi', 'insurance']),
  additional_services: z.array(z.object({
    service_name: z.string(),
    service_fee: z.number(),
    payment_mode: z.enum(['cash', 'online', 'card', 'upi', 'insurance']),
  })).optional(),
  visit_notes: z.string().optional(),
  chief_complaint: z.string().optional(),
  admission_required: z.boolean().default(false),
  bed_number: z.string().optional(),
  room_type: z.enum(['general', 'private', 'icu']).optional(),
  daily_rate: z.number().optional(),
});

interface VisitAgainModalProps {
  patient: PatientWithRelations;
  onClose: () => void;
  onVisitCreated?: () => void;
}

interface ServiceItem {
  service_name: string;
  service_fee: number;
  payment_mode: 'cash' | 'online' | 'card' | 'upi' | 'insurance';
}

const VisitAgainModal: React.FC<VisitAgainModalProps> = ({ patient, onClose, onVisitCreated }) => {
  const [filteredDoctors, setFilteredDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [additionalServices, setAdditionalServices] = useState<ServiceItem[]>([]);
  const [showServices, setShowServices] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(visitAgainSchema),
    defaultValues: {
      visit_date: new Date().toISOString().split('T')[0], // Default to today
      consultation_fee: 500,
      consultation_payment_mode: 'cash',
      admission_required: false,
      room_type: 'general',
      daily_rate: 1000,
    },
  });

  const watchedDepartment = watch('selected_department');
  const watchedDoctor = watch('selected_doctor');
  const watchedAdmission = watch('admission_required');
  const watchedVisitDate = watch('visit_date');

  useEffect(() => {
    // Initialize with all doctors
    setFilteredDoctors(DOCTORS_DATA);
  }, []);

  useEffect(() => {
    if (watchedDepartment) {
      const filtered = DOCTORS_DATA.filter(d => d.department === watchedDepartment);
      setFilteredDoctors(filtered);
      
      // Set default consultation fee based on doctor selection
      if (watchedDoctor) {
        // Set a default fee based on department or doctor
        const selectedDoc = DOCTORS_DATA.find(d => d.name === watchedDoctor);
        if (selectedDoc) {
          // Set default consultation fees by department
          const defaultFees: { [key: string]: number } = {
            'ORTHOPAEDIC': 500,
            'GASTRO': 600,
            'GYN.': 500,
            'NEUROLOGY': 800,
            'UROLOGY': 600,
            'SURGICAL ONCOLOGY': 1000,
            'MEDICAL ONCOLOGY': 1000,
            'NEUROSURGERY': 1200,
            'ENDOCRINOLOGY': 700,
            'GENERAL PHYSICIAN': 400,
            'DIETICIAN': 300,
            'PHYSIOTHERAPY': 600
          };
          setValue('consultation_fee', defaultFees[selectedDoc.department] || 500);
        }
      }
    } else {
      setFilteredDoctors(DOCTORS_DATA);
    }
  }, [watchedDepartment, watchedDoctor, setValue]);

  const addService = () => {
    setAdditionalServices([...additionalServices, {
      service_name: '',
      service_fee: 0,
      payment_mode: 'cash'
    }]);
    setShowServices(true);
  };

  const removeService = (index: number) => {
    const newServices = additionalServices.filter((_, i) => i !== index);
    setAdditionalServices(newServices);
    if (newServices.length === 0) {
      setShowServices(false);
    }
  };

  const updateService = (index: number, field: keyof ServiceItem, value: string | number) => {
    const newServices = [...additionalServices];
    newServices[index] = { ...newServices[index], [field]: value };
    setAdditionalServices(newServices);
  };

  const calculateTotalFees = () => {
    const consultationFee = watch('consultation_fee') || 0;
    const dailyRate = watchedAdmission ? (watch('daily_rate') || 0) : 0;
    const servicesFee = additionalServices.reduce((sum, service) => sum + (service.service_fee || 0), 0);
    return consultationFee + dailyRate + servicesFee;
  };

  const generateBedOptions = () => {
    const beds = [];
    for (let i = 1; i <= 50; i++) {
      beds.push(`BED-${i.toString().padStart(3, '0')}`);
    }
    return beds;
  };

  const generateReceipt = (data: any, transactions: any[]) => {
    const selectedDoctor = DOCTORS_DATA.find(d => d.name === data.selected_doctor);
    const visitDate = new Date(data.visit_date);
    const now = new Date();
    const receiptNumber = `RV-${visitDate.getFullYear()}${(visitDate.getMonth() + 1).toString().padStart(2, '0')}${visitDate.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    const charges = [
      {
        description: `Consultation with ${selectedDoctor?.name || 'Unknown'} - Return Visit`,
        amount: data.consultation_fee,
        quantity: 1,
        rate: data.consultation_fee,
      },
      ...additionalServices.filter(s => s.service_name && s.service_fee > 0).map(service => ({
        description: service.service_name,
        amount: service.service_fee,
        quantity: 1,
        rate: service.service_fee,
      })),
    ];

    if (data.admission_required && data.daily_rate) {
      charges.push({
        description: `Admission - ${data.room_type} room, Bed ${data.bed_number} - Return Visit`,
        amount: data.daily_rate,
        quantity: 1,
        rate: data.daily_rate,
      });
    }

    const totalAmount = calculateTotalFees();
    const payments = [
      {
        mode: data.consultation_payment_mode.toUpperCase() as 'CASH' | 'ONLINE',
        amount: data.consultation_fee,
      },
    ];

    // Add service payments
    additionalServices.filter(s => s.service_name && s.service_fee > 0).forEach(service => {
      payments.push({
        mode: service.payment_mode.toUpperCase() as 'CASH' | 'ONLINE',
        amount: service.service_fee,
      });
    });

    if (data.admission_required && data.daily_rate) {
      payments.push({
        mode: data.consultation_payment_mode.toUpperCase() as 'CASH' | 'ONLINE',
        amount: data.daily_rate,
      });
    }

    const receiptData: ReceiptData = {
      type: data.admission_required ? 'ADMISSION' : 'CONSULTATION',
      receiptNumber,
      date: visitDate.toLocaleDateString('en-IN'),
      time: visitDate.toLocaleTimeString('en-IN'),
      hospital: {
        name: 'VALANT Hospital',
        address: 'Near Railway Station, Dahod, Gujarat - 389151',
        phone: '+91 2673 245678',
        email: 'info@valanthospital.com',
        registration: 'REG/2020/GUJ/12345',
        gst: '24ABCDE1234F1Z5',
      },
      patient: {
        id: patient.id.slice(0, 8),
        name: `${patient.first_name} ${patient.last_name}`,
        age: patient.age,
        gender: patient.gender,
        phone: patient.phone,
        address: patient.address,
        bloodGroup: patient.blood_group,
      },
      charges,
      payments,
      totals: {
        subtotal: totalAmount,
        discount: 0,
        insurance: 0,
        netAmount: totalAmount,
        amountPaid: totalAmount,
        balance: 0,
      },
      staff: {
        processedBy: 'System',
        authorizedBy: selectedDoctor?.name,
      },
      notes: data.visit_notes || data.chief_complaint || 'Return visit for existing patient',
      isOriginal: true,
    };

    return receiptData;
  };

  const onSubmit = async (data: any) => {
    setLoading(true);
    try {
      const transactions = [];

      // Create Consultation Fee Transaction
      console.log('Creating consultation transaction:', {
        patient_id: patient.id,
        transaction_type: 'consultation',
        amount: data.consultation_fee,
        payment_mode: data.consultation_payment_mode,
        doctor_id: data.selected_doctor,
        department: data.selected_department,
        description: `Consultation with ${data.selected_doctor} - Return Visit`,
      });
      
      const transactionData: CreateTransactionData = {
        patient_id: patient.id,
        transaction_type: 'CONSULTATION',
        amount: data.consultation_fee,
        payment_mode: data.consultation_payment_mode.toUpperCase() as 'CASH' | 'ONLINE' | 'CARD' | 'UPI' | 'INSURANCE',
        doctor_name: data.selected_doctor,
        department: data.selected_department,
        description: `Consultation with ${data.selected_doctor} - Return Visit`,
        hospital_id: '550e8400-e29b-41d4-a716-446655440000', // Default hospital ID
        created_at: data.visit_date + 'T' + new Date().toTimeString().split(' ')[0] // Use selected date with current time
      } as any;
      
      const consultationTransaction = await HospitalService.createTransaction(transactionData);
      transactions.push(consultationTransaction);

      // Create additional service transactions
      for (const service of additionalServices) {
        if (service.service_name && service.service_fee > 0) {
          const serviceTransactionData: CreateTransactionData = {
            patient_id: patient.id,
            transaction_type: 'SERVICE',
            amount: service.service_fee,
            payment_mode: service.payment_mode.toUpperCase() as 'CASH' | 'ONLINE' | 'CARD' | 'UPI' | 'INSURANCE',
            doctor_name: data.selected_doctor,
            department: data.selected_department,
            description: service.service_name,
            hospital_id: '550e8400-e29b-41d4-a716-446655440000',
            created_at: data.visit_date + 'T' + new Date().toTimeString().split(' ')[0] // Use selected date with current time
          } as any;
          
          const serviceTransaction = await HospitalService.createTransaction(serviceTransactionData);
          transactions.push(serviceTransaction);
        }
      }

      // Handle Admission if required
      if (data.admission_required && data.bed_number && data.room_type && data.daily_rate) {
        await dataService.createAdmission({
          patient_id: patient.id,
          bed_number: data.bed_number,
          room_type: data.room_type,
          department: data.selected_department,
          daily_rate: data.daily_rate,
          admission_date: data.visit_date,
          status: 'active',
          total_amount: data.daily_rate,
        });

        const admissionTransactionData: CreateTransactionData = {
          patient_id: patient.id,
          transaction_type: 'ADMISSION_FEE',
          amount: data.daily_rate,
          payment_mode: data.consultation_payment_mode.toUpperCase() as 'CASH' | 'ONLINE' | 'CARD' | 'UPI' | 'INSURANCE',
          doctor_name: data.selected_doctor,
          department: data.selected_department,
          description: `Admission - ${data.room_type} room, Bed ${data.bed_number} - Return Visit`,
          hospital_id: '550e8400-e29b-41d4-a716-446655440000',
          created_at: data.visit_date + 'T' + new Date().toTimeString().split(' ')[0] // Use selected date with current time
        } as any;
        
        const admissionTransaction = await HospitalService.createTransaction(admissionTransactionData);
        transactions.push(admissionTransaction);
      }

      // Update patient's primary doctor and department if changed
      if (data.selected_doctor && data.selected_department) {
        try {
          console.log('Updating patient primary doctor and department:', {
            patient_id: patient.id,
            new_doctor: data.selected_doctor,
            new_department: data.selected_department,
            current_doctor: patient.primary_doctor,
            current_department: patient.department
          });

          // Update patient's primary doctor and department in the patients table
          await HospitalService.updatePatient(patient.id, {
            primary_doctor: data.selected_doctor,
            department: data.selected_department,
            last_visit_doctor: data.selected_doctor,
            last_visit_department: data.selected_department,
            updated_at: new Date().toISOString()
          });

          toast.success(`Patient's primary doctor updated to ${data.selected_doctor}`);
        } catch (error) {
          console.error('Error updating patient doctor:', error);
          // Don't fail the entire operation if this update fails
          toast.error('Visit recorded but patient doctor update failed');
        }
      }

      // Create patient visit record if table exists
      try {
        await dataService.createPatientVisit({
          patient_id: patient.id,
          visit_date: data.visit_date,
          visit_type: 'return_visit',
          department: data.selected_department,
          doctor_id: data.selected_doctor, // Doctor name
          chief_complaint: data.chief_complaint || '',
          notes: data.visit_notes || '',
          total_amount: calculateTotalFees(),
        });
      } catch (error) {
        console.log('Patient visits table might not exist yet');
      }

      // Generate receipt
      const receipt = generateReceipt(data, transactions);
      setReceiptData(receipt);
      setShowReceipt(true);

      // Enhanced success message
      const doctorChanged = data.selected_doctor !== patient.primary_doctor;
      const visitDate = new Date(data.visit_date).toLocaleDateString('en-IN');
      const successMessage = doctorChanged ? 
        `Visit recorded for ${visitDate} & doctor updated to ${data.selected_doctor}! Total: ₹${calculateTotalFees().toLocaleString()}` :
        `Return visit recorded for ${visitDate}! Total fees: ₹${calculateTotalFees().toLocaleString()}`;
      
      toast.success(successMessage);

      if (onVisitCreated) {
        onVisitCreated();
      }
    } catch (error: any) {
      console.error('Error creating visit:', error);
      toast.error(`Failed to record visit: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (showReceipt && receiptData) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-bold">Visit Receipt Generated</h2>
            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                🖨️ Print Receipt
              </button>
              <button
                onClick={onClose}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
              >
                ✕ Close
              </button>
            </div>
          </div>
          <div className="overflow-y-auto max-h-[calc(95vh-80px)]">
            <ReceiptTemplate data={receiptData} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 bg-blue-50">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                🔄 New Visit - {patient.first_name} {patient.last_name}
              </h2>
              <p className="text-gray-600">Patient ID: {patient.id.slice(0, 8)} • Return Visit</p>
            </div>
            <button
              onClick={onClose}
              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
            >
              ✕ Close
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Patient Info Summary */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Patient Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div><strong>Name:</strong> {patient.first_name} {patient.last_name}</div>
                <div><strong>Phone:</strong> {patient.phone}</div>
                <div><strong>Gender:</strong> {patient.gender}</div>
              </div>
            </div>

            {/* Visit Details */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Visit Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    label="Visit Date *"
                    type="date"
                    {...register('visit_date')}
                    error={errors.visit_date?.message}
                  />
                  <div className="text-xs mt-1">
                    {watchedVisitDate && (() => {
                      const selectedDate = new Date(watchedVisitDate);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      selectedDate.setHours(0, 0, 0, 0);
                      
                      if (selectedDate.getTime() === today.getTime()) {
                        return <span className="text-blue-600">📅 Today's visit</span>;
                      } else if (selectedDate < today) {
                        return <span className="text-orange-600">📋 Recording past visit</span>;
                      } else {
                        return <span className="text-green-600">🗓️ Future appointment</span>;
                      }
                    })()}
                  </div>
                </div>
                <div>
                  <Input
                    label="Chief Complaint"
                    {...register('chief_complaint')}
                    placeholder="Main reason for visit"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Visit Notes</label>
                  <textarea
                    {...register('visit_notes')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    placeholder="Additional notes about this visit"
                  />
                </div>
              </div>
            </div>

            {/* Doctor and Department */}
            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Doctor & Department</h3>
              
              {/* Current Patient Info */}
              {patient.primary_doctor && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-sm font-medium text-blue-800 mb-2">Current Patient Information:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                    <div><strong>Current Doctor:</strong> {patient.primary_doctor || 'Not assigned'}</div>
                    <div><strong>Current Department:</strong> {patient.department || 'Not assigned'}</div>
                  </div>
                  {watchedDoctor && watchedDoctor !== patient.primary_doctor && (
                    <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-sm text-yellow-800">
                      ⚠️ <strong>Doctor Change Detected:</strong> This will update the patient's primary doctor from "{patient.primary_doctor}" to "{watchedDoctor}"
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <select
                    {...register('selected_department')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
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
                      <option key={doctor.name} value={doctor.name}>
                        {doctor.name}
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
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4 text-gray-700">Payment Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Mode *</label>
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

            {/* Additional Services */}
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-700">Additional Services</h3>
                <Button type="button" onClick={addService} variant="outline" size="sm">
                  ➕ Add Service
                </Button>
              </div>
              
              {additionalServices.map((service, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 p-3 bg-white rounded border">
                  <input
                    type="text"
                    placeholder="Service name"
                    value={service.service_name}
                    onChange={(e) => updateService(index, 'service_name', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <input
                    type="number"
                    placeholder="Fee"
                    value={service.service_fee || ''}
                    onChange={(e) => updateService(index, 'service_fee', parseInt(e.target.value) || 0)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={0}
                  />
                  <select
                    value={service.payment_mode}
                    onChange={(e) => updateService(index, 'payment_mode', e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="online">Online</option>
                    <option value="card">Card</option>
                    <option value="upi">UPI</option>
                    <option value="insurance">Insurance</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeService(index)}
                    className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            {/* Admission Section */}
            <div className="bg-orange-50 p-4 rounded-lg">
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
                        let rate = 1000;
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
                <h3 className="text-lg font-semibold text-gray-700">Total Visit Fees</h3>
                <div className="text-2xl font-bold text-indigo-600">
                  ₹{calculateTotalFees().toLocaleString()}
                </div>
              </div>
              <div className="mt-2 text-sm text-gray-600">
                Consultation: ₹{watch('consultation_fee') || 0}
                {additionalServices.length > 0 && ` + Services: ₹${additionalServices.reduce((sum, s) => sum + (s.service_fee || 0), 0)}`}
                {watchedAdmission && ` + Admission: ₹${watch('daily_rate') || 0}`}
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Recording...' : 
                  watchedDoctor && watchedDoctor !== patient.primary_doctor ? 
                    `Update Doctor & Record Visit - ₹${calculateTotalFees().toLocaleString()}` :
                    `Record Visit & Collect ₹${calculateTotalFees().toLocaleString()}`
                }
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default VisitAgainModal;