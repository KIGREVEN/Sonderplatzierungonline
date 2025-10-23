import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { Plus, Search, List, Menu, X, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import UserProfile from './components/UserProfile'
import BookingForm from './components/BookingForm'
import BookingOverview from './components/BookingOverview'
import AvailabilityChecker from './components/AvailabilityChecker'
import ProductsPage from './components/ProductsPage'
import LocationsPage from './components/LocationsPage'
import CampaignsPage from './components/CampaignsPage'
import CategoriesPage from './components/CategoriesPage'
import BookingsPage from './components/BookingsPage'
import UsersPage from './components/UsersPage'
import { useAuth } from './context/AuthContext'
import './App.css'

// Rollenbasierte Weiterleitung
function RoleBasedRedirect() {
  const { isAdmin } = useAuth()
  
  if (isAdmin()) {
    return <Navigate to="/overview" replace />
  } else {
    return <Navigate to="/availability" replace />
  }
}

function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isVerwaltungOpen, setIsVerwaltungOpen] = useState(false)
  const location = useLocation()
  const { isAuthenticated, isAdmin, hasPermission } = useAuth()

  const isActive = (path) => location.pathname === path
  const isVerwaltungActive = () => {
    const verwaltungPaths = ['/products', '/locations', '/campaigns', '/categories', '/bookings', '/users']
    return verwaltungPaths.includes(location.pathname)
  }

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/greven-medien-logo.png" 
                alt="Greven Medien" 
                className="h-10 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Übersicht */}
            {isAdmin() && (
              <Link
                to="/overview"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/overview')
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <List className="h-4 w-4" />
                <span>Übersicht</span>
              </Link>
            )}

            {/* Neue Buchung */}
            {isAdmin() && (
              <Link
                to="/booking"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/booking')
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Plus className="h-4 w-4" />
                <span>Neue Buchung</span>
              </Link>
            )}

            {/* Verwaltung Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsVerwaltungOpen(!isVerwaltungOpen)}
                onBlur={() => setTimeout(() => setIsVerwaltungOpen(false), 200)}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isVerwaltungActive()
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <List className="h-4 w-4" />
                <span>Verwaltung</span>
                <ChevronDown className={`h-4 w-4 transition-transform ${isVerwaltungOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isVerwaltungOpen && (
                <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border">
                  <Link
                    to="/products"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsVerwaltungOpen(false)}
                  >
                    Artikel
                  </Link>
                  <Link
                    to="/locations"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsVerwaltungOpen(false)}
                  >
                    Orte
                  </Link>
                  <Link
                    to="/campaigns"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsVerwaltungOpen(false)}
                  >
                    Kampagnen
                  </Link>
                  <Link
                    to="/categories"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsVerwaltungOpen(false)}
                  >
                    Branchen
                  </Link>
                  <Link
                    to="/bookings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsVerwaltungOpen(false)}
                  >
                    Buchungen
                  </Link>
                  <Link
                    to="/users"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setIsVerwaltungOpen(false)}
                  >
                    Benutzer
                  </Link>
                </div>
              )}
            </div>

            {/* Verfügbarkeit */}
            <Link
              to="/availability"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/availability')
                  ? 'bg-red-100 text-red-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Search className="h-4 w-4" />
              <span>Verfügbarkeit</span>
            </Link>
            
            {/* User Profile */}
            {isAuthenticated() && (
              <div className="ml-4">
                <UserProfile />
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            {isAuthenticated() && (
              <UserProfile />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {/* Übersicht */}
              {isAdmin() && (
                <Link
                  to="/overview"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive('/overview')
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <List className="h-5 w-5" />
                  <span>Übersicht</span>
                </Link>
              )}

              {/* Neue Buchung */}
              {isAdmin() && (
                <Link
                  to="/booking"
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    isActive('/booking')
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Plus className="h-5 w-5" />
                  <span>Neue Buchung</span>
                </Link>
              )}

              {/* Verwaltung - Mobile */}
              <div className="px-3 py-2">
                <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  Verwaltung
                </div>
                <div className="space-y-1">
                  <Link
                    to="/products"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive('/products')
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Artikel
                  </Link>
                  <Link
                    to="/locations"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive('/locations')
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Orte
                  </Link>
                  <Link
                    to="/campaigns"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive('/campaigns')
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Kampagnen
                  </Link>
                  <Link
                    to="/categories"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive('/categories')
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Branchen
                  </Link>
                  <Link
                    to="/bookings"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive('/bookings')
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Buchungen
                  </Link>
                  <Link
                    to="/users"
                    className={`block px-3 py-2 rounded-md text-base font-medium ${
                      isActive('/users')
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Benutzer
                  </Link>
                </div>
              </div>

              {/* Verfügbarkeit */}
              <Link
                to="/availability"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActive('/availability')
                    ? 'bg-red-100 text-red-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Search className="h-5 w-5" />
                <span>Verfügbarkeit</span>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

function Dashboard() {
  const { isAdmin, hasPermission, apiRequest } = useAuth()
  const [stats, setStats] = useState({
    activeBookings: 0,
    availablePlaces: 0,
    pendingReservations: 0,
    recentBookings: []
  })
  const [loading, setLoading] = useState(true)

  const fetchDashboardData = async () => {
    setLoading(true)
    try {
      const [bookingsRes, availabilityRes] = await Promise.all([
        apiRequest('/api/bookings'),
        apiRequest('/api/bookings/availability/summary')
      ])

      if (bookingsRes.ok && availabilityRes.ok) {
        const bookingsData = await bookingsRes.json()
        const availabilityData = await availabilityRes.json()

        setStats({
          activeBookings: bookingsData.data.filter(b => b.status === 'confirmed').length,
          availablePlaces: availabilityData.data.availablePlaces || 0,
          pendingReservations: bookingsData.data.filter(b => b.status === 'pending').length,
          recentBookings: bookingsData.data.slice(0, 5)
        })
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchDashboardData()
    // Aktualisiere die Daten alle 5 Minuten
    const interval = setInterval(fetchDashboardData, 300000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        {isAdmin() && (
          <div className="mt-4 sm:mt-0">
            <Link to="/booking">
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Neue Buchung
              </Button>
            </Link>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Buchungen</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold animate-pulse">...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.activeBookings}</div>
                <p className="text-xs text-muted-foreground">
                  Aktuell bestätigte Buchungen
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verfügbare Plätze</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold animate-pulse">...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.availablePlaces}</div>
                <p className="text-xs text-muted-foreground">
                  Freie Platzierungen
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservierungen</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-2xl font-bold animate-pulse">...</div>
            ) : (
              <>
                <div className="text-2xl font-bold">{stats.pendingReservations}</div>
                <p className="text-xs text-muted-foreground">
                  Ausstehende Reservierungen
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Schnellzugriff</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdmin() && (
              <Link to="/booking" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="h-4 w-4 mr-2" />
                  Neue Buchung erstellen
                </Button>
              </Link>
            )}
            <Link to="/availability" className="block">
              <Button variant="outline" className="w-full justify-start">
                <Search className="h-4 w-4 mr-2" />
                Verfügbarkeit prüfen
              </Button>
            </Link>
            <Link to="/bookings" className="block">
              <Button variant="outline" className="w-full justify-start">
                <List className="h-4 w-4 mr-2" />
                Alle Buchungen anzeigen
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex justify-between items-center">
            <CardTitle>Neueste Buchungen</CardTitle>
            <Link to="/bookings">
              <Button variant="ghost" size="sm">
                Alle anzeigen
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="animate-pulse space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-12 bg-gray-100 rounded"></div>
                ))}
              </div>
            ) : stats.recentBookings.length > 0 ? (
              <div className="space-y-4">
                {stats.recentBookings.map((booking, i) => (
                  <div key={booking.id} className="flex justify-between items-center text-sm">
                    <div>
                      <div className="font-medium">{booking.kundenname}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs ${
                      booking.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                      booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {booking.status === 'confirmed' ? 'Bestätigt' :
                       booking.status === 'pending' ? 'Ausstehend' :
                       booking.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Keine aktuellen Buchungen
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <ProtectedRoute>
            <Navigation />
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
              <Routes>
                <Route 
                  path="/" 
                  element={
                    <ProtectedRoute requireAdmin={false}>
                      <RoleBasedRedirect />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/overview" 
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <BookingOverview />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/booking" 
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <BookingForm />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/availability" element={<AvailabilityChecker />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/locations" element={<LocationsPage />} />
                <Route path="/campaigns" element={<CampaignsPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/bookings" element={<BookingsPage />} />
                <Route 
                  path="/users" 
                  element={
                    <ProtectedRoute requireAdmin={true}>
                      <UsersPage />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/dashboard" element={<Dashboard />} />
                {/* Redirect für unbekannte Routen */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
          </ProtectedRoute>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App

