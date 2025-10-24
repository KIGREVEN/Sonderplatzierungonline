const { query } = require('../config/database');

(async () => {
  try {
    console.log('🔧 Füge is_active Spalte zur users-Tabelle hinzu...');

    // Prüfe ob Spalte bereits existiert
    const checkColumn = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' AND column_name = 'is_active'
    `);

    if (checkColumn.rows.length > 0) {
      console.log('✅ Spalte is_active existiert bereits');
    } else {
      // Spalte hinzufügen
      await query(`
        ALTER TABLE users 
        ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true
      `);
      console.log('✅ Spalte is_active hinzugefügt');
    }

    // Prüfe aktuelle Struktur
    const columns = await query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 Aktuelle users-Tabelle Struktur:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${col.column_default ? `DEFAULT ${col.column_default}` : ''}`);
    });

    // Zeige alle User
    const users = await query('SELECT id, username, role, is_active FROM users');
    console.log('\n👥 Benutzer:');
    users.rows.forEach(user => {
      console.log(`  - ${user.username} (${user.role}) - ${user.is_active ? 'aktiv' : 'inaktiv'}`);
    });

    console.log('\n🎉 Users-Schema fix abgeschlossen!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Fehler:', err.message);
    console.error(err);
    process.exit(1);
  }
})();
