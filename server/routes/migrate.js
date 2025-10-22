const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const fs = require('fs');
const path = require('path');

// Verkaufspreis Migration (bestehend)
router.post('/verkaufspreis', async (req, res) => {
  try {
    console.log('🚀 Starting verkaufspreis migration via API...');
    
    // Prüfe ob Spalte bereits existiert
    const checkResult = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'verkaufspreis'
    `);

    if (checkResult.rows.length > 0) {
      return res.json({
        success: true,
        message: 'Verkaufspreis-Spalte existiert bereits',
        alreadyExists: true
      });
    }

    // Füge verkaufspreis Spalte hinzu
    await query(`
      ALTER TABLE bookings 
      ADD COLUMN verkaufspreis DECIMAL(10,2) DEFAULT NULL
    `);
    console.log('✅ Added verkaufspreis column to bookings table');

    // Füge Kommentar hinzu
    await query(`
      COMMENT ON COLUMN bookings.verkaufspreis IS 'Verkaufspreis der Buchung in Euro'
    `);
    console.log('✅ Added comment to verkaufspreis column');

    // Füge Index für Performance hinzu
    await query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_verkaufspreis 
      ON bookings(verkaufspreis) 
      WHERE verkaufspreis IS NOT NULL
    `);
    console.log('✅ Added index for verkaufspreis column');

    console.log('🎉 Migration completed successfully!');

    res.json({
      success: true,
      message: 'Verkaufspreis-Migration erfolgreich abgeschlossen',
      changes: [
        'verkaufspreis DECIMAL(10,2) Spalte hinzugefügt',
        'Kommentar zur Dokumentation hinzugefügt',
        'Performance-Index erstellt'
      ]
    });

  } catch (error) {
    console.error('❌ Migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Migration fehlgeschlagen',
      error: error.message
    });
  }
});

// Users Migration (neu)
router.post('/users', async (req, res) => {
  try {
    console.log('🚀 Starting users migration via API...');
    
    // Prüfe ob users Tabelle bereits existiert
    const checkResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);

    if (checkResult.rows.length > 0) {
      // Prüfe ob Standard-Benutzer existieren
      const usersResult = await query('SELECT id, username, role FROM users ORDER BY created_at');
      
      return res.json({
        success: true,
        message: 'Users-Tabelle existiert bereits',
        alreadyExists: true,
        users: usersResult.rows
      });
    }

    // Erstelle users Tabelle
    await query(`
      CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Created users table');

    // Erstelle Indizes
    await query('CREATE INDEX idx_users_username ON users(username)');
    await query('CREATE INDEX idx_users_role ON users(role)');
    console.log('✅ Created indexes');

    // Erstelle Trigger für updated_at
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = CURRENT_TIMESTAMP;
          RETURN NEW;
      END;
      $$ language 'plpgsql'
    `);

    await query(`
      CREATE TRIGGER update_users_updated_at 
          BEFORE UPDATE ON users 
          FOR EACH ROW 
          EXECUTE FUNCTION update_updated_at_column()
    `);
    console.log('✅ Created update trigger');

    // Füge Kommentare hinzu
    await query(`
      COMMENT ON TABLE users IS 'Benutzer-Tabelle für Authentifizierung und Autorisierung';
      COMMENT ON COLUMN users.id IS 'Eindeutige Benutzer-ID';
      COMMENT ON COLUMN users.username IS 'Eindeutiger Benutzername für Login';
      COMMENT ON COLUMN users.password_hash IS 'Gehashtes Passwort (bcrypt)';
      COMMENT ON COLUMN users.role IS 'Benutzerrolle: admin (Vollzugriff) oder viewer (nur lesen)';
    `);
    console.log('✅ Added table comments');

    // Erstelle Standard-Benutzer
    // Admin: admin / admin123
    await query(`
      INSERT INTO users (username, password_hash, role) 
      VALUES ('admin', '$2b$12$LQv3c1yqBw2fyuDxAiO1KOHGeaNHiCRlsBAu.H0LhubTRBKr4qiAi', 'admin')
    `);

    // Viewer: viewer / viewer123
    await query(`
      INSERT INTO users (username, password_hash, role) 
      VALUES ('viewer', '$2b$12$8Y6.V7QGsqrdy4q2rjwIve7FGsL6l8J8VvBUy.vEcOnlre7EMW.H.', 'viewer')
    `);
    console.log('✅ Created default users');

    // Prüfe erstellte Benutzer
    const usersResult = await query('SELECT id, username, role, created_at FROM users ORDER BY created_at');

    console.log('🎉 Users migration completed successfully!');

    res.json({
      success: true,
      message: 'Users-Migration erfolgreich abgeschlossen',
      changes: [
        'users Tabelle erstellt',
        'Indizes für Performance hinzugefügt',
        'Update-Trigger implementiert',
        'Standard-Benutzer erstellt'
      ],
      users: usersResult.rows,
      credentials: {
        admin: { username: 'admin', password: 'admin123', role: 'admin' },
        viewer: { username: 'viewer', password: 'viewer123', role: 'viewer' }
      }
    });

  } catch (error) {
    console.error('❌ Users migration failed:', error);
    res.status(500).json({
      success: false,
      message: 'Users-Migration fehlgeschlagen',
      error: error.message
    });
  }
});

