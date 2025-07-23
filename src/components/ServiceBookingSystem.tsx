import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { supabase } from '../config/supabaseNew';
import { 
  HOSPITAL_SERVICES, 
  HospitalService, 
  getServiceById,
  calculateServiceTotal,
  estimateServiceDuration 
} from '../data/hospitalServices';
import HospitalService from '../services/hospitalService';
import type { Patient } from '../config/supabaseNew';

interface ServiceBooking {
  id?: string;
  patient_id: string;
  service_ids: string[];
  scheduled_date: string;
  scheduled_time: string;
  priority: 'ROUTINE' | 'URGENT' | 'EMERGENCY';
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  is_corporate: boolean;
  total_amount: number;
  estimated_duration: number;
  created_at?: string;
  updated_at?: string;
}

interface PatientSearchProps {
  onPatientSelect: (patient: Patient) => void;
  selectedPatient: Patient | null;
}

const PatientSearch: React.FC<PatientSearchProps> = ({ onPatientSelect, selectedPatient }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchTerm.length >= 2) {
      searchPatients();
    } else {
      setPatients([]);
      setShowDropdown(false);
    }
  }, [searchTerm]);

  const searchPatients = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%,patient_id.ilike.%${searchTerm}%`)
        .limit(10);

      if (error) throw error;
      setPatients(data || []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error searching patients:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Search Patient *
      </label>
      <input
        type="text"
        value={selectedPatient ? `${selectedPatient.first_name} ${selectedPatient.last_name} (${selectedPatient.patient_id})` : searchTerm}
        onChange={(e) => {
          if (!selectedPatient) {
            setSearchTerm(e.target.value);
          }
        }}
        onFocus={() => {
          if (!selectedPatient) {
            setShowDropdown(patients.length > 0);
          }
        }}
        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        placeholder="Type patient name, phone, or ID..."
        required
      />
      
      {selectedPatient && (
        <button
          type="button"
          onClick={() => {
            onPatientSelect(null as any);
            setSearchTerm('');
            setShowDropdown(false);
          }}
          className="absolute right-2 top-8 text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      )}

      {loading && (
        <div className="absolute right-2 top-8">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        </div>
      )}

      {showDropdown && !selectedPatient && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {patients.length > 0 ? (
            patients.map(patient => (
              <div
                key={patient.id}
                onClick={() => {
                  onPatientSelect(patient);
                  setShowDropdown(false);
                  setSearchTerm('');
                }}
                className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
              >
                <div className="font-medium text-gray-900">
                  {patient.first_name} {patient.last_name}
                </div>
                <div className="text-sm text-gray-500">
                  ID: {patient.patient_id} | Phone: {patient.phone || 'N/A'}
                </div>
              </div>
            ))
          ) : (
            <div className="px-4 py-2 text-gray-500 text-center">
              No patients found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface ServiceBookingSystemProps {
  preSelectedServices?: string[];
  preSelectedPatient?: Patient;
  onBookingComplete?: (booking: ServiceBooking) => void;
}

const ServiceBookingSystem: React.FC<ServiceBookingSystemProps> = ({
  preSelectedServices = [],
  preSelectedPatient,
  onBookingComplete
}) => {
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(preSelectedPatient || null);
  const [selectedServices, setSelectedServices] = useState<string[]>(preSelectedServices);
  const [bookingData, setBookingData] = useState({
    scheduled_date: '',
    scheduled_time: '',
    priority: 'ROUTINE' as 'ROUTINE' | 'URGENT' | 'EMERGENCY',
    notes: '',
    is_corporate: false
  });
  const [loading, setLoading] = useState(false);
  const [existingBookings, setExistingBookings] = useState<ServiceBooking[]>([]);

  useEffect(() => {
    loadExistingBookings();
  }, []);

  const loadExistingBookings = async () => {
    try {
      const { data, error } = await supabase
        .from('service_bookings')
        .select(`
          *,
          patient:patients(first_name, last_name, patient_id)
        `)
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true });

      if (error) throw error;
      setExistingBookings(data || []);
    } catch (error) {
      console.error('Error loading bookings:', error);
    }
  };

  const handleServiceToggle = (serviceId: string) => {
    setSelectedServices(prev => 
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const totalAmount = calculateServiceTotal(selectedServices, bookingData.is_corporate);
  const estimatedDuration = estimateServiceDuration(selectedServices);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPatient) {
      toast.error('Please select a patient');
      return;
    }
    
    if (selectedServices.length === 0) {
      toast.error('Please select at least one service');
      return;
    }

    setLoading(true);
    try {
      const booking: Omit<ServiceBooking, 'id' | 'created_at' | 'updated_at'> = {
        patient_id: selectedPatient.id,
        service_ids: selectedServices,
        scheduled_date: bookingData.scheduled_date,
        scheduled_time: bookingData.scheduled_time,
        priority: bookingData.priority,
        status: 'SCHEDULED',
        notes: bookingData.notes,
        is_corporate: bookingData.is_corporate,
        total_amount: totalAmount,
        estimated_duration: estimatedDuration
      };

      const { data, error } = await supabase
        .from('service_bookings')
        .insert(booking)
        .select()
        .single();

      if (error) throw error;

      // Create transaction record
      await supabase
        .from('patient_transactions')
        .insert({
          patient_id: selectedPatient.id,
          transaction_type: 'SERVICE_BOOKING',
          description: `Service booking - ${selectedServices.length} service(s)`,
          amount: totalAmount,
          payment_mode: 'PENDING',
          status: 'PENDING'
        });

      toast.success('Service booking created successfully!');
      
      if (onBookingComplete) {
        onBookingComplete(data);
      }

      // Reset form
      setSelectedPatient(null);
      setSelectedServices([]);
      setBookingData({
        scheduled_date: '',
        scheduled_time: '',
        priority: 'ROUTINE',
        notes: '',
        is_corporate: false
      });

      loadExistingBookings();
    } catch (error: any) {
      console.error('Error creating booking:', error);
      toast.error(`Failed to create booking: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'EMERGENCY': return 'bg-red-100 text-red-800';
      case 'URGENT': return 'bg-orange-100 text-orange-800';
      case 'ROUTINE': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">📅 Service Booking System</h1>
        <p className="text-gray-600">Schedule and manage service appointments</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Booking Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-6">Book New Service</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Patient Search */}
            <PatientSearch 
              onPatientSelect={setSelectedPatient}
              selectedPatient={selectedPatient}
            />

            {/* Service Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Services *
              </label>
              <div className="max-h-40 overflow-y-auto border border-gray-300 rounded-md p-3">
                {HOSPITAL_SERVICES.map(service => (
                  <div key={service.id} className="flex items-center space-x-3 mb-2">
                    <input
                      type="checkbox"
                      id={service.id}
                      checked={selectedServices.includes(service.id)}
                      onChange={() => handleServiceToggle(service.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor={service.id} className="flex-1 text-sm">
                      <span className="font-medium">{service.name}</span>
                      <span className="text-gray-500 ml-2">
                        (₹{bookingData.is_corporate ? service.corporateRate : service.generalRate})
                      </span>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Corporate Rate Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="corporate-rate"
                checked={bookingData.is_corporate}
                onChange={(e) => setBookingData({...bookingData, is_corporate: e.target.checked})}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="corporate-rate" className="text-sm font-medium text-gray-700">
                Apply Corporate Rate
              </label>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={bookingData.scheduled_date}
                  onChange={(e) => setBookingData({...bookingData, scheduled_date: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time *
                </label>
                <input
                  type="time"
                  required
                  value={bookingData.scheduled_time}
                  onChange={(e) => setBookingData({...bookingData, scheduled_time: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <select
                value={bookingData.priority}
                onChange={(e) => setBookingData({...bookingData, priority: e.target.value as any})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="ROUTINE">Routine</option>
                <option value="URGENT">Urgent</option>
                <option value="EMERGENCY">Emergency</option>
              </select>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={bookingData.notes}
                onChange={(e) => setBookingData({...bookingData, notes: e.target.value})}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Any special instructions..."
              />
            </div>

            {/* Summary */}
            {selectedServices.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">Booking Summary</h3>
                <div className="text-sm text-blue-700 space-y-1">
                  <div>Services: {selectedServices.length}</div>
                  <div>Estimated Duration: {estimatedDuration} minutes</div>
                  <div className="font-semibold">Total Amount: ₹{totalAmount.toLocaleString()}</div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !selectedPatient || selectedServices.length === 0}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Booking...' : 'Book Services'}
            </button>
          </form>
        </div>

        {/* Existing Bookings */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Recent Bookings</h2>
            <button
              onClick={loadExistingBookings}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              🔄 Refresh
            </button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {existingBookings.map(booking => (
              <div key={booking.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium text-gray-900">
                      {(booking as any).patient?.first_name} {(booking as any).patient?.last_name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      ID: {(booking as any).patient?.patient_id}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(booking.priority)}`}>
                      {booking.priority}
                    </span>
                  </div>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <div>📅 {booking.scheduled_date} at {booking.scheduled_time}</div>
                  <div>⏱️ Duration: {booking.estimated_duration} minutes</div>
                  <div>💰 Amount: ₹{booking.total_amount.toLocaleString()}</div>
                  <div>🔬 Services: {booking.service_ids.length}</div>
                </div>

                {booking.notes && (
                  <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                    {booking.notes}
                  </div>
                )}
              </div>
            ))}

            {existingBookings.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <div className="text-4xl mb-2">📅</div>
                <p>No bookings found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceBookingSystem;