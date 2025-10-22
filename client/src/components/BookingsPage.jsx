import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Switch } from './ui/switch'
import { Label } from './ui/label'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'

export default function BookingsPage() {
  const { apiRequest, isAdmin } = useAuth()
  const [bookings, setBookings] = useState([])
  const [products, setProducts] = useState([])
  const [locations, setLocations] = useState([])
  const [campaigns, setCampaigns] = useState([])
  const [loading, setLoading] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editBooking, setEditBooking] = useState(null)
  const [filters, setFilters] = useState({
    product_id: '',
    location_id: '',
    campaign_id: '',
    status: '',
    date_from: '',
    date_to: ''
  })
  const [formData, setFormData] = useState({
    product_id: '',
    location_id: '',
    campaign_id: '',
    start_date: '',
    end_date: '',
    status: 'pending',
    notes: ''
  })

  const statusOptions = [
    { value: 'pending', label: 'Ausstehend' },
    { value: 'confirmed', label: 'Bestätigt' },
    { value: 'cancelled', label: 'Storniert' },
    { value: 'completed', label: 'Abgeschlossen' }
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
      const [productsRes, locationsRes, campaignsRes] = await Promise.all([
        apiRequest('/api/products'),
        apiRequest('/api/locations'),
        apiRequest('/api/campaigns')
      ])

      if (productsRes.ok) {
        const data = await productsRes.json()
        setProducts(data.data || [])
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const method = editBooking ? 'PUT' : 'POST'
      const url = editBooking 
        ? '/api/bookings/' + editBooking.id
        : '/api/bookings'
      
      const res = await apiRequest(url, {
        method,
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setDialogOpen(false)
        fetchBookings()
        setEditBooking(null)
        setFormData({
          product_id: '',
          location_id: '',
          campaign_id: '',
          start_date: '',
          end_date: '',
          status: 'pending',
          notes: ''
        })
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

  const handleEdit = (booking) => {
    setEditBooking(booking)
    setFormData({
      product_id: booking.product_id,
      location_id: booking.location_id,
      campaign_id: booking.campaign_id,
      start_date: booking.start_date,
      end_date: booking.end_date,
      status: booking.status,
      notes: booking.notes || ''
    })
    setDialogOpen(true)
  }

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const res = await apiRequest('/api/bookings/' + bookingId, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
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
        <h1 className="text-3xl font-bold">Buchungen</h1>
        {isAdmin() && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => {
                setEditBooking(null)
                setFormData({
                  product_id: '',
                  location_id: '',
                  campaign_id: '',
                  start_date: '',
                  end_date: '',
                  status: 'pending',
                  notes: ''
                })
              }}>
                Buchung hinzufügen
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editBooking ? 'Buchung bearbeiten' : 'Neue Buchung'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div>
                  <Label>Produkt</Label>
                  <Select
                    value={formData.product_id}
                    onValueChange={(value) => setFormData(prev => ({...prev, product_id: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Produkt auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map(product => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Standort</Label>
                  <Select
                    value={formData.location_id}
                    onValueChange={(value) => setFormData(prev => ({...prev, location_id: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Standort auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Kampagne</Label>
                  <Select
                    value={formData.campaign_id}
                    onValueChange={(value) => setFormData(prev => ({...prev, campaign_id: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kampagne auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {campaigns.map(campaign => (
                        <SelectItem key={campaign.id} value={campaign.id}>
                          {campaign.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Startdatum</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({...prev, start_date: e.target.value}))}
                    required
                  />
                </div>

                <div>
                  <Label>Enddatum</Label>
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData(prev => ({...prev, end_date: e.target.value}))}
                    required
                  />
                </div>

                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData(prev => ({...prev, status: value}))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Status auswählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notizen</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({...prev, notes: e.target.value}))}
                    placeholder="Optionale Notizen"
                  />
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Abbrechen
                  </Button>
                  <Button type="submit">
                    {editBooking ? 'Speichern' : 'Erstellen'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">Filter</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Produkt</Label>
            <Select
              value={filters.product_id}
              onValueChange={(value) => setFilters(prev => ({...prev, product_id: value}))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle Produkte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle Produkte</SelectItem>
                {products.map(product => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Standort</Label>
            <Select
              value={filters.location_id}
              onValueChange={(value) => setFilters(prev => ({...prev, location_id: value}))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle Standorte" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle Standorte</SelectItem>
                {locations.map(location => (
                  <SelectItem key={location.id} value={location.id}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Kampagne</Label>
            <Select
              value={filters.campaign_id}
              onValueChange={(value) => setFilters(prev => ({...prev, campaign_id: value}))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle Kampagnen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle Kampagnen</SelectItem>
                {campaigns.map(campaign => (
                  <SelectItem key={campaign.id} value={campaign.id}>
                    {campaign.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Status</Label>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({...prev, status: value}))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Alle Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Alle Status</SelectItem>
                {statusOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Von Datum</Label>
            <Input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters(prev => ({...prev, date_from: e.target.value}))}
            />
          </div>

          <div>
            <Label>Bis Datum</Label>
            <Input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters(prev => ({...prev, date_to: e.target.value}))}
            />
          </div>
        </div>

        <div className="mt-4">
          <Button variant="outline" onClick={() => setFilters({
            product_id: '',
            location_id: '',
            campaign_id: '',
            status: '',
            date_from: '',
            date_to: ''
          })}>
            Filter zurücksetzen
          </Button>
        </div>
      </div>

      {/* Bookings List */}
      <div className="bg-white rounded-lg shadow">
        {loading ? (
          <div className="p-4">Lade Buchungen...</div>
        ) : bookings.length === 0 ? (
          <div className="p-4 text-gray-500">Keine Buchungen gefunden</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left">Produkt</th>
                  <th className="px-4 py-2 text-left">Standort</th>
                  <th className="px-4 py-2 text-left">Kampagne</th>
                  <th className="px-4 py-2 text-left">Zeitraum</th>
                  <th className="px-4 py-2 text-left">Status</th>
                  <th className="px-4 py-2 text-left">Aktionen</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {bookings.map(booking => {
                  const product = products.find(p => p.id === booking.product_id)
                  const location = locations.find(l => l.id === booking.location_id)
                  const campaign = campaigns.find(c => c.id === booking.campaign_id)
                  const status = statusOptions.find(s => s.value === booking.status)

                  return (
                    <tr key={booking.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2">{product?.name || '-'}</td>
                      <td className="px-4 py-2">{location?.name || '-'}</td>
                      <td className="px-4 py-2">{campaign?.label || '-'}</td>
                      <td className="px-4 py-2">
                        {booking.start_date} - {booking.end_date}
                      </td>
                      <td className="px-4 py-2">
                        <Select
                          value={booking.status}
                          onValueChange={(value) => handleStatusChange(booking.id, value)}
                          disabled={!isAdmin()}
                        >
                          <SelectTrigger className="w-[140px]">
                            <SelectValue>{status?.label}</SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {statusOptions.map(option => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-2">
                          {isAdmin() && (
                            <>
                              <Button size="sm" variant="outline" onClick={() => handleEdit(booking)}>
                                Bearbeiten
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleDelete(booking.id)}>
                                Löschen
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}