import { useState, useEffect } from 'react';
import useCategories from '../hooks/useCategories';

const BookingOverview = () => {
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const categories = useCategories();
  
  const [filters, setFilters] = useState({
    search: '',
    belegung: '',
    berater: '',
    status: 'all', // Standardwert statt leer
    platzierung: 'all' // Standardwert statt leer
  });

  // Konvertiert ISO Datum zu tt.mm.jjjj Format
  const formatDateForDisplay = (isoString) => {
    const date = new Date(isoString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings`);
      const data = await response.json();
      
      if (response.ok) {
        setBookings(data.data || []);
        setError('');
      } else {
        setError(data.message || 'Fehler beim Laden der Buchungen');
      }
    } catch (error) {
      setError('Netzwerkfehler. Bitte versuchen Sie es erneut.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  useEffect(() => {
    let filtered = bookings;

    // Textsuche
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(booking => 
        booking.kundenname.toLowerCase().includes(searchLower) ||
        booking.kundennummer.toLowerCase().includes(searchLower) ||
        booking.belegung.toLowerCase().includes(searchLower) ||
        booking.berater.toLowerCase().includes(searchLower)
      );
    }

    // Belegung Filter
    if (filters.belegung) {
      filtered = filtered.filter(booking => 
        booking.belegung.toLowerCase().includes(filters.belegung.toLowerCase())
      );
    }

    // Berater Filter
    if (filters.berater) {
      filtered = filtered.filter(booking => 
        booking.berater.toLowerCase().includes(filters.berater.toLowerCase())
      );
    }

    // Status Filter
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(booking => booking.status === filters.status);
    }

    // Platzierung Filter
    if (filters.platzierung && filters.platzierung !== 'all') {
      filtered = filtered.filter(booking => booking.platzierung.toString() === filters.platzierung);
    }

    setFilteredBookings(filtered);
  }, [bookings, filters]);

  const handleFilterChange = (name, value) => {
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDelete = async (id) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Buchung löschen möchten?')) {
      return;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/bookings/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await fetchBookings(); // Neu laden
      } else {
        const data = await response.json();
        alert(data.message || 'Fehler beim Löschen der Buchung');
      }
    } catch (error) {
      alert('Netzwerkfehler beim Löschen der Buchung');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'vorreserviert':
        return 'bg-green-100 text-green-800';
      case 'reserviert':
        return 'bg-yellow-100 text-yellow-800';
      case 'gebucht':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      belegung: '',
      berater: '',
      status: 'all',
      platzierung: 'all'
    });
  };

  if (loading) {
    return (
      <div className="w-full bg-white p-8 rounded-lg shadow-md">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
          Buchungen werden geladen...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          📅 Buchungsübersicht
        </h2>
        <p className="text-gray-600 mb-6">Verwalten und filtern Sie alle Buchungen</p>

        {/* Filter Section */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium flex items-center gap-2">
              🔍 Filter
            </h3>
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Filter zurücksetzen
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                🔍 Suche
              </label>
              <input
                type="text"
                placeholder="Name, Nummer, Belegung..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                🏢 Belegung
              </label>
              <input
                type="text"
                list="filter-belegung-list"
                placeholder="z.B. Kanalreinigung"
                value={filters.belegung}
                onChange={(e) => handleFilterChange('belegung', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <datalist id="filter-belegung-list">
                {categories.map(cat => (
                  <option key={cat.id} value={cat.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                👨‍💼 Berater
              </label>
              <input
                type="text"
                placeholder="z.B. Anna Schmidt"
                value={filters.berater}
                onChange={(e) => handleFilterChange('berater', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle Status</option>
                <option value="vorreserviert">vorreserviert</option>
                <option value="reserviert">Reserviert</option>
                <option value="gebucht">Gebucht</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                📍 Platzierung
              </label>
              <select
                value={filters.platzierung}
                onChange={(e) => handleFilterChange('platzierung', e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Alle Platzierungen</option>
                {[1, 2, 3, 4, 5, 6].map(num => (
                  <option key={num} value={num.toString()}>Platzierung {num}</option>
                ))}
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={fetchBookings}
                className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center justify-center gap-2"
              >
                🔄 Aktualisieren
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-md bg-red-50 text-red-700 border border-red-200 mb-4">
            ❌ {error}
          </div>
        )}

        {/* Results Summary */}
        <div className="mb-4 text-sm text-gray-600">
          {filteredBookings.length} von {bookings.length} Buchungen angezeigt
        </div>

        {/* Table */}
        <div className="border rounded-md overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Kunde</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Belegung</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Zeitraum</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Platzierung</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Berater</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Aktionen</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Keine Buchungen gefunden
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-gray-900">{booking.kundenname}</div>
                        <div className="text-sm text-gray-500">{booking.kundennummer}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">{booking.belegung}</td>
                    <td className="px-4 py-3">
                      <div className="text-sm">
                        <div className="text-gray-900">{formatDateForDisplay(booking.zeitraum_von)}</div>
                        <div className="text-gray-500">bis {formatDateForDisplay(booking.zeitraum_bis)}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        📍 {booking.platzierung}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 text-sm text-gray-900">
                        👤 {booking.berater}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleDelete(booking.id)}
                        className="text-red-600 hover:text-red-700 p-1 rounded"
                        title="Buchung löschen"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BookingOverview;

