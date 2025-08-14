import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, User } from 'lucide-react';
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

interface MonthCalendarProps {
  className?: string;
}

const MonthCalendar: React.FC<MonthCalendarProps> = ({ className = '' }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [appointments, setAppointments] = useState<Appointment[]>([]);

  // Load appointments from localStorage
  useEffect(() => {
    const loadAppointments = () => {
      try {
        const saved = localStorage.getItem('hospital_appointments');
        if (saved) {
          const parsed = JSON.parse(saved);
          setAppointments(parsed);
        }
      } catch (error) {
        console.error('Error loading appointments:', error);
      }
    };

    loadAppointments();
    const interval = setInterval(loadAppointments, 5000);
    return () => clearInterval(interval);
  }, []);

  // Notification system
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
        
        if (hoursDiff <= 2 && hoursDiff > 1.5 && !notifiedAppointments.includes(`${appointment.id}-2h`)) {
          toast(`⏰ Appointment with ${appointment.patient_name} in 2 hours`, {
            duration: 6000,
            icon: '🔔',
          });
          notifiedAppointments.push(`${appointment.id}-2h`);
        }
        
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

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + (direction === 'next' ? 1 : -1));
      return newDate;
    });
  };

  const getAppointmentsForDate = (date: Date): Appointment[] => {
    const dateStr = date.toISOString().split('T')[0];
    return appointments
      .filter(apt => apt.appointment_date === dateStr && apt.status !== 'cancelled')
      .sort((a, b) => a.appointment_time.localeCompare(b.appointment_time));
  };

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

  const getAppointmentColor = (type: string, status: string) => {
    if (status === 'completed') return 'bg-green-100 text-green-700 border-green-200';
    
    switch (type) {
      case 'consultation': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'follow-up': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'procedure': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'emergency': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className={`bg-white rounded-lg shadow-sm border ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">📅 Appointment Calendar</h2>
            <div className="flex items-center space-x-2 px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>LIVE</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            
            <div className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </div>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
            
            <button
              onClick={() => setCurrentDate(new Date())}
              className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="p-6">
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
            const todayAppointments = day.appointments.filter(apt => apt.status === 'confirmed' || apt.status === 'scheduled');

            return (
              <div
                key={index}
                className={`
                  relative min-h-[120px] p-2 rounded-lg border transition-all hover:shadow-md
                  ${day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                  ${isToday(day.date) ? 'ring-2 ring-blue-500 bg-blue-50' : 'border-gray-200'}
                  ${hasAppointments ? 'border-blue-300' : ''}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-sm font-semibold ${
                    day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                  } ${isToday(day.date) ? 'text-blue-600' : ''}`}>
                    {day.date.getDate()}
                  </span>
                  {hasAppointments && (
                    <span className="text-xs bg-blue-500 text-white px-1 rounded-full">
                      {day.appointments.length}
                    </span>
                  )}
                </div>
                
                {/* Appointments */}
                <div className="space-y-1">
                  {day.appointments.slice(0, 3).map((apt, i) => (
                    <div
                      key={i}
                      className={`
                        text-xs px-2 py-1 rounded border truncate cursor-pointer hover:shadow-sm transition-shadow
                        ${getAppointmentColor(apt.appointment_type, apt.status)}
                      `}
                      title={`${formatTime(apt.appointment_time)} - ${apt.patient_name} with Dr. ${apt.doctor_name} (${apt.appointment_type})`}
                    >
                      <div className="font-medium truncate">
                        {formatTime(apt.appointment_time)}
                      </div>
                      <div className="truncate opacity-90">
                        {apt.patient_name.split(' ')[0]}
                      </div>
                      <div className="truncate opacity-75 text-xs">
                        Dr. {apt.doctor_name.split(' ')[0]}
                      </div>
                    </div>
                  ))}
                  {day.appointments.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium px-2">
                      +{day.appointments.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Summary */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Total appointments this month: {appointments.filter(apt => 
              new Date(apt.appointment_date).getMonth() === currentDate.getMonth() &&
              new Date(apt.appointment_date).getFullYear() === currentDate.getFullYear() &&
              apt.status !== 'cancelled'
            ).length}
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-blue-100 border border-blue-200 rounded"></div>
              <span>Consultation</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
              <span>Emergency</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
              <span>Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonthCalendar;