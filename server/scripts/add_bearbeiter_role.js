const { query } = require('../config/database');

async function addBearbeiterRole() {
  try {
    console.log('🔧 Starte Migration: Füge "bearbeiter" Rolle zur Datenbank hinzu...');

    // Schritt 1: Prüfe ob Constraint existiert
    const checkConstraint = await query(`
      SELECT constraint_name 
      FROM information_schema.constraint_column_usage 
      WHERE table_name = 'users' 
      AND constraint_name = 'users_role_check'
    `);

    if (checkConstraint.rows.length > 0) {
      console.log('✅ Constraint "users_role_check" gefunden, wird aktualisiert...');
      
      // Schritt 2: Entferne alten Constraint
      await query(`
        ALTER TABLE users 
        DROP CONSTRAINT IF EXISTS users_role_check
      `);
      console.log('✅ Alter Constraint entfernt');
      
      // Schritt 3: Füge neuen Constraint mit 'bearbeiter' hinzu
      await query(`
        ALTER TABLE users 
        ADD CONSTRAINT users_role_check 
        CHECK (role IN ('admin', 'viewer', 'bearbeiter'))
      `);
      console.log('✅ Neuer Constraint mit "bearbeiter" Rolle hinzugefügt');
    } else {
      console.log('⚠️  Constraint "users_role_check" nicht gefunden');
      console.log('   Versuche Constraint direkt hinzuzufügen...');
      
      // Falls Constraint nicht existiert, direkt hinzufügen
      await query(`
        ALTER TABLE users 
        ADD CONSTRAINT users_role_check 
        CHECK (role IN ('admin', 'viewer', 'bearbeiter'))
      `);
      console.log('✅ Constraint mit allen Rollen hinzugefügt');
    }

    // Schritt 4: Prüfe die aktuelle Struktur
    const tableInfo = await query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Aktuelle Tabellenstruktur "users":');
    tableInfo.rows.forEach(col => {
      console.log(`   - ${col.column_name}: ${col.data_type} ${col.column_default ? `(default: ${col.column_default})` : ''}`);
    });

    // Schritt 5: Zeige aktuelle Benutzer
    const users = await query('SELECT id, username, role, is_active FROM users ORDER BY id');
    console.log('\n👥 Aktuelle Benutzer:');
    users.rows.forEach(user => {
      console.log(`   - ${user.username} (${user.role}) - ${user.is_active ? 'Aktiv' : 'Inaktiv'}`);
    });

    console.log('\n✅ Migration erfolgreich abgeschlossen!');
    console.log('   Die Rolle "bearbeiter" kann jetzt verwendet werden.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Fehler bei der Migration:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Script ausführen
addBearbeiterRole();
