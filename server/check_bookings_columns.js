require('dotenv').config();
const { query } = require('./config/database');

async function checkBookingsColumns() {
  try {
    const result = await query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'bookings' ORDER BY ordinal_position"
    );
    console.log('\n=== Bookings Table Columns ===');
    console.log(JSON.stringify(result.rows, null, 2));
    process.exit(0);
  } catch (error) {
    console.error('Fehler:', error);
    process.exit(1);
  }
}

checkBookingsColumns();
