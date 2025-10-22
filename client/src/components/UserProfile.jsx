import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const UserProfile = () => {
  const { user, logout, isAdmin, isViewer } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = async () => {
    await logout();
    setShowLogoutConfirm(false);
  };

  const getRoleIcon = () => {
    if (isAdmin()) {
      return (
        <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    } else {
      return (
        <svg className="h-5 w-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    }
  };

  const getRoleDescription = () => {
    if (isAdmin()) {
      return 'Vollzugriff auf alle Funktionen';
    } else if (isViewer()) {
      return 'Nur Verfügbarkeitsprüfung';
    }
    return 'Unbekannte Rolle';
  };

  const getPermissions = () => {
    if (isAdmin()) {
      return [
        'Buchungen anzeigen',
        'Buchungen erstellen',
        'Buchungen bearbeiten',
        'Buchungen löschen',
        'Verfügbarkeitsprüfung',
        'Benutzerverwaltung'
      ];
    } else if (isViewer()) {
      return [
        'Verfügbarkeitsprüfung',
        'Buchungsübersicht (schreibgeschützt)'
      ];
    }
    return [];
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative">
      {/* User Menu Button */}
      <div className="flex items-center space-x-3 bg-white rounded-lg shadow-sm border border-gray-200 px-3 py-2 hover:shadow-md transition-shadow duration-200">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="h-8 w-8 rounded-full bg-koeln-red flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user.username.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.username}
            </p>
            {getRoleIcon()}
          </div>
          <p className="text-xs text-gray-500 truncate">
            {user.role}
          </p>
        </div>

        {/* Logout Button */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          title="Abmelden"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Abmelden bestätigen
                </h3>
                <p className="text-sm text-gray-500 mb-6">
                  Möchten Sie sich wirklich abmelden? Sie müssen sich erneut anmelden, um das Portal zu verwenden.
                </p>

                {/* User Info */}
                <div className="bg-gray-50 rounded-md p-3 mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <div className="h-6 w-6 rounded-full bg-koeln-red flex items-center justify-center">
                      <span className="text-xs font-medium text-white">
                        {user.username.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">{user.username}</span>
                    {getRoleIcon()}
                  </div>
                  <p className="text-xs text-gray-600">{getRoleDescription()}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-koeln-red transition-colors duration-200"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                  >
                    Abmelden
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Erweiterte UserProfile-Komponente mit Details
export const UserProfileDetailed = () => {
  const { user, isAdmin, isViewer } = useAuth();

  if (!user) {
    return null;
  }

  const getPermissions = () => {
    if (isAdmin()) {
      return [
        'Buchungen anzeigen',
        'Buchungen erstellen',
        'Buchungen bearbeiten',
        'Buchungen löschen',
        'Verfügbarkeitsprüfung',
        'Benutzerverwaltung'
      ];
    } else if (isViewer()) {
      return [
        'Verfügbarkeitsprüfung',
        'Buchungsübersicht (schreibgeschützt)'
      ];
    }
    return [];
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center space-x-4 mb-6">
        <div className="h-16 w-16 rounded-full bg-koeln-red flex items-center justify-center">
          <span className="text-xl font-medium text-white">
            {user.username.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900">{user.username}</h2>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isAdmin() ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
            }`}>
              {user.role}
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Account Info */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Account-Informationen</h3>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-3 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-medium text-gray-500">Benutzername</dt>
              <dd className="text-sm text-gray-900">{user.username}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Rolle</dt>
              <dd className="text-sm text-gray-900 capitalize">{user.role}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Erstellt am</dt>
              <dd className="text-sm text-gray-900">
                {new Date(user.created_at).toLocaleDateString('de-DE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="text-sm text-green-600">Aktiv</dd>
            </div>
          </dl>
        </div>

        {/* Permissions */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Berechtigungen</h3>
          <ul className="space-y-2">
            {getPermissions().map((permission, index) => (
              <li key={index} className="flex items-center space-x-2">
                <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-gray-700">{permission}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;

