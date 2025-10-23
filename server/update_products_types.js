require('dotenv').config();
const { query } = require('./config/database');

async function updateProducts() {
  try {
    console.log('Aktualisiere Artikel mit Artikel-Typen...\n');
    
    // Update "Top Ranking 1", "Top Ranking 2", "Top Ranking 3" to type_id 1 (Top-Ranking)
    await query(
      `UPDATE products SET article_type_id = 1 WHERE name LIKE 'Top Ranking%'`
    );
    console.log('✅ Top Ranking Artikel aktualisiert');
    
    // Update "App-Startseiten Banner" to type_id 4 (Banner)
    await query(
      `UPDATE products SET article_type_id = 4 WHERE key = 'banner'`
    );
    console.log('✅ Banner Artikel aktualisiert');
    
    // Check results
    const products = await query('SELECT id, name, key, article_type_id FROM products ORDER BY id');
    console.log('\n=== Aktualisierte Artikel ===');
    console.log(JSON.stringify(products.rows, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('Fehler:', error);
    process.exit(1);
  }
}

updateProducts();
