import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { Plus, Search, List, Menu, X, ChevronDown, Moon, Sun, Sparkles, Home } from 'lucide-react'
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

// Dark Mode Hook
function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('darkMode')
    return saved ? JSON.parse(saved) : false
  })

  useEffect(() => {
    const root = window.document.documentElement
    if (isDark) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    localStorage.setItem('darkMode', JSON.stringify(isDark))
  }, [isDark])

  return [isDark, setIsDark]
}

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
  const [isDark, setIsDark] = useDarkMode()
  const location = useLocation()
  const { isAuthenticated, isAdmin, hasPermission } = useAuth()

  const isActive = (path) => location.pathname === path
  const isVerwaltungActive = () => {
    const verwaltungPaths = ['/products', '/locations', '/campaigns', '/categories', '/bookings', '/users']
    return verwaltungPaths.includes(location.pathname)
  }

  return (
    <nav className="glass sticky top-0 z-[100] border-b border-white/20 dark:border-gray-700/30 animate-fade-in">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <img 
                  src="/greven-medien-logo.png" 
                  alt="Greven Medien" 
                  className="h-10 w-auto transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute -inset-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-lg opacity-0 group-hover:opacity-20 blur transition-opacity duration-300"></div>
              </div>
              <span className="hidden sm:block text-xl font-bold gradient-text">
                Sonderplatzierung Online
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2">
            {/* Übersicht */}
            {isAdmin() && (
              <Link
                to="/overview"
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 btn-modern ${
                  isActive('/overview')
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/50'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
                }`}
              >
                <List className="h-4 w-4" />
                <span>📊 Übersicht</span>
              </Link>
            )}

            {/* Neue Buchung */}
            {isAdmin() && (
              <Link
                to="/booking"
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 btn-modern ${
                  isActive('/booking')
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/50'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
                }`}
              >
                <Plus className="h-4 w-4" />
                <span>✨ Neue Buchung</span>
              </Link>
            )}

            {/* Verwaltung Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsVerwaltungOpen(!isVerwaltungOpen)}
                onBlur={() => setTimeout(() => setIsVerwaltungOpen(false), 200)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 btn-modern ${
                  isVerwaltungActive()
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/50'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
                }`}
              >
                <List className="h-4 w-4" />
                <span>⚙️ Verwaltung</span>
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isVerwaltungOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isVerwaltungOpen && (
                <div className="absolute left-0 mt-2 w-56 glass-card py-2 z-[110] animate-scale-in shadow-2xl">
                  <Link
                    to="/products"
                    className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-red-500 hover:to-orange-500 hover:text-white transition-all duration-200 mx-2 rounded-lg"
                    onClick={() => setIsVerwaltungOpen(false)}
                  >
                    📦 Artikel
                  </Link>
                  <Link
                    to="/locations"
                    className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-red-500 hover:to-orange-500 hover:text-white transition-all duration-200 mx-2 rounded-lg"
                    onClick={() => setIsVerwaltungOpen(false)}
                  >
                    📍 Orte
                  </Link>
                  <Link
                    to="/campaigns"
                    className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-red-500 hover:to-orange-500 hover:text-white transition-all duration-200 mx-2 rounded-lg"
                    onClick={() => setIsVerwaltungOpen(false)}
                  >
                    🎯 Kampagnen
                  </Link>
                  <Link
                    to="/categories"
                    className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-red-500 hover:to-orange-500 hover:text-white transition-all duration-200 mx-2 rounded-lg"
                    onClick={() => setIsVerwaltungOpen(false)}
                  >
                    🏢 Branchen
                  </Link>
                  <Link
                    to="/bookings"
                    className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-red-500 hover:to-orange-500 hover:text-white transition-all duration-200 mx-2 rounded-lg"
                    onClick={() => setIsVerwaltungOpen(false)}
                  >
                    📅 Buchungen
                  </Link>
                  <Link
                    to="/users"
                    className="block px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gradient-to-r hover:from-red-500 hover:to-orange-500 hover:text-white transition-all duration-200 mx-2 rounded-lg"
                    onClick={() => setIsVerwaltungOpen(false)}
                  >
                    👥 Benutzer
                  </Link>
                </div>
              )}
            </div>

            {/* Verfügbarkeit */}
            <Link
              to="/availability"
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 btn-modern ${
                isActive('/availability')
                  ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/50'
                  : 'text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
              }`}
            >
              <Search className="h-4 w-4" />
              <span>🔍 Verfügbarkeit</span>
            </Link>

            {/* Dark Mode Toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-300"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            
            {/* User Profile */}
            {isAuthenticated() && (
              <div className="ml-2">
                <UserProfile />
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2 rounded-xl text-gray-700 dark:text-gray-200"
              aria-label="Toggle Dark Mode"
            >
              {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {isAuthenticated() && (
              <UserProfile />
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden animate-slide-in">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              {/* Übersicht */}
              {isAdmin() && (
                <Link
                  to="/overview"
                  className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                    isActive('/overview')
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <List className="h-5 w-5" />
                  <span>📊 Übersicht</span>
                </Link>
              )}

              {/* Neue Buchung */}
              {isAdmin() && (
                <Link
                  to="/booking"
                  className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                    isActive('/booking')
                      ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  <Plus className="h-5 w-5" />
                  <span>✨ Neue Buchung</span>
                </Link>
              )}

              {/* Verwaltung - Mobile */}
              <div className="px-4 py-2">
                <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  ⚙️ Verwaltung
                </div>
                <div className="space-y-1">
                  <Link
                    to="/products"
                    className={`block px-4 py-2.5 rounded-xl text-base font-medium transition-all duration-200 ${
                      isActive('/products')
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    📦 Artikel
                  </Link>
                  <Link
                    to="/locations"
                    className={`block px-4 py-2.5 rounded-xl text-base font-medium transition-all duration-200 ${
                      isActive('/locations')
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    📍 Orte
                  </Link>
                  <Link
                    to="/campaigns"
                    className={`block px-4 py-2.5 rounded-xl text-base font-medium transition-all duration-200 ${
                      isActive('/campaigns')
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    🎯 Kampagnen
                  </Link>
                  <Link
                    to="/categories"
                    className={`block px-4 py-2.5 rounded-xl text-base font-medium transition-all duration-200 ${
                      isActive('/categories')
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    🏢 Branchen
                  </Link>
                  <Link
                    to="/bookings"
                    className={`block px-4 py-2.5 rounded-xl text-base font-medium transition-all duration-200 ${
                      isActive('/bookings')
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    📅 Buchungen
                  </Link>
                  <Link
                    to="/users"
                    className={`block px-4 py-2.5 rounded-xl text-base font-medium transition-all duration-200 ${
                      isActive('/users')
                        ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                        : 'text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    👥 Benutzer
                  </Link>
                </div>
              </div>

              {/* Verfügbarkeit */}
              <Link
                to="/availability"
                className={`flex items-center space-x-2 px-4 py-3 rounded-xl text-base font-medium transition-all duration-200 ${
                  isActive('/availability')
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                    : 'text-gray-700 dark:text-gray-200 hover:bg-white/50 dark:hover:bg-gray-800/50'
                }`}
                onClick={() => setIsMenuOpen(false)}
              >
                <Search className="h-5 w-5" />
                <span>🔍 Verfügbarkeit</span>
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
    const interval = setInterval(fetchDashboardData, 300000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero Section */}
      <div className="hero-gradient rounded-3xl p-8 md:p-12 glass-card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-2">
              Dashboard <Sparkles className="inline h-8 w-8 text-orange-500" />
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              Willkommen zurück! Hier ist deine Übersicht.
            </p>
          </div>
          {isAdmin() && (
            <div className="mt-6 sm:mt-0">
              <Link to="/booking">
                <Button className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 text-white shadow-lg shadow-red-500/50 btn-modern">
                  <Plus className="h-5 w-5 mr-2" />
                  Neue Buchung
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="glass-card p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl">
              <List className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl">📊</span>
          </div>
          {loading ? (
            <div className="text-3xl font-bold animate-pulse">...</div>
          ) : (
            <>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.activeBookings}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Aktive Buchungen
              </p>
            </>
          )}
        </div>

        <div className="glass-card p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl">
              <Search className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl">✅</span>
          </div>
          {loading ? (
            <div className="text-3xl font-bold animate-pulse">...</div>
          ) : (
            <>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.availablePlaces}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Verfügbare Plätze
              </p>
            </>
          )}
        </div>

        <div className="glass-card p-6 card-hover">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl">
              <List className="h-6 w-6 text-white" />
            </div>
            <span className="text-3xl">⏳</span>
          </div>
          {loading ? (
            <div className="text-3xl font-bold animate-pulse">...</div>
          ) : (
            <>
              <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                {stats.pendingReservations}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Ausstehende Reservierungen
              </p>
            </>
          )}
        </div>
      </div>

      {/* Quick Actions & Recent Bookings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center">
            <Sparkles className="h-5 w-5 mr-2 text-orange-500" />
            Schnellzugriff
          </h2>
          <div className="space-y-3">
            {isAdmin() && (
              <Link to="/booking" className="block">
                <Button variant="outline" className="w-full justify-start h-12 btn-modern hover:bg-gradient-to-r hover:from-red-500 hover:to-orange-500 hover:text-white hover:border-transparent">
                  <Plus className="h-5 w-5 mr-3" />
                  ✨ Neue Buchung erstellen
                </Button>
              </Link>
            )}
            <Link to="/availability" className="block">
              <Button variant="outline" className="w-full justify-start h-12 btn-modern hover:bg-gradient-to-r hover:from-red-500 hover:to-orange-500 hover:text-white hover:border-transparent">
                <Search className="h-5 w-5 mr-3" />
                🔍 Verfügbarkeit prüfen
              </Button>
            </Link>
            <Link to="/bookings" className="block">
              <Button variant="outline" className="w-full justify-start h-12 btn-modern hover:bg-gradient-to-r hover:from-red-500 hover:to-orange-500 hover:text-white hover:border-transparent">
                <List className="h-5 w-5 mr-3" />
                📅 Alle Buchungen anzeigen
              </Button>
            </Link>
          </div>
        </div>

        <div className="glass-card p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
              <List className="h-5 w-5 mr-2 text-orange-500" />
              Neueste Buchungen
            </h2>
            <Link to="/bookings">
              <Button variant="ghost" size="sm" className="hover:bg-gradient-to-r hover:from-red-500 hover:to-orange-500 hover:text-white">
                Alle anzeigen
              </Button>
            </Link>
          </div>
          {loading ? (
            <div className="animate-pulse space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
              ))}
            </div>
          ) : stats.recentBookings.length > 0 ? (
            <div className="space-y-3">
              {stats.recentBookings.map((booking) => (
                <div key={booking.id} className="flex justify-between items-center p-3 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all duration-200">
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{booking.kundenname}</div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      {new Date(booking.start_date).toLocaleDateString()} - {new Date(booking.end_date).toLocaleDateString()}
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-xs font-medium ${
                    booking.status === 'confirmed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                    booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                  }`}>
                    {booking.status === 'confirmed' ? '✅ Bestätigt' :
                     booking.status === 'pending' ? '⏳ Ausstehend' :
                     booking.status}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              <List className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Keine aktuellen Buchungen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gradient-modern custom-scrollbar">
          <ProtectedRoute>
            <Navigation />
            <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
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
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            
            {/* Footer */}
            <footer className="mt-16 border-t border-gray-200 dark:border-gray-700">
              <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                <div className="text-center text-gray-600 dark:text-gray-400">
                  <p className="text-sm">
                    © {new Date().getFullYear()} Greven Medien. Alle Rechte vorbehalten.
                  </p>
                  <p className="text-xs mt-2">
                    Made with ❤️ and modern technology
                  </p>
                </div>
              </div>
            </footer>
          </ProtectedRoute>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App