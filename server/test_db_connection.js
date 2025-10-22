require('dotenv').config();
const { Pool } = require('pg');

console.log('=== Umgebungsvariablen ===');
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD);

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

async function testConnection() {
  try {
    const client = await pool.connect();
    
    console.log('\n=== Verbindungsinfo ===');
    const dbInfo = await client.query('SELECT current_database(), current_user, current_schema()');
    console.log('Aktuelle Datenbank:', dbInfo.rows[0]);
    
    console.log('\n=== Alle Tabellen ===');
    const tables = await client.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
    console.log('Tabellen:', tables.rows.map(r => r.tablename));
    
    console.log('\n=== Users-Tabelle suchen ===');
    const usersCheck = await client.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users')");
    console.log('Users-Tabelle existiert:', usersCheck.rows[0].exists);
    
    if (usersCheck.rows[0].exists) {
      const users = await client.query('SELECT username, role FROM users');
      console.log('Benutzer:', users.rows);
    }
    
    client.release();
    await pool.end();
    
  } catch (error) {
    console.error('Verbindungsfehler:', error);
  }
}

testConnection();
