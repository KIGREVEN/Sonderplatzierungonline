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
    belegung: '',
    berater: '',
    status: '',
    platzierung: '',
    startDate: '', // Neuer Datumsfilter
    endDate: ''    // Neuer Datumsfilter
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
        belegung: '',
        berater: '',
        status: '',
        platzierung: '',
        startDate: '',
        endDate: ''
      };
    }
    
    let filtered = bookings.filter(booking => {
      // Text-basierte Filter
      const matchesSearch = !currentFilters.search || 
        booking.kundenname.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
        booking.kundennummer.toLowerCase().includes(currentFilters.search.toLowerCase()) ||
        booking.belegung.toLowerCase().includes(currentFilters.belegung.toLowerCase());

      const matchesBelegung = !currentFilters.belegung || 
        booking.belegung.toLowerCase().includes(currentFilters.belegung.toLowerCase());

      const matchesBerater = !currentFilters.berater || 
        booking.berater.toLowerCase().includes(currentFilters.berater.toLowerCase());

      const matchesStatus = !currentFilters.status || 
        currentFilters.status === 'alle' || 
        booking.status === currentFilters.status;

      const matchesPlatzierung = !currentFilters.platzierung || 
        currentFilters.platzierung === 'alle' || 
        booking.platzierung.toString() === currentFilters.platzierung;

      // Datumsfilter
      let matchesDateRange = true;
      if (currentFilters.startDate || currentFilters.endDate) {
        const bookingStart = new Date(booking.zeitraum_von);
        const bookingEnd = new Date(booking.zeitraum_bis);
        
        if (currentFilters.startDate) {
          const filterStart = parseDate(currentFilters.startDate);
          if (filterStart && bookingEnd < filterStart) {
            matchesDateRange = false;
          }
        }
        
        if (currentFilters.endDate) {
          const filterEnd = parseDate(currentFilters.endDate);
          if (filterEnd && bookingStart > filterEnd) {
            matchesDateRange = false;
          }
        }
      }

      return matchesSearch && matchesBelegung && matchesBerater && 
             matchesStatus && matchesPlatzierung && matchesDateRange;
    });

    setFilteredBookings(filtered);
  };

  // Filter zurücksetzen
  const resetFilters = () => {
    const emptyFilters = {
      search: '',
      belegung: '',
      berater: '',
      status: '',
      platzierung: '',
      startDate: '',
      endDate: ''
    };
    setFilters(emptyFilters);
    setFilteredBookings(bookings);
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
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-2">
        📅 Buchungsübersicht
      </h1>
      <p className="text-gray-600 mb-6">Verwalten und filtern Sie alle Buchungen</p>

      {/* Filter-Sektion */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            🔍 Filter
          </h2>
          <button
            onClick={resetFilters}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Filter zurücksetzen
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Allgemeine Suche */}
          <div>
            <label className="block text-sm font-medium mb-1">
              🔍 Suche
            </label>
            <input
              type="text"
              placeholder="Name, Nummer, Belegung..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Belegung */}
          <div>
            <label className="block text-sm font-medium mb-1">
              🏢 Belegung
            </label>
            <input
              type="text"
              placeholder="z.B. Kanalreinigung"
              value={filters.belegung}
              onChange={(e) => handleFilterChange('belegung', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Berater */}
          <div>
            <label className="block text-sm font-medium mb-1">
              👨‍💼 Berater
            </label>
            <input
              type="text"
              placeholder="z.B. Anna Schmidt"
              value={filters.berater}
              onChange={(e) => handleFilterChange('berater', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Status
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Alle Status</option>
              <option value="vorreserviert">vorreserviert</option>
              <option value="reserviert">Reserviert</option>
              <option value="gebucht">Gebucht</option>
            </select>
          </div>

          {/* Platzierung */}
          <div>
            <label className="block text-sm font-medium mb-1">
              📍 Platzierung
            </label>
            <select
              value={filters.platzierung}
              onChange={(e) => handleFilterChange('platzierung', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Alle Platzierungen</option>
              <option value="1">Platzierung 1</option>
              <option value="2">Platzierung 2</option>
              <option value="3">Platzierung 3</option>
              <option value="4">Platzierung 4</option>
              <option value="5">Platzierung 5</option>
              <option value="6">Platzierung 6</option>
            </select>
          </div>

          {/* Startdatum Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">
              📅 Von Datum
            </label>
            <DatePicker
              value={filters.startDate}
              onChange={handleDateFilterChange('startDate')}
              placeholder="tt.mm.jjjj"
              name="startDate"
            />
          </div>

          {/* Enddatum Filter */}
          <div>
            <label className="block text-sm font-medium mb-1">
              📅 Bis Datum
            </label>
            <DatePicker
              value={filters.endDate}
              onChange={handleDateFilterChange('endDate')}
              placeholder="tt.mm.jjjj"
              name="endDate"
            />
          </div>
        </div>
      </div>

      {/* Ergebnisse */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200">
          <p className="text-sm text-gray-600">
            {filteredBookings.length} von {bookings.length} Buchungen angezeigt
          </p>
        </div>

        {/* Tabelle */}
        <div className="overflow-hidden">
          <table className="w-full table-fixed">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '20%'}}>
                  Kunde
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '15%'}}>
                  Belegung
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '15%'}}>
                  Zeitraum
                </th>
                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '8%'}}>
                  Platz
                </th>
                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '10%'}}>
                  Status
                </th>
                <th className="px-2 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '12%'}}>
                  Berater
                </th>
                <th className="px-2 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '12%'}}>
                  Preis
                </th>
                <th className="px-1 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider" style={{width: '8%'}}>
                  Aktionen
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {Array.isArray(filteredBookings) && filteredBookings.map((booking) => (
                <tr key={booking.id} className="hover:bg-gray-50">
                  <td className="px-2 py-4" style={{width: '20%'}}>
                    <div className="overflow-hidden">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {booking.kundenname}
                      </div>
                      <div className="text-xs text-gray-500 truncate">
                        {booking.kundennummer}
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-900" style={{width: '15%'}}>
                    <div className="truncate" title={booking.belegung}>
                      {booking.belegung}
                    </div>
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-900" style={{width: '15%'}}>
                    <div className="text-xs">
                      <div className="truncate">
                        {formatDateFromISO(booking.zeitraum_von)}
                      </div>
                      <div className="truncate">
                        {booking.zeitraum_bis && formatDateFromISO(booking.zeitraum_bis) !== '31.12.2099' ? 
                          `bis ${formatDateFromISO(booking.zeitraum_bis)}` : 
                          <span className="text-blue-600 font-medium">🔄 Abo (unbefristet)</span>
                        }
                      </div>
                    </div>
                  </td>
                  <td className="px-1 py-4 text-center" style={{width: '8%'}}>
                    <span className="inline-flex items-center justify-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✅ Belegt
                    </span>
                  </td>
                  <td className="px-1 py-4 text-center" style={{width: '10%'}}>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium truncate ${
                      booking.status === 'gebucht' ? 'bg-green-100 text-green-800' :
                      booking.status === 'reserviert' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`} title={booking.status}>
                      {booking.status}
                    </span>
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-900" style={{width: '12%'}}>
                    <div className="truncate" title={booking.berater}>
                      {booking.berater}
                    </div>
                  </td>
                  <td className="px-2 py-4 text-sm text-gray-900 text-right" style={{width: '12%'}}>
                    <div className="text-xs truncate">
                      {booking.verkaufspreis ? 
                        `${parseFloat(booking.verkaufspreis).toLocaleString('de-DE', {
                          style: 'currency',
                          currency: 'EUR'
                        })}` : 
                        <span className="text-gray-400">-</span>
                      }
                    </div>
                  </td>
                  <td className="px-1 py-4 text-center" style={{width: '8%'}}>
                    <div className="flex gap-1 justify-center">
                      {isAdmin() && (
                        <>
                          <button
                            onClick={() => openEditModal(booking)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 text-sm"
                            title="Buchung bearbeiten"
                          >
                            ✏️
                          </button>
                          <button
                            onClick={() => deleteBooking(booking.id)}
                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 text-sm"
                            title="Buchung löschen"
                          >
                            🗑️
                          </button>
                        </>
                      )}
                      {!isAdmin() && (
                        <span className="text-gray-400 text-xs" title="Nur für Administratoren">
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
            <p className="text-gray-500">Keine Buchungen gefunden.</p>
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

