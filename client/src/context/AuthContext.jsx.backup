import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth muss innerhalb eines AuthProvider verwendet werden');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://koeln-branchen-api.onrender.com';

  // Initialisierung: Prüfe ob Benutzer bereits angemeldet ist
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setLoading(true);
        setError(null);

        // Prüfe localStorage für gespeicherten Token
        const savedToken = localStorage.getItem('auth_token');
        const savedUser = localStorage.getItem('auth_user');

        if (savedToken && savedUser) {
          try {
            // Validiere Token mit Backend
            const response = await fetch(`${baseUrl}/api/auth/validate`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${savedToken}`,
                'Content-Type': 'application/json'
              }
            });

            if (response.ok) {
              const data = await response.json();
              setToken(savedToken);
              setUser(data.user);
              console.log('✅ Benutzer automatisch angemeldet:', data.user.username);
            } else {
              // Token ungültig, entferne aus localStorage
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
              console.log('⚠️ Gespeicherter Token ungültig, Benutzer abgemeldet');
            }
          } catch (error) {
            console.error('Token-Validierung fehlgeschlagen:', error);
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
          }
        }
      } catch (error) {
        console.error('Auth-Initialisierung fehlgeschlagen:', error);
        setError('Authentifizierung konnte nicht initialisiert werden');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [baseUrl]);

  // Login-Funktion
  const login = async (username, password) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setToken(data.token);
        
        // Speichere in localStorage für Persistenz
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('auth_user', JSON.stringify(data.user));

        console.log('✅ Anmeldung erfolgreich:', data.user.username, `(${data.user.role})`);
        return { success: true, user: data.user };
      } else {
        setError(data.message || 'Anmeldung fehlgeschlagen');
        return { success: false, message: data.message || 'Anmeldung fehlgeschlagen' };
      }
    } catch (error) {
      console.error('Login-Fehler:', error);
      const errorMessage = 'Netzwerkfehler bei der Anmeldung';
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  // Logout-Funktion
  const logout = async () => {
    try {
      setLoading(true);
      
      // Backend-Logout (optional, für Server-seitige Token-Invalidierung)
      if (token) {
        try {
          await fetch(`${baseUrl}/api/auth/logout`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
        } catch (error) {
          console.warn('Backend-Logout fehlgeschlagen:', error);
        }
      }

      // Lokale Abmeldung
      setUser(null);
      setToken(null);
      setError(null);
      
      // Entferne aus localStorage
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');

      console.log('✅ Benutzer abgemeldet');
    } catch (error) {
      console.error('Logout-Fehler:', error);
    } finally {
      setLoading(false);
    }
  };

  // Hilfsfunktionen für Rollen-Checks
  const isAdmin = () => {
    return user && user.role === 'admin';
  };

  const isViewer = () => {
    return user && user.role === 'viewer';
  };

  const isAuthenticated = () => {
    return user !== null && token !== null;
  };

  const hasPermission = (action) => {
    if (!isAuthenticated()) return false;
    
    // Admin hat alle Berechtigungen
    if (isAdmin()) return true;
    
    // Viewer-Berechtigungen
    if (isViewer()) {
      // Viewer kann nur lesen und Verfügbarkeit prüfen
      return ['read', 'view', 'availability'].includes(action);
    }
    
    return false;
  };

  // API-Request-Helper mit automatischer Token-Einbindung
  const apiRequest = async (url, options = {}) => {
    const config = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    // Füge Authorization Header hinzu wenn Token vorhanden
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${baseUrl}${url}`, config);
      
      // Automatische Abmeldung bei 401 Unauthorized
      if (response.status === 401) {
        console.warn('Token abgelaufen oder ungültig, Benutzer wird abgemeldet');
        await logout();
        throw new Error('Sitzung abgelaufen. Bitte melden Sie sich erneut an.');
      }

      return response;
    } catch (error) {
      console.error('API-Request Fehler:', error);
      throw error;
    }
  };

  const value = {
    // State
    user,
    token,
    loading,
    error,
    
    // Actions
    login,
    logout,
    
    // Helpers
    isAdmin,
    isViewer,
    isAuthenticated,
    hasPermission,
    apiRequest,
    
    // Clear error
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

