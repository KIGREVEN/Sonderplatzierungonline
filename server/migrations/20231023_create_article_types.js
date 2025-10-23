const { query } = require('../config/database');

async function up() {
  // Create article_types table
  await query(`
    CREATE TABLE IF NOT EXISTS article_types (
      id SERIAL PRIMARY KEY,
      key VARCHAR(255) NOT NULL UNIQUE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Add article_type_id to products table
  await query(`
    ALTER TABLE products 
    ADD COLUMN IF NOT EXISTS article_type_id INTEGER REFERENCES article_types(id);
  `);

  // Insert initial article types
  await query(`
    INSERT INTO article_types (key, name, description) VALUES
    ('top-ranking', 'Top-Ranking', 'Top-Ranking Platzierungen'),
    ('premium-listing', 'Premium-Listing', 'Premium-Listing Platzierungen'),
    ('standard-listing', 'Standard-Listing', 'Standard-Listing Platzierungen')
    ON CONFLICT (key) DO NOTHING;
  `);
}

async function down() {
  // Remove foreign key from products
  await query(`
    ALTER TABLE products DROP COLUMN IF EXISTS article_type_id;
  `);

  // Drop article_types table
  await query(`
    DROP TABLE IF EXISTS article_types;
  `);
}

module.exports = { up, down };