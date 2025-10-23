const { query } = require('../config/database');

(async () => {
  try {
    console.log('=== ARTICLE_TYPES TABLE ===');
    const at = await query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'article_types' ORDER BY ordinal_position`);
    console.log(at.rows.map(r => r.column_name));

    console.log('\n=== ARTICLE_PLATFORMS TABLE ===');
    const ap = await query(`SELECT column_name FROM information_schema.columns WHERE table_name = 'article_platforms' ORDER BY ordinal_position`);
    console.log(ap.rows.map(r => r.column_name));

    console.log('\n=== PRODUCTS TABLE (rel to article_types) ===');
    const p = await query(`SELECT id, name, article_type_id FROM products LIMIT 3`);
    console.log(p.rows);

    console.log('\n=== ARTICLE_PLATFORMS DATA ===');
    const apData = await query(`SELECT * FROM article_platforms LIMIT 5`);
    console.log(apData.rows);

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
