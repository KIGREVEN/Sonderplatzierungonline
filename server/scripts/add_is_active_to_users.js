const { query } = require('../config/database');

(async () => {
  try {
    console.log('Füge is_active Spalte zur users Tabelle hinzu (falls nicht vorhanden)...');
    await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE`);
    await query(`UPDATE users SET is_active = TRUE WHERE is_active IS NULL`);
    console.log('✅ is_active Spalte hinzugefügt / initialisiert');
    process.exit(0);
  } catch (err) {
    console.error('Fehler beim Hinzufügen der Spalte is_active:', err.message);
    process.exit(1);
  }
})();
