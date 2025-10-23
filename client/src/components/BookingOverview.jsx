import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DatePicker from './DatePicker'; // Import der neuen DatePicker-Komponente
import EditBookingModal from './EditBookingModal';

const BookingOverview = () => {
  const { apiRequest, isAdmin, hasPermission } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [filteredBookings, setFilteredBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    platform: '',
    location: '',
    campaign: '',
    berater: '',
    status: ''
  });

  // Edit Modal State
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Lade Buchungen
  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await apiRequest('/api/bookings');
      if (response.ok) {
        const responseData = await response.json();
        // Backend gibt Objekt mit {success, data, count, filters} zurück
        const bookingsArray = Array.isArray(responseData.data) ? responseData.data : [];
        setBookings(bookingsArray);
        setFilteredBookings(bookingsArray);
        console.log('Buchungen erfolgreich geladen:', bookingsArray.length);
        console.log('Backend Response:', responseData);
      } else {
        console.error('Fehler beim Laden der Buchungen:', response.status);
        // Fallback zu leerem Array
        setBookings([]);
        setFilteredBookings([]);
      }
    } catch (error) {
      console.error('Netzwerkfehler:', error);
      // Fallback zu leerem Array
      setBookings([]);
      setFilteredBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  // Filter-Handler
  const handleFilterChange = (name, value) => {
    const newFilters = { ...filters, [name]: value };
    setFilters(newFilters);
    applyFilters(newFilters);
  };

  // Datumsfilter-Handler
  const handleDateFilterChange = (name) => (value) => {
    handleFilterChange(name, value);
  };

  // Parse date from string (dd.mm.yyyy format)
  const parseDate = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split('.');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    return isNaN(date.getTime()) ? null : date;
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

  // Filter anwenden
  const applyFilters = (currentFilters = filters) => {
    // Sicherheitsprüfung: Stelle sicher, dass bookings ein Array ist
    if (!Array.isArray(bookings)) {
      console.warn('Bookings ist kein Array:', bookings);
      setFilteredBookings([]);
      return;
    }

    // Sicherheitsprüfung: Stelle sicher, dass currentFilters definiert ist
    if (!currentFilters) {
      console.warn('CurrentFilters ist undefined, verwende leere Filter');
      currentFilters = {
        search: '',
        platform: '',
        location: '',
        campaign: '',
        berater: '',
        status: ''
      };
    }
    
    let filtered = bookings.filter(booking => {
      // Allgemeine Suche (Name, Nummer)
      const matchesSearch = !currentFilters.search || 
        booking.kundenname?.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
        booking.kundennummer?.toLowerCase().includes(currentFilters.search.toLowerCase());

      // Plattform
      const matchesPlatform = !currentFilters.platform || 
        booking.platform_name?.toLowerCase().includes(currentFilters.platform.toLowerCase());

      // Ort
      const matchesLocation = !currentFilters.location || 
        booking.location_name?.toLowerCase().includes(currentFilters.location.toLowerCase());

      // Kampagne
      const matchesCampaign = !currentFilters.campaign || 
        booking.campaign_name?.toLowerCase().includes(currentFilters.campaign.toLowerCase());

      // Berater
      const matchesBerater = !currentFilters.berater || 
        booking.berater?.toLowerCase().includes(currentFilters.berater.toLowerCase());

      // Status
      const matchesStatus = !currentFilters.status || 
        currentFilters.status === 'alle' || 
        booking.status === currentFilters.status;

      return matchesSearch && matchesPlatform && matchesLocation && 
             matchesCampaign && matchesBerater && matchesStatus;
    });

    setFilteredBookings(filtered);
  };

  // Filter zurücksetzen
  const resetFilters = () => {
    const emptyFilters = {
      search: '',
      platform: '',
      location: '',
      campaign: '',
      berater: '',
      status: ''
    };
    setFilters(emptyFilters);
    applyFilters(emptyFilters);
  };

  // Buchung löschen
  const deleteBooking = async (id) => {
    if (!confirm('Sind Sie sicher, dass Sie diese Buchung löschen möchten?')) return;

    try {
      const response = await apiRequest(`/api/bookings/${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        fetchBookings(); // Neu laden
      } else {
        alert('Fehler beim Löschen der Buchung');
      }
    } catch (error) {
      alert('Netzwerkfehler beim Löschen');
    }
  };

  // Buchung bearbeiten
  const openEditModal = (booking) => {
    setSelectedBooking(booking);
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setSelectedBooking(null);
  };

  const handleBookingUpdated = (updatedBooking) => {
    // Aktualisiere die Buchungsliste
    const updatedBookings = bookings.map(booking => 
      booking.id === updatedBooking.id ? updatedBooking : booking
    );
    setBookings(updatedBookings);
    
    // Aktualisiere auch die gefilterten Buchungen direkt
    const updatedFilteredBookings = filteredBookings.map(booking => 
      booking.id === updatedBooking.id ? updatedBooking : booking
    );
    setFilteredBookings(updatedFilteredBookings);
    
    // Wende Filter erneut an mit aktuellen Filtern (als Backup)
    setTimeout(() => {
      applyFilters(filters);
    }, 100);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Lade Buchungen...</div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
        📅 Buchungsübersicht
      </h1>
      <p className="text-gray-600 dark:text-gray-400 mb-6">Verwalten und filtern Sie alle Buchungen</p>

      {/* Filter-Sektion */}
      <div className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2 text-gray-900 dark:text-white">
            🔍 Filter
          </h2>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-white/50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200"
          >
            Filter zurücksetzen
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Allgemeine Suche */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              🔍 Suche
            </label>
            <input
              type="text"
              placeholder="Name, Nummer..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-red-500 transition-all duration-200"
            />
          </div>

          {/* Plattform */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              💻 Plattform
            </label>
            <input
              type="text"
              placeholder="z.B. Gelbe Seiten"
              value={filters.platform}
              onChange={(e) => handleFilterChange('platform', e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-red-500 transition-all duration-200"
            />
          </div>

          {/* Ort */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              📍 Ort
            </label>
            <input
              type="text"
              placeholder="z.B. Köln"
              value={filters.location}
              onChange={(e) => handleFilterChange('location', e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-red-500 transition-all duration-200"
            />
          </div>

          {/* Kampagne */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              📅 Kampagne
            </label>
            <input
              type="text"
              placeholder="z.B. 25/26"
              value={filters.campaign}
              onChange={(e) => handleFilterChange('campaign', e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-red-500 transition-all duration-200"
            />
          </div>

          {/* Berater */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              � Berater
            </label>
            <input
              type="text"
              placeholder="z.B. Anna Schmidt"
              value={filters.berater}
              onChange={(e) => handleFilterChange('berater', e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-red-500 transition-all duration-200"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              ✅ Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 transition-all duration-200"
            >
              <option value="">Alle Status</option>
              <option value="vorreserviert">Vorreserviert</option>
              <option value="reserviert">Reserviert</option>
              <option value="gebucht">Gebucht</option>
            </select>
          </div>
        </div>
      </div>

      {/* Ergebnisse */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {filteredBookings.length} von {bookings.length} Buchungen angezeigt
          </p>
        </div>

        {/* Tabelle */}
        <div className="overflow-x-auto">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{width: '15%'}}>
                  Kunde
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{width: '10%'}}>
                  Plattform
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{width: '12%'}}>
                  Artikel
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{width: '10%'}}>
                  Ort
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{width: '12%'}}>
                  Branche
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{width: '8%'}}>
                  Kampagne
                </th>
                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{width: '8%'}}>
                  Status
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{width: '10%'}}>
                  Berater
                </th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{width: '10%'}}>
                  Preis
                </th>
                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider" style={{width: '5%'}}>
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {Array.isArray(filteredBookings) && filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors duration-150">
                  <td className="px-2 py-4" style={{width: '15%'}}>
                    <div className="overflow-hidden">
                      <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {booking.kundenname}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {booking.kundennummer}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-900 dark:text-gray-200" style={{width: '10%'}}>
                    <div className="truncate" title={booking.platform_name}>
                      {booking.platform_name || '-'}
                    </div>
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-900 dark:text-gray-200" style={{width: '12%'}}>
                    <div className="truncate" title={booking.product_name}>
                      {booking.product_name || '-'}
                    </div>
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-900 dark:text-gray-200" style={{width: '10%'}}>
                    <div className="truncate" title={booking.location_name}>
                      {booking.location_name || '-'}
                    </div>
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-900 dark:text-gray-200" style={{width: '12%'}}>
                    <div className="truncate" title={booking.category_name}>
                      {booking.category_name || '-'}
                    </div>
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-900 dark:text-gray-200" style={{width: '8%'}}>
                    <div className="truncate" title={booking.campaign_name}>
                      {booking.campaign_name || '-'}
                    </div>
                  </td>
                  <td className="px-1 py-4 text-center" style={{width: '8%'}}>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium truncate ${
                      booking.status === 'gebucht' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400' :
                      booking.status === 'reserviert' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400' :
                      'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
                    }`} title={booking.status}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-900 dark:text-gray-200" style={{width: '10%'}}>
                    <div className="truncate" title={booking.berater}>
                      {booking.berater}
                    </div>
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-900 dark:text-gray-200 text-right" style={{width: '10%'}}>
                    <div className="text-xs truncate">
                      {booking.verkaufspreis ? 
                        `${parseFloat(booking.verkaufspreis).toLocaleString('de-DE', {
                          style: 'currency',
                          currency: 'EUR'
                        })}` : 
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      }
                    </div>
                  </td>
                  <td className="px-1 py-4 text-center" style={{width: '5%'}}>
                    <div className="flex gap-1 justify-center">
                      {isAdmin() && (
                        <>
                          <button
                            onClick={() => openEditModal(booking)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-sm transition-all duration-200"
                            title="Buchung bearbeiten"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteBooking(booking.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-sm transition-all duration-200"
                            title="Buchung löschen"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                      {!isAdmin() && (
                        <span className="text-gray-400 dark:text-gray-500 text-xs" title="Nur für Administratoren">
                          👁️
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredBookings.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Keine Buchungen gefunden.</p>
          </div>
        )}
      </div>

      {/* Edit Booking Modal */}
      <EditBookingModal
        booking={selectedBooking}
        isOpen={editModalOpen}
        onClose={closeEditModal}
        onBookingUpdated={handleBookingUpdated}
      />
    </div>
  );
};

export default BookingOverview;

