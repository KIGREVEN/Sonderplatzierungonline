const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'sp_db',
  user: 'sp_user',
  password: 'sp_pass',
  ssl: false
});

async function runUsersMigration() {
  const client = await pool.connect();
  try {
    console.log('Running users migration...');
    const sql = await fs.readFile(path.join(__dirname, 'migrations', 'create_users_table.sql'), 'utf8');
    await client.query('DROP TABLE IF EXISTS users CASCADE');
    await client.query(sql);
    console.log('✅ Successfully created users table');

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runUsersMigration();