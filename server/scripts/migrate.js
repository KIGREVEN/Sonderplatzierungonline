const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const createTables = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🚀 Starting database migration...');

    // Create categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      );
    `);
    console.log('✅ Created categories table');

    // Create bookings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        kundenname VARCHAR(100) NOT NULL,
        kundennummer VARCHAR(50) NOT NULL,
        belegung VARCHAR(100) NOT NULL,
        zeitraum_von TIMESTAMP WITH TIME ZONE NOT NULL,
        zeitraum_bis TIMESTAMP WITH TIME ZONE NOT NULL,
        platzierung INTEGER NOT NULL CHECK (platzierung >= 1 AND platzierung <= 6),
        status VARCHAR(20) NOT NULL DEFAULT 'reserviert' CHECK (status IN ('frei', 'reserviert', 'gebucht')),
        berater VARCHAR(100) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        
        -- Constraints
        CONSTRAINT valid_time_range CHECK (zeitraum_bis > zeitraum_von),
        CONSTRAINT unique_booking UNIQUE (belegung, platzierung, zeitraum_von, zeitraum_bis)
      );
    `);
    
    console.log('✅ Created bookings table');
    
    // Create indexes for better performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_belegung ON bookings(belegung);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_platzierung ON bookings(platzierung);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_zeitraum ON bookings(zeitraum_von, zeitraum_bis);
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_berater ON bookings(berater);
    `);
    
    console.log('✅ Created database indexes');
    
    // Create a function to automatically update the updated_at timestamp
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    
    // Create trigger for automatic timestamp updates
    await client.query(`
      DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
      CREATE TRIGGER update_bookings_updated_at
        BEFORE UPDATE ON bookings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    
    console.log('✅ Created triggers for automatic timestamp updates');
    
    // Create a view for booking conflicts
    await client.query(`
      CREATE OR REPLACE VIEW booking_conflicts AS
      SELECT 
        b1.id as booking1_id,
        b1.kundenname as booking1_kunde,
        b1.belegung as booking1_belegung,
        b1.platzierung,
        b1.zeitraum_von as booking1_von,
        b1.zeitraum_bis as booking1_bis,
        b2.id as booking2_id,
        b2.kundenname as booking2_kunde,
        b2.belegung as booking2_belegung,
        b2.zeitraum_von as booking2_von,
        b2.zeitraum_bis as booking2_bis
      FROM bookings b1
      JOIN bookings b2 ON (
        b1.id != b2.id 
        AND b1.belegung = b2.belegung 
        AND b1.platzierung = b2.platzierung
        AND b1.status IN ('reserviert', 'gebucht')
        AND b2.status IN ('reserviert', 'gebucht')
        AND (
          (b1.zeitraum_von <= b2.zeitraum_von AND b1.zeitraum_bis > b2.zeitraum_von) OR
          (b1.zeitraum_von < b2.zeitraum_bis AND b1.zeitraum_bis >= b2.zeitraum_bis) OR
          (b1.zeitraum_von >= b2.zeitraum_von AND b1.zeitraum_bis <= b2.zeitraum_bis)
        )
      );
    `);
    
    console.log('✅ Created booking conflicts view');
    
    // Create a function to clean up expired reservations
    await client.query(`
      CREATE OR REPLACE FUNCTION cleanup_expired_reservations(timeout_minutes INTEGER DEFAULT 30)
      RETURNS TABLE(
        id INTEGER,
        kundenname VARCHAR(100),
        belegung VARCHAR(100),
        platzierung INTEGER,
        expired_at TIMESTAMP WITH TIME ZONE
      ) AS $$
      BEGIN
        RETURN QUERY
        UPDATE bookings 
        SET status = 'frei', updated_at = NOW()
        WHERE status = 'reserviert' 
          AND created_at < NOW() - INTERVAL '1 minute' * timeout_minutes
        RETURNING 
          bookings.id,
          bookings.kundenname,
          bookings.belegung,
          bookings.platzierung,
          bookings.created_at + INTERVAL '1 minute' * timeout_minutes as expired_at;
      END;
      $$ LANGUAGE plpgsql;
    `);
    
    console.log('✅ Created cleanup function for expired reservations');

    // Create platforms table
    await client.query(`
      CREATE TABLE IF NOT EXISTS platforms (
        id SERIAL PRIMARY KEY,
        key VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(200) NOT NULL,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Created platforms table');

    // Create products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        platform_key VARCHAR(100) NOT NULL,
        key VARCHAR(100) NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        CONSTRAINT fk_products_platform FOREIGN KEY (platform_key) REFERENCES platforms(key) ON DELETE CASCADE,
        CONSTRAINT unique_product_per_platform UNIQUE (platform_key, key)
      );
    `);
    console.log('✅ Created products table');

    // Create locations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS locations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(200) NOT NULL,
        code VARCHAR(100),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Created locations table');

    // Create campaigns table
    await client.query(`
      CREATE TABLE IF NOT EXISTS campaigns (
        id SERIAL PRIMARY KEY,
        label VARCHAR(100) NOT NULL UNIQUE,
        from_date DATE,
        to_date DATE,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Created campaigns table');

    // Alter existing bookings table to add references for multi-platform support
    await client.query(`
      ALTER TABLE bookings
      ADD COLUMN IF NOT EXISTS platform_key VARCHAR(100),
      ADD COLUMN IF NOT EXISTS product_key VARCHAR(100),
      ADD COLUMN IF NOT EXISTS location_id INTEGER,
      ADD COLUMN IF NOT EXISTS campaign_label VARCHAR(100),
      ADD COLUMN IF NOT EXISTS customer_ref VARCHAR(100),
      ADD COLUMN IF NOT EXISTS meta JSONB;
    `);
    console.log('✅ Altered bookings table - added platform/product/location/campaign fields');

    // Add foreign key constraints where appropriate
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.table_constraints tc
          WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.constraint_name = 'fk_bookings_location'
        ) THEN
          ALTER TABLE bookings
            ADD CONSTRAINT fk_bookings_location FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;
        END IF;
      END$$;
    `);
    
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_products_platform_key ON products(platform_key);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_platform_key ON bookings(platform_key);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_product_key ON bookings(product_key);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_location_id ON bookings(location_id);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_bookings_campaign_label ON bookings(campaign_label);
    `);
    console.log('✅ Created indexes for new platform/product/location/campaign fields');
    
    console.log('🎉 Database migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

const dropTables = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  Dropping all tables and functions...');
    
    await client.query('DROP VIEW IF EXISTS booking_conflicts CASCADE;');
    await client.query('DROP FUNCTION IF EXISTS cleanup_expired_reservations(INTEGER) CASCADE;');
    await client.query('DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;');
    await client.query('DROP TABLE IF EXISTS bookings CASCADE;');
    
    console.log('✅ All tables and functions dropped');
    
  } catch (error) {
    console.error('❌ Drop failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

const showTables = async () => {
  const client = await pool.connect();
  
  try {
    console.log('📋 Database schema information:');
    
    // Show tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n📊 Tables:');
    tables.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Show views
    const views = await client.query(`
      SELECT table_name 
      FROM information_schema.views 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('\n👁️  Views:');
    views.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });
    
    // Show functions
    const functions = await client.query(`
      SELECT routine_name, routine_type
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      ORDER BY routine_name;
    `);
    
    console.log('\n⚙️  Functions:');
    functions.rows.forEach(row => {
      console.log(`  - ${row.routine_name} (${row.routine_type})`);
    });
    
    // Show bookings table structure
    if (tables.rows.some(row => row.table_name === 'bookings')) {
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        ORDER BY ordinal_position;
      `);
      
      console.log('\n📋 Bookings table structure:');
      columns.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : 'NULL'} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Show tables failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

// Command line interface
const command = process.argv[2];

const main = async () => {
  try {
    switch (command) {
      case 'up':
        await createTables();
        break;
      case 'down':
        await dropTables();
        break;
      case 'reset':
        await dropTables();
        await createTables();
        break;
      case 'status':
        await showTables();
        break;
      default:
        console.log('Usage: node migrate.js [up|down|reset|status]');
        console.log('  up     - Create tables and functions');
        console.log('  down   - Drop all tables and functions');
        console.log('  reset  - Drop and recreate everything');
        console.log('  status - Show current database schema');
        process.exit(1);
    }
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

if (require.main === module) {
  main();
}

module.exports = {
  createTables,
  dropTables,
  showTables
};

