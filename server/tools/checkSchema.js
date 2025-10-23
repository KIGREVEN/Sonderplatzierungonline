const { query } = require('../config/database');

(async () => {
  try {
    console.log('=== PRODUCTS TABLE ===');
    const products = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'products' 
      ORDER BY ordinal_position
    `);
    console.log(products.rows);

    console.log('\n=== BOOKINGS TABLE ===');
    const bookings = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      ORDER BY ordinal_position
    `);
    console.log(bookings.rows);

    console.log('\n=== ARTICLE_TYPES TABLE ===');
    const articleTypes = await query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'article_types' 
      ORDER BY ordinal_position
    `);
    console.log(articleTypes.rows);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
