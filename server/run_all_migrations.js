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

async function runMigrations() {
  const client = await pool.connect();
  try {
    // Run migrations in order
    const migrations = [
      'initial_schema.sql',
      'create_users_table.sql',
      'insert_default_users.sql'
    ];

    for (const migration of migrations) {
      console.log(`Running migration: ${migration}`);
      const sql = await fs.readFile(path.join(__dirname, 'migrations', migration), 'utf8');
      await client.query(sql);
      console.log(`✅ Successfully completed migration: ${migration}`);
    }

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();