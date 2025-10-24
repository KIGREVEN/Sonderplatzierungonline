import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function BookingsPage() {
  const { apiRequest, isAdmin } = useAuth()
  const [bookings, setBookings] = useState([])
  const [platforms, setPlatforms] = useState([])
  const [locations, setLocations] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    platform_id: '',
    location_id: '',
    campaign_id: '',
    status: '',
    berater: ''
  })

  const statusOptions = [
    { value: 'vorreserviert', label: 'Vorreserviert', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'reserviert', label: 'Reserviert', color: 'bg-blue-100 text-blue-800' },
    { value: 'gebucht', label: 'Gebucht', color: 'bg-green-100 text-green-800' }
  ]

  const fetchBookings = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams()
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value)
      })
      
      const res = await apiRequest('/api/bookings?' + queryParams.toString())
      if (res.ok) {
        const data = await res.json()
        setBookings(data.data || [])
      }
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }

  const fetchRelatedData = async () => {
    try {
      const [platformsRes, locationsRes, campaignsRes] = await Promise.all([
        apiRequest('/api/platforms'),
        apiRequest('/api/locations'),
        apiRequest('/api/campaigns')
      ])

      if (platformsRes.ok) {
        const data = await platformsRes.json()
        setPlatforms(data.data || [])
      }
      if (locationsRes.ok) {
        const data = await locationsRes.json()
        setLocations(data.data || [])
      }
      if (campaignsRes.ok) {
        const data = await campaignsRes.json()
        setCampaigns(data.data || [])
      }
    } catch (e) {
      console.error(e)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Buchung wirklich löschen?')) return
    try {
      const res = await apiRequest('/api/bookings/' + id, {
        method: 'DELETE'
      })
      if (res.ok) {
        fetchBookings()
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    fetchBookings()
    fetchRelatedData()
  }, [])

  useEffect(() => {
    fetchBookings()
  }, [filters])

  return (
    <div className="w-full max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold dark:text-white">Buchungsübersicht</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">Filter</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Plattform</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white"
              value={filters.platform_id}
              onChange={(e) => setFilters(prev => ({...prev, platform_id: e.target.value}))}
            >
              <option value="">Alle Plattformen</option>
              {platforms.map(platform => (
                <option key={platform.id} value={platform.id.toString()}>
                  {platform.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ort</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white"
              value={filters.location_id}
              onChange={(e) => setFilters(prev => ({...prev, location_id: e.target.value}))}
            >
              <option value="">Alle Orte</option>
              {locations.map(location => (
                <option key={location.id} value={location.id.toString()}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kampagne</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white"
              value={filters.campaign_id}
              onChange={(e) => setFilters(prev => ({...prev, campaign_id: e.target.value}))}
            >
              <option value="">Alle Kampagnen</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id.toString()}>
                  {campaign.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white"
              value={filters.status}
              onChange={(e) => setFilters(prev => ({...prev, status: e.target.value}))}
            >
              <option value="">Alle Status</option>
              {statusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Berater</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 dark:text-white"
              value={filters.berater}
              onChange={(e) => setFilters(prev => ({...prev, berater: e.target.value}))}
              placeholder="Berater suchen..."
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
            onClick={() => setFilters({
              platform_id: '',
              location_id: '',
              campaign_id: '',
              status: '',
              berater: ''
            })}
          >
            Filter zurücksetzen
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        {loading ? (
          <div className="p-4 dark:text-white">Lade Buchungen...</div>
        ) : bookings.length === 0 ? (
          <div className="p-4 text-gray-500 dark:text-gray-400">Keine Buchungen gefunden</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left dark:text-white">Kunde</th>
                  <th className="px-4 py-2 text-left dark:text-white">Plattform</th>
                  <th className="px-4 py-2 text-left dark:text-white">Artikel</th>
                  <th className="px-4 py-2 text-left dark:text-white">Ort</th>
                  <th className="px-4 py-2 text-left dark:text-white">Branche</th>
                  <th className="px-4 py-2 text-left dark:text-white">Kampagne</th>
                  <th className="px-4 py-2 text-left dark:text-white">Status</th>
                  <th className="px-4 py-2 text-left dark:text-white">Berater</th>
                  <th className="px-4 py-2 text-left dark:text-white">Preis</th>
                  {isAdmin() && <th className="px-4 py-2 text-left dark:text-white">Aktionen</th>}
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {bookings.map(booking => {
                  const status = statusOptions.find(s => s.value === booking.status)

                  return (
                    <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-2">
                        <div>
                          <div className="font-medium dark:text-white">{booking.kundenname}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">{booking.kundennummer}</div>
                        </div>
                      </td>
                      <td className="px-4 py-2 dark:text-gray-300">{booking.platform_name || '-'}</td>
                      <td className="px-4 py-2 dark:text-gray-300">{booking.product_name || '-'}</td>
                      <td className="px-4 py-2 dark:text-gray-300">{booking.location_name || '-'}</td>
                      <td className="px-4 py-2 dark:text-gray-300">{booking.category_name || '-'}</td>
                      <td className="px-4 py-2 dark:text-gray-300">{booking.campaign_name || '-'}</td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status?.color || 'bg-gray-100 text-gray-800 dark:bg-gray-600 dark:text-gray-200'}`}>
                          {status?.label || booking.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 dark:text-gray-300">{booking.berater}</td>
                      <td className="px-4 py-2 dark:text-gray-300">
                        {booking.verkaufspreis ? 
                          new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(booking.verkaufspreis) 
                          : '-'}
                      </td>
                      {isAdmin() && (
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2">
                            <button
                              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                              onClick={() => handleDelete(booking.id)}
                            >
                              Löschen
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
        Gesamt: {bookings.length} Buchung{bookings.length !== 1 ? 'en' : ''}
      </div>
    </div>
  )
}
