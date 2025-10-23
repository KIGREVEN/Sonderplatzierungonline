const { Pool } = require('pg');
require('dotenv').config();

const cfg = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'sp_db',
  user: process.env.DB_USER || 'sp_user',
  password: process.env.DB_PASSWORD || 'sp_pass'
};

(async () => {
  const pool = new Pool(cfg);
  try {
    const res = await pool.query("SELECT id, username, is_active, role, created_at FROM users ORDER BY id");
    console.log('Users:', res.rows);
  } catch (err) {
    console.error('Error querying users:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
})();
