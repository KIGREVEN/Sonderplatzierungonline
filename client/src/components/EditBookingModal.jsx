import { useState, useEffect } from 'react';import { useState, useEffect } from 'react';

import { useAuth } from '../context/AuthContext';import { useAuth } from '../context/AuthContext';



const EditBookingModal = ({ booking, isOpen, onClose, onBookingUpdated }) => {const EditBookingModal = ({ booking, isOpen, onClose, onBookingUpdated }) => {

  const { apiRequest } = useAuth();  const { apiRequest } = useAuth();

    

  // Form state - supports both campaign and duration modes  // Form state - supports both campaign and duration modes

  const [formData, setFormData] = useState({  const [formData, setFormData] = useState({

    kundenname: '',    kundenname: '',

    kundennummer: '',    kundennummer: '',

    platform_id: '',    platform_id: '',

    article_type_id: '',    article_type_id: '',

    product_id: '',    product_id: '',

    category_id: '',    category_id: '',

    location_id: '',    location_id: '',

    campaign_id: '',    campaign_id: '',

    duration_start: '',    duration_start: '',

    duration_end: '',    duration_end: '',

    status: 'reserviert',    status: 'reserviert',

    berater: '',    berater: '',

    verkaufspreis: ''    verkaufspreis: ''

  });  });



  // Data lists  // Data lists

  const [platforms, setPlatforms] = useState([]);  const [platforms, setPlatforms] = useState([]);

  const [articleTypes, setArticleTypes] = useState([]);  const [articleTypes, setArticleTypes] = useState([]);

  const [products, setProducts] = useState([]);  const [products, setProducts] = useState([]);

  const [categories, setCategories] = useState([]);  const [categories, setCategories] = useState([]);

  const [locations, setLocations] = useState([]);  const [locations, setLocations] = useState([]);

  const [campaigns, setCampaigns] = useState([]);  const [campaigns, setCampaigns] = useState([]);



  // UI state  // UI state

  const [loading, setLoading] = useState(false);  const [loading, setLoading] = useState(false);

  const [message, setMessage] = useState({ type: '', text: '' });  const [message, setMessage] = useState({ type: '', text: '' });

  const [isCampaignBased, setIsCampaignBased] = useState(true);  const [isCampaignBased, setIsCampaignBased] = useState(true);



  // Load initial data (platforms, categories, locations, campaigns)  // Lade Kategorien von der API

  useEffect(() => {  useEffect(() => {

    const fetchInitialData = async () => {    const fetchCategories = async () => {

      if (!isOpen) return;      try {

              setCategoriesLoading(true);

      try {        const response = await apiRequest('/api/categories');

        const [pRes, catRes, locRes, campRes] = await Promise.all([        

          apiRequest('/api/platforms?active_only=true'),        if (response.ok) {

          apiRequest('/api/categories?active_only=true'),          const data = await response.json();

          apiRequest('/api/locations?active_only=true'),          if (Array.isArray(data.data)) {

          apiRequest('/api/campaigns?active_only=true')            setCategories(data.data);

        ]);          } else {

            console.warn('Categories data is not an array:', data);

        if (pRes.ok) {            setCategories([]);

          const data = await pRes.json();          }

          setPlatforms(data.data || []);        } else {

        }          console.error('Failed to fetch categories:', response.statusText);

        if (catRes.ok) {          setCategories([]);

          const data = await catRes.json();        }

          setCategories(data.data || []);      } catch (error) {

        }        console.error('Error fetching categories:', error);

        if (locRes.ok) {        setCategories([]);

          const data = await locRes.json();      } finally {

          setLocations(data.data || []);        setCategoriesLoading(false);

        }      }

        if (campRes.ok) {    };

          const data = await campRes.json();

          setCampaigns(data.data || []);    if (isOpen) {

        }      fetchCategories();

      } catch (error) {    }

        console.error('Error loading initial data:', error);  }, [isOpen, apiRequest]);

      }

    };  // Konvertiert ISO-Datum zu deutschem Format (dd.mm.yyyy)

  const formatDateFromISO = (isoString) => {

    fetchInitialData();    if (!isoString) return '';

  }, [isOpen, apiRequest]);    const date = new Date(isoString);

    const day = date.getDate().toString().padStart(2, '0');

  // Fill form with booking data when modal opens    const month = (date.getMonth() + 1).toString().padStart(2, '0');

  useEffect(() => {    const year = date.getFullYear();

    if (booking && isOpen) {    return `${day}.${month}.${year}`;

      setFormData({  };

        kundenname: booking.kundenname || '',

        kundennummer: booking.kundennummer || '',  // Fülle Formular mit Buchungsdaten wenn Modal geöffnet wird

        platform_id: booking.platform_id || '',  useEffect(() => {

        article_type_id: '', // Will be loaded from product    if (booking && isOpen) {

        product_id: booking.product_id || '',      // Prüfe auf Abo-Buchungen (31.12.2099)

        category_id: booking.category_id || '',      const isAbo = booking.zeitraum_bis && new Date(booking.zeitraum_bis).getFullYear() === 2099;

        location_id: booking.location_id || '',      

        campaign_id: booking.campaign_id || '',      setFormData({

        duration_start: booking.duration_start ? booking.duration_start.split('T')[0] : '',        kundenname: booking.kundenname || '',

        duration_end: booking.duration_end ? booking.duration_end.split('T')[0] : '',        kundennummer: booking.kundennummer || '',

        status: booking.status || 'reserviert',        belegung: booking.belegung || '',

        berater: booking.berater || '',        zeitraum_von: formatDateFromISO(booking.zeitraum_von),

        verkaufspreis: booking.verkaufspreis || ''        zeitraum_bis: isAbo ? '' : formatDateFromISO(booking.zeitraum_bis), // Abo-Buchungen: leer anzeigen

      });        status: booking.status || 'reserviert',

      setMessage({ type: '', text: '' });        berater: booking.berater || '',

    }        verkaufspreis: booking.verkaufspreis || ''

  }, [booking, isOpen]);      });

      setMessage({ type: '', text: '' });

  // CASCADE: When platform changes, load article types for that platform    }

  useEffect(() => {  }, [booking, isOpen]);

    const fetchArticleTypes = async () => {

      if (!formData.platform_id || !isOpen) {  const handleInputChange = (e) => {

        setArticleTypes([]);    const { name, value } = e.target;

        setProducts([]);    setFormData(prev => ({

        return;      ...prev,

      }      [name]: value

    }));

      try {  };

        const platform = platforms.find(p => p.id === parseInt(formData.platform_id));

        if (!platform) return;  const handleDateChange = (field, date) => {

    setFormData(prev => ({

        const res = await apiRequest(`/api/article-types?platform_key=${encodeURIComponent(platform.key)}`);      ...prev,

        if (res.ok) {      [field]: date

          const data = await res.json();    }));

          setArticleTypes(data.data || []);  };

        }

      } catch (error) {  const handleSubmit = async (e) => {

        console.error('Error loading article types:', error);    e.preventDefault();

      }    setLoading(true);

    };    setMessage({ type: '', text: '' });



    fetchArticleTypes();    try {

  }, [formData.platform_id, platforms, isOpen, apiRequest]);      // Validierung

      if (!formData.kundenname.trim()) {

  // CASCADE: When article type changes, load products (articles) for that type        throw new Error('Kundenname ist erforderlich');

  useEffect(() => {      }

    const fetchProducts = async () => {      if (!formData.kundennummer.trim()) {

      if (!formData.article_type_id || !isOpen) {        throw new Error('Kundennummer ist erforderlich');

        setProducts([]);      }

        setIsCampaignBased(true);      if (!formData.belegung.trim()) {

        return;        throw new Error('Belegung ist erforderlich');

      }      }

      if (!formData.zeitraum_von) {

      try {        throw new Error('Von-Datum ist erforderlich');

        const res = await apiRequest(`/api/products?articleTypeId=${formData.article_type_id}&active_only=true`);      }

        if (res.ok) {      // Bis-Datum ist optional für Abo-Buchungen

          const data = await res.json();      if (!formData.berater.trim()) {

          setProducts(data.data || []);        throw new Error('Berater ist erforderlich');

        }      }

      } catch (error) {

        console.error('Error loading products:', error);      // Konvertiert deutsches Datumsformat (dd.mm.yyyy) zu ISO 8601

      }      const convertDateToISO = (dateString, isEndDate = false) => {

    };        if (!dateString || dateString.trim() === '') {

          // Für Abo-Buchungen: Automatisch 31.12.2099 setzen wenn Enddatum leer

    fetchProducts();          if (isEndDate) {

  }, [formData.article_type_id, isOpen, apiRequest]);            return '2099-12-31T23:59:59.000Z'; // Abo-Datum: 31.12.2099

          }

  // Detect campaign mode when article type changes          return null; // Startdatum darf nicht leer sein

  useEffect(() => {        }

    const fetchArticleTypeMode = async () => {        

      if (!formData.article_type_id || !isOpen) return;        // Parse deutsches Format: dd.mm.yyyy

        const [day, month, year] = dateString.split('.');

      try {        

        const res = await apiRequest(`/api/article-types/${formData.article_type_id}`);        // Validiere Teile

        if (res.ok) {        if (!day || !month || !year) {

          const data = await res.json();          // Fallback für Abo-Buchungen

          setIsCampaignBased(data.data?.is_campaign_based !== false);          if (isEndDate) {

        }            return '2099-12-31T23:59:59.000Z';

      } catch (error) {          }

        console.error('Error loading article type mode:', error);          return null;

        setIsCampaignBased(true);        }

      }        

    };        // Erstelle ISO 8601 Format

        // Startdatum: 00:00:00, Enddatum: 23:59:59 für ganztägige Abdeckung

    fetchArticleTypeMode();        const time = isEndDate ? '23:59:59.000Z' : '00:00:00.000Z';

  }, [formData.article_type_id, isOpen, apiRequest]);        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}T${time}`;

        

  // Load article_type_id from product when editing existing booking        return isoDate;

  useEffect(() => {      };

    const fetchProductArticleType = async () => {

      if (!formData.product_id || !isOpen || formData.article_type_id) return;      const bookingData = {

        kundenname: formData.kundenname.trim(),

      try {        kundennummer: formData.kundennummer.trim(),

        const res = await apiRequest(`/api/products/${formData.product_id}`);        belegung: formData.belegung.trim(),

        if (res.ok) {        zeitraum_von: convertDateToISO(formData.zeitraum_von, false),

          const data = await res.json();        zeitraum_bis: convertDateToISO(formData.zeitraum_bis, true), // Automatisch 31.12.2099 für Abo-Buchungen

          if (data.data?.article_type_id) {        status: formData.status,

            setFormData(prev => ({        berater: formData.berater.trim(),

              ...prev,        verkaufspreis: formData.verkaufspreis ? parseFloat(formData.verkaufspreis) : null

              article_type_id: data.data.article_type_id        // platzierung wird nicht mehr geändert - bleibt automatisch verwaltet

            }));      };

          }

        }      const response = await apiRequest(`/api/bookings/${booking.id}`, {

      } catch (error) {        method: 'PUT',

        console.error('Error loading product details:', error);        headers: {

      }          'Content-Type': 'application/json',

    };        },

        body: JSON.stringify(bookingData)

    fetchProductArticleType();      });

  }, [formData.product_id, isOpen, apiRequest]);

      const result = await response.json();

  const handleInputChange = (e) => {

    const { name, value } = e.target;      if (response.ok) {

    setFormData(prev => ({        setMessage({ 

      ...prev,          type: 'success', 

      [name]: value          text: 'Buchung erfolgreich aktualisiert!' 

    }));        });

  };        

        // Benachrichtige Parent-Komponente

  const validateForm = () => {        if (onBookingUpdated) {

    const errors = [];          onBookingUpdated(result.data);

            }

    if (!formData.kundenname.trim()) errors.push('Kundenname ist erforderlich');        

    if (!formData.kundennummer.trim()) errors.push('Kundennummer ist erforderlich');        // Schließe Modal nach kurzer Verzögerung

    if (!formData.platform_id) errors.push('Plattform ist erforderlich');        setTimeout(() => {

    if (!formData.product_id) errors.push('Artikel ist erforderlich');          onClose();

    if (!formData.category_id) errors.push('Branche ist erforderlich');        }, 1500);

    if (!formData.location_id) errors.push('Ort ist erforderlich');      } else {

            throw new Error(result.message || 'Fehler beim Aktualisieren der Buchung');

    if (isCampaignBased) {      }

      if (!formData.campaign_id) errors.push('Kampagne ist erforderlich');    } catch (error) {

    } else {      console.error('Update error:', error);

      if (!formData.duration_start) errors.push('Startdatum ist erforderlich');      setMessage({ 

      if (!formData.duration_end) errors.push('Enddatum ist erforderlich');        type: 'error', 

      if (formData.duration_start && formData.duration_end && formData.duration_start > formData.duration_end) {        text: error.message || 'Ein Fehler ist aufgetreten' 

        errors.push('Enddatum muss nach dem Startdatum liegen');      });

      }    } finally {

    }      setLoading(false);

        }

    if (!formData.berater.trim()) errors.push('Berater ist erforderlich');  };



    return errors;  if (!isOpen) return null;

  };

  return (

  const handleSubmit = async (e) => {    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">

    e.preventDefault();      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">

            <div className="p-6">

    const errors = validateForm();          <div className="flex justify-between items-center mb-6">

    if (errors.length > 0) {            <h2 className="text-2xl font-bold text-gray-900">

      setMessage({               ✏️ Buchung bearbeiten

        type: 'error',             </h2>

        text: 'Bitte füllen Sie alle Pflichtfelder aus: ' + errors.join(', ')             <button

      });              onClick={onClose}

      return;              className="text-gray-400 hover:text-gray-600 text-2xl"

    }            >

              ✕

    setLoading(true);            </button>

    setMessage({ type: '', text: '' });          </div>



    try {          {message.text && (

      const apiData = {            <div className={`mb-4 p-4 rounded-md ${

        kundenname: formData.kundenname,              message.type === 'success' 

        kundennummer: formData.kundennummer,                ? 'bg-green-50 text-green-800 border border-green-200' 

        platform_id: parseInt(formData.platform_id),                : 'bg-red-50 text-red-800 border border-red-200'

        product_id: parseInt(formData.product_id),            }`}>

        category_id: parseInt(formData.category_id),              {message.text}

        location_id: parseInt(formData.location_id),            </div>

        status: formData.status,          )}

        berater: formData.berater,

        verkaufspreis: formData.verkaufspreis ? parseFloat(formData.verkaufspreis) : null          <form onSubmit={handleSubmit} className="space-y-4">

      };            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

              <div>

      if (isCampaignBased) {                <label className="block text-sm font-medium mb-1 flex items-center gap-2">

        apiData.campaign_id = parseInt(formData.campaign_id);                  👤 Kundenname *

      } else {                </label>

        apiData.duration_start = formData.duration_start;                <input

        apiData.duration_end = formData.duration_end;                  type="text"

      }                  name="kundenname"

                  value={formData.kundenname}

      const response = await apiRequest(`/api/bookings/${booking.id}`, {                  onChange={handleInputChange}

        method: 'PUT',                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"

        headers: {                  placeholder="Max Mustermann"

          'Content-Type': 'application/json',                  required

        },                />

        body: JSON.stringify(apiData)              </div>

      });

              <div>

      const data = await response.json();                <label className="block text-sm font-medium mb-1 flex items-center gap-2">

                        🔢 Kundennummer *

      if (response.ok && data.success) {                </label>

        setMessage({                 <input

          type: 'success',                   type="text"

          text: 'Buchung erfolgreich aktualisiert!'                   name="kundennummer"

        });                  value={formData.kundennummer}

                  onChange={handleInputChange}

        if (onBookingUpdated) {                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"

          onBookingUpdated(data.data);                  placeholder="K-12345"

        }                  required

                />

        setTimeout(() => {              </div>

          onClose();            </div>

        }, 1500);

      } else {            <div>

        if (response.status === 409 || (data.error && data.error.name === 'ConflictError')) {              <label className="block text-sm font-medium mb-1 flex items-center gap-2">

          setMessage({                 🏢 Belegung *

            type: 'error',               </label>

            text: 'Die gewünschte Belegung ist bereits belegt.'               {categoriesLoading ? (

          });                <input

        } else if (response.status === 400 && data.details) {                  type="text"

          const errorMessages = data.details.map(detail => `${detail.field}: ${detail.message}`);                  name="belegung"

          setMessage({                   value={formData.belegung}

            type: 'error',                   onChange={handleInputChange}

            text: `Validierungsfehler: ${errorMessages.join(', ')}`                   className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"

          });                  placeholder="Lade Kategorien..."

        } else {                  required

          setMessage({                 />

            type: 'error',               ) : (

            text: data.message || data.error || `Fehler ${response.status}`                 <input

          });                  type="text"

        }                  name="belegung"

      }                  value={formData.belegung}

    } catch (error) {                  onChange={handleInputChange}

      console.error('Error updating booking:', error);                  list="categories-list"

      setMessage({                   className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"

        type: 'error',                   placeholder="z.B. Kanalreinigung"

        text: 'Fehler beim Aktualisieren der Buchung: ' + error.message                   required

      });                />

    } finally {              )}

      setLoading(false);              <datalist id="categories-list">

    }                {Array.isArray(categories) && categories.map((category) => (

  };                  <option key={category.id} value={category.name} />

                ))}

  if (!isOpen) return null;              </datalist>

            </div>

  return (

    <div className="fixed inset-0 bg-black/75 dark:bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      <div className="glass-card rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">              <div>

        <div className="p-6">                <label className="block text-sm font-medium mb-1 flex items-center gap-2">

          <div className="flex justify-between items-center mb-6">                  📅 Von Datum *

            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">                </label>

              ✏️ Buchung bearbeiten                <DatePicker

            </h2>                  value={formData.zeitraum_von}

            <button                  onChange={(date) => handleDateChange('zeitraum_von', date)}

              onClick={onClose}                  placeholder="tt.mm.jjjj"

              className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 text-2xl transition-colors duration-200"                  required

            >                />

              ✕              </div>

            </button>

          </div>              <div>

                <label className="block text-sm font-medium mb-1 flex items-center gap-2">

          {message.text && (                  📅 Bis Datum <span className="text-gray-500 text-xs">(optional für Abo-Buchungen)</span>

            <div                </label>

              className={`mb-4 p-4 rounded-xl ${                <DatePicker

                message.type === 'success'                  value={formData.zeitraum_bis}

                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'                  onChange={(date) => handleDateChange('zeitraum_bis', date)}

                  : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'                  placeholder="tt.mm.jjjj (leer = unbefristetes Abo)"

              }`}                  required={false}

            >                />

              {message.text}                <p className="text-xs text-gray-500 mt-1">

            </div>                  💡 Leer lassen für unbefristete Abo-Buchungen (wird automatisch auf 31.12.2099 gesetzt)

          )}                </p>

              </div>

          <form onSubmit={handleSubmit} className="space-y-4">            </div>

            {/* Kundenname & Kundennummer */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">

              <div>              <p className="text-sm text-gray-600">

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">                ℹ️ Die Platzierung wird automatisch vom System verwaltet und kann nicht geändert werden.

                  Kundenname *              </p>

                </label>            </div>

                <input

                  type="text"            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">

                  name="kundenname"              <div>

                  value={formData.kundenname}                <label className="block text-sm font-medium mb-1 flex items-center gap-2">

                  onChange={handleInputChange}                  📊 Status *

                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"                </label>

                  placeholder="z.B. Max Mustermann"                <select

                  required                  name="status"

                />                  value={formData.status}

              </div>                  onChange={handleInputChange}

                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"

              <div>                >

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">                  <option value="vorreserviert">Vorreserviert</option>

                  Kundennummer *                  <option value="reserviert">Reserviert</option>

                </label>                  <option value="gebucht">Gebucht</option>

                <input                </select>

                  type="text"              </div>

                  name="kundennummer"            </div>

                  value={formData.kundennummer}

                  onChange={handleInputChange}            <div>

                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"              <label className="block text-sm font-medium mb-1 flex items-center gap-2">

                  placeholder="z.B. K-001"                👨‍💼 Berater *

                  required              </label>

                />              <input

              </div>                type="text"

            </div>                name="berater"

                value={formData.berater}

            {/* CASCADE Step 1: Plattform */}                onChange={handleInputChange}

            <div>                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"

              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">                placeholder="Anna Schmidt"

                Plattform *                required

              </label>              />

              <select            </div>

                name="platform_id"

                value={formData.platform_id}            <div>

                onChange={handleInputChange}              <label className="block text-sm font-medium mb-1 flex items-center gap-2">

                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"                💰 Verkaufspreis (optional)

                required              </label>

              >              <input

                <option value="">-- Plattform wählen --</option>                type="number"

                {platforms.map(platform => (                name="verkaufspreis"

                  <option key={platform.id} value={platform.id}>                value={formData.verkaufspreis}

                    {platform.name}                onChange={handleInputChange}

                  </option>                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-red-500 focus:border-transparent"

                ))}                placeholder="1500.00"

              </select>                min="0"

            </div>                step="0.01"

              />

            {/* CASCADE Step 2: Artikel-Typ (filtered by platform) */}              <p className="text-sm text-gray-500 mt-1">

            {formData.platform_id && (                Verkaufspreis in Euro (z.B. 1500.00)

              <div>              </p>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">            </div>

                  Artikel-Typ *

                </label>            <div className="flex gap-3 pt-4">

                <select              <button

                  name="article_type_id"                type="submit"

                  value={formData.article_type_id}                disabled={loading}

                  onChange={handleInputChange}                className={`flex-1 py-3 px-4 rounded font-medium transition-colors ${

                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"                  loading

                  required                    ? 'bg-gray-400 text-white cursor-not-allowed'

                >                    : 'bg-red-600 text-white hover:bg-red-700'

                  <option value="">-- Artikel-Typ wählen --</option>                }`}

                  {articleTypes.map(type => (              >

                    <option key={type.id} value={type.id}>                {loading ? '💾 Wird gespeichert...' : '💾 Änderungen speichern'}

                      {type.name}              </button>

                    </option>              

                  ))}              <button

                </select>                type="button"

              </div>                onClick={onClose}

            )}                className="px-6 py-3 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"

              >

            {/* CASCADE Step 3: Artikel (filtered by article type) */}                Abbrechen

            {formData.article_type_id && (              </button>

              <div>            </div>

                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">          </form>

                  Artikel *        </div>

                </label>      </div>

                <select    </div>

                  name="product_id"  );

                  value={formData.product_id}};

                  onChange={handleInputChange}

                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"export default EditBookingModal;

                  required

                >
                  <option value="">-- Artikel wählen --</option>
                  {products.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Branche (Category) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Branche *
              </label>
              <select
                name="category_id"
                value={formData.category_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
                required
              >
                <option value="">-- Branche wählen --</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Ort (Location) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Ort *
              </label>
              <select
                name="location_id"
                value={formData.location_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
                required
              >
                <option value="">-- Ort wählen --</option>
                {locations.map(location => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Conditional: Kampagne (Campaign) OR Laufzeit (Duration) */}
            {isCampaignBased ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                  Kampagne *
                </label>
                <select
                  name="campaign_id"
                  value={formData.campaign_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
                  required
                >
                  <option value="">-- Kampagne wählen --</option>
                  {campaigns.map(campaign => (
                    <option key={campaign.id} value={campaign.id}>
                      {campaign.label}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Startdatum *
                  </label>
                  <input
                    type="date"
                    name="duration_start"
                    value={formData.duration_start}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                    Enddatum *
                  </label>
                  <input
                    type="date"
                    name="duration_end"
                    value={formData.duration_end}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
                    required
                  />
                </div>
              </div>
            )}

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
                required
              >
                <option value="vorreserviert">Vorreserviert</option>
                <option value="reserviert">Reserviert</option>
                <option value="gebucht">Gebucht</option>
              </select>
            </div>

            {/* Berater */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Berater *
              </label>
              <input
                type="text"
                name="berater"
                value={formData.berater}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
                placeholder="z.B. Anna Schmidt"
                required
              />
            </div>

            {/* Verkaufspreis (optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
                Verkaufspreis (optional)
              </label>
              <input
                type="number"
                step="0.01"
                name="verkaufspreis"
                value={formData.verkaufspreis}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
                placeholder="z.B. 299.99"
              />
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-3 px-4 rounded-xl shadow-glow focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              >
                {loading ? '⏳ Wird gespeichert...' : '✅ Änderungen speichern'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              >
                Abbrechen
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditBookingModal;
