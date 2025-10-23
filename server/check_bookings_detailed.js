const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'sp_db',
  user: process.env.DB_USER || 'sp_user',
  password: process.env.DB_PASSWORD || 'sp_pass'
});

async function checkBookings() {
  try {
    console.log('=== BUCHUNGEN IN DER DATENBANK ===\n');
    
    const result = await pool.query(`
      SELECT 
        b.id,
        b.kundenname,
        b.kundennummer,
        b.berater,
        b.status,
        b.verkaufspreis,
        b.platform_id,
        b.product_id,
        b.category_id,
        b.location_id,
        b.campaign_id,
        p.name as platform_name,
        pr.name as product_name,
        c.name as category_name,
        l.name as location_name,
        ca.name as campaign_name
      FROM bookings b
      LEFT JOIN platforms p ON b.platform_id = p.id
      LEFT JOIN products pr ON b.product_id = pr.id
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN locations l ON b.location_id = l.id
      LEFT JOIN campaigns ca ON b.campaign_id = ca.id
      ORDER BY b.id
    `);
    
    console.log(`Gefundene Buchungen: ${result.rows.length}\n`);
    
    result.rows.forEach((booking, index) => {
      console.log(`--- Buchung #${index + 1} (ID: ${booking.id}) ---`);
      console.log(`Kunde: ${booking.kundenname} (${booking.kundennummer})`);
      console.log(`Berater: ${booking.berater}`);
      console.log(`Status: ${booking.status}`);
      console.log(`Verkaufspreis: ${booking.verkaufspreis || 'N/A'}`);
      console.log(`\nZuordnungen:`);
      console.log(`  Platform: ${booking.platform_name} (ID: ${booking.platform_id})`);
      console.log(`  Produkt: ${booking.product_name} (ID: ${booking.product_id})`);
      console.log(`  Kategorie: ${booking.category_name} (ID: ${booking.category_id})`);
      console.log(`  Ort: ${booking.location_name} (ID: ${booking.location_id})`);
      console.log(`  Kampagne: ${booking.campaign_name} (ID: ${booking.campaign_id})`);
      console.log('');
    });
    
    // Prüfe, welche Produkte in der DB existieren
    const products = await pool.query('SELECT id, name, article_type_id FROM products ORDER BY id');
    console.log('=== VERFÜGBARE PRODUKTE ===');
    products.rows.forEach(p => {
      console.log(`ID ${p.id}: ${p.name} (Artikel-Typ: ${p.article_type_id})`);
    });
    
  } catch (error) {
    console.error('Fehler:', error);
  } finally {
    await pool.end();
  }
}

checkBookings();
