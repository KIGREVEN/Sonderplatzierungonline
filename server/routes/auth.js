const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Login-Endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validierung
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username und Password sind erforderlich'
      });
    }

    // Benutzer finden
    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Ungültige Anmeldedaten'
      });
    }

    // Passwort verifizieren
    const isValidPassword = await user.verifyPassword(password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Ungültige Anmeldedaten'
      });
    }

    // JWT Token generieren
    const token = user.generateToken();

    // Cookie setzen (optional, für bessere UX)
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
    });

    console.log(`✅ User logged in: ${user.username} (${user.role})`);

    res.json({
      success: true,
      message: 'Anmeldung erfolgreich',
      user: user.toJSON(),
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Anmeldung fehlgeschlagen',
      error: error.message
    });
  }
});

// Logout-Endpoint
router.post('/logout', (req, res) => {
  try {
    // Cookie löschen
    res.clearCookie('auth_token');

    console.log('✅ User logged out');

    res.json({
      success: true,
      message: 'Abmeldung erfolgreich'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Abmeldung fehlgeschlagen',
      error: error.message
    });
  }
});

// Aktueller Benutzer-Endpoint (für Frontend-Initialisierung)
router.get('/me', authenticateToken, (req, res) => {
  try {
    res.json({
      success: true,
      user: req.user.toJSON()
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Benutzer-Informationen konnten nicht abgerufen werden',
      error: error.message
    });
  }
});

// Token-Validierung-Endpoint
router.post('/validate', authenticateToken, (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Token ist gültig',
      user: req.user.toJSON()
    });

  } catch (error) {
    console.error('Token validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Token-Validierung fehlgeschlagen',
      error: error.message
    });
  }
});

// Alle Benutzer abrufen (nur für Admins)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll();

    res.json({
      success: true,
      users: users.map(user => user.toJSON()),
      count: users.length
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Benutzer konnten nicht abgerufen werden',
      error: error.message
    });
  }
});

// Neuen Benutzer erstellen (nur für Admins)
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Validierung
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username und Password sind erforderlich'
      });
    }

    if (role && !['admin', 'viewer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role muss "admin" oder "viewer" sein'
      });
    }

    // Benutzer erstellen
    const newUser = await User.create({
      username,
      password,
      role: role || 'viewer'
    });

    console.log(`✅ New user created: ${newUser.username} (${newUser.role}) by ${req.user.username}`);

    res.status(201).json({
      success: true,
      message: 'Benutzer erfolgreich erstellt',
      user: newUser.toJSON()
    });

  } catch (error) {
    console.error('Create user error:', error);
    
    if (error.message.includes('bereits vergeben')) {
      return res.status(409).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Benutzer konnte nicht erstellt werden',
      error: error.message
    });
  }
});

// Benutzer-Rolle ändern (nur für Admins)
router.put('/users/:id/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!role || !['admin', 'viewer'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Gültige Role erforderlich (admin oder viewer)'
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Benutzer nicht gefunden'
      });
    }

    // Verhindere, dass sich ein Admin selbst degradiert
    if (user.id === req.user.id && role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Sie können Ihre eigene Admin-Rolle nicht entfernen'
      });
    }

    await user.updateRole(role);

    console.log(`✅ User role updated: ${user.username} -> ${role} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Benutzer-Rolle erfolgreich aktualisiert',
      user: user.toJSON()
    });

  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({
      success: false,
      message: 'Benutzer-Rolle konnte nicht aktualisiert werden',
      error: error.message
    });
  }
});

// Benutzer löschen (nur für Admins)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Benutzer nicht gefunden'
      });
    }

    // Verhindere, dass sich ein Admin selbst löscht
    if (user.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Sie können sich nicht selbst löschen'
      });
    }

    const deleted = await user.delete();
    if (!deleted) {
      return res.status(500).json({
        success: false,
        message: 'Benutzer konnte nicht gelöscht werden'
      });
    }

    console.log(`✅ User deleted: ${user.username} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Benutzer erfolgreich gelöscht'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Benutzer konnte nicht gelöscht werden',
      error: error.message
    });
  }
});

// Passwort ändern (für eigenen Account)
router.put('/password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Aktuelles und neues Passwort sind erforderlich'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Neues Passwort muss mindestens 6 Zeichen lang sein'
      });
    }

    // Aktuelles Passwort verifizieren
    const isValidPassword = await req.user.verifyPassword(currentPassword);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Aktuelles Passwort ist falsch'
      });
    }

    // Neues Passwort hashen und speichern
    const bcrypt = require('bcrypt');
    const saltRounds = 12;
    const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

    const { query } = require('../config/database');
    await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newPasswordHash, req.user.id]
    );

    console.log(`✅ Password changed for user: ${req.user.username}`);

    res.json({
      success: true,
      message: 'Passwort erfolgreich geändert'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Passwort konnte nicht geändert werden',
      error: error.message
    });
  }
});

module.exports = router;

