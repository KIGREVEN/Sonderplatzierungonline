const { query } = require('../config/database');

(async () => {
  try {
    console.log('🔧 Fixing bookings schema to match simplified model...');

    // Add missing foreign key columns (ids)
    await query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS platform_id INTEGER REFERENCES platforms(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS campaign_id INTEGER REFERENCES campaigns(id) ON DELETE SET NULL
    `);
    console.log('✅ Ensured id foreign keys (platform_id, product_id, location_id, category_id, campaign_id)');

    // Ensure berater exists (old schema had it, but make sure)
    await query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS berater VARCHAR(100)
    `);
    console.log('✅ Ensured bookings.berater');

    // Ensure verkaufspreis exists
    await query(`
      ALTER TABLE bookings 
      ADD COLUMN IF NOT EXISTS verkaufspreis DECIMAL(10,2)
    `);
    console.log('✅ Ensured bookings.verkaufspreis');

    // Align status allowed values: drop old check, normalize existing values, and add new validated check
    await query(`
      DO $$
      DECLARE
        cons RECORD;
      BEGIN
        FOR cons IN 
          SELECT conname FROM pg_constraint 
          WHERE conrelid = 'bookings'::regclass AND contype = 'c' AND conname ILIKE '%status%'
        LOOP
          EXECUTE format('ALTER TABLE bookings DROP CONSTRAINT %I', cons.conname);
        END LOOP;
      END$$;
    `);
    // Normalize any legacy or unexpected status values to fit the simplified set
    await query(`
      UPDATE bookings
      SET status = CASE
        WHEN status ILIKE 'geplant' THEN 'vorreserviert'
        WHEN status ILIKE 'bestätigt' OR status ILIKE 'bestaetigt' OR status ILIKE 'bestatigt' THEN 'gebucht'
        WHEN status ILIKE 'abgelehnt' OR status ILIKE 'storniert' OR status ILIKE 'canceled' OR status ILIKE 'cancelled' THEN 'reserviert'
        WHEN status ILIKE 'vorreserviert' THEN 'vorreserviert'
        WHEN status ILIKE 'reserviert' THEN 'reserviert'
        WHEN status ILIKE 'gebucht' THEN 'gebucht'
        ELSE 'reserviert'
      END
      WHERE status IS NOT NULL AND status NOT IN ('vorreserviert','reserviert','gebucht');
    `);
    // Add constraint as NOT VALID first to avoid immediate failure, then validate after normalization
    await query(`
      ALTER TABLE bookings 
      ADD CONSTRAINT chk_bookings_status CHECK (status IN ('vorreserviert','reserviert','gebucht')) NOT VALID
    `);
    await query(`
      ALTER TABLE bookings VALIDATE CONSTRAINT chk_bookings_status
    `);
    console.log('✅ Updated status CHECK constraint (normalized and validated)');

    // Legacy columns no longer required by simplified model should be nullable
    await query(`
      DO $$
      BEGIN
        -- Drop NOT NULL only if column exists
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'bookings' AND column_name = 'belegung'
        ) THEN
          BEGIN
            ALTER TABLE bookings ALTER COLUMN belegung DROP NOT NULL;
          EXCEPTION WHEN others THEN
            -- ignore if already nullable
            NULL;
          END;
        END IF;

        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'bookings' AND column_name = 'platzierung'
        ) THEN
          BEGIN
            ALTER TABLE bookings ALTER COLUMN platzierung DROP NOT NULL;
          EXCEPTION WHEN others THEN
            NULL;
          END;
        END IF;
      END$$;
    `);
    console.log('✅ Made legacy columns belegung/platzierung nullable');

    // Indexes to speed up lookups
    await query(`CREATE INDEX IF NOT EXISTS idx_bookings_platform_id ON bookings(platform_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_bookings_product_id ON bookings(product_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_bookings_location_id ON bookings(location_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_bookings_category_id ON bookings(category_id)`);
    await query(`CREATE INDEX IF NOT EXISTS idx_bookings_campaign_id ON bookings(campaign_id)`);

    // Preview structure
    const cols = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name='bookings' ORDER BY ordinal_position
    `);
    console.log('📋 bookings columns:', cols.rows.map(r => r.column_name).join(', '));

    console.log('🎉 Bookings schema fix completed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Bookings schema fix failed:', err);
    process.exit(1);
  }
})();
