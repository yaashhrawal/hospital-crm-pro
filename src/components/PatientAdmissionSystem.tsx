import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import dataService from '../services/dataService';
import type { Patient } from '../types/index';

// Admission form validation schema
const admissionSchema = z.object({
  patient_id: z.string().min(1, 'Patient selection is required'),
  admission_type: z.enum(['emergency', 'planned', 'transfer', 'observation']),
  ward_type: z.enum(['general', 'private', 'semi_private', 'icu', 'emergency']),
  bed_number: z.string().min(1, 'Bed number is required'),
  admission_date: z.string().min(1, 'Admission date is required'),
  admission_time: z.string().min(1, 'Admission time is required'),
  estimated_days: z.number().min(1, 'Estimated days must be at least 1').max(365, 'Cannot exceed 365 days'),
  admission_charges: z.number().min(0, 'Admission charges cannot be negative'),
  daily_room_charges: z.number().min(0, 'Daily room charges cannot be negative'),
  doctor_id: z.string().optional(),
  department: z.string().min(1, 'Department is required'),
  reason_for_admission: z.string().min(5, 'Reason must be at least 5 characters'),
  medical_history: z.string().optional(),
  current_medications: z.string().optional(),
  allergies: z.string().optional(),
  emergency_contact_name: z.string().min(1, 'Emergency contact name is required'),
  emergency_contact_phone: z.string().min(10, 'Valid emergency contact phone is required'),
  insurance_details: z.string().optional(),
  special_requirements: z.string().optional(),
});

type AdmissionFormData = z.infer<typeof admissionSchema>;

interface Admission {
  id: string;
  patient_id: string;
  patient_name: string;
  admission_type: string;
  ward_type: string;
  bed_number: string;
  admission_date: string;
  admission_time: string;
  estimated_days: number;
  admission_charges: number;
  daily_room_charges: number;
  doctor_id?: string;
  doctor_name?: string;
  department: string;
  reason_for_admission: string;
  status: 'admitted' | 'discharged' | 'transferred';
  total_charges: number;
  created_at: string;
}

interface Bed {
  id: string;
  bed_number: string;
  ward_type: string;
  floor: number;
  is_occupied: boolean;
  patient_id?: string;
  daily_charges: number;
}

const PatientAdmissionSystem: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [admissions, setAdmissions] = useState<Admission[]>([]);
  const [availableBeds, setAvailableBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewAdmission, setShowNewAdmission] = useState(false);
  const [selectedWardType, setSelectedWardType] = useState<string>('');

  const { register, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm<AdmissionFormData>({
    resolver: zodResolver(admissionSchema),
    defaultValues: {
      admission_date: new Date().toISOString().split('T')[0],
      admission_time: new Date().toTimeString().slice(0, 5),
      estimated_days: 1,
      admission_charges: 1000,
      daily_room_charges: 500,
    }
  });

  const watchedPatientId = watch('patient_id');
  const watchedWardType = watch('ward_type');
  const watchedEstimatedDays = watch('estimated_days');
  const watchedAdmissionCharges = watch('admission_charges');
  const watchedDailyCharges = watch('daily_room_charges');

  useEffect(() => {
    loadData();
    initializeMockBeds();
    loadMockAdmissions();
  }, []);

  useEffect(() => {
    if (watchedWardType) {
      setSelectedWardType(watchedWardType);
      updateBedList(watchedWardType);
      updateDailyCharges(watchedWardType);
    }
  }, [watchedWardType]);

  const loadData = async () => {
    try {
      const [patientsData, doctorsData, departmentsData] = await Promise.all([
        dataService.getPatients(),
        dataService.getDoctors(),
        dataService.getDepartments(),
      ]);
      
      setPatients(patientsData);
      setDoctors(doctorsData);
      setDepartments(departmentsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    }
  };

  const initializeMockBeds = () => {
    const mockBeds: Bed[] = [
      // General Ward
      { id: '1', bed_number: 'G-101', ward_type: 'general', floor: 1, is_occupied: false, daily_charges: 500 },
      { id: '2', bed_number: 'G-102', ward_type: 'general', floor: 1, is_occupied: true, patient_id: 'patient1', daily_charges: 500 },
      { id: '3', bed_number: 'G-103', ward_type: 'general', floor: 1, is_occupied: false, daily_charges: 500 },
      { id: '4', bed_number: 'G-201', ward_type: 'general', floor: 2, is_occupied: false, daily_charges: 500 },
      
      // Private Rooms
      { id: '5', bed_number: 'P-301', ward_type: 'private', floor: 3, is_occupied: false, daily_charges: 1500 },
      { id: '6', bed_number: 'P-302', ward_type: 'private', floor: 3, is_occupied: false, daily_charges: 1500 },
      { id: '7', bed_number: 'P-303', ward_type: 'private', floor: 3, is_occupied: true, patient_id: 'patient2', daily_charges: 1500 },
      
      // Semi-Private
      { id: '8', bed_number: 'SP-201', ward_type: 'semi_private', floor: 2, is_occupied: false, daily_charges: 1000 },
      { id: '9', bed_number: 'SP-202', ward_type: 'semi_private', floor: 2, is_occupied: false, daily_charges: 1000 },
      
      // ICU
      { id: '10', bed_number: 'ICU-01', ward_type: 'icu', floor: 4, is_occupied: false, daily_charges: 3000 },
      { id: '11', bed_number: 'ICU-02', ward_type: 'icu', floor: 4, is_occupied: true, patient_id: 'patient3', daily_charges: 3000 },
      { id: '12', bed_number: 'ICU-03', ward_type: 'icu', floor: 4, is_occupied: false, daily_charges: 3000 },
      
      // Emergency
      { id: '13', bed_number: 'ER-01', ward_type: 'emergency', floor: 1, is_occupied: false, daily_charges: 2000 },
      { id: '14', bed_number: 'ER-02', ward_type: 'emergency', floor: 1, is_occupied: false, daily_charges: 2000 },
    ];
    
    setAvailableBeds(mockBeds);
  };

  const loadMockAdmissions = () => {
    const mockAdmissions: Admission[] = [
      {
        id: '1',
        patient_id: 'patient1',
        patient_name: 'John Doe',
        admission_type: 'emergency',
        ward_type: 'general',
        bed_number: 'G-102',
        admission_date: '2025-01-20',
        admission_time: '14:30',
        estimated_days: 3,
        admission_charges: 1000,
        daily_room_charges: 500,
        doctor_id: 'doctor1',
        doctor_name: 'Dr. Smith',
        department: 'Emergency',
        reason_for_admission: 'Chest pain and breathing difficulty',
        status: 'admitted',
        total_charges: 2500,
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        patient_id: 'patient2',
        patient_name: 'Jane Smith',
        admission_type: 'planned',
        ward_type: 'private',
        bed_number: 'P-303',
        admission_date: '2025-01-19',
        admission_time: '09:00',
        estimated_days: 5,
        admission_charges: 2000,
        daily_room_charges: 1500,
        doctor_id: 'doctor2',
        doctor_name: 'Dr. Johnson',
        department: 'Surgery',
        reason_for_admission: 'Scheduled surgery - knee replacement',
        status: 'admitted',
        total_charges: 9500,
        created_at: new Date().toISOString(),
      },
    ];
    
    setAdmissions(mockAdmissions);
  };

  const updateBedList = (wardType: string) => {
    // This would filter available beds by ward type
    // For now, just showing all beds
  };

  const updateDailyCharges = (wardType: string) => {
    const chargeMap: Record<string, number> = {
      general: 500,
      semi_private: 1000,
      private: 1500,
      icu: 3000,
      emergency: 2000,
    };
    
    const dailyCharge = chargeMap[wardType] || 500;
    setValue('daily_room_charges', dailyCharge);
  };

  const onSubmit = async (data: AdmissionFormData) => {
    try {
      setLoading(true);
      
      const selectedPatient = patients.find(p => p.id === data.patient_id);
      const selectedDoctor = doctors.find(d => d.id === data.doctor_id);
      
      const totalCharges = data.admission_charges + (data.daily_room_charges * data.estimated_days);
      
      const newAdmission: Admission = {
        id: Date.now().toString(),
        patient_id: data.patient_id,
        patient_name: `${selectedPatient?.first_name} ${selectedPatient?.last_name}`,
        admission_type: data.admission_type,
        ward_type: data.ward_type,
        bed_number: data.bed_number,
        admission_date: data.admission_date,
        admission_time: data.admission_time,
        estimated_days: data.estimated_days,
        admission_charges: data.admission_charges,
        daily_room_charges: data.daily_room_charges,
        doctor_id: data.doctor_id,
        doctor_name: selectedDoctor?.name,
        department: data.department,
        reason_for_admission: data.reason_for_admission,
        status: 'admitted',
        total_charges: totalCharges,
        created_at: new Date().toISOString(),
      };

      // In real implementation, save to Supabase
      setAdmissions(prev => [...prev, newAdmission]);
      
      // Mark bed as occupied
      setAvailableBeds(prev => 
        prev.map(bed => 
          bed.bed_number === data.bed_number 
            ? { ...bed, is_occupied: true, patient_id: data.patient_id }
            : bed
        )
      );

      // Create admission transaction
      await dataService.createTransaction({
        patient_id: data.patient_id,
        transaction_type: 'admission',
        amount: data.admission_charges,
        payment_mode: 'cash',
        doctor_id: data.doctor_id,
        department: data.department,
        description: `Hospital Admission - ${data.ward_type} ward, Bed ${data.bed_number}`,
      });

      toast.success(`Patient admitted successfully to bed ${data.bed_number}! Total charges: ₹${totalCharges.toLocaleString()}`);
      setShowNewAdmission(false);
      reset();
    } catch (error) {
      console.error('Error creating admission:', error);
      toast.error('Failed to admit patient');
    } finally {
      setLoading(false);
    }
  };

  const dischargePatient = (admissionId: string) => {
    setAdmissions(prev =>
      prev.map(admission =>
        admission.id === admissionId
          ? { ...admission, status: 'discharged' }
          : admission
      )
    );
    
    const admission = admissions.find(a => a.id === admissionId);
    if (admission) {
      // Free up the bed
      setAvailableBeds(prev =>
        prev.map(bed =>
          bed.bed_number === admission.bed_number
            ? { ...bed, is_occupied: false, patient_id: undefined }
            : bed
        )
      );
      toast.success(`Patient discharged from bed ${admission.bed_number}`);
    }
  };

  const getWardTypeIcon = (wardType: string) => {
    switch (wardType) {
      case 'general': return '🏥';
      case 'private': return '🛏️';
      case 'semi_private': return '🏨';
      case 'icu': return '🚨';
      case 'emergency': return '⚡';
      default: return '🏥';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'admitted': return 'bg-green-100 text-green-800';
      case 'discharged': return 'bg-gray-100 text-gray-800';
      case 'transferred': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const availableBedsForWard = availableBeds.filter(bed => 
    !selectedWardType || bed.ward_type === selectedWardType
  ).filter(bed => !bed.is_occupied);

  const totalEstimatedCharges = watchedAdmissionCharges + (watchedDailyCharges * watchedEstimatedDays);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">🏥 Patient Admission System</h2>
            <button
              onClick={() => setShowNewAdmission(!showNewAdmission)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              ➕ New Admission
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{admissions.filter(a => a.status === 'admitted').length}</div>
              <div className="text-sm text-gray-600">Current Patients</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{availableBeds.filter(b => !b.is_occupied).length}</div>
              <div className="text-sm text-gray-600">Available Beds</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                ₹{admissions.reduce((sum, a) => sum + a.total_charges, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Revenue</div>
            </div>
            <div className="bg-orange-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{availableBeds.length}</div>
              <div className="text-sm text-gray-600">Total Beds</div>
            </div>
          </div>
        </div>

        {/* New Admission Form */}
        {showNewAdmission && (
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold mb-4">New Patient Admission</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Patient Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient *</label>
                  <select
                    {...register('patient_id')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Patient</option>
                    {patients.map(patient => (
                      <option key={patient.id} value={patient.id}>
                        {patient.first_name} {patient.last_name} - {patient.phone}
                      </option>
                    ))}
                  </select>
                  {errors.patient_id && <p className="text-red-500 text-sm">{errors.patient_id.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admission Type *</label>
                  <select
                    {...register('admission_type')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="emergency">🚨 Emergency</option>
                    <option value="planned">📅 Planned</option>
                    <option value="transfer">🔄 Transfer</option>
                    <option value="observation">👀 Observation</option>
                  </select>
                  {errors.admission_type && <p className="text-red-500 text-sm">{errors.admission_type.message}</p>}
                </div>
              </div>

              {/* Ward and Bed Selection */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ward Type *</label>
                  <select
                    {...register('ward_type')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Ward Type</option>
                    <option value="general">🏥 General Ward - ₹500/day</option>
                    <option value="semi_private">🏨 Semi-Private - ₹1,000/day</option>
                    <option value="private">🛏️ Private Room - ₹1,500/day</option>
                    <option value="icu">🚨 ICU - ₹3,000/day</option>
                    <option value="emergency">⚡ Emergency - ₹2,000/day</option>
                  </select>
                  {errors.ward_type && <p className="text-red-500 text-sm">{errors.ward_type.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bed Number *</label>
                  <select
                    {...register('bed_number')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={!selectedWardType}
                  >
                    <option value="">Select Bed</option>
                    {availableBedsForWard.map(bed => (
                      <option key={bed.id} value={bed.bed_number}>
                        {bed.bed_number} - Floor {bed.floor} (₹{bed.daily_charges}/day)
                      </option>
                    ))}
                  </select>
                  {errors.bed_number && <p className="text-red-500 text-sm">{errors.bed_number.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Days *</label>
                  <input
                    type="number"
                    {...register('estimated_days', { valueAsNumber: true })}
                    min={1}
                    max={365}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.estimated_days && <p className="text-red-500 text-sm">{errors.estimated_days.message}</p>}
                </div>
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admission Date *</label>
                  <input
                    type="date"
                    {...register('admission_date')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.admission_date && <p className="text-red-500 text-sm">{errors.admission_date.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admission Time *</label>
                  <input
                    type="time"
                    {...register('admission_time')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.admission_time && <p className="text-red-500 text-sm">{errors.admission_time.message}</p>}
                </div>
              </div>

              {/* Charges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admission Charges (₹) *</label>
                  <input
                    type="number"
                    {...register('admission_charges', { valueAsNumber: true })}
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.admission_charges && <p className="text-red-500 text-sm">{errors.admission_charges.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Daily Room Charges (₹) *</label>
                  <input
                    type="number"
                    {...register('daily_room_charges', { valueAsNumber: true })}
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    readOnly
                  />
                  {errors.daily_room_charges && <p className="text-red-500 text-sm">{errors.daily_room_charges.message}</p>}
                </div>
              </div>

              {/* Doctor and Department */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attending Doctor</label>
                  <select
                    {...register('doctor_id')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.department}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <select
                    {...register('department')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {errors.department && <p className="text-red-500 text-sm">{errors.department.message}</p>}
                </div>
              </div>

              {/* Medical Information */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Admission *</label>
                <textarea
                  {...register('reason_for_admission')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  placeholder="Describe the reason for hospital admission"
                />
                {errors.reason_for_admission && <p className="text-red-500 text-sm">{errors.reason_for_admission.message}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name *</label>
                  <input
                    type="text"
                    {...register('emergency_contact_name')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Emergency contact name"
                  />
                  {errors.emergency_contact_name && <p className="text-red-500 text-sm">{errors.emergency_contact_name.message}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone *</label>
                  <input
                    type="tel"
                    {...register('emergency_contact_phone')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="Emergency contact phone"
                  />
                  {errors.emergency_contact_phone && <p className="text-red-500 text-sm">{errors.emergency_contact_phone.message}</p>}
                </div>
              </div>

              {/* Cost Summary */}
              {totalEstimatedCharges > 0 && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Cost Breakdown</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Admission Charges:</span>
                      <div className="font-semibold">₹{watchedAdmissionCharges?.toLocaleString() || 0}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Room Charges ({watchedEstimatedDays} days):</span>
                      <div className="font-semibold">₹{(watchedDailyCharges * watchedEstimatedDays)?.toLocaleString() || 0}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Total Estimated:</span>
                      <div className="text-lg font-bold text-blue-600">₹{totalEstimatedCharges?.toLocaleString() || 0}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Admitting Patient...' : 'Admit Patient'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewAdmission(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Current Admissions */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Bed & Ward</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admission Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor & Dept</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Charges</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {admissions.map((admission) => (
                <tr key={admission.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{admission.patient_name}</div>
                    <div className="text-sm text-gray-500">ID: {admission.patient_id.slice(0, 8)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{getWardTypeIcon(admission.ward_type)}</span>
                      <div>
                        <div className="font-medium">{admission.bed_number}</div>
                        <div className="text-sm text-gray-500 capitalize">{admission.ward_type.replace('_', ' ')}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">
                      {new Date(admission.admission_date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">
                      {admission.admission_time} • {admission.estimated_days} days
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{admission.doctor_name || 'Not assigned'}</div>
                    <div className="text-sm text-gray-500">{admission.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">₹{admission.total_charges.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">₹{admission.daily_room_charges}/day</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(admission.status)}`}>
                      {admission.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {admission.status === 'admitted' && (
                      <button
                        onClick={() => dischargePatient(admission.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Discharge
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {admissions.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500">No patient admissions found.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientAdmissionSystem;