import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const BookingForm = ({ onBookingCreated }) => {
  const { user, apiRequest } = useAuth();
  
  // Form state - SIMPLIFIED (no dates!)
  const [formData, setFormData] = useState({
    kundenname: '',
    kundennummer: '',
    platform_id: '',
    article_type_id: '',
    product_id: '',
    category_id: '',
    location_id: '',
    campaign_id: '',
    status: 'reserviert',
    berater: '',
    verkaufspreis: ''
  });

  // Data lists
  const [platforms, setPlatforms] = useState([]);
  const [articleTypes, setArticleTypes] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  // UI state
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Load initial data (platforms, categories, locations, campaigns)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [pRes, catRes, locRes, campRes] = await Promise.all([
          apiRequest('/api/platforms?active_only=true'),
          apiRequest('/api/categories?active_only=true'),
          apiRequest('/api/locations?active_only=true'),
          apiRequest('/api/campaigns?active_only=true')
        ]);

        if (pRes.ok) {
          const data = await pRes.json();
          setPlatforms(data.data || []);
        }
        if (catRes.ok) {
          const data = await catRes.json();
          setCategories(data.data || []);
        }
        if (locRes.ok) {
          const data = await locRes.json();
          setLocations(data.data || []);
        }
        if (campRes.ok) {
          const data = await campRes.json();
          setCampaigns(data.data || []);
        }
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    fetchInitialData();
  }, [apiRequest]);

  // CASCADE: When platform changes, load article types for that platform
  useEffect(() => {
    const fetchArticleTypes = async () => {
      if (!formData.platform_id) {
        setArticleTypes([]);
        setProducts([]);
        return;
      }

      try {
        // Find platform key from platform_id
        const platform = platforms.find(p => p.id === parseInt(formData.platform_id));
        if (!platform) return;

        const res = await apiRequest(`/api/article-types?platform_key=${encodeURIComponent(platform.key)}`);
        if (res.ok) {
          const data = await res.json();
          setArticleTypes(data.data || []);
        }
      } catch (error) {
        console.error('Error loading article types:', error);
      }
    };

    fetchArticleTypes();
    // Reset dependent fields
    setFormData(prev => ({ ...prev, article_type_id: '', product_id: '' }));
  }, [formData.platform_id, platforms, apiRequest]);

  // CASCADE: When article type changes, load products (articles) for that type
  useEffect(() => {
    const fetchProducts = async () => {
      if (!formData.article_type_id) {
        setProducts([]);
        return;
      }

      try {
        const res = await apiRequest(`/api/products?articleTypeId=${formData.article_type_id}&active_only=true`);
        if (res.ok) {
          const data = await res.json();
          setProducts(data.data || []);
        }
      } catch (error) {
        console.error('Error loading products:', error);
      }
    };

    fetchProducts();
    // Reset product selection
    setFormData(prev => ({ ...prev, product_id: '' }));
  }, [formData.article_type_id, apiRequest]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!formData.kundenname.trim()) errors.push('Kundenname ist erforderlich');
    if (!formData.kundennummer.trim()) errors.push('Kundennummer ist erforderlich');
    if (!formData.platform_id) errors.push('Plattform ist erforderlich');
    if (!formData.product_id) errors.push('Artikel ist erforderlich');
    if (!formData.category_id) errors.push('Branche ist erforderlich');
    if (!formData.location_id) errors.push('Ort ist erforderlich');
    if (!formData.campaign_id) errors.push('Kampagne ist erforderlich');
    if (!formData.berater.trim()) errors.push('Berater ist erforderlich');

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      setMessage({ 
        type: 'error', 
        text: 'Bitte füllen Sie alle Pflichtfelder aus: ' + errors.join(', ') 
      });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const apiData = {
        kundenname: formData.kundenname,
        kundennummer: formData.kundennummer,
        platform_id: parseInt(formData.platform_id),
        product_id: parseInt(formData.product_id),
        category_id: parseInt(formData.category_id),
        location_id: parseInt(formData.location_id),
        campaign_id: parseInt(formData.campaign_id),
        status: formData.status,
        berater: formData.berater,
        verkaufspreis: formData.verkaufspreis ? parseFloat(formData.verkaufspreis) : null
      };

      console.log('Sending simplified booking data:', apiData);

      const response = await apiRequest('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: 'Buchung erfolgreich erstellt!' 
        });
        
        // Form zurücksetzen
        setFormData({
          kundenname: '',
          kundennummer: '',
          platform_id: '',
          article_type_id: '',
          product_id: '',
          category_id: '',
          location_id: '',
          campaign_id: '',
          status: 'reserviert',
          berater: '',
          verkaufspreis: ''
        });

        if (onBookingCreated) {
          onBookingCreated(data.data);
        }
      } else {
        // Handle conflict error (double booking)
        if (response.status === 409 || (data.error && data.error.name === 'ConflictError')) {
          setMessage({ 
            type: 'error', 
            text: 'Die gewünschte Belegung ist bereits belegt.' 
          });
        } else if (response.status === 400 && data.details) {
          const errorMessages = data.details.map(detail => `${detail.field}: ${detail.message}`);
          setMessage({ 
            type: 'error', 
            text: `Validierungsfehler: ${errorMessages.join(', ')}` 
          });
        } else {
          setMessage({ 
            type: 'error', 
            text: data.message || data.error || `Fehler ${response.status}` 
          });
        }
      }
    } catch (error) {
      console.error('Error creating booking:', error);
      setMessage({ 
        type: 'error', 
        text: 'Fehler beim Erstellen der Buchung: ' + error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 glass-card rounded-xl">
      <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-white">
        📝 Neue Buchung erstellen
      </h2>

      {message.text && (
        <div
          className={`mb-4 p-4 rounded-xl ${
            message.type === 'success'
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
          }`}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Kundenname */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Kundenname *
          </label>
          <input
            type="text"
            name="kundenname"
            value={formData.kundenname}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
            placeholder="z.B. Max Mustermann"
            required
          />
        </div>

        {/* Kundennummer */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Kundennummer *
          </label>
          <input
            type="text"
            name="kundennummer"
            value={formData.kundennummer}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
            placeholder="z.B. K-001"
            required
          />
        </div>

        {/* CASCADE Step 1: Plattform */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Plattform *
          </label>
          <select
            name="platform_id"
            value={formData.platform_id}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
            required
          >
            <option value="">-- Plattform wählen --</option>
            {platforms.map(platform => (
              <option key={platform.id} value={platform.id}>
                {platform.name}
              </option>
            ))}
          </select>
        </div>

        {/* CASCADE Step 2: Artikel-Typ (filtered by platform) */}
        {formData.platform_id && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Artikel-Typ *
            </label>
            <select
              name="article_type_id"
              value={formData.article_type_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
              required
            >
              <option value="">-- Artikel-Typ wählen --</option>
              {articleTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* CASCADE Step 3: Artikel (filtered by article type) */}
        {formData.article_type_id && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
              Artikel *
            </label>
            <select
              name="product_id"
              value={formData.product_id}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
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
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
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

        {/* Kampagne (Campaign) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Kampagne *
          </label>
          <select
            name="campaign_id"
            value={formData.campaign_id}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
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

        {/* Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">
            Status *
          </label>
          <select
            name="status"
            value={formData.status}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
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

        {/* Submit Button */}
        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white py-3 px-4 rounded-xl shadow-glow focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {loading ? '⏳ Erstelle Buchung...' : '✅ Buchung erstellen'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
