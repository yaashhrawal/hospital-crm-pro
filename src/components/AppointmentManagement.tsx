import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import dataService from '../services/dataService';
import { PatientService } from '../services/patientService';
import { appointmentService } from '../services/appointmentService';
import type { Patient } from '../types/index';

interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string;
  doctor_id: string;
  doctor_name: string;
  department: string;
  appointment_date: string;
  appointment_time: string;
  appointment_type: 'consultation' | 'follow-up' | 'procedure' | 'emergency';
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  estimated_duration: number;
  estimated_cost: number;
  notes: string;
  created_at: string;
}

const AppointmentManagement: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [patientSelectionType, setPatientSelectionType] = useState<'existing' | 'new'>('existing');
  const [patientSearchQuery, setPatientSearchQuery] = useState('');
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
  const [selectedPatientFromSearch, setSelectedPatientFromSearch] = useState<Patient | null>(null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    loadData();
  }, []);

  // Filter patients based on search query
  useEffect(() => {
    if (patientSearchQuery.trim() === '') {
      setFilteredPatients(patients.slice(0, 10)); // Show first 10 patients
    } else {
      const filtered = patients.filter(patient => 
        `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(patientSearchQuery.toLowerCase()) ||
        patient.phone?.includes(patientSearchQuery) ||
        patient.patient_id?.toLowerCase().includes(patientSearchQuery.toLowerCase())
      );
      setFilteredPatients(filtered.slice(0, 10)); // Limit to 10 results
    }
  }, [patientSearchQuery, patients]);

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.patient-search-container')) {
        setShowPatientSearch(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [patientsData, doctorsData, departmentsData] = await Promise.all([
        dataService.getPatients(),
        dataService.getDoctors(),
        dataService.getDepartments(),
      ]);
      
      setPatients(patientsData);
      setDoctors(doctorsData);
      setDepartments(departmentsData);
      
      // Load mock appointments (in real implementation, this would come from dataService)
      loadAppointments();
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadAppointments = () => {
    // Mock appointments data - in real implementation, this would be stored in Supabase
    const mockAppointments: Appointment[] = [
      {
        id: '1',
        patient_id: 'patient1',
        patient_name: 'John Doe',
        doctor_id: 'doctor1',
        doctor_name: 'Dr. Smith',
        department: 'Cardiology',
        appointment_date: '2025-01-22',
        appointment_time: '10:00',
        appointment_type: 'consultation',
        status: 'scheduled',
        estimated_duration: 30,
        estimated_cost: 500,
        notes: 'Follow-up for chest pain',
        created_at: new Date().toISOString(),
      },
      {
        id: '2',
        patient_id: 'patient2',
        patient_name: 'Jane Smith',
        doctor_id: 'doctor2',
        doctor_name: 'Dr. Johnson',
        department: 'Orthopedics',
        appointment_date: '2025-01-23',
        appointment_time: '14:00',
        appointment_type: 'procedure',
        status: 'confirmed',
        estimated_duration: 60,
        estimated_cost: 1500,
        notes: 'Knee examination and X-ray',
        created_at: new Date().toISOString(),
      },
    ];
    
    setAppointments(mockAppointments);
  };

  const watchedPatientId = watch('patient_id');
  const watchedDoctorId = watch('doctor_id');
  const watchedAppointmentType = watch('appointment_type');

  useEffect(() => {
    // Auto-fill estimated cost based on appointment type and doctor
    if (watchedAppointmentType && watchedDoctorId) {
      const doctor = doctors.find(d => d.id === watchedDoctorId);
      let estimatedCost = 500; // default

      switch (watchedAppointmentType) {
        case 'consultation':
          estimatedCost = doctor?.fee || 500;
          break;
        case 'follow-up':
          estimatedCost = (doctor?.fee || 500) * 0.7; // 30% discount for follow-up
          break;
        case 'procedure':
          estimatedCost = (doctor?.fee || 500) * 2;
          break;
        case 'emergency':
          estimatedCost = (doctor?.fee || 500) * 1.5;
          break;
      }

      setValue('estimated_cost', Math.round(estimatedCost));
    }
  }, [watchedAppointmentType, watchedDoctorId, doctors, setValue]);

  // Handle patient search input
  const handlePatientSearch = (query: string) => {
    setPatientSearchQuery(query);
    setShowPatientSearch(true);
    setSelectedPatientFromSearch(null);
  };

  // Handle patient selection from search results
  const handlePatientSelect = (patient: Patient) => {
    setSelectedPatientFromSearch(patient);
    setPatientSearchQuery(`${patient.first_name} ${patient.last_name}`);
    setShowPatientSearch(false);
    setValue('patient_id', patient.id);
  };

  // Handle creating new patient from search query
  const handleCreatePatientFromSearch = async () => {
    if (!patientSearchQuery.trim()) return;

    try {
      const nameParts = patientSearchQuery.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ');

      const newPatientData = {
        first_name: firstName,
        last_name: lastName || '',
        phone: '',
        email: '',
        gender: 'MALE' as const,
        address: '',
      };

      const newPatient = await PatientService.createPatient(newPatientData);
      
      // Update local patients list
      setPatients(prev => [...prev, newPatient]);
      
      // Select the newly created patient
      setSelectedPatientFromSearch(newPatient);
      setValue('patient_id', newPatient.id);
      setShowPatientSearch(false);
      
      toast.success(`New patient "${newPatient.first_name} ${newPatient.last_name}" created successfully`);
    } catch (error: any) {
      console.error('Error creating patient from search:', error);
      toast.error(error.message || 'Failed to create patient');
    }
  };

  const onSubmit = async (data: any) => {
    try {
      let patientId = data.patient_id;
      let patientName = '';

      // Handle new patient creation
      if (patientSelectionType === 'new') {
        const newPatientData = {
          first_name: data.new_patient_first_name,
          last_name: data.new_patient_last_name || '',
          phone: data.new_patient_phone || '',
          email: data.new_patient_email || '',
          gender: data.new_patient_gender as 'MALE' | 'FEMALE' | 'OTHER' || 'MALE',
          address: data.new_patient_address || '',
        };

        const newPatient = await PatientService.createPatient(newPatientData);
        patientId = newPatient.id;
        patientName = `${newPatient.first_name} ${newPatient.last_name || ''}`.trim();
        
        // Update local patients list
        setPatients(prev => [...prev, newPatient]);
        toast.success(`New patient "${patientName}" created successfully`);
      } else {
        // Handle existing patient selection (either from dropdown or search)
        let selectedPatient = patients.find(p => p.id === data.patient_id);
        
        // If no patient found but we have a search selection, use that
        if (!selectedPatient && selectedPatientFromSearch) {
          selectedPatient = selectedPatientFromSearch;
          patientId = selectedPatient.id;
        }
        
        if (selectedPatient) {
          patientName = `${selectedPatient.first_name} ${selectedPatient.last_name || ''}`.trim();
        } else {
          throw new Error('Please select a patient or create a new one');
        }
      }

      const selectedDoctor = doctors.find(d => d.id === data.doctor_id);

      const newAppointment: Appointment = {
        id: Date.now().toString(),
        patient_id: patientId,
        patient_name: patientName,
        doctor_id: data.doctor_id,
        doctor_name: selectedDoctor?.name || 'Unknown Doctor',
        department: data.department,
        appointment_date: data.appointment_date,
        appointment_time: data.appointment_time,
        appointment_type: data.appointment_type,
        status: 'scheduled',
        estimated_duration: Number(data.estimated_duration),
        estimated_cost: Number(data.estimated_cost),
        notes: data.notes || '',
        created_at: new Date().toISOString(),
      };

      // Save to Supabase in production - for now using mock data
      // TODO: Replace with appointmentService.createAppointment(appointmentData) for production
      setAppointments(prev => [...prev, newAppointment]);
      
      toast.success(`Appointment scheduled for ${patientName} on ${new Date(data.appointment_date).toLocaleDateString()}`);
      setShowNewAppointment(false);
      setPatientSelectionType('existing');
      
      // Reset all search states
      setPatientSearchQuery('');
      setShowPatientSearch(false);
      setSelectedPatientFromSearch(null);
      
      reset();
    } catch (error: any) {
      console.error('Error scheduling appointment:', error);
      toast.error(error.message || 'Failed to schedule appointment');
    }
  };

  const updateAppointmentStatus = (appointmentId: string, newStatus: Appointment['status']) => {
    setAppointments(prev =>
      prev.map(apt =>
        apt.id === appointmentId ? { ...apt, status: newStatus } : apt
      )
    );
    toast.success(`Appointment status updated to ${newStatus}`);
  };

  const cancelAppointment = (appointmentId: string) => {
    updateAppointmentStatus(appointmentId, 'cancelled');
  };

  const getStatusColor = (status: Appointment['status']) => {
    switch (status) {
      case 'scheduled': return 'bg-blue-100 text-blue-800';
      case 'confirmed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: Appointment['appointment_type']) => {
    switch (type) {
      case 'consultation': return '👨‍⚕️';
      case 'follow-up': return '🔄';
      case 'procedure': return '🏥';
      case 'emergency': return '🚨';
      default: return '📅';
    }
  };

  const filteredAppointments = appointments.filter(apt => {
    if (filterStatus !== 'all' && apt.status !== filterStatus) return false;
    return true;
  });

  const upcomingAppointments = appointments.filter(apt =>
    new Date(apt.appointment_date) >= new Date() && apt.status !== 'cancelled'
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading appointments...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-800">📅 Appointment Management</h2>
            <button
              onClick={() => setShowNewAppointment(!showNewAppointment)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              ➕ Schedule Appointment
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{upcomingAppointments.length}</div>
              <div className="text-sm text-gray-600">Upcoming</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {appointments.filter(a => a.status === 'confirmed').length}
              </div>
              <div className="text-sm text-gray-600">Confirmed</div>
            </div>
            <div className="bg-yellow-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                {appointments.filter(a => a.status === 'scheduled').length}
              </div>
              <div className="text-sm text-gray-600">Scheduled</div>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                ₹{appointments.reduce((sum, a) => sum + a.estimated_cost, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Value</div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4 items-center">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="all">All Statuses</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* New Appointment Form */}
        {showNewAppointment && (
          <div className="px-6 py-4 bg-gray-50 border-b">
            <h3 className="text-lg font-semibold mb-4">Schedule New Appointment</h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Patient Selection Type Toggle */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-3">Patient Information</label>
                <div className="flex gap-4 mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setPatientSelectionType('existing');
                      // Clear new patient fields when switching
                      setValue('new_patient_first_name', '');
                      setValue('new_patient_last_name', '');
                      setValue('new_patient_phone', '');
                      setValue('new_patient_email', '');
                      setValue('new_patient_address', '');
                      // Clear search states
                      setPatientSearchQuery('');
                      setShowPatientSearch(false);
                      setSelectedPatientFromSearch(null);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      patientSelectionType === 'existing'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    👤 Select Existing Patient
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPatientSelectionType('new');
                      // Clear existing patient selection when switching
                      setValue('patient_id', '');
                      // Clear search states
                      setPatientSearchQuery('');
                      setShowPatientSearch(false);
                      setSelectedPatientFromSearch(null);
                    }}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      patientSelectionType === 'new'
                        ? 'bg-green-600 text-white'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    ➕ Create New Patient
                  </button>
                </div>

                {/* Existing Patient Selection with Search */}
                {patientSelectionType === 'existing' && (
                  <div className="relative patient-search-container">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Search or Select Patient
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={patientSearchQuery}
                        onChange={(e) => handlePatientSearch(e.target.value)}
                        onFocus={() => setShowPatientSearch(true)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md pr-10"
                        placeholder="Type patient name, phone, or ID..."
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                      </div>
                    </div>

                    {/* Search Results Dropdown */}
                    {showPatientSearch && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {filteredPatients.length > 0 ? (
                          <>
                            {filteredPatients.map(patient => (
                              <div
                                key={patient.id}
                                onClick={() => handlePatientSelect(patient)}
                                className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100"
                              >
                                <div className="font-medium text-gray-900">
                                  {patient.first_name} {patient.last_name}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {patient.phone && `📱 ${patient.phone}`} {patient.patient_id && `• ID: ${patient.patient_id}`}
                                </div>
                              </div>
                            ))}
                          </>
                        ) : (
                          <div className="px-3 py-4">
                            <div className="text-gray-500 text-center mb-3">
                              No patients found matching "{patientSearchQuery}"
                            </div>
                            {patientSearchQuery.trim() && (
                              <button
                                type="button"
                                onClick={handleCreatePatientFromSearch}
                                className="w-full bg-green-600 text-white px-3 py-2 rounded text-sm hover:bg-green-700 transition-colors"
                              >
                                ➕ Create new patient "{patientSearchQuery}"
                              </button>
                            )}
                          </div>
                        )}
                        
                        {/* Close button */}
                        <div className="border-t border-gray-200 p-2">
                          <button
                            type="button"
                            onClick={() => setShowPatientSearch(false)}
                            className="w-full text-gray-500 text-sm hover:text-gray-700"
                          >
                            Close
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Selected Patient Display */}
                    {selectedPatientFromSearch && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
                        <span className="text-green-700">✓ Selected: </span>
                        <span className="font-medium">{selectedPatientFromSearch.first_name} {selectedPatientFromSearch.last_name}</span>
                        {selectedPatientFromSearch.phone && <span className="text-gray-600 ml-2">• {selectedPatientFromSearch.phone}</span>}
                      </div>
                    )}

                    {/* Hidden input for form validation */}
                    <input
                      type="hidden"
                      {...register('patient_id', { 
                        required: patientSelectionType === 'existing' ? false : false // Made optional since we handle it in submit
                      })}
                    />
                  </div>
                )}

                {/* New Patient Form */}
                {patientSelectionType === 'new' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        {...register('new_patient_first_name', { 
                          required: patientSelectionType === 'new' ? 'First name is required' : false 
                        })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Enter first name"
                      />
                      {errors.new_patient_first_name && <p className="text-red-500 text-sm">{errors.new_patient_first_name.message as string}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                      <input
                        type="text"
                        {...register('new_patient_last_name')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Enter last name (optional)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                      <input
                        type="tel"
                        {...register('new_patient_phone')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Enter phone number"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        {...register('new_patient_email')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Enter email address"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                      <select
                        {...register('new_patient_gender')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                      <input
                        type="text"
                        {...register('new_patient_address')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        placeholder="Enter address"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Doctor *</label>
                  <select
                    {...register('doctor_id', { required: 'Doctor is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Doctor</option>
                    {doctors.map(doctor => (
                      <option key={doctor.id} value={doctor.id}>
                        {doctor.name} - {doctor.department}
                      </option>
                    ))}
                  </select>
                  {errors.doctor_id && <p className="text-red-500 text-sm">{errors.doctor_id.message as string}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <select
                    {...register('department', { required: 'Department is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept.id} value={dept.name}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {errors.department && <p className="text-red-500 text-sm">{errors.department.message as string}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                  <input
                    type="date"
                    {...register('appointment_date', { required: 'Date is required' })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.appointment_date && <p className="text-red-500 text-sm">{errors.appointment_date.message as string}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time *</label>
                  <input
                    type="time"
                    {...register('appointment_time', { required: 'Time is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                  {errors.appointment_time && <p className="text-red-500 text-sm">{errors.appointment_time.message as string}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                  <select
                    {...register('appointment_type', { required: 'Type is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="">Select Type</option>
                    <option value="consultation">👨‍⚕️ Consultation</option>
                    <option value="follow-up">🔄 Follow-up</option>
                    <option value="procedure">🏥 Procedure</option>
                    <option value="emergency">🚨 Emergency</option>
                  </select>
                  {errors.appointment_type && <p className="text-red-500 text-sm">{errors.appointment_type.message as string}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    {...register('estimated_duration')}
                    defaultValue={30}
                    min={15}
                    max={180}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost (₹)</label>
                  <input
                    type="number"
                    {...register('estimated_cost')}
                    min={0}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  {...register('notes')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows={2}
                  placeholder="Special instructions or notes about the appointment"
                />
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
                >
                  Schedule Appointment
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewAppointment(false)}
                  className="bg-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Appointments List */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patient</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Doctor & Department</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAppointments.map((appointment) => (
                <tr key={appointment.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{appointment.patient_name}</div>
                    <div className="text-sm text-gray-500">ID: {appointment.patient_id.slice(0, 8)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{appointment.doctor_name}</div>
                    <div className="text-sm text-gray-500">{appointment.department}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">
                      {new Date(appointment.appointment_date).toLocaleDateString()}
                    </div>
                    <div className="text-sm text-gray-500">{appointment.appointment_time}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="flex items-center gap-1">
                      {getTypeIcon(appointment.appointment_type)}
                      {appointment.appointment_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                      {appointment.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold">₹{appointment.estimated_cost.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">{appointment.estimated_duration}min</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      {appointment.status === 'scheduled' && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                          className="text-green-600 hover:text-green-800"
                        >
                          Confirm
                        </button>
                      )}
                      {appointment.status === 'confirmed' && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'in_progress')}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          Start
                        </button>
                      )}
                      {appointment.status === 'in_progress' && (
                        <button
                          onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                          className="text-purple-600 hover:text-purple-800"
                        >
                          Complete
                        </button>
                      )}
                      {!['completed', 'cancelled'].includes(appointment.status) && (
                        <button
                          onClick={() => cancelAppointment(appointment.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAppointments.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-500">No appointments found.</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentManagement;