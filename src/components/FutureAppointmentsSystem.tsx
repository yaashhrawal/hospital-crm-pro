import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import HospitalService from '../services/hospitalService';
import SMSService from '../services/smsService';
import Receipt from './Receipt';
import type { FutureAppointment, PatientWithRelations, User, CreateAppointmentData, AppointmentWithRelations } from '../config/supabaseNew';
import { APPOINTMENT_TYPES, APPOINTMENT_STATUS } from '../config/supabaseNew';

interface AppointmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ isOpen, onClose, onSuccess }) => {
  try {
  const [formData, setFormData] = useState({
    patient_id: '',
    doctor_id: '',
    appointment_date: '',
    appointment_time: '',
    duration_minutes: 30,
    appointment_type: 'CONSULTATION',
    reason: '',
    estimated_cost: 0,
    notes: '',
    send_sms: false
  });

  const [patients, setPatients] = useState<PatientWithRelations[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchPatient, setSearchPatient] = useState('');
  const [filteredPatients, setFilteredPatients] = useState<PatientWithRelations[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadPatientsAndDoctors();
      // Set default date to today
      const today = new Date().toISOString().split('T')[0];
      setFormData(prev => ({ ...prev, appointment_date: today }));
    }
  }, [isOpen]);

  useEffect(() => {
    // Filter patients based on search
    if (searchPatient.trim()) {
      const search = searchPatient.toLowerCase();
      setFilteredPatients(
        patients.filter(p => 
          p.first_name.toLowerCase().includes(search) ||
          p.last_name.toLowerCase().includes(search) ||
          p.phone.includes(search) ||
          p.patient_id.toLowerCase().includes(search)
        ).slice(0, 10)
      );
    } else {
      setFilteredPatients(patients.slice(0, 10));
    }
  }, [searchPatient, patients]);

  const loadPatientsAndDoctors = async () => {
    try {
      const [patientsData, currentUser] = await Promise.all([
        HospitalService.getPatients(50000, true, true),
        HospitalService.getCurrentUser()
      ]);
      
      setPatients(patientsData);
      
      // For now, use current user as doctor (in real app, you'd fetch all doctors)
      if (currentUser) {
        setDoctors([currentUser]);
        setFormData(prev => ({ ...prev, doctor_id: currentUser.id }));
      }
    } catch (error: any) {
      toast.error(`Failed to load data: ${error.message}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.patient_id || !formData.doctor_id || !formData.appointment_date || !formData.appointment_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const appointmentData: CreateAppointmentData = {
        patient_id: formData.patient_id,
        doctor_id: formData.doctor_id,
        appointment_date: formData.appointment_date,
        appointment_time: formData.appointment_time,
        duration_minutes: formData.duration_minutes,
        appointment_type: formData.appointment_type,
        reason: formData.reason.trim(),
        estimated_cost: formData.estimated_cost,
        notes: formData.notes.trim() || undefined
      };

      console.log('📝 Creating appointment with data:', appointmentData);
      await HospitalService.createAppointment(appointmentData);
      console.log('✅ Appointment created successfully');

      toast.success('Appointment scheduled successfully!');

      // Send SMS confirmation if enabled and patient is selected
      if (formData.send_sms && selectedPatient) {
        try {
          const patientFullName = `${selectedPatient.first_name} ${selectedPatient.last_name}`;
          const doctor = doctors.find(d => d.id === formData.doctor_id);
          const doctorName = doctor ? `${doctor.first_name} ${doctor.last_name}` : 'Our Doctor';
          const formattedDate = new Date(formData.appointment_date).toLocaleDateString('en-IN');

          const smsResult = await SMSService.sendAppointmentConfirmation(
            selectedPatient.id,
            patientFullName,
            selectedPatient.phone,
            formattedDate,
            formData.appointment_time,
            doctorName,
            selectedPatient.patient_id // Use actual patient_id (e.g., P004063)
          );

          if (smsResult.success) {
            toast.success('SMS confirmation sent!');
          } else if (smsResult.error && smsResult.error !== 'SMS service not configured') {
            toast.error('Failed to send SMS confirmation');
          }
        } catch (smsError) {
          console.error('SMS sending error:', smsError);
          // Don't block the flow if SMS fails
        }
      }

      // Reset form
      setFormData({
        patient_id: '',
        doctor_id: doctors[0]?.id || '',
        appointment_date: new Date().toISOString().split('T')[0],
        appointment_time: '',
        duration_minutes: 30,
        appointment_type: 'CONSULTATION',
        reason: '',
        estimated_cost: 0,
        notes: '',
        send_sms: false
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast.error(`Failed to schedule appointment: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const selectedPatient = patients.find(p => p.id === formData.patient_id);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">📅 Schedule New Appointment</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Patient Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Patient <span className="text-red-500">*</span>
            </label>
            
            {/* Patient Search */}
            <input
              type="text"
              placeholder="Search patient by name, phone, or ID..."
              value={searchPatient}
              onChange={(e) => setSearchPatient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            
            {/* Patient Dropdown */}
            <select
              value={formData.patient_id}
              onChange={(e) => setFormData({ ...formData, patient_id: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="">Select a patient</option>
              {filteredPatients.map(patient => (
                <option key={patient.id} value={patient.id}>
                  {patient.first_name} {patient.last_name} - {patient.phone} (ID: {patient.patient_id})
                </option>
              ))}
            </select>

            {/* Selected Patient Info */}
            {selectedPatient && (
              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                <div className="font-medium">{selectedPatient.first_name} {selectedPatient.last_name}</div>
                <div className="text-sm text-gray-600">
                  {selectedPatient.phone} • {selectedPatient.gender} • {selectedPatient.visitCount || 0} visits
                </div>
              </div>
            )}
          </div>

          {/* Date and Time */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.appointment_date}
                onChange={(e) => setFormData({ ...formData, appointment_date: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={new Date().toISOString().split('T')[0]}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Time <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={formData.appointment_time}
                onChange={(e) => setFormData({ ...formData, appointment_time: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {/* Duration and Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Duration (minutes)</label>
              <select
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2 hours</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Type</label>
              <select
                value={formData.appointment_type}
                onChange={(e) => setFormData({ ...formData, appointment_type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {APPOINTMENT_TYPES.map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Visit <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Brief description of the visit purpose"
              required
            />
          </div>

          {/* Estimated Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Cost (₹)</label>
            <input
              type="number"
              value={formData.estimated_cost}
              onChange={(e) => setFormData({ ...formData, estimated_cost: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="0"
              min="0"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Additional notes or special instructions"
              rows={3}
            />
          </div>

          {/* SMS Checkbox */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.send_sms}
                onChange={(e) => setFormData({ ...formData, send_sms: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Send SMS confirmation to patient
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Scheduling...' : '📅 Schedule Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
  } catch (error: any) {
    console.error('Error in AppointmentForm:', error);
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md">
          <h3 className="text-red-600 font-bold mb-2">Error in Appointment Form</h3>
          <p className="text-gray-600 mb-4">{error.message || 'An error occurred'}</p>
          <button onClick={onClose} className="bg-gray-600 text-white px-4 py-2 rounded">
            Close
          </button>
        </div>
      </div>
    );
  }
};

const FutureAppointmentsSystem: React.FC = () => {
  const [appointments, setAppointments] = useState<AppointmentWithRelations[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedPatientForReceipt, setSelectedPatientForReceipt] = useState<PatientWithRelations | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [filterDate, setFilterDate] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadAppointments();
  }, []);

  const loadAppointments = async () => {
    try {
      console.log('🔍 Loading appointments...');
      setLoading(true);
      const appointmentsData = await HospitalService.getAppointments();
      console.log('📅 Appointments loaded:', appointmentsData);
      setAppointments(appointmentsData || []);
    } catch (error: any) {
      console.error('❌ Error loading appointments:', error);
      console.error('Error details:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
      toast.error(`Failed to load appointments: ${error.message}`);
      // Set empty array on error so component still renders
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredAppointments = () => {
    let filtered = [...appointments];

    if (filterDate) {
      filtered = filtered.filter(apt => apt.appointment_date === filterDate);
    }

    if (filterStatus !== 'all') {
      filtered = filtered.filter(apt => apt.status === filterStatus);
    }

    return filtered.sort((a, b) => {
      const dateA = new Date(`${a.appointment_date} ${a.appointment_time}`);
      const dateB = new Date(`${b.appointment_date} ${b.appointment_time}`);
      return dateA.getTime() - dateB.getTime();
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'CONFIRMED': return 'bg-green-100 text-green-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'NO_SHOW': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredAppointments = getFilteredAppointments();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading appointments...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">📅 Future Appointments</h1>
          <p className="text-gray-600">Schedule and manage upcoming appointments</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          ➕ Schedule New Appointment
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg border-2 border-blue-200">
          <div className="text-2xl font-bold text-blue-700">{appointments.length}</div>
          <div className="text-blue-600">Total Appointments</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg border-2 border-green-200">
          <div className="text-2xl font-bold text-green-700">
            {appointments.filter(a => a.appointment_date === new Date().toISOString().split('T')[0]).length}
          </div>
          <div className="text-green-600">Today's Appointments</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200">
          <div className="text-2xl font-bold text-yellow-700">
            {appointments.filter(a => a.status === 'SCHEDULED').length}
          </div>
          <div className="text-yellow-600">Pending Confirmation</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border-2 border-purple-200">
          <div className="text-2xl font-bold text-purple-700">
            ₹{appointments.reduce((sum, a) => sum + (a.estimated_cost || 0), 0).toLocaleString()}
          </div>
          <div className="text-purple-600">Estimated Revenue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Filter by date"
            />
          </div>
          <div className="min-w-[200px]">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Statuses</option>
              {APPOINTMENT_STATUS.map(status => (
                <option key={status.value} value={status.value}>{status.label}</option>
              ))}
            </select>
          </div>
          <button
            onClick={loadAppointments}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-4 font-semibold text-gray-700">Date & Time</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Patient</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Type</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Reason</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Duration</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Status</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Est. Cost</th>
                  <th className="text-left p-4 font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAppointments.map((appointment, index) => {
                  const appointmentDate = new Date(appointment.appointment_date);
                  const isToday = appointment.appointment_date === new Date().toISOString().split('T')[0];
                  const isPast = appointmentDate < new Date();
                  
                  return (
                    <tr 
                      key={appointment.id} 
                      className={`border-b hover:bg-gray-50 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                      } ${isToday ? 'bg-blue-25' : ''} ${isPast && appointment.status === 'SCHEDULED' ? 'bg-red-25' : ''}`}
                    >
                      <td className="p-4">
                        <div className="font-medium">{appointmentDate.toLocaleDateString()}</div>
                        <div className="text-sm text-gray-600">
                          {appointment.appointment_time}
                          {isToday && <span className="ml-2 text-blue-600 font-medium">Today</span>}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="font-medium">
                          {appointment.patient?.first_name} {appointment.patient?.last_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {appointment.patient?.phone || 'N/A'}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                          {appointment.appointment_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="max-w-xs truncate">{appointment.reason}</div>
                      </td>
                      <td className="p-4">
                        {appointment.duration_minutes} min
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(appointment.status)}`}>
                          {appointment.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className="text-green-600 font-medium">
                          ₹{(appointment.estimated_cost || 0).toLocaleString()}
                        </span>
                      </td>
                      <td className="p-4">
                        {appointment.patient && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedPatientForReceipt(appointment.patient!);
                              setShowReceiptModal(true);
                            }}
                            className="bg-indigo-600 text-white px-2 py-1 rounded text-xs hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            title="View Receipt"
                          >
                            🧾 Receipt
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border p-12 text-center">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No appointments found</h3>
          <p className="text-gray-600 mb-4">
            {filterDate || filterStatus !== 'all' 
              ? 'Try adjusting your filters'
              : 'No appointments have been scheduled yet'
            }
          </p>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
          >
            📅 Schedule First Appointment
          </button>
        </div>
      )}

      {/* Appointment Form Modal */}
      <AppointmentForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        onSuccess={loadAppointments}
      />

      {/* Receipt Modal */}
      {showReceiptModal && selectedPatientForReceipt && (
        <Receipt
          patientId={selectedPatientForReceipt.id}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedPatientForReceipt(null);
          }}
        />
      )}
    </div>
  );
};

export default FutureAppointmentsSystem;