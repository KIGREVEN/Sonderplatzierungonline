require('dotenv').config();
const { query } = require('../config/database');

async function addIsActiveToCategories() {
  try {
    console.log('Füge is_active Spalte zur categories Tabelle hinzu...\n');
    
    // Add is_active column
    await query(`
      ALTER TABLE categories 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
    `);
    console.log('✅ is_active Spalte hinzugefügt');
    
    // Set all existing categories to active
    await query(`UPDATE categories SET is_active = true WHERE is_active IS NULL`);
    console.log('✅ Alle bestehenden Kategorien auf aktiv gesetzt');
    
    // Check results
    const result = await query('SELECT id, name, is_active FROM categories ORDER BY name');
    console.log('\n=== Kategorien nach Update ===');
    console.log(JSON.stringify(result.rows, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Fehler:', error);
    process.exit(1);
  }
}

addIsActiveToCategories();
