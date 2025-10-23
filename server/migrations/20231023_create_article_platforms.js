const { query } = require('../config/database');

async function up() {
  // Create article_platforms junction table
  await query(`
    CREATE TABLE IF NOT EXISTS article_platforms (
      article_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
      platform_key VARCHAR(255) REFERENCES platforms(key) ON DELETE CASCADE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (article_id, platform_key)
    );
  `);

  // Move existing platform relationships
  await query(`
    INSERT INTO article_platforms (article_id, platform_key)
    SELECT id, platform_key FROM products
    ON CONFLICT DO NOTHING;
  `);

  // Keep the platform_key column for now, but make it nullable
  await query(`
    ALTER TABLE products ALTER COLUMN platform_key DROP NOT NULL;
  `);
}

async function down() {
  // Add back platform_key column
  await query(`
    ALTER TABLE products ADD COLUMN platform_key VARCHAR(255) REFERENCES platforms(key);
  `);

  // Move relationships back
  await query(`
    UPDATE products p
    SET platform_key = ap.platform_key
    FROM article_platforms ap
    WHERE p.id = ap.article_id;
  `);

  // Drop junction table
  await query(`
    DROP TABLE IF EXISTS article_platforms;
  `);
}

module.exports = { up, down };