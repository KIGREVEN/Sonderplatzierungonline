const fs = require('fs').promises;
const path = require('path');
const { query } = require('./config/database');

async function getMigrationFiles() {
  const migrationsDir = path.join(__dirname, 'migrations');
  const files = await fs.readdir(migrationsDir);
  return files
    .filter(f => f.endsWith('.js'))
    .sort();
}

async function createMigrationsTable() {
  await query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

async function getMigrationsFromDB() {
  const result = await query('SELECT name FROM migrations');
  return result.rows.map(row => row.name);
}

async function runMigration() {
  try {
    console.log('🚀 Starting migrations...');
    
    // Create migrations table if it doesn't exist
    await createMigrationsTable();
    
    // Get all migration files
    const migrationFiles = await getMigrationFiles();
    const executedMigrations = await getMigrationsFromDB();
    
    // Run pending migrations
    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        console.log(`Running migration: ${file}`);
        const migration = require(path.join(__dirname, 'migrations', file));
        await migration.up();
        await query('INSERT INTO migrations (name) VALUES ($1)', [file]);
        console.log(`✅ Completed migration: ${file}`);
      }
    }
    
    console.log('🎉 All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration().then(() => {
    console.log('Migrations finished. Exiting...');
    process.exit(0);
  });
}

module.exports = runMigration;

