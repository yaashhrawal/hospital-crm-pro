import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { PatientService } from '../services/patientService';
import { appointmentService } from '../services/appointmentService';
import { supabase } from '../config/supabase';

interface Appointment {
  id: string;
  patient_id: string;
  patient_name: string;
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
  const [showNewAppointment, setShowNewAppointment] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm();

  useEffect(() => {
    loadAppointments();
  }, []);

  const watchedAppointmentType = watch('appointment_type');

  useEffect(() => {
    // Auto-fill estimated cost based on appointment type
    if (watchedAppointmentType) {
      let estimatedCost = 500; // default

      switch (watchedAppointmentType) {
        case 'consultation':
          estimatedCost = 500;
          break;
        case 'follow-up':
          estimatedCost = 350;
          break;
        case 'procedure':
          estimatedCost = 1000;
          break;
        case 'emergency':
          estimatedCost = 750;
          break;
      }

      setValue('estimated_cost', Math.round(estimatedCost));
    }
  }, [watchedAppointmentType, setValue]);

  const loadAppointments = async () => {
    try {
      setLoading(true);
      
      // Try to load from Supabase first
      try {
        const response = await appointmentService.getAppointments({
          limit: 100,
          sortBy: 'scheduled_at',
          sortOrder: 'desc'
        });
        
        if (response && response.data) {
          // Transform Supabase appointments to local format
          const supabaseAppointments = response.data.map((apt: any) => ({
            id: apt.id,
            patient_id: apt.patient_id,
            patient_name: `${apt.patient?.first_name || ''} ${apt.patient?.last_name || ''}`.trim(),
            doctor_name: `${apt.doctor?.first_name || ''} ${apt.doctor?.last_name || ''}`.trim() || 'Unknown Doctor',
            department: apt.department?.name || 'General',
            appointment_date: apt.scheduled_at ? apt.scheduled_at.split('T')[0] : '',
            appointment_time: apt.scheduled_at ? new Date(apt.scheduled_at).toTimeString().slice(0, 5) : '',
            appointment_type: apt.appointment_type?.toLowerCase() || 'consultation',
            status: apt.status?.toLowerCase() || 'scheduled',
            estimated_duration: apt.duration || 30,
            estimated_cost: 500, // Default cost
            notes: apt.notes || '',
            created_at: apt.created_at,
          }));
          
          // Also save to localStorage for offline access
          localStorage.setItem('hospital_appointments', JSON.stringify(supabaseAppointments));
          setAppointments(supabaseAppointments);
          return;
        }
      } catch (supabaseError) {
        console.log('Could not fetch from Supabase, falling back to localStorage:', supabaseError);
      }
      
      // Fallback to localStorage if Supabase fails
      const existingAppointments = localStorage.getItem('hospital_appointments');
      if (existingAppointments) {
        setAppointments(JSON.parse(existingAppointments));
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: any) => {
    try {
      setLoading(true);
      
      const newAppointment: Appointment = {
        id: Date.now().toString(),
        patient_id: 'manual-' + Date.now(),
        patient_name: data.patient_name,
        doctor_name: data.doctor_name || 'Unknown Doctor',
        department: data.department || 'General',
        appointment_date: data.appointment_date,
        appointment_time: data.appointment_time,
        appointment_type: data.appointment_type,
        status: 'scheduled',
        estimated_duration: Number(data.estimated_duration) || 30,
        estimated_cost: Number(data.estimated_cost) || 500,
        notes: data.notes || '',
        created_at: new Date().toISOString(),
      };

      // Save to localStorage
      const existingAppointments = localStorage.getItem('hospital_appointments');
      const appointments = existingAppointments ? JSON.parse(existingAppointments) : [];
      appointments.push(newAppointment);
      localStorage.setItem('hospital_appointments', JSON.stringify(appointments));

      setAppointments(appointments);
      
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new Event('appointmentUpdated'));
      
      toast.success(`Appointment scheduled for ${data.patient_name} on ${new Date(data.appointment_date).toLocaleDateString('en-IN')}`);
      setShowNewAppointment(false);
      reset();
    } catch (error: any) {
      console.error('Error scheduling appointment:', error);
      toast.error(error.message || 'Failed to schedule appointment');
    } finally {
      setLoading(false);
    }
  };

  const updateAppointmentStatus = (appointmentId: string, newStatus: Appointment['status']) => {
    const updated = appointments.map(apt =>
      apt.id === appointmentId ? { ...apt, status: newStatus } : apt
    );
    
    localStorage.setItem('hospital_appointments', JSON.stringify(updated));
    setAppointments(updated);
    
    // Dispatch custom event for same-tab updates
    window.dispatchEvent(new Event('appointmentUpdated'));
    
    toast.success(`Appointment status updated to ${newStatus}`);
  };

  const cancelAppointment = (appointmentId: string) => {
    updateAppointmentStatus(appointmentId, 'cancelled');
  };

  const deleteAppointment = (appointmentId: string, patientName: string) => {
    const confirmDelete = window.confirm(
      `Are you sure you want to delete the appointment for ${patientName}?\n\nThis action cannot be undone.`
    );

    if (!confirmDelete) return;

    try {
      const updated = appointments.filter(apt => apt.id !== appointmentId);
      localStorage.setItem('hospital_appointments', JSON.stringify(updated));
      setAppointments(updated);
      
      // Dispatch custom event for same-tab updates
      window.dispatchEvent(new Event('appointmentUpdated'));
      
      toast.success('Appointment deleted successfully');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      toast.error('Failed to delete appointment');
    }
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
              {/* Patient Name - Manual Entry */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-3">Patient Information</label>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient Name *</label>
                  <input
                    type="text"
                    {...register('patient_name', { required: 'Patient name is required' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter patient name"
                  />
                  {errors.patient_name && <p className="text-red-500 text-sm">{errors.patient_name.message as string}</p>}
                </div>
              </div>

              {/* Doctor Information */}
              <div className="bg-green-50 p-4 rounded-lg">
                <label className="block text-sm font-medium text-gray-700 mb-3">Doctor Information</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Doctor Name *</label>
                    <input
                      type="text"
                      {...register('doctor_name', { required: 'Doctor name is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter doctor name"
                    />
                    {errors.doctor_name && <p className="text-red-500 text-sm">{errors.doctor_name.message as string}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                    <input
                      type="text"
                      {...register('department', { required: 'Department is required' })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="Enter department"
                    />
                    {errors.department && <p className="text-red-500 text-sm">{errors.department.message as string}</p>}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                  disabled={loading}
                  className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Scheduling...' : 'Schedule Appointment'}
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
          {filteredAppointments.length > 0 ? (
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
                        {new Date(appointment.appointment_date).toLocaleDateString('en-IN')}
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
                      <div className="flex gap-2 flex-wrap">
                        {appointment.status === 'scheduled' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'confirmed')}
                            className="text-green-600 hover:text-green-800 font-medium"
                          >
                            Confirm
                          </button>
                        )}
                        {appointment.status === 'confirmed' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'in_progress')}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Start
                          </button>
                        )}
                        {appointment.status === 'in_progress' && (
                          <button
                            onClick={() => updateAppointmentStatus(appointment.id, 'completed')}
                            className="text-purple-600 hover:text-purple-800 font-medium"
                          >
                            Complete
                          </button>
                        )}
                        {!['completed', 'cancelled'].includes(appointment.status) && (
                          <button
                            onClick={() => cancelAppointment(appointment.id)}
                            className="text-orange-600 hover:text-orange-800 font-medium"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          onClick={() => deleteAppointment(appointment.id, appointment.patient_name)}
                          className="text-red-600 hover:text-red-800 font-medium"
                          title="Delete appointment permanently"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📅</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
              <p className="text-gray-500 mb-4">
                Get started by scheduling your first appointment
              </p>
              <button
                onClick={() => setShowNewAppointment(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
              >
                ➕ Schedule Appointment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentManagement;