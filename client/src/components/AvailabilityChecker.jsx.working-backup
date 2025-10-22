import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DatePicker from './DatePicker';

const AvailabilityChecker = () => {
  const { apiRequest } = useAuth();
  const [checkData, setCheckData] = useState({
    zeitraum_von: '',
    zeitraum_bis: '',
    belegung: ''
  });

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  // Load categories from API
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await apiRequest('/api/categories');
        
        if (response.ok) {
          const data = await response.json();
          const categoriesArray = Array.isArray(data.data) ? data.data : [];
          setCategories(categoriesArray);
        } else {
          setCategories([]);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [apiRequest]);

  // Handler for DatePicker components
  const handleDateChange = (name) => (value) => {
    setCheckData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // Automatic calculation of end date when start date changes
      if (name === 'zeitraum_von' && value && isValidDateFormat(value)) {
        const endDate = calculateEndDate(value);
        newData.zeitraum_bis = endDate;
      }
      
      return newData;
    });
  };

  // Calculate end date (12 months later)
  const calculateEndDate = (startDateString) => {
    try {
      const [day, month, year] = startDateString.split('.').map(Number);
      const startDate = new Date(year, month - 1, day); // month is 0-based
      
      // Add 12 months
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
      
      // Format back to German format
      const endDay = endDate.getDate().toString().padStart(2, '0');
      const endMonth = (endDate.getMonth() + 1).toString().padStart(2, '0');
      const endYear = endDate.getFullYear();
      
      return `${endDay}.${endMonth}.${endYear}`;
    } catch (error) {
      console.error('Error calculating end date:', error);
      return '';
    }
  };

  // Handler for Select dropdown - FIXED: Proper select validation
  const handleSelectChange = (e) => {
    const { name, value } = e.target;
    setCheckData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validation for German date format
  const isValidDateFormat = (dateString) => {
    const regex = /^\d{2}\.\d{2}\.\d{4}$/;
    return regex.test(dateString);
  };

  // Convert German date format (dd.mm.yyyy) to ISO 8601
  const convertDateToISO = (dateString, isEndDate = false) => {
    if (!dateString || dateString.trim() === '') {
      // For subscription bookings: Automatically set 31.12.2099 if end date is empty
      if (isEndDate) {
        return '2099-12-31T23:59:59.000Z'; // Subscription date: 31.12.2099
      }
      return null; // Start date cannot be empty
    }
    
    // Parse German format: dd.mm.yyyy
    const [day, month, year] = dateString.split('.');
    
    // Validate parts
    if (!day || !month || !year) {
      // Fallback for subscription bookings
      if (isEndDate) {
        return '2099-12-31T23:59:59.000Z';
      }
      return null;
    }
    
    // Create ISO 8601 format
    // Start date: 00:00:00, End date: 23:59:59 for full day coverage
    const time = isEndDate ? '23:59:59.000Z' : '00:00:00.000Z';
    const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}`;
    
    return isoDate;
  };

  // Format date from ISO to dd.mm.yyyy
  const formatDateFromISO = (isoString) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const validateForm = () => {
    const errors = [];

    if (!checkData.zeitraum_von) {
      errors.push('Start date is required');
    } else if (!isValidDateFormat(checkData.zeitraum_von)) {
      errors.push('Start date must be in format dd.mm.yyyy');
    }

    if (!checkData.zeitraum_bis) {
      errors.push('End date is required');
    } else if (!isValidDateFormat(checkData.zeitraum_bis)) {
      errors.push('End date must be in format dd.mm.yyyy');
    }

    // Check if end date is after start date
    if (checkData.zeitraum_von && checkData.zeitraum_bis && 
        isValidDateFormat(checkData.zeitraum_von) && isValidDateFormat(checkData.zeitraum_bis)) {
      const [startDay, startMonth, startYear] = checkData.zeitraum_von.split('.').map(Number);
      const [endDay, endMonth, endYear] = checkData.zeitraum_bis.split('.').map(Number);
      
      const startDate = new Date(startYear, startMonth - 1, startDay);
      const endDate = new Date(endYear, endMonth - 1, endDay);
      
      if (endDate < startDate) {
        errors.push('End date must be after start date');
      }
    }

    if (!checkData.belegung || checkData.belegung.trim() === '') {
      errors.push('Occupation/Industry is required');
    }

    // FIXED: Validate that the selected occupation exists in available categories
    if (checkData.belegung && categories.length > 0) {
      const validCategory = categories.find(cat => cat.name === checkData.belegung);
      if (!validCategory) {
        errors.push('Please select a valid occupation/industry from the list');
      }
    }

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      setMessage({ type: 'error', text: errors.join(', ') });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    setResults(null);

    try {
      // Convert data for API - new anonymous placement logic
      const apiData = {
        zeitraum_von: convertDateToISO(checkData.zeitraum_von, false),
        zeitraum_bis: convertDateToISO(checkData.zeitraum_bis, true),
        belegung: checkData.belegung
      };

      console.log('Checking availability for period:', apiData);

      const response = await apiRequest(`/api/availability/check?${new URLSearchParams(apiData)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setResults(data.data);
        
        const { available_places, occupied_places, message } = data.data;
        
        setMessage({ 
          type: 'success', 
          text: `Check completed: ${message}`
        });
        
        console.log('Availability check successful:', data.data);
      } else {
        setMessage({ type: 'error', text: data.message || 'Error during availability check' });
      }
    } catch (error) {
      console.error('Error during availability check:', error);
      setMessage({ type: 'error', text: 'Network error during availability check' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Form */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          🔍 Availability Check
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Time Period */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                📅 Start Date *
              </label>
              <DatePicker
                value={checkData.zeitraum_von}
                onChange={handleDateChange('zeitraum_von')}
                placeholder="dd.mm.yyyy (e.g. 15.07.2024)"
                name="zeitraum_von"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Format: dd.mm.yyyy</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                📅 End Date *
              </label>
              <DatePicker
                value={checkData.zeitraum_bis}
                onChange={handleDateChange('zeitraum_bis')}
                placeholder="dd.mm.yyyy (e.g. 20.07.2024)"
                name="zeitraum_bis"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Format: dd.mm.yyyy (automatically set to +12 months)</p>
            </div>
          </div>

          {/* FIXED: Occupation/Industry - Proper Select Dropdown */}
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              🏢 Occupation/Industry *
            </label>
            {categoriesLoading ? (
              <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-50 text-gray-500">
                ⏳ Loading categories...
              </div>
            ) : (
              <select
                name="belegung"
                value={checkData.belegung}
                onChange={handleSelectChange}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white"
                required
              >
                <option value="">-- Please select an occupation/industry --</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Only available categories from the database can be selected
            </p>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || categoriesLoading}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? '⏳ Checking availability...' : '🔍 Check Availability'}
          </button>
        </form>
      </div>

      {/* Results */}
      {results && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📊 Availability Results for {results.belegung}
          </h2>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              <strong>Period:</strong> {formatDateFromISO(results.zeitraum_von)} to {formatDateFromISO(results.zeitraum_bis)}
            </p>
            <p className="text-gray-700">
              <strong>Occupation:</strong> {results.belegung}
            </p>
          </div>

          {/* Availability Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {results.available_places}
              </div>
              <div className="text-sm text-green-700 font-medium">Available Places</div>
            </div>
            
            <div className="text-center bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {results.occupied_places}
              </div>
              <div className="text-sm text-red-700 font-medium">Occupied Places</div>
            </div>
            
            <div className="text-center bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {results.total_places}
              </div>
              <div className="text-sm text-blue-700 font-medium">Total Places</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Occupancy</span>
              <span>{results.occupied_places} of {results.total_places} places</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-red-500 h-4 rounded-full transition-all duration-300"
                style={{width: `${(results.occupied_places / results.total_places) * 100}%`}}
              ></div>
            </div>
          </div>

          {/* Status Message */}
          <div className={`p-4 rounded-lg text-center font-medium ${
            results.is_available 
              ? 'bg-green-100 text-green-800 border border-green-200' 
              : 'bg-red-100 text-red-800 border border-red-200'
          }`}>
            {results.is_available ? '✅' : '❌'} {results.message}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityChecker;

