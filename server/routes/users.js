const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// GET /api/users - Alle Benutzer abrufen (nur Admin)
router.get('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, username, role, is_active, created_at, updated_at FROM users ORDER BY username ASC'
    );
    
    res.json({ 
      success: true, 
      data: result.rows 
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/users - Neuen Benutzer erstellen (nur Admin)
router.post('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { username, password, role, is_active } = req.body;

    // Validierung
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username und Passwort sind erforderlich'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Passwort muss mindestens 6 Zeichen lang sein'
      });
    }

    if (role && !['admin', 'viewer', 'bearbeiter'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role muss "admin", "viewer" oder "bearbeiter" sein'
      });
    }

    // Prüfen ob Username bereits existiert
    const existingUser = await query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Benutzername ist bereits vergeben'
      });
    }

    // Passwort hashen
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Benutzer erstellen
    const result = await query(
      `INSERT INTO users (username, password_hash, role, is_active, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, NOW(), NOW()) 
       RETURNING id, username, role, is_active, created_at, updated_at`,
      [username, passwordHash, role || 'viewer', is_active !== false]
    );

    console.log(`✅ New user created: ${username} (${role || 'viewer'}) by ${req.user.username}`);

    res.status(201).json({
      success: true,
      message: 'Benutzer erfolgreich erstellt',
      data: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

// PUT /api/users/:id - Benutzer bearbeiten (nur Admin)
router.put('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { username, password, role, is_active } = req.body;

    // Benutzer existiert?
    const userCheck = await query('SELECT id, username FROM users WHERE id = $1', [id]);
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Benutzer nicht gefunden'
      });
    }

    // Validierung
    if (role && !['admin', 'viewer', 'bearbeiter'].includes(role)) {
      return res.status(400).json({
        success: false,
        message: 'Role muss "admin", "viewer" oder "bearbeiter" sein'
      });
    }

    // Verhindere, dass sich ein Admin selbst degradiert oder deaktiviert
    if (parseInt(id) === req.user.id) {
      if (role && role !== 'admin') {
        return res.status(400).json({
          success: false,
          message: 'Sie können Ihre eigene Admin-Rolle nicht entfernen'
        });
      }
      if (is_active === false) {
        return res.status(400).json({
          success: false,
          message: 'Sie können sich nicht selbst deaktivieren'
        });
      }
    }

    // Username-Änderung prüfen
    if (username && username !== userCheck.rows[0].username) {
      const existingUser = await query(
        'SELECT id FROM users WHERE username = $1 AND id != $2',
        [username, id]
      );
      if (existingUser.rows.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Benutzername ist bereits vergeben'
        });
      }
    }

    // Update-Query dynamisch aufbauen
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (username) {
      updates.push(`username = $${paramCount++}`);
      values.push(username);
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Passwort muss mindestens 6 Zeichen lang sein'
        });
      }
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      updates.push(`password_hash = $${paramCount++}`);
      values.push(passwordHash);
    }

    if (role) {
      updates.push(`role = $${paramCount++}`);
      values.push(role);
    }

    if (is_active !== undefined) {
      updates.push(`is_active = $${paramCount++}`);
      values.push(is_active);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount} 
       RETURNING id, username, role, is_active, created_at, updated_at`,
      values
    );

    console.log(`✅ User updated: ${result.rows[0].username} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Benutzer erfolgreich aktualisiert',
      data: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

// DELETE /api/users/:id - Benutzer löschen (nur Admin)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Benutzer existiert?
    const userCheck = await query(
      'SELECT id, username FROM users WHERE id = $1',
      [id]
    );

    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Benutzer nicht gefunden'
      });
    }

    // Verhindere, dass sich ein Admin selbst löscht
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Sie können sich nicht selbst löschen'
      });
    }

    await query('DELETE FROM users WHERE id = $1', [id]);

    console.log(`✅ User deleted: ${userCheck.rows[0].username} by ${req.user.username}`);

    res.json({
      success: true,
      message: 'Benutzer erfolgreich gelöscht'
    });

  } catch (error) {
    next(error);
  }
});

// PATCH /api/users/:id/toggle-active - Benutzer aktivieren/deaktivieren (nur Admin)
router.patch('/:id/toggle-active', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;

    // Verhindere, dass sich ein Admin selbst deaktiviert
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Sie können sich nicht selbst deaktivieren'
      });
    }

    const result = await query(
      `UPDATE users SET is_active = NOT is_active, updated_at = NOW() 
       WHERE id = $1 
       RETURNING id, username, role, is_active, created_at, updated_at`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Benutzer nicht gefunden'
      });
    }

    console.log(`✅ User ${result.rows[0].is_active ? 'activated' : 'deactivated'}: ${result.rows[0].username} by ${req.user.username}`);

    res.json({
      success: true,
      message: `Benutzer ${result.rows[0].is_active ? 'aktiviert' : 'deaktiviert'}`,
      data: result.rows[0]
    });

  } catch (error) {
    next(error);
  }
});

module.exports = router;
