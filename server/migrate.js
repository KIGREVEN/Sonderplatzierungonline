const { query } = require('./config/database');

async function runMigration() {
  try {
    console.log('🚀 Starting verkaufspreis migration...');
    
    // Check if column already exists
    const checkColumn = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'bookings' 
      AND column_name = 'verkaufspreis'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('✅ Column verkaufspreis already exists');
      return;
    }
    
    // Add verkaufspreis column
    await query(`
      ALTER TABLE bookings 
      ADD COLUMN verkaufspreis DECIMAL(10,2) DEFAULT NULL
    `);
    
    console.log('✅ Added verkaufspreis column to bookings table');
    
    // Add comment
    await query(`
      COMMENT ON COLUMN bookings.verkaufspreis IS 'Verkaufspreis der Buchung in Euro'
    `);
    
    console.log('✅ Added comment to verkaufspreis column');
    
    // Add index
    await query(`
      CREATE INDEX idx_bookings_verkaufspreis 
      ON bookings(verkaufspreis) 
      WHERE verkaufspreis IS NOT NULL
    `);
    
    console.log('✅ Added index for verkaufspreis column');
    
    console.log('🎉 Migration completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if this script is executed directly
if (require.main === module) {
  runMigration().then(() => {
    console.log('Migration finished. Exiting...');
    process.exit(0);
  });
}

module.exports = runMigration;

