const { query } = require('../config/database');

(async () => {
  try {
    console.log('🔧 Fixing categories schema...');

    // Ensure is_active exists
    await query(`
      ALTER TABLE categories 
      ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true
    `);
    console.log('✅ Ensured categories.is_active');

    // Ensure timestamps exist
    await query(`
      ALTER TABLE categories 
      ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW()
    `);
    console.log('✅ Ensured categories.created_at and categories.updated_at');

    // Create or replace trigger function
    await query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Add trigger for categories if not exists
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_trigger WHERE tgname = 'update_categories_updated_at'
        ) THEN
          CREATE TRIGGER update_categories_updated_at
          BEFORE UPDATE ON categories
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
        END IF;
      END$$;
    `);
    console.log('✅ Ensured update trigger on categories');

    // Backfill any NULLs
    await query(`UPDATE categories SET is_active = COALESCE(is_active, true)`);

    // Preview
    const result = await query('SELECT id, name, is_active, created_at, updated_at FROM categories ORDER BY name');
    console.log('📋 Categories preview:', result.rows);

    console.log('🎉 Categories schema fix completed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Categories schema fix failed:', err);
    process.exit(1);
  }
})();
