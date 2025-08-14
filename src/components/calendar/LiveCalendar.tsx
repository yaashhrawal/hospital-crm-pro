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

interface LiveCalendarProps {
  className?: string;
}

const LiveCalendar: React.FC<LiveCalendarProps> = ({ className = '' }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [notifications, setNotifications] = useState<string[]>([]);

  // Load appointments from localStorage
  useEffect(() => {
    const loadAppointments = () => {
      try {
        const saved = localStorage.getItem('hospital_appointments');
        if (saved) {
          setAppointments(JSON.parse(saved));
        }
      } catch (error) {
        console.error('Error loading appointments:', error);
      }
    };

    loadAppointments();
    
    // Set up periodic refresh
    const interval = setInterval(loadAppointments, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Notification system
  useEffect(() => {
    const checkNotifications = () => {
      const now = new Date();
      const notifiedAppointments = JSON.parse(localStorage.getItem('notified_appointments') || '[]');
      
      appointments.forEach(appointment => {
        if (['cancelled', 'completed'].includes(appointment.status)) return;
        
        const appointmentDateTime = new Date(`${appointment.appointment_date}T${appointment.appointment_time}`);
        const timeDiff = appointmentDateTime.getTime() - now.getTime();
        const hoursDiff = timeDiff / (1000 * 60 * 60);
        
        // Check for 2-hour notification
        if (hoursDiff <= 2 && hoursDiff > 1.9 && !notifiedAppointments.includes(`${appointment.id}-2h`)) {
          toast(`⏰ Reminder: Appointment with ${appointment.patient_name} in 2 hours`, {
            duration: 8000,
            icon: '🔔',
            style: {
              background: '#fef3c7',
              color: '#92400e',
              border: '1px solid #f59e0b',
            },
          });
          notifiedAppointments.push(`${appointment.id}-2h`);
        }
        
        // Check for 1-hour notification
        if (hoursDiff <= 1 && hoursDiff > 0.9 && !notifiedAppointments.includes(`${appointment.id}-1h`)) {
          toast(`🚨 Urgent: Appointment with ${appointment.patient_name} in 1 hour!`, {
            duration: 10000,
            icon: '⚡',
            style: {
              background: '#fecaca',
              color: '#991b1b',
              border: '1px solid #ef4444',
            },
          });
          notifiedAppointments.push(`${appointment.id}-1h`);
        }
      });
      
      localStorage.setItem('notified_appointments', JSON.stringify(notifiedAppointments));
    };

    const notificationInterval = setInterval(checkNotifications, 60000); // Check every minute
    checkNotifications(); // Check immediately

    return () => clearInterval(notificationInterval);
  }, [appointments]);

  // Calendar navigation
  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === 'next' ? 7 : -7));
      return newDate;
    });
  };

  const navigateDay = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(prev.getDate() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  // Get appointments for a specific date
  const getAppointmentsForDate = (date: Date): Appointment[] => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments
      .filter(apt => apt.appointment_date === dateStr)
      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
  };

  // Generate calendar days for month view
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      const prevMonthDay = new Date(year, month, -startingDayOfWeek + i + 1);
      days.push({
        date: prevMonthDay,
        isCurrentMonth: false,
        appointments: getAppointmentsForDate(prevMonthDay)
      });
    }

    // Add days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      days.push({
        date,
        isCurrentMonth: true,
        appointments: getAppointmentsForDate(date)
      });
    }

    // Add empty cells for days after the month ends
    const remainingCells = 42 - days.length; // 6 rows × 7 days
    for (let i = 1; i <= remainingCells; i++) {
      const nextMonthDay = new Date(year, month + 1, i);
      days.push({
        date: nextMonthDay,
        isCurrentMonth: false,
        appointments: getAppointmentsForDate(nextMonthDay)
      });
    }

    return days;
  };

  // Get week days for week view
  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day;
    startOfWeek.setDate(diff);

    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + i);
      weekDays.push({
        date,
        appointments: getAppointmentsForDate(date)
      });
    }
    return weekDays;
  };

  // Get appointment type color
  const getAppointmentColor = (type: string, status: string) => {
    if (status === 'cancelled') return 'bg-gray-200 text-gray-600 border-gray-300';
    if (status === 'completed') return 'bg-green-100 text-green-800 border-green-200';
    
    switch (type) {
      case 'consultation': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'follow-up': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'procedure': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'emergency': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if date is selected
  const isSelected = (date: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`bg-white rounded-2xl shadow-lg border border-gray-100 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-bold text-gray-900">
              📅 Live Calendar
            </h2>
            <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
              {(['month', 'week', 'day'] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    viewMode === mode
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                if (viewMode === 'month') navigateMonth('prev');
                else if (viewMode === 'week') navigateWeek('prev');
                else navigateDay('prev');
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <div className="text-lg font-semibold text-gray-900 min-w-[200px] text-center">
              {viewMode === 'month' && `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`}
              {viewMode === 'week' && `Week of ${currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
              {viewMode === 'day' && currentDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </div>
            
            <button
              onClick={() => {
                if (viewMode === 'month') navigateMonth('next');
                else if (viewMode === 'week') navigateWeek('next');
                else navigateDay('next');
              }}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-6">
        {viewMode === 'month' && (
          <div className="space-y-4">
            {/* Week headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-sm font-semibold text-gray-600 uppercase tracking-wider"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {getCalendarDays().map((day, index) => {
                const hasAppointments = day.appointments.length > 0;
                const urgentAppointments = day.appointments.filter(apt => 
                  apt.appointment_type === 'emergency' || apt.status === 'confirmed'
                );

                return (
                  <div
                    key={index}
                    onClick={() => setSelectedDate(day.date)}
                    className={`
                      relative min-h-[80px] p-2 rounded-lg cursor-pointer transition-all hover:bg-gray-50
                      ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                      ${isToday(day.date) ? 'bg-blue-50 ring-2 ring-blue-200' : ''}
                      ${isSelected(day.date) ? 'bg-blue-100 ring-2 ring-blue-300' : ''}
                      ${hasAppointments ? 'border border-gray-200' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-semibold ${
                        isToday(day.date) ? 'text-blue-600' : ''
                      }`}>
                        {day.date.getDate()}
                      </span>
                      {urgentAppointments.length > 0 && (
                        <AlertCircle className="h-3 w-3 text-red-500" />
                      )}
                    </div>
                    
                    {/* Appointment dots */}
                    <div className="space-y-1">
                      {day.appointments.slice(0, 3).map((apt, i) => (
                        <div
                          key={i}
                          className={`
                            text-xs px-1 py-0.5 rounded border truncate
                            ${getAppointmentColor(apt.appointment_type, apt.status)}
                          `}
                          title={`${apt.patient_name} - ${formatTime(apt.appointment_time)}`}
                        >
                          {formatTime(apt.appointment_time)} {apt.patient_name.split(' ')[0]}
                        </div>
                      ))}
                      {day.appointments.length > 3 && (
                        <div className="text-xs text-gray-500 font-medium">
                          +{day.appointments.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {viewMode === 'week' && (
          <div className="space-y-4">
            {/* Week header */}
            <div className="grid grid-cols-7 gap-4">
              {getWeekDays().map((day, index) => (
                <div
                  key={index}
                  className={`text-center p-3 rounded-lg ${
                    isToday(day.date) ? 'bg-blue-100 text-blue-900' : 'text-gray-700'
                  }`}
                >
                  <div className="text-sm font-semibold uppercase tracking-wide">
                    {weekDays[day.date.getDay()]}
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    {day.date.getDate()}
                  </div>
                </div>
              ))}
            </div>

            {/* Week appointments */}
            <div className="grid grid-cols-7 gap-4 min-h-[300px]">
              {getWeekDays().map((day, index) => (
                <div key={index} className="space-y-2 border-r border-gray-100 pr-2 last:border-r-0">
                  {day.appointments.map((apt, i) => (
                    <div
                      key={i}
                      className={`
                        p-2 rounded-lg border cursor-pointer hover:shadow-md transition-all
                        ${getAppointmentColor(apt.appointment_type, apt.status)}
                      `}
                      title={`${apt.patient_name} with Dr. ${apt.doctor_name}`}
                    >
                      <div className="text-xs font-bold mb-1">
                        {formatTime(apt.appointment_time)}
                      </div>
                      <div className="text-xs font-medium truncate">
                        {apt.patient_name}
                      </div>
                      <div className="text-xs opacity-75 truncate">
                        Dr. {apt.doctor_name}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {viewMode === 'day' && (
          <div className="space-y-4">
            {/* Day header */}
            <div className="text-center p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                {currentDate.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric', 
                  year: 'numeric' 
                })}
              </h3>
              <p className="text-gray-600">
                {getAppointmentsForDate(currentDate).length} appointments scheduled
              </p>
            </div>

            {/* Day appointments */}
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {getAppointmentsForDate(currentDate).length > 0 ? (
                getAppointmentsForDate(currentDate).map((apt, index) => (
                  <div
                    key={index}
                    className={`
                      p-4 rounded-xl border-l-4 shadow-sm hover:shadow-md transition-all cursor-pointer
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

export default LiveCalendar;