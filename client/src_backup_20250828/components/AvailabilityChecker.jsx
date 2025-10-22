import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DatePicker from './DatePicker'; // Import der neuen DatePicker-Komponente

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

  // Lade Kategorien von der API
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
        setCategories([]);
      } finally {
        setCategoriesLoading(false);
      }
    };

    fetchCategories();
  }, [apiRequest]);

  // Handler für DatePicker-Komponenten
  const handleDateChange = (name) => (value) => {
    setCheckData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      
      // Automatische Berechnung des Enddatums wenn Startdatum geändert wird
      if (name === 'zeitraum_von' && value && isValidDateFormat(value)) {
        const endDate = calculateEndDate(value);
        newData.zeitraum_bis = endDate;
      }
      
      return newData;
    });
  };

  // Berechne Enddatum (12 Monate später)
  const calculateEndDate = (startDateString) => {
    try {
      const [day, month, year] = startDateString.split('.').map(Number);
      const startDate = new Date(year, month - 1, day); // month ist 0-basiert
      
      // Füge 12 Monate hinzu
      const endDate = new Date(startDate);
      endDate.setFullYear(endDate.getFullYear() + 1);
      
      // Formatiere zurück zu deutschem Format
      const endDay = endDate.getDate().toString().padStart(2, '0');
      const endMonth = (endDate.getMonth() + 1).toString().padStart(2, '0');
      const endYear = endDate.getFullYear();
      
      return `${endDay}.${endMonth}.${endYear}`;
    } catch (error) {
      console.error('Fehler bei Enddatum-Berechnung:', error);
      return '';
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCheckData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validierung für deutsches Datumsformat
  const isValidDateFormat = (dateString) => {
    const regex = /^\d{2}\.\d{2}\.\d{4}$/;
    return regex.test(dateString);
  };

  // Konvertiert deutsches Datumsformat (dd.mm.yyyy) zu ISO 8601
  const convertDateToISO = (dateString, isEndDate = false) => {
    if (!dateString || dateString.trim() === '') {
      // Für Abo-Buchungen: Automatisch 31.12.2099 setzen wenn Enddatum leer
      if (isEndDate) {
        return '2099-12-31T23:59:59.000Z'; // Abo-Datum: 31.12.2099
      }
      return null; // Startdatum darf nicht leer sein
    }
    
    // Parse deutsches Format: dd.mm.yyyy
    const [day, month, year] = dateString.split('.');
    
    // Validiere Teile
    if (!day || !month || !year) {
      // Fallback für Abo-Buchungen
      if (isEndDate) {
        return '2099-12-31T23:59:59.000Z';
      }
      return null;
    }
    
    // Erstelle ISO 8601 Format
    // Startdatum: 00:00:00, Enddatum: 23:59:59 für ganztägige Abdeckung
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
      errors.push('Startdatum ist erforderlich');
    } else if (!isValidDateFormat(checkData.zeitraum_von)) {
      errors.push('Startdatum muss im Format tt.mm.jjjj eingegeben werden');
    }

    if (!checkData.zeitraum_bis) {
      errors.push('Enddatum ist erforderlich');
    } else if (!isValidDateFormat(checkData.zeitraum_bis)) {
      errors.push('Enddatum muss im Format tt.mm.jjjj eingegeben werden');
    }

    // Prüfe ob Enddatum nach Startdatum liegt
    if (checkData.zeitraum_von && checkData.zeitraum_bis && 
        isValidDateFormat(checkData.zeitraum_von) && isValidDateFormat(checkData.zeitraum_bis)) {
      const [startDay, startMonth, startYear] = checkData.zeitraum_von.split('.').map(Number);
      const [endDay, endMonth, endYear] = checkData.zeitraum_bis.split('.').map(Number);
      
      const startDate = new Date(startYear, startMonth - 1, startDay);
      const endDate = new Date(endYear, endMonth - 1, endDay);
      
      if (endDate < startDate) {
        errors.push('Enddatum muss nach dem Startdatum liegen');
      }
    }

    if (!checkData.belegung || checkData.belegung.trim() === '') {
      errors.push('Belegung/Branche ist erforderlich');
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
      // Konvertiere Daten für API - neue anonyme Platzierungslogik
      const apiData = {
        zeitraum_von: convertDateToISO(checkData.zeitraum_von, false),
        zeitraum_bis: convertDateToISO(checkData.zeitraum_bis, true),
        belegung: checkData.belegung
      };

      console.log('Prüfe Verfügbarkeit für Zeitraum:', apiData);

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
          text: `Prüfung abgeschlossen: ${message}`
        });
        
        console.log('Verfügbarkeitsprüfung erfolgreich:', data.data);
      } else {
        setMessage({ type: 'error', text: data.message || 'Fehler bei der Verfügbarkeitsprüfung' });
      }
    } catch (error) {
      console.error('Fehler bei der Verfügbarkeitsprüfung:', error);
      setMessage({ type: 'error', text: 'Netzwerkfehler bei der Verfügbarkeitsprüfung' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Formular */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          🔍 Verfügbarkeitsprüfung
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Zeitraum */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                📅 Startdatum *
              </label>
              <DatePicker
                value={checkData.zeitraum_von}
                onChange={handleDateChange('zeitraum_von')}
                placeholder="tt.mm.jjjj (z.B. 15.07.2024)"
                name="zeitraum_von"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Format: tt.mm.jjjj</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                📅 Enddatum *
              </label>
              <DatePicker
                value={checkData.zeitraum_bis}
                onChange={handleDateChange('zeitraum_bis')}
                placeholder="tt.mm.jjjj (z.B. 20.07.2024)"
                name="zeitraum_bis"
                required
              />
              <p className="text-xs text-gray-500 mt-1">Format: tt.mm.jjjj (wird automatisch auf +12 Monate gesetzt)</p>
            </div>
          </div>

          {/* Belegung/Branche */}
          <div>
            <label className="block text-sm font-medium mb-1 flex items-center gap-2">
              🏢 Belegung/Branche *
            </label>
            <input
              type="text"
              name="belegung"
              value={checkData.belegung}
              onChange={handleInputChange}
              list="belegung-list"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
              placeholder={categoriesLoading ? "Kategorien werden geladen..." : "z.B. Kanalreinigung"}
              required
              disabled={categoriesLoading}
            />
            <datalist id="belegung-list">
              {categories.map(cat => (
                <option key={cat.id} value={cat.name} />
              ))}
            </datalist>
          </div>

          {/* Nachricht */}
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
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? '⏳ Prüfe Verfügbarkeit...' : '🔍 Verfügbarkeit prüfen'}
          </button>
        </form>
      </div>

      {/* Ergebnisse */}
      {results && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            📊 Verfügbarkeitsergebnisse für {results.belegung}
          </h2>
          
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              <strong>Zeitraum:</strong> {formatDateFromISO(results.zeitraum_von)} bis {formatDateFromISO(results.zeitraum_bis)}
            </p>
            <p className="text-gray-700">
              <strong>Belegung:</strong> {results.belegung}
            </p>
          </div>

          {/* Verfügbarkeitsübersicht */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {results.available_places}
              </div>
              <div className="text-sm text-green-700 font-medium">Verfügbare Plätze</div>
            </div>
            
            <div className="text-center bg-red-50 p-4 rounded-lg border border-red-200">
              <div className="text-3xl font-bold text-red-600 mb-2">
                {results.occupied_places}
              </div>
              <div className="text-sm text-red-700 font-medium">Belegte Plätze</div>
            </div>
            
            <div className="text-center bg-blue-50 p-4 rounded-lg border border-blue-200">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {results.total_places}
              </div>
              <div className="text-sm text-blue-700 font-medium">Gesamt Plätze</div>
            </div>
          </div>

          {/* Fortschrittsbalken */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Belegung</span>
              <span>{results.occupied_places} von {results.total_places} Plätzen</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-red-500 h-4 rounded-full transition-all duration-300"
                style={{width: `${(results.occupied_places / results.total_places) * 100}%`}}
              ></div>
            </div>
          </div>

          {/* Status-Nachricht */}
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

