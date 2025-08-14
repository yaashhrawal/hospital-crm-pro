import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

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

interface SimpleCalendarProps {
  className?: string;
}

const SimpleCalendar: React.FC<SimpleCalendarProps> = ({ className = '' }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');

  // Load appointments from localStorage
  useEffect(() => {
    const loadAppointments = () => {
      try {
        const saved = localStorage.getItem('hospital_appointments');
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log('📅 Loaded appointments:', parsed);
          setAppointments(parsed);
        } else {
          console.log('📅 No appointments found in localStorage');
        }
      } catch (error) {
        console.error('Error loading appointments:', error);
      }
    };

    loadAppointments();
    
    // Set up periodic refresh
    const interval = setInterval(loadAppointments, 5000);
    return () => clearInterval(interval);
  }, []);

  // Simple notification check
  useEffect(() => {
    if (appointments.length === 0) return;
    
    const checkNotifications = () => {
      const now = new Date();
      const notifiedAppointments = JSON.parse(localStorage.getItem('notified_appointments') || '[]');
      
      appointments.forEach(appointment => {
        if (['cancelled', 'completed'].includes(appointment.status)) return;
        
        const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
        const timeDiff = appointmentDateTime.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        // Check for 2-hour notification
        if (hoursDiff <= 2 && hoursDiff > 1.5 && !notifiedAppointments.includes(`${appointment.id}-2h`)) {
          toast(`⏰ Appointment with ${appointment.patient_name} in 2 hours`, {
            duration: 6000,
            icon: '🔔',
          });
          notifiedAppointments.push(`${appointment.id}-2h`);
        }
        
        // Check for 1-hour notification
        if (hoursDiff <= 1 && hoursDiff > 0.5 && !notifiedAppointments.includes(`${appointment.id}-1h`)) {
          toast(`🚨 Appointment with ${appointment.patient_name} in 1 hour!`, {
            duration: 8000,
            icon: '⚡',
          });
          notifiedAppointments.push(`${appointment.id}-1h`);
        }
      });
      
      localStorage.setItem('notified_appointments', JSON.stringify(notifiedAppointments));
    };

    const notificationInterval = setInterval(checkNotifications, 60000);
    checkNotifications();

    return () => clearInterval(notificationInterval);
  }, [appointments]);

  // Get appointments for today
  const getTodayAppointments = (): Appointment[] => {
    const today = new Date().toISOString().split('T')[0];
    return appointments
      .filter(apt => apt.appointment_date === today)
      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
  };

  // Get upcoming appointments (next 7 days)
  const getUpcomingAppointments = (): Appointment[] => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    return appointments
      .filter(apt => {
        const aptDate = new Date(apt.appointment_date);
        return aptDate >= today && aptDate <= nextWeek && !['cancelled'].includes(apt.status);
      })
      .sort((a, b) => {
        const dateCompare = a.appointment_date.localeCompare(b.appointment_date);
        if (dateCompare !== 0) return dateCompare;
        return a.appointment_time.localeCompare(b.appointment_time);
      });
  };

  const getAppointmentColor = (type: string, status: string) => {
    if (status === 'cancelled') return 'bg-gray-100 text-gray-600 border-gray-200';
    if (status === 'completed') return 'bg-green-100 text-green-800 border-green-200';
    
    switch (type) {
      case 'consultation': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'follow-up': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'procedure': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isToday = (dateString: string) => {
    return dateString === new Date().toISOString().split('T')[0];
  };

  const todayAppointments = getTodayAppointments();
  const upcomingAppointments = getUpcomingAppointments();

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 relative ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">📅 Live Calendar</h2>
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'day'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Today
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                  viewMode === 'week'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Week
              </button>
            </div>
          </div>
          
          <div className="text-sm text-gray-500">
            {appointments.length} total appointments
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-6">
        {viewMode === 'day' && (
          <div className="space-y-4">
            <div className="text-center p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                Today's Appointments
              </h3>
              <p className="text-gray-600">
                {todayAppointments.length} appointments scheduled
              </p>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {todayAppointments.length > 0 ? (
                todayAppointments.map((apt, index) => (
                  <div
                    key={index}
                    className={`
                      p-4 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all
                      ${getAppointmentColor(apt.appointment_type, apt.status)} border-l-current
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Clock className="h-4 w-4" />
                          <span className="font-bold text-lg">
                            {formatTime(apt.appointment_time)}
                          </span>
                          <span className="text-xs px-2 py-1 bg-white bg-opacity-50 rounded-full">
                            {apt.estimated_duration}min
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-1">
                          <User className="h-4 w-4" />
                          <span className="font-semibold">{apt.patient_name}</span>
                        </div>
                        
                        <div className="text-sm opacity-75 mb-2">
                          Dr. {apt.doctor_name} • {apt.department}
                        </div>
                        
                        <div className="text-sm">
                          <span className="font-medium">{apt.appointment_type}</span>
                          {apt.notes && (
                            <span className="ml-2 italic">• {apt.notes}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          ₹{apt.estimated_cost.toLocaleString()}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full ${
                          apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          apt.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                          apt.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                          apt.status === 'completed' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {apt.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">📅</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments today</h3>
                  <p className="text-gray-500">Enjoy your free day!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {viewMode === 'week' && (
          <div className="space-y-4">
            <div className="text-center p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
              <h3 className="text-xl font-bold text-gray-900 mb-1">
                Upcoming Appointments
              </h3>
              <p className="text-gray-600">
                Next 7 days • {upcomingAppointments.length} appointments
              </p>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {upcomingAppointments.length > 0 ? (
                upcomingAppointments.map((apt, index) => (
                  <div
                    key={index}
                    className={`
                      p-4 rounded-xl border shadow-sm hover:shadow-md transition-all
                      ${getAppointmentColor(apt.appointment_type, apt.status)}
                      ${isToday(apt.appointment_date) ? 'ring-2 ring-blue-300' : ''}
                    `}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-bold text-sm px-2 py-1 bg-white bg-opacity-50 rounded">
                            {formatDate(apt.appointment_date)}
                          </span>
                          <Clock className="h-4 w-4" />
                          <span className="font-bold">
                            {formatTime(apt.appointment_time)}
                          </span>
                          {isToday(apt.appointment_date) && (
                            <span className="text-xs px-2 py-1 bg-blue-500 text-white rounded-full">
                              TODAY
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-2 mb-1">
                          <User className="h-4 w-4" />
                          <span className="font-semibold">{apt.patient_name}</span>
                        </div>
                        
                        <div className="text-sm opacity-75">
                          Dr. {apt.doctor_name} • {apt.department} • {apt.appointment_type}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="font-bold">
                          ₹{apt.estimated_cost.toLocaleString()}
                        </div>
                        <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                          apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                          apt.status === 'scheduled' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {apt.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-6xl mb-4">🗓️</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No upcoming appointments</h3>
                  <p className="text-gray-500">All clear for the next week!</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Live indicator */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span>LIVE</span>
        </div>
      </div>
    </div>
  );
};

export default SimpleCalendar;