import React, { useState, useRef, useEffect } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface ModernDatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
}

const ModernDatePicker: React.FC<ModernDatePickerProps> = ({
  value,
  onChange,
  label,
  placeholder = "DD/MM/YYYY",
  className = "",
  disabled = false,
  minDate,
  maxDate
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (value) {
      // Parse YYYY-MM-DD date properly to avoid timezone issues
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      return !isNaN(date.getTime()) ? date : new Date();
    }
    return new Date();
  });
  const [selectedDate, setSelectedDate] = useState<Date | null>(() => {
    if (value) {
      // Parse YYYY-MM-DD date properly to avoid timezone issues
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      return !isNaN(date.getTime()) ? date : null;
    }
    return null;
  });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Month names for display
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Quick date options
  const quickOptions = [
    { label: 'Today', getValue: () => {
      const now = new Date();
      console.log('📅 Quick Today option - Local date:', now.toDateString());
      return now;
    }},
    { label: 'Yesterday', getValue: () => {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      return date;
    }},
    { label: 'This Week Start', getValue: () => {
      const date = new Date();
      const day = date.getDay();
      date.setDate(date.getDate() - day);
      return date;
    }},
    { label: 'Last Week Start', getValue: () => {
      const date = new Date();
      const day = date.getDay();
      date.setDate(date.getDate() - day - 7);
      return date;
    }},
    { label: 'Month Start', getValue: () => {
      const date = new Date();
      date.setDate(1);
      return date;
    }},
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Update selected date when value prop changes
  useEffect(() => {
    if (value) {
      // Parse YYYY-MM-DD date properly to avoid timezone issues
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(year, month - 1, day); // month is 0-indexed
      if (!isNaN(date.getTime())) {
        console.log('📅 Updating date picker value:', { value, parsedDate: date.toDateString() });
        setSelectedDate(date);
        setCurrentMonth(date);
      }
    } else {
      // If no value, reset to null
      setSelectedDate(null);
    }
  }, [value]);

  // Format date for display (Indian format DD/MM/YYYY)
  const formatDisplayDate = (date: Date | null) => {
    if (!date) return '';
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());

    const days = [];
    const current = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }

    return { days, firstDay, lastDay };
  };

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    // Use local date to avoid timezone issues
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;
    
    console.log('📅 Date selected:', { date, dateStr, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone });
    
    // Check min/max constraints
    if (minDate && dateStr < minDate) return;
    if (maxDate && dateStr > maxDate) return;
    
    setSelectedDate(date);
    onChange(dateStr);
    setIsOpen(false);
  };

  // Handle quick option selection
  const handleQuickOption = (option: typeof quickOptions[0]) => {
    const date = option.getValue();
    console.log('🚀 Quick option selected:', option.label, date);
    handleDateSelect(date);
  };

  // Navigate months
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  // Navigate to specific month/year
  const navigateToDate = (year: number, month: number) => {
    setCurrentMonth(new Date(year, month, 1));
  };

  const { days, firstDay, lastDay } = getDaysInMonth(currentMonth);
  const today = new Date();
  // Use local date to avoid timezone issues
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      
      {/* Input Field */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={formatDisplayDate(selectedDate)}
          placeholder={placeholder}
          readOnly
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`
            w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg
            focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-100 disabled:cursor-not-allowed
            cursor-pointer transition-all duration-200
            ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
            hover:border-gray-400
          `}
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          <Calendar className={`h-4 w-4 ${disabled ? 'text-gray-400' : 'text-gray-500'}`} />
        </div>
      </div>

      {/* Dropdown Calendar */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 min-w-[320px] animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Quick Options */}
          <div className="p-3 border-b border-gray-100">
            <div className="text-xs font-medium text-gray-500 mb-2">Quick Select</div>
            <div className="flex flex-wrap gap-1">
              {quickOptions.map((option) => (
                <button
                  key={option.label}
                  onClick={() => handleQuickOption(option)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-blue-100 hover:text-blue-700 rounded-md transition-colors duration-150"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar Header */}
          <div className="flex items-center justify-between p-3 border-b border-gray-100">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-150"
            >
              <ChevronLeft className="h-4 w-4 text-gray-600" />
            </button>
            
            <div className="flex items-center space-x-2">
              <select
                value={currentMonth.getMonth()}
                onChange={(e) => navigateToDate(currentMonth.getFullYear(), parseInt(e.target.value))}
                className="text-sm font-medium bg-transparent border-none focus:outline-none cursor-pointer hover:bg-gray-100 rounded px-2 py-1"
              >
                {monthNames.map((month, index) => (
                  <option key={month} value={index}>{month}</option>
                ))}
              </select>
              
              <select
                value={currentMonth.getFullYear()}
                onChange={(e) => navigateToDate(parseInt(e.target.value), currentMonth.getMonth())}
                className="text-sm font-medium bg-transparent border-none focus:outline-none cursor-pointer hover:bg-gray-100 rounded px-2 py-1"
              >
                {Array.from({ length: 21 }, (_, i) => {
                  const year = new Date().getFullYear() - 10 + i;
                  return (
                    <option key={year} value={year}>{year}</option>
                  );
                })}
              </select>
            </div>
            
            <button
              onClick={() => navigateMonth('next')}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-150"
            >
              <ChevronRight className="h-4 w-4 text-gray-600" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="p-3">
            {/* Day Headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {dayNames.map((day) => (
                <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
            </div>

            {/* Date Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((date, index) => {
                // Use local date format to avoid timezone issues
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                const dateStr = `${year}-${month}-${day}`;
                
                const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                
                // Also fix selected date comparison
                let selectedDateStr = '';
                if (selectedDate) {
                  const selYear = selectedDate.getFullYear();
                  const selMonth = String(selectedDate.getMonth() + 1).padStart(2, '0');
                  const selDay = String(selectedDate.getDate()).padStart(2, '0');
                  selectedDateStr = `${selYear}-${selMonth}-${selDay}`;
                }
                const isSelected = selectedDate && dateStr === selectedDateStr;
                const isToday = dateStr === todayStr;
                const isDisabled = 
                  (minDate && dateStr < minDate) || 
                  (maxDate && dateStr > maxDate);

                return (
                  <button
                    key={index}
                    onClick={() => !isDisabled && handleDateSelect(date)}
                    disabled={isDisabled}
                    className={`
                      w-8 h-8 text-sm rounded-lg transition-all duration-150 relative
                      ${!isCurrentMonth 
                        ? 'text-gray-300 hover:text-gray-400' 
                        : isSelected
                          ? 'bg-blue-600 text-white font-medium shadow-md'
                          : isToday
                            ? 'bg-blue-100 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-100'
                      }
                      ${isDisabled ? 'opacity-25 cursor-not-allowed' : 'cursor-pointer'}
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                    `}
                  >
                    {date.getDate()}
                    {isToday && !isSelected && (
                      <div className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 rounded-full"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Today: {today.toLocaleDateString('en-IN')}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernDatePicker;