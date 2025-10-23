require('dotenv').config();
const { query } = require('./config/database');

async function checkCategories() {
  try {
    const result = await query('SELECT * FROM categories ORDER BY id');
    console.log('\n=== Kategorien in der Datenbank ===');
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Fehler:', error);
    process.exit(1);
  }
}

checkCategories();
