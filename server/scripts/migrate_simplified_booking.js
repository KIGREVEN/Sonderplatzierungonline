const { query } = require('../config/database');

(async () => {
  try {
    console.log('🔄 Updating bookings table for simplified booking logic...');

    // 1. Make zeitraum_von and zeitraum_bis nullable (no longer needed)
    console.log('Making date fields optional...');
    await query(`
      ALTER TABLE bookings
      ALTER COLUMN zeitraum_von DROP NOT NULL,
      ALTER COLUMN zeitraum_bis DROP NOT NULL;
    `);

    // 2. Add new ID-based foreign key columns
    console.log('Adding new ID-based columns...');
    await query(`
      ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS platform_id INTEGER,
      ADD COLUMN IF NOT EXISTS product_id INTEGER,
      ADD COLUMN IF NOT EXISTS campaign_id INTEGER,
      ADD COLUMN IF NOT EXISTS category_id INTEGER;
    `);

    // 3. Add foreign key constraints
    console.log('Adding foreign key constraints...');
    await query(`
      DO $$
      BEGIN
        -- Platform FK
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'fk_bookings_platform'
        ) THEN
          ALTER TABLE bookings
            ADD CONSTRAINT fk_bookings_platform 
            FOREIGN KEY (platform_id) REFERENCES platforms(id) ON DELETE RESTRICT;
        END IF;

        -- Product FK
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'fk_bookings_product'
        ) THEN
          ALTER TABLE bookings
            ADD CONSTRAINT fk_bookings_product 
            FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT;
        END IF;

        -- Campaign FK
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'fk_bookings_campaign'
        ) THEN
          ALTER TABLE bookings
            ADD CONSTRAINT fk_bookings_campaign 
            FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE RESTRICT;
        END IF;

        -- Category FK
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'fk_bookings_category'
        ) THEN
          ALTER TABLE bookings
            ADD CONSTRAINT fk_bookings_category 
            FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT;
        END IF;

        -- Location FK already exists, ensure it's RESTRICT
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'fk_bookings_location'
        ) THEN
          ALTER TABLE bookings DROP CONSTRAINT fk_bookings_location;
        END IF;
        
        ALTER TABLE bookings
          ADD CONSTRAINT fk_bookings_location 
          FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT;
      END$$;
    `);

    // 4. Drop old unique constraint (if exists)
    console.log('Removing old unique constraints...');
    await query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'unique_booking'
        ) THEN
          ALTER TABLE bookings DROP CONSTRAINT unique_booking;
        END IF;
      END$$;
    `);

    // 5. Add new unique constraint to prevent double bookings
    console.log('Adding unique constraint for double-booking prevention...');
    await query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints 
          WHERE constraint_name = 'unique_booking_combination'
        ) THEN
          ALTER TABLE bookings
            ADD CONSTRAINT unique_booking_combination 
            UNIQUE (platform_id, product_id, location_id, campaign_id);
        END IF;
      END$$;
    `);

    // 6. Add indexes for performance
    console.log('Adding indexes...');
    await query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_platform_id ON bookings(platform_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_product_id ON bookings(product_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_campaign_id ON bookings(campaign_id);
      CREATE INDEX IF NOT EXISTS idx_bookings_category_id ON bookings(category_id);
    `);

    // 7. Make platzierung and belegung optional (no longer strictly needed)
    console.log('Making legacy fields optional...');
    await query(`
      ALTER TABLE bookings
      ALTER COLUMN platzierung DROP NOT NULL,
      ALTER COLUMN belegung DROP NOT NULL;
    `);

    console.log('✅ Bookings table updated successfully!');
    console.log('');
    console.log('Summary of changes:');
    console.log('- zeitraum_von, zeitraum_bis: now nullable (no longer required)');
    console.log('- Added: platform_id, product_id, campaign_id, category_id');
    console.log('- Unique constraint: (platform_id, product_id, location_id, campaign_id)');
    console.log('- platzierung, belegung: now nullable');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  }
})();
