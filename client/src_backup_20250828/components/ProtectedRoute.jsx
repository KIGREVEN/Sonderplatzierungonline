import React from 'react';
import { useAuth } from '../context/AuthContext';
import LoginForm from './LoginForm';

const ProtectedRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, isAdmin, loading, user } = useAuth();

  // Zeige Loading-Spinner während Authentifizierung geprüft wird
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-koeln-red"></div>
          <p className="mt-4 text-gray-600">Authentifizierung wird geprüft...</p>
        </div>
      </div>
    );
  }

  // Nicht angemeldet -> Login-Formular anzeigen
  if (!isAuthenticated()) {
    return <LoginForm />;
  }

  // Admin-Berechtigung erforderlich, aber Benutzer ist kein Admin
  if (requireAdmin && !isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full text-center">
          <div className="bg-white shadow-lg rounded-lg p-8">
            <div className="mx-auto h-16 w-16 flex items-center justify-center rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Zugriff verweigert
            </h3>
            <p className="text-gray-600 mb-4">
              Sie haben keine Berechtigung für diesen Bereich. 
              Administrator-Rechte sind erforderlich.
            </p>
            <div className="bg-gray-50 rounded-md p-3 mb-4">
              <p className="text-sm text-gray-700">
                <strong>Angemeldet als:</strong> {user?.username} ({user?.role})
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Wenden Sie sich an einen Administrator, um Zugriff zu erhalten.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Authentifiziert und berechtigt -> Inhalt anzeigen
  return children;
};

export default ProtectedRoute;

