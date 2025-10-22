import { useState, useRef, useEffect } from 'react';
import { Calendar, X } from 'lucide-react';

const DatePicker = ({ 
  value, 
  onChange, 
  placeholder = "tt.mm.jjjj", 
  name,
  required = false,
  className = "",
  disabled = false 
}) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const calendarRef = useRef(null);
  const inputRef = useRef(null);

  // Parse date from string (dd.mm.yyyy format)
  const parseDate = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split('.');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date;
  };

  // Format date to string (dd.mm.yyyy format)
  const formatDate = (date) => {
    if (!date) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  // Validate date format (dd.mm.yyyy)
  const isValidDateFormat = (dateString) => {
    const dateRegex = /^\d{1,2}\.\d{1,2}\.\d{4}$/;
    if (!dateRegex.test(dateString)) return false;
    const date = parseDate(dateString);
    return date !== null && formatDate(date) === dateString;
  };

  // Handle input change
  const handleInputChange = (e) => {
    const inputValue = e.target.value;
    onChange(inputValue);
    
    // Update selected date if valid
    if (isValidDateFormat(inputValue)) {
      setSelectedDate(parseDate(inputValue));
    }
  };

  // Handle calendar date selection
  const handleDateSelect = (date) => {
    const formattedDate = formatDate(date);
    setSelectedDate(date);
    onChange(formattedDate);
    setIsCalendarOpen(false);
  };

  // Handle calendar toggle
  const toggleCalendar = () => {
    if (disabled) return;
    setIsCalendarOpen(!isCalendarOpen);
  };

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target)) {
        setIsCalendarOpen(false);
      }
    };

    if (isCalendarOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCalendarOpen]);

  // Initialize selected date from value
  useEffect(() => {
    if (value && isValidDateFormat(value)) {
      setSelectedDate(parseDate(value));
    }
  }, [value]);

  // Generate calendar days
  const generateCalendarDays = () => {
    const today = new Date();
    const currentDate = selectedDate || today;
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay() + 1); // Start from Monday
    
    const days = [];
    const currentDay = new Date(startDate);
    
    // Generate 6 weeks (42 days)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    return { days, currentMonth: month, currentYear: year };
  };

  // Navigate calendar month
  const navigateMonth = (direction) => {
    const currentDate = selectedDate || new Date();
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setSelectedDate(newDate);
  };

  const { days, currentMonth, currentYear } = generateCalendarDays();
  const monthNames = [
    'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
    'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
  ];

  return (
    <div className="relative">
      {/* Input Field with Calendar Icon */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          name={name}
          value={value || ''}
          onChange={handleInputChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={`w-full p-3 pr-12 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            disabled ? 'bg-gray-100 cursor-not-allowed' : ''
          } ${className}`}
        />
        <button
          type="button"
          onClick={toggleCalendar}
          disabled={disabled}
          className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded hover:bg-gray-100 ${
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
          }`}
        >
          <Calendar size={20} className="text-gray-500" />
        </button>
      </div>

      {/* Calendar Popup */}
      {isCalendarOpen && (
        <div
          ref={calendarRef}
          className="absolute top-full left-0 mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 min-w-[300px]"
        >
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => navigateMonth(-1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              ←
            </button>
            <h3 className="font-semibold text-lg">
              {monthNames[currentMonth]} {currentYear}
            </h3>
            <button
              type="button"
              onClick={() => navigateMonth(1)}
              className="p-1 hover:bg-gray-100 rounded"
            >
              →
            </button>
            <button
              type="button"
              onClick={() => setIsCalendarOpen(false)}
              className="p-1 hover:bg-gray-100 rounded ml-2"
            >
              <X size={16} />
            </button>
          </div>

          {/* Weekday Headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 p-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => {
              const isCurrentMonth = day.getMonth() === currentMonth;
              const isToday = day.toDateString() === new Date().toDateString();
              const isSelected = selectedDate && day.toDateString() === selectedDate.toDateString();
              
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleDateSelect(day)}
                  className={`p-2 text-sm rounded hover:bg-blue-100 ${
                    !isCurrentMonth 
                      ? 'text-gray-300' 
                      : isSelected 
                        ? 'bg-blue-500 text-white' 
                        : isToday 
                          ? 'bg-blue-100 text-blue-600 font-semibold' 
                          : 'text-gray-700'
                  }`}
                >
                  {day.getDate()}
                </button>
              );
            })}
          </div>

          {/* Today Button */}
          <div className="mt-4 pt-3 border-t border-gray-200">
            <button
              type="button"
              onClick={() => handleDateSelect(new Date())}
              className="w-full p-2 text-sm bg-gray-100 hover:bg-gray-200 rounded"
            >
              Heute auswählen
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatePicker;

