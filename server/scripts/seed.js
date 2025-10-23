const { Pool } = require('pg');
require('dotenv').config();

// Database configuration
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'sp_db',
  user: process.env.DB_USER || 'sp_user',
  password: process.env.DB_PASSWORD || 'sp_pass',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const sampleCategories = [
  'Gastronomie',
  'Einzelhandel',
  'Dienstleistung',
  'Handwerk',
  'IT-Services',
  'Beratung',
  'Immobilien',
  'Gesundheitswesen',
  'Kanalreinigung'
];

const sampleBookings = [
  {
    kundenname: 'Max Mustermann',
    kundennummer: 'K-001',
    belegung: 'Gastronomie',
    zeitraum_von: new Date('2024-07-01T09:00:00Z'),
    zeitraum_bis: new Date('2024-07-01T17:00:00Z'),
    platzierung: 1,
    status: 'gebucht',
    berater: 'Anna Schmidt'
  },
  {
    kundenname: 'Erika Musterfrau',
    kundennummer: 'K-002',
    belegung: 'Einzelhandel',
    zeitraum_von: new Date('2024-07-01T10:00:00Z'),
    zeitraum_bis: new Date('2024-07-01T18:00:00Z'),
    platzierung: 2,
    status: 'gebucht',
    berater: 'Thomas Müller'
  },
  {
    kundenname: 'Hans Weber',
    kundennummer: 'K-003',
    belegung: 'Dienstleistung',
    zeitraum_von: new Date('2024-07-02T08:00:00Z'),
    zeitraum_bis: new Date('2024-07-02T16:00:00Z'),
    platzierung: 1,
    status: 'reserviert',
    berater: 'Anna Schmidt'
  },
  {
    kundenname: 'Maria Schneider',
    kundennummer: 'K-004',
    belegung: 'Handwerk',
    zeitraum_von: new Date('2024-07-02T09:00:00Z'),
    zeitraum_bis: new Date('2024-07-02T17:00:00Z'),
    platzierung: 3,
    status: 'gebucht',
    berater: 'Lisa Wagner'
  },
  {
    kundenname: 'Peter Fischer',
    kundennummer: 'K-005',
    belegung: 'IT-Services',
    zeitraum_von: new Date('2024-07-03T10:00:00Z'),
    zeitraum_bis: new Date('2024-07-03T18:00:00Z'),
    platzierung: 4,
    status: 'reserviert',
    berater: 'Thomas Müller'
  },
  {
    kundenname: 'Sabine Klein',
    kundennummer: 'K-006',
    belegung: 'Beratung',
    zeitraum_von: new Date('2024-07-04T09:00:00Z'),
    zeitraum_bis: new Date('2024-07-04T17:00:00Z'),
    platzierung: 2,
    status: 'gebucht',
    berater: 'Lisa Wagner'
  },
  {
    kundenname: 'Michael Braun',
    kundennummer: 'K-007',
    belegung: 'Gastronomie',
    zeitraum_von: new Date('2024-07-05T11:00:00Z'),
    zeitraum_bis: new Date('2024-07-05T19:00:00Z'),
    platzierung: 5,
    status: 'frei',
    berater: 'Anna Schmidt'
  },
  {
    kundenname: 'Julia Hoffmann',
    kundennummer: 'K-008',
    belegung: 'Einzelhandel',
    zeitraum_von: new Date('2024-07-06T08:30:00Z'),
    zeitraum_bis: new Date('2024-07-06T16:30:00Z'),
    platzierung: 6,
    status: 'reserviert',
    berater: 'Thomas Müller'
  },
  {
    kundenname: 'Robert Zimmermann',
    kundennummer: 'K-009',
    belegung: 'Immobilien',
    zeitraum_von: new Date('2024-07-07T09:30:00Z'),
    zeitraum_bis: new Date('2024-07-07T17:30:00Z'),
    platzierung: 1,
    status: 'gebucht',
    berater: 'Lisa Wagner'
  },
  {
    kundenname: 'Andrea Richter',
    kundennummer: 'K-010',
    belegung: 'Gesundheitswesen',
    zeitraum_von: new Date('2024-07-08T10:30:00Z'),
    zeitraum_bis: new Date('2024-07-08T18:30:00Z'),
    platzierung: 3,
    status: 'reserviert',
    berater: 'Anna Schmidt'
  }
];

const seedDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🌱 Starting database seeding...');

    // Clear existing data
    await client.query('DELETE FROM bookings');
    await client.query('DELETE FROM categories');
    await client.query("DELETE FROM platforms");
    await client.query("DELETE FROM products");
    await client.query("DELETE FROM locations");
    await client.query("DELETE FROM campaigns");
    console.log('🗑️  Cleared existing bookings and categories');
    
    // Reset sequences
  await client.query('ALTER SEQUENCE bookings_id_seq RESTART WITH 1');
  await client.query('ALTER SEQUENCE categories_id_seq RESTART WITH 1');
  await client.query('ALTER SEQUENCE platforms_id_seq RESTART WITH 1');
  await client.query('ALTER SEQUENCE products_id_seq RESTART WITH 1');
  await client.query('ALTER SEQUENCE locations_id_seq RESTART WITH 1');
  await client.query('ALTER SEQUENCE campaigns_id_seq RESTART WITH 1');
    console.log('🔄 Reset ID sequences');

    // Insert sample categories
    for (const name of sampleCategories) {
      await client.query('INSERT INTO categories (name) VALUES ($1)', [name]);
    }
    console.log(`✅ Inserted ${sampleCategories.length} categories`);

    // Insert required platforms (exactly three)
    const platforms = [
      { key: 'gelbe_seiten', name: 'Gelbe Seiten' },
      { key: 'das_telefonbuch', name: 'Das Telefonbuch' },
      { key: 'das_oertliche', name: 'Das Örtliche' }
    ];

    for (const p of platforms) {
      await client.query('INSERT INTO platforms (key, name, is_active) VALUES ($1,$2,$3)', [p.key, p.name, true]);
    }
    console.log('✅ Inserted 3 platforms (gelbe_seiten, das_telefonbuch, das_oertliche)');
    
    // Insert sample bookings
    for (const booking of sampleBookings) {
      await client.query(`
        INSERT INTO bookings (
          kundenname, kundennummer, belegung, zeitraum_von, zeitraum_bis, 
          platzierung, status, berater
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [
        booking.kundenname,
        booking.kundennummer,
        booking.belegung,
        booking.zeitraum_von,
        booking.zeitraum_bis,
        booking.platzierung,
        booking.status,
        booking.berater
      ]);
    }
    
    console.log(`✅ Inserted ${sampleBookings.length} sample bookings`);
    
    // Show statistics
    const stats = await client.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM bookings 
      GROUP BY status
      ORDER BY status;
    `);
    
    console.log('\n📊 Booking statistics:');
    stats.rows.forEach(row => {
      console.log(`  ${row.status}: ${row.count}`);
    });
    
    const placementStats = await client.query(`
      SELECT 
        platzierung,
        COUNT(*) as count
      FROM bookings 
      GROUP BY platzierung
      ORDER BY platzierung;
    `);
    
    console.log('\n📍 Placement statistics:');
    placementStats.rows.forEach(row => {
      console.log(`  Platz ${row.platzierung}: ${row.count} bookings`);
    });
    
    const brancheStats = await client.query(`
      SELECT 
        belegung,
        COUNT(*) as count
      FROM bookings 
      GROUP BY belegung
      ORDER BY count DESC;
    `);
    
    console.log('\n🏢 Branch statistics:');
    brancheStats.rows.forEach(row => {
      console.log(`  ${row.belegung}: ${row.count} bookings`);
    });
    
    console.log('\n🎉 Database seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

const clearDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🗑️  Clearing database...');

    await client.query('DELETE FROM bookings');
    await client.query('DELETE FROM categories');
    await client.query('ALTER SEQUENCE bookings_id_seq RESTART WITH 1');
    await client.query('ALTER SEQUENCE categories_id_seq RESTART WITH 1');
    
    console.log('✅ Database cleared');
    
  } catch (error) {
    console.error('❌ Clear failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

const showData = async () => {
  const client = await pool.connect();
  
  try {
    console.log('📋 Current database content:');
    
    const bookings = await client.query(`
      SELECT 
        id, kundenname, kundennummer, belegung, 
        platzierung, status, berater,
        TO_CHAR(zeitraum_von, 'YYYY-MM-DD HH24:MI') as von,
        TO_CHAR(zeitraum_bis, 'YYYY-MM-DD HH24:MI') as bis
      FROM bookings 
      ORDER BY zeitraum_von, platzierung;
    `);
    
    if (bookings.rows.length === 0) {
      console.log('  No bookings found');
    } else {
      console.log(`\n📊 ${bookings.rows.length} bookings found:\n`);
      console.log('ID | Kunde              | Nummer | Belegung        | Platz | Status     | Von             | Bis             | Berater');
      console.log('---|--------------------|---------|--------------------|-------|------------|-----------------|-----------------|------------------');
      
      bookings.rows.forEach(row => {
        console.log(
          `${row.id.toString().padEnd(2)} | ` +
          `${row.kundenname.padEnd(18)} | ` +
          `${row.kundennummer.padEnd(7)} | ` +
          `${row.belegung.padEnd(18)} | ` +
          `${row.platzierung.toString().padEnd(5)} | ` +
          `${row.status.padEnd(10)} | ` +
          `${row.von.padEnd(15)} | ` +
          `${row.bis.padEnd(15)} | ` +
          `${row.berater}`
        );
      });
    }
    
  } catch (error) {
    console.error('❌ Show data failed:', error);
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
      case 'seed':
        await seedDatabase();
        break;
      case 'clear':
        await clearDatabase();
        break;
      case 'show':
        await showData();
        break;
      case 'reset':
        await clearDatabase();
        await seedDatabase();
        break;
      default:
        console.log('Usage: node seed.js [seed|clear|show|reset]');
        console.log('  seed  - Insert sample data');
        console.log('  clear - Clear all data');
        console.log('  show  - Show current data');
        console.log('  reset - Clear and reseed');
        process.exit(1);
    }
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

if (require.main === module) {
  main();
}

module.exports = {
  seedDatabase,
  clearDatabase,
  showData,
  sampleBookings
};

