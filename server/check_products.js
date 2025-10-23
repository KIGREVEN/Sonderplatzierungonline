require('dotenv').config();
const { query } = require('./config/database');

async function checkProducts() {
  try {
    // Check products
    const products = await query('SELECT id, name, key, article_type_id FROM products ORDER BY id');
    console.log('\n=== Bestehende Artikel ===');
    console.log(JSON.stringify(products.rows, null, 2));
    
    // Check article types
    const types = await query('SELECT id, key, name FROM article_types ORDER BY id');
    console.log('\n=== Artikel-Typen ===');
    console.log(JSON.stringify(types.rows, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Fehler:', error);
    process.exit(1);
  }
}

checkProducts();
