import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom'
import { Plus, Search, List, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import UserProfile from './components/UserProfile'
import BookingForm from './components/BookingForm'
import BookingOverview from './components/BookingOverview'
import AvailabilityChecker from './components/AvailabilityChecker'
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
  const location = useLocation()
  const { isAuthenticated, isAdmin, hasPermission } = useAuth()

  // Rollenbasierte Navigation
  const getNavItems = () => {
    const baseItems = []

    // Nur Admins können Übersicht und neue Buchungen sehen
    if (isAdmin()) {
      baseItems.push({ path: '/overview', label: 'Übersicht', icon: List, permission: 'read' })
      baseItems.push({ path: '/booking', label: 'Neue Buchung', icon: Plus, permission: 'create' })
    }

    // Alle authentifizierten Benutzer können Verfügbarkeit prüfen
    baseItems.push({ path: '/availability', label: 'Verfügbarkeit', icon: Search, permission: 'availability' })

    return baseItems.filter(item => hasPermission(item.permission))
  }

  const navItems = getNavItems()
  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img 
                src="/koeln-branchen-logo.png" 
                alt="Köln Branchen Guide" 
                className="h-10 w-auto"
              />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {navItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive(item.path)
                      ? 'bg-red-100 text-red-700'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              )
            })}
            
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
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                      isActive(item.path)
                        ? 'bg-red-100 text-red-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

function Dashboard() {
  const { isAdmin, hasPermission } = useAuth()

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
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Wird nach dem ersten Laden angezeigt
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Verfügbare Plätze</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Prüfen Sie die Verfügbarkeit
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reservierungen</CardTitle>
            <List className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Offene Reservierungen
            </p>
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
            <Link to="/" className="block">
              <Button variant="outline" className="w-full justify-start">
                <List className="h-4 w-4 mr-2" />
                Alle Buchungen anzeigen
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Systeminfo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Version:</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Platzierungen:</span>
                <span>1-6</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="text-green-600">Online</span>
              </div>
            </div>
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

