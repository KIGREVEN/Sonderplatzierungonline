const User = require('../models/User');

// Middleware zur Token-Verifizierung
const authenticateToken = async (req, res, next) => {
  try {
    // Token aus Authorization Header oder Cookie extrahieren
    let token = null;
    
    // Prüfe Authorization Header (Bearer Token)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    // Fallback: Prüfe Cookie
    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Zugriff verweigert. Kein Token bereitgestellt.'
      });
    }

    // Token verifizieren
    const decoded = User.verifyToken(token);
    
    // Benutzer aus Datenbank laden
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Ungültiger Token. Benutzer nicht gefunden.'
      });
    }

    // Benutzer-Informationen an Request anhängen
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth Middleware Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Ungültiger Token.'
    });
  }
};

// Middleware zur Rollen-Überprüfung
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentifizierung erforderlich.'
      });
    }

    if (req.user.role !== requiredRole) {
      return res.status(403).json({
        success: false,
        message: `Zugriff verweigert. ${requiredRole}-Berechtigung erforderlich.`
      });
    }

    next();
  };
};

// Middleware zur Admin-Überprüfung
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentifizierung erforderlich.'
    });
  }

  if (!req.user.isAdmin()) {
    return res.status(403).json({
      success: false,
      message: 'Zugriff verweigert. Admin-Berechtigung erforderlich.'
    });
  }

  next();
};

// Middleware für optionale Authentifizierung (für öffentliche Endpunkte mit erweiterten Funktionen für angemeldete Benutzer)
const optionalAuth = async (req, res, next) => {
  try {
    let token = null;
    
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
    
    if (!token && req.cookies && req.cookies.auth_token) {
      token = req.cookies.auth_token;
    }

    if (token) {
      try {
        const decoded = User.verifyToken(token);
        const user = await User.findById(decoded.id);
        if (user) {
          req.user = user;
        }
      } catch (error) {
        // Token ungültig, aber das ist okay für optionale Auth
        console.log('Optional auth failed:', error.message);
      }
    }

    next();
  } catch (error) {
    // Fehler ignorieren und ohne Benutzer fortfahren
    next();
  }
};

// Hilfsfunktion zur Überprüfung von Berechtigungen
const hasPermission = (user, action, resource) => {
  if (!user) return false;
  
  // Admin hat alle Berechtigungen
  if (user.isAdmin()) return true;
  
  // Viewer-Berechtigungen
  if (user.isViewer()) {
    // Viewer kann nur lesen
    if (action === 'read') return true;
    
    // Viewer kann Verfügbarkeit prüfen
    if (resource === 'availability') return true;
    
    // Alles andere ist verboten
    return false;
  }
  
  return false;
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  optionalAuth,
  hasPermission
};