// Migration Status
router.get('/status', async (req, res) => {
  try {
    const migrations = {};

    // Prüfe verkaufspreis Migration
    const verkaufspreisResult = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' AND column_name = 'verkaufspreis'
    `);
    migrations.verkaufspreis = verkaufspreisResult.rows.length > 0;

    // Prüfe users Migration
    const usersTableResult = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'users'
    `);
    migrations.users_table = usersTableResult.rows.length > 0;

    if (migrations.users_table) {
      const usersResult = await query('SELECT id, username, role FROM users ORDER BY created_at');
      migrations.users_count = usersResult.rows.length;
      migrations.users = usersResult.rows;
    }

    res.json({
      success: true,
      migrations
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Status-Abfrage fehlgeschlagen',
      error: error.message
    });
  }
});

module.exports = router;


// Users Password Fix (für Debugging)
router.post('/users-fix', async (req, res) => {
  try {
    console.log('🔧 Starting users password fix...');
    
    // Lösche alte Benutzer
    await query('DELETE FROM users WHERE username IN ($1, $2)', ['admin', 'viewer']);
    console.log('✅ Deleted old users');

    // Erstelle neue Benutzer mit korrekten Hashes
    const adminHash = '$2b$12$SKSM5BlYBsXT7smBLwgIp.D2KupS15rKwyIywtnGhHijjR6xpLa86';
    const viewerHash = '$2b$12$q5fKMyPul9mE3/ne5u5dcOyzVZIe7nEceiBZ.RK/aE3rlzgy0A15q';

    await query(`
      INSERT INTO users (username, password_hash, role) 
      VALUES ('admin', $1, 'admin')
    `, [adminHash]);

    await query(`
      INSERT INTO users (username, password_hash, role) 
      VALUES ('viewer', $1, 'viewer')
    `, [viewerHash]);
    
    console.log('✅ Created users with new password hashes');

    // Prüfe erstellte Benutzer
    const usersResult = await query('SELECT id, username, role, created_at FROM users ORDER BY created_at');

    console.log('🎉 Users password fix completed successfully!');

    res.json({
      success: true,
      message: 'Users-Passwort-Fix erfolgreich abgeschlossen',
      users: usersResult.rows,
      credentials: {
        admin: { username: 'admin', password: 'admin123', role: 'admin' },
        viewer: { username: 'viewer', password: 'viewer123', role: 'viewer' }
      }
    });

  } catch (error) {
    console.error('❌ Users password fix failed:', error);
    res.status(500).json({
      success: false,
      message: 'Users-Passwort-Fix fehlgeschlagen',
      error: error.message
    });
  }
});


// Users Debug (Tabellen-Struktur prüfen)
router.get('/users-debug', async (req, res) => {
  try {
    console.log('🔍 Debugging users table structure...');
    
    // Prüfe Tabellen-Struktur
    const structureResult = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    // Prüfe aktuelle Benutzer
    const usersResult = await query('SELECT * FROM users LIMIT 5');
    
    res.json({
      success: true,
      table_structure: structureResult.rows,
      current_users: usersResult.rows,
      debug_info: {
        table_exists: structureResult.rows.length > 0,
        user_count: usersResult.rows.length
      }
    });

  } catch (error) {
    console.error('❌ Users debug failed:', error);
    res.status(500).json({
      success: false,
      message: 'Users-Debug fehlgeschlagen',
      error: error.message
    });
  }
});

// Users Fix v2 (mit email-Spalte)
router.post('/users-fix-v2', async (req, res) => {
  try {
    console.log('🔧 Starting users password fix v2...');
    
    // Lösche alte Benutzer
    await query('DELETE FROM users WHERE username IN ($1, $2)', ['admin', 'viewer']);
    console.log('✅ Deleted old users');

    // Erstelle neue Benutzer mit korrekten Hashes und email
    const adminHash = '$2b$12$SKSM5BlYBsXT7smBLwgIp.D2KupS15rKwyIywtnGhHijjR6xpLa86';
    const viewerHash = '$2b$12$q5fKMyPul9mE3/ne5u5dcOyzVZIe7nEceiBZ.RK/aE3rlzgy0A15q';

    await query(`
      INSERT INTO users (username, password_hash, role, email) 
      VALUES ('admin', $1, 'admin', 'admin@koeln-branchen.local')
    `, [adminHash]);

    await query(`
      INSERT INTO users (username, password_hash, role, email) 
      VALUES ('viewer', $1, 'viewer', 'viewer@koeln-branchen.local')
    `, [viewerHash]);
    
    console.log('✅ Created users with new password hashes and emails');

    // Prüfe erstellte Benutzer
    const usersResult = await query('SELECT id, username, role, email, created_at FROM users ORDER BY created_at');

    console.log('🎉 Users password fix v2 completed successfully!');

    res.json({
      success: true,
      message: 'Users-Passwort-Fix v2 erfolgreich abgeschlossen',
      users: usersResult.rows,
      credentials: {
        admin: { username: 'admin', password: 'admin123', role: 'admin' },
        viewer: { username: 'viewer', password: 'viewer123', role: 'viewer' }
      }
    });

  } catch (error) {
    console.error('❌ Users password fix v2 failed:', error);
    res.status(500).json({
      success: false,
      message: 'Users-Passwort-Fix v2 fehlgeschlagen',
      error: error.message
    });
  }
});

