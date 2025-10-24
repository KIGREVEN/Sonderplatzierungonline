import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const EditBookingModal = ({ booking, isOpen, onClose, onBookingUpdated }) => {
  const { apiRequest } = useAuth();
  
  // Form state - supports both campaign and duration modes
  const [formData, setFormData] = useState({
    kundenname: '',
    kundennummer: '',
    platform_id: '',
    article_type_id: '',
    product_id: '',
    category_id: '',
    location_id: '',
    campaign_id: '',
    duration_start: '',
    duration_end: '',
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
  const [isCampaignBased, setIsCampaignBased] = useState(true); // Default: campaign mode

  // Load initial data (platforms, categories, locations, campaigns)
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!isOpen) return;
      
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
  }, [isOpen, apiRequest]);

  // Fill form with booking data when modal opens
// Load products for booking.product_id directly after modal opens, if article_type_id is not set
useEffect(() => {
  if (!isOpen || !booking || !booking.product_id || formData.article_type_id) return;
  // Lade articleTypes für platform_id, falls noch leer
  const fetchTypesAndProducts = async () => {
    try {
      let articleTypeId;
      if (articleTypes.length === 0 && booking.platform_id) {
        const platformRes = await apiRequest(`/api/platforms/${booking.platform_id}`);
        if (platformRes.ok) {
          const platformData = await platformRes.json();
          const typesRes = await apiRequest(`/api/article-types?platform_key=${encodeURIComponent(platformData.data.key)}`);
          if (typesRes.ok) {
            const typesData = await typesRes.json();
            setArticleTypes(typesData.data || []);
          }
        }
      }
      // Lade Produktdaten direkt
      const res = await apiRequest(`/api/products/${booking.product_id}`);
      if (res.ok) {
        const data = await res.json();
        articleTypeId = data.data?.article_type_id;
        if (articleTypeId) {
          // Lade alle Produkte für diesen article_type_id
          const prodRes = await apiRequest(`/api/products?articleTypeId=${articleTypeId}&active_only=true`);
          if (prodRes.ok) {
            const prodData = await prodRes.json();
            setProducts(prodData.data || []);
          }
        }
      }
    } catch (error) {
      console.error('Error loading product/articleTypes for modal:', error);
    }
  };
  fetchTypesAndProducts();
}, [isOpen, booking, formData.article_type_id, articleTypes.length, apiRequest]);
  useEffect(() => {
    if (booking && isOpen) {
      // Detect mode from booking data
      const hasDateRange = booking.duration_start && booking.duration_end;
      const hasCampaign = booking.campaign_id;
      
      setFormData({
        kundenname: booking.kundenname || '',
        kundennummer: booking.kundennummer || '',
        platform_id: booking.platform_id || '',
        article_type_id: '', // wird nachgeladen
        product_id: booking.product_id || '',
        category_id: booking.category_id || '',
        location_id: booking.location_id || '',
        campaign_id: booking.campaign_id || '',
        duration_start: booking.duration_start ? booking.duration_start.split('T')[0] : '',
        duration_end: booking.duration_end ? booking.duration_end.split('T')[0] : '',
        status: booking.status || 'reserviert',
        berater: booking.berater || '',
        verkaufspreis: booking.verkaufspreis || ''
      });
      
      // Set initial campaign mode based on data
      if (hasDateRange && !hasCampaign) {
        setIsCampaignBased(false);
      } else {
        setIsCampaignBased(true);
      }
    }
  }, [booking, isOpen]);

  // CASCADE: When platform changes, load article types for that platform
  useEffect(() => {
    const fetchArticleTypes = async () => {
      if (!formData.platform_id || !isOpen) {
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
  }, [formData.platform_id, platforms, isOpen, apiRequest]);

  // CASCADE: When article type changes, load products (articles) for that type
  useEffect(() => {
    const fetchProducts = async () => {
      if (!formData.article_type_id || !isOpen) {
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
  }, [formData.article_type_id, isOpen, apiRequest]);

  // NEW: Detect campaign mode when article type changes (but only when manually changing, not on initial load)
  useEffect(() => {
    const fetchArticleTypeMode = async () => {
      if (!formData.article_type_id || !isOpen) return;

      try {
        const res = await apiRequest(`/api/article-types/${formData.article_type_id}`);
        if (res.ok) {
          const data = await res.json();
          // Only update mode if we don't have booking data (i.e., when user changes article type)
          if (!booking || !booking.product_id) {
            setIsCampaignBased(data.data?.is_campaign_based !== false);
          }
        }
      } catch (error) {
        console.error('Error loading article type mode:', error);
      }
    };

    fetchArticleTypeMode();
  }, [formData.article_type_id, isOpen, apiRequest, booking]);

  // Load article_type_id from product when editing existing booking
  // Set article_type_id after products and articleTypes are loaded and booking.product_id is present
  useEffect(() => {
    if (!isOpen || !booking || !booking.product_id || products.length === 0 || articleTypes.length === 0) return;
    // Finde das Produkt in der geladenen Liste
    const product = products.find(p => p.id === parseInt(booking.product_id));
    if (product && product.article_type_id) {
      setFormData(prev => ({
        ...prev,
        article_type_id: product.article_type_id
      }));
      // Detect campaign mode from article type
      const articleType = articleTypes.find(a => a.id === product.article_type_id);
      if (articleType) {
        const articleTypeIsCampaignBased = articleType.is_campaign_based !== false;
        if (booking.duration_start && booking.duration_end && !articleTypeIsCampaignBased) {
          setIsCampaignBased(false);
        } else if (booking.campaign_id && articleTypeIsCampaignBased) {
          setIsCampaignBased(true);
        } else {
          setIsCampaignBased(articleTypeIsCampaignBased);
        }
      }
    }
  }, [isOpen, booking, products, articleTypes]);

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
    
    // Conditional validation based on article type mode
    if (isCampaignBased) {
      if (!formData.campaign_id) errors.push('Kampagne ist erforderlich');
    } else {
      if (!formData.duration_start) errors.push('Startdatum ist erforderlich');
      if (!formData.duration_end) errors.push('Enddatum ist erforderlich');
      if (formData.duration_start && formData.duration_end && formData.duration_start > formData.duration_end) {
        errors.push('Enddatum muss nach dem Startdatum liegen');
      }
    }
    
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
        status: formData.status,
        berater: formData.berater,
        verkaufspreis: formData.verkaufspreis ? parseFloat(formData.verkaufspreis) : null
      };

      // Add campaign_id OR duration fields based on mode
      if (isCampaignBased) {
        apiData.campaign_id = parseInt(formData.campaign_id);
      } else {
        apiData.duration_start = formData.duration_start;
        apiData.duration_end = formData.duration_end;
      }

      const response = await apiRequest(`/api/bookings/${booking.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(apiData)
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMessage({ 
          type: 'success', 
          text: 'Buchung erfolgreich aktualisiert!' 
        });

        if (onBookingUpdated) {
          onBookingUpdated(data.data);
        }

        setTimeout(() => {
          onClose();
        }, 1500);
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
      console.error('Error updating booking:', error);
      setMessage({ 
        type: 'error', 
        text: 'Fehler beim Aktualisieren der Buchung: ' + error.message 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/75 dark:bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-card rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              ✏️ Buchung bearbeiten
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 text-2xl transition-colors duration-200"
            >
              ✕
            </button>
          </div>

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
