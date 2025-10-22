const bcrypt = require('bcrypt');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createAdminUser() {
  const client = await pool.connect();
  
  try {
    const username = 'admin';
    const password = 'Automatisierung@123!';
    const role = 'admin';
    
    // Hash the password
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);
    
    // Insert or update the admin user
    const result = await client.query(`
      INSERT INTO users (username, password_hash, role) 
      VALUES ($1, $2, $3) 
      ON CONFLICT (username) 
      DO UPDATE SET password_hash = $2, role = $3
      RETURNING id, username, role, created_at
    `, [username, password_hash, role]);
    
    console.log('✅ Admin user created/updated:', result.rows[0]);
    console.log('Username:', username);
    console.log('Password:', password);
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

createAdminUser();

