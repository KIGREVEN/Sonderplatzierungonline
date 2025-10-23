import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const AvailabilityChecker = () => {
  const { apiRequest } = useAuth();
  
  const [checkData, setCheckData] = useState({
    platform_id: '',
    article_type_id: '',
    location_id: '',
    category_id: '',
    campaign_id: ''
  });

  const [platforms, setPlatforms] = useState([]);
  const [articleTypes, setArticleTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [campaigns, setCampaigns] = useState([]);

  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });

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

  useEffect(() => {
    const fetchArticleTypes = async () => {
      if (!checkData.platform_id) {
        setArticleTypes([]);
        return;
      }

      try {
        const platform = platforms.find(p => p.id === parseInt(checkData.platform_id));
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
    setCheckData(prev => ({ ...prev, article_type_id: '' }));
  }, [checkData.platform_id, platforms, apiRequest]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCheckData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!checkData.platform_id) errors.push('Plattform');
    if (!checkData.article_type_id) errors.push('Artikel-Typ');
    if (!checkData.location_id) errors.push('Ort');
    if (!checkData.category_id) errors.push('Belegung (Branche)');
    if (!checkData.campaign_id) errors.push('Kampagne');

    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (errors.length > 0) {
      setMessage({ 
        type: 'error', 
        text: 'Bitte füllen Sie alle Felder aus: ' + errors.join(', ') 
      });
      return;
    }

    setLoading(true);
    setMessage({ type: '', text: '' });
    setResults([]);

    try {
      const productsRes = await apiRequest(`/api/products?articleTypeId=${checkData.article_type_id}&active_only=true`);
      
      if (!productsRes.ok) {
        setMessage({ type: 'error', text: 'Fehler beim Laden der Artikel' });
        setLoading(false);
        return;
      }

      const productsData = await productsRes.json();
      const products = productsData.data || [];

      if (products.length === 0) {
        setMessage({ type: 'info', text: 'Keine Artikel für diesen Artikel-Typ gefunden' });
        setLoading(false);
        return;
      }

      const availabilityResults = await Promise.all(
        products.map(async (product) => {
          const queryParams = new URLSearchParams({
            platform_id: checkData.platform_id,
            product_id: product.id,
            location_id: checkData.location_id,
            category_id: checkData.category_id,
            campaign_id: checkData.campaign_id
          });

          const bookingRes = await apiRequest(`/api/bookings?${queryParams}`);
          
          if (bookingRes.ok) {
            const bookingData = await bookingRes.json();
            const existingBookings = bookingData.data || [];
            
            return {
              product: product,
              is_available: existingBookings.length === 0,
              booking: existingBookings.length > 0 ? existingBookings[0] : null
            };
          }
          
          return {
            product: product,
            is_available: null,
            booking: null,
            error: true
          };
        })
      );

      setResults(availabilityResults);
      
      const availableCount = availabilityResults.filter(r => r.is_available).length;
      const bookedCount = availabilityResults.filter(r => !r.is_available && !r.error).length;
      
      setMessage({ 
        type: 'success', 
        text: `Prüfung abgeschlossen: ${availableCount} verfügbar, ${bookedCount} belegt` 
      });

    } catch (error) {
      console.error('Error during availability check:', error);
      setMessage({ type: 'error', text: 'Netzwerkfehler bei der Verfügbarkeitsprüfung' });
    } finally {
      setLoading(false);
    }
  };

  const platform = platforms.find(p => p.id === parseInt(checkData.platform_id));
  const articleType = articleTypes.find(at => at.id === parseInt(checkData.article_type_id));
  const location = locations.find(l => l.id === parseInt(checkData.location_id));
  const category = categories.find(c => c.id === parseInt(checkData.category_id));
  const campaign = campaigns.find(c => c.id === parseInt(checkData.campaign_id));

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          🔍 Verfügbarkeitsprüfung
        </h1>
        
        <p className="text-gray-600 mb-6">
          Wählen Sie Plattform, Artikel-Typ, Ort, Belegung und Kampagne aus, um zu sehen, welche Artikel verfügbar oder belegt sind.
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plattform *
              </label>
              <select
                name="platform_id"
                value={checkData.platform_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Artikel-Typ *
              </label>
              <select
                name="article_type_id"
                value={checkData.article_type_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                required
                disabled={!checkData.platform_id}
              >
                <option value="">-- Artikel-Typ wählen --</option>
                {articleTypes.map(type => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ort *
              </label>
              <select
                name="location_id"
                value={checkData.location_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Belegung (Branche) *
              </label>
              <select
                name="category_id"
                value={checkData.category_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                required
              >
                <option value="">-- Belegung wählen --</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Kampagne *
              </label>
              <select
                name="campaign_id"
                value={checkData.campaign_id}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
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
          </div>

          {message.text && (
            <div className={`p-4 rounded-md ${
              message.type === 'success' ? 'bg-green-100 text-green-700' : 
              message.type === 'info' ? 'bg-blue-100 text-blue-700' :
              'bg-red-100 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 text-white py-3 px-6 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? '⏳ Prüfe Verfügbarkeit...' : '🔍 Verfügbarkeit prüfen'}
          </button>
        </form>
      </div>

      {results.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            📊 Verfügbarkeit für: {articleType?.name}
          </h2>
          
          <div className="mb-4 text-sm text-gray-600 space-y-1">
            <p><strong>Plattform:</strong> {platform?.name}</p>
            <p><strong>Ort:</strong> {location?.name}</p>
            <p><strong>Belegung:</strong> {category?.name}</p>
            <p><strong>Kampagne:</strong> {campaign?.label}</p>
          </div>

          <div className="space-y-3">
            {results.map((result, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-lg border-2 ${
                  result.is_available 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">
                        {result.is_available ? '✅' : '❌'}
                      </span>
                      <div>
                        <h3 className={`font-bold text-lg ${
                          result.is_available ? 'text-green-800' : 'text-red-800'
                        }`}>
                          {result.product.name}
                        </h3>
                        <p className={`text-sm ${
                          result.is_available ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {result.is_available ? 'Verfügbar' : 'Belegt'}
                        </p>
                      </div>
                    </div>

                    {!result.is_available && result.booking && (
                      <div className="mt-3 ml-11 p-3 bg-white rounded border border-gray-200">
                        <h4 className="font-semibold text-gray-800 mb-2 text-sm">Buchungsinformationen:</h4>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <span className="text-gray-600">Kunde:</span>
                            <p className="font-medium">{result.booking.kundenname}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Kundennummer:</span>
                            <p className="font-medium">{result.booking.kundennummer}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Berater:</span>
                            <p className="font-medium">{result.booking.berater}</p>
                          </div>
                          <div>
                            <span className="text-gray-600">Status:</span>
                            <p className="font-medium">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                result.booking.status === 'gebucht' ? 'bg-green-100 text-green-800' :
                                result.booking.status === 'reserviert' ? 'bg-blue-100 text-blue-800' :
                                'bg-yellow-100 text-yellow-800'
                              }`}>
                                {result.booking.status}
                              </span>
                            </p>
                          </div>
                          {result.booking.verkaufspreis && (
                            <div>
                              <span className="text-gray-600">Verkaufspreis:</span>
                              <p className="font-medium">
                                {new Intl.NumberFormat('de-DE', { 
                                  style: 'currency', 
                                  currency: 'EUR' 
                                }).format(result.booking.verkaufspreis)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityChecker;
