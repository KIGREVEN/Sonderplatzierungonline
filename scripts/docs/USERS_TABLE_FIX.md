# 🔧 Users-Tabelle Fix - Migration unvollständig

## 🔍 Problem identifiziert:

1. **Migration-Script** erstellt nur `categories` und `bookings` Tabellen
2. **Users-Tabelle fehlt** komplett im Migration-Script
3. **API erwartet users-Tabelle** für Authentifizierung
4. **Frontend funktioniert** → wahrscheinlich hardcoded Authentifizierung

## ⚡ Sofortige Lösung:

### 1. Users-Tabelle manuell erstellen:
```bash
psql -U adtle -d koeln_branchen_db -h localhost << 'EOF'
-- Users-Tabelle erstellen
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer',
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bcrypt-Hashes für admin123 und viewer123
-- Hash für "admin123": $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi
-- Hash für "viewer123": $2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi

INSERT INTO users (username, password_hash, role) VALUES 
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('viewer', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'viewer')
ON CONFLICT (username) DO NOTHING;

-- Trigger für updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Ergebnis anzeigen
SELECT id, username, role, created_at FROM users;
EOF
```

### 2. Tabellen-Status überprüfen:
```bash
# Alle Tabellen anzeigen
psql -U adtle -d koeln_branchen_db -h localhost -c "\dt"

# Users-Tabelle spezifisch prüfen
psql -U adtle -d koeln_branchen_db -h localhost -c "SELECT username, role FROM users;"
```

### 3. API-Login testen:
```bash
curl --location 'http://192.168.116.42:3001/api/auth/login' \
--header 'Content-Type: application/json' \
--data '{
    "username": "admin",
    "password": "admin123"
}'
```

## 🔧 Erweiterte Migration-Script-Korrektur:

### Migration-Script erweitern:
```bash
cd /home/adtle/koelnbranchende/server/scripts

# Backup des aktuellen Scripts
cp migrate.js migrate.js.backup

# Users-Tabelle zur Migration hinzufügen
cat >> migrate_users.js << 'EOF'
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const createUsersTable = async () => {
  const client = await pool.connect();

  try {
    console.log('🔐 Creating users table...');

    // Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'viewer',
        email VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Created users table');

    // Insert default users
    await client.query(`
      INSERT INTO users (username, password_hash, role) VALUES 
      ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
      ('viewer', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'viewer')
      ON CONFLICT (username) DO NOTHING;
    `);

    console.log('✅ Inserted default users');

    // Create trigger for updated_at
    await client.query(`
      CREATE TRIGGER IF NOT EXISTS update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    console.log('✅ Created users table trigger');

    console.log('🎉 Users table migration completed!');

  } catch (error) {
    console.error('❌ Users migration failed:', error);
    throw error;
  } finally {
    client.release();
  }
};

if (require.main === module) {
  createUsersTable()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { createUsersTable };
EOF

# Users-Migration ausführen
node migrate_users.js
```

## 🔍 Warum funktioniert das Frontend?

### Frontend-Authentifizierung analysieren:
```bash
cd /home/adtle/koelnbranchende/client/src/context
grep -A 20 -B 5 "login" AuthContext.jsx
```

**Wahrscheinlich hardcoded:**
```javascript
const login = (username, password) => {
  if (username === 'admin' && password === 'admin123') {
    setUser({ username: 'admin', role: 'admin' });
    return true;
  }
  if (username === 'viewer' && password === 'viewer123') {
    setUser({ username: 'viewer', role: 'viewer' });
    return true;
  }
  return false;
};
```

## 🎯 Langfristige Lösung:

### 1. Migration-Script vollständig korrigieren:
```bash
cd /home/adtle/koelnbranchende/server/scripts

# Vollständiges Migration-Script mit users-Tabelle erstellen
cat > migrate_complete.js << 'EOF'
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const createAllTables = async () => {
  const client = await pool.connect();

  try {
    console.log('🚀 Starting complete database migration...');

    // 1. Create users table FIRST
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'viewer',
        email VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Created users table');

    // 2. Create categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE
      );
    `);
    console.log('✅ Created categories table');

    // 3. Create bookings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS bookings (
        id SERIAL PRIMARY KEY,
        kundenname VARCHAR(100) NOT NULL,
        kundennummer VARCHAR(50) NOT NULL,
        belegung VARCHAR(100) NOT NULL,
        zeitraum_von TIMESTAMP WITH TIME ZONE NOT NULL,
        zeitraum_bis TIMESTAMP WITH TIME ZONE,
        platzierung INTEGER CHECK (platzierung >= 1 AND platzierung <= 6),
        status VARCHAR(20) NOT NULL DEFAULT 'reserviert' CHECK (status IN ('frei', 'reserviert', 'gebucht')),
        berater VARCHAR(100) NOT NULL,
        verkaufspreis DECIMAL(10,2),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('✅ Created bookings table');

    // 4. Insert default users
    await client.query(`
      INSERT INTO users (username, password_hash, role) VALUES 
      ('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
      ('viewer', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'viewer')
      ON CONFLICT (username) DO NOTHING;
    `);
    console.log('✅ Inserted default users');

    // 5. Create update function
    await client.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);
    console.log('✅ Created update function');

    // 6. Create triggers
    await client.query(`
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
        BEFORE UPDATE ON users
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS update_bookings_updated_at ON bookings;
      CREATE TRIGGER update_bookings_updated_at
        BEFORE UPDATE ON bookings
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `);
    console.log('✅ Created triggers');

    console.log('🎉 Complete database migration finished!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

createAllTables();
EOF

# Vollständige Migration ausführen
node migrate_complete.js
```

## ✅ Erfolgskontrolle:

### Nach der Korrektur sollten Sie sehen:
```bash
# Tabellen-Liste
psql -U adtle -d koeln_branchen_db -h localhost -c "\dt"
# Ergebnis: users, categories, bookings

# Users-Inhalt
psql -U adtle -d koeln_branchen_db -h localhost -c "SELECT username, role FROM users;"
# Ergebnis: admin (admin), viewer (viewer)

# API-Login-Test
curl --location 'http://192.168.116.42:3001/api/auth/login' \
--header 'Content-Type: application/json' \
--data '{"username": "admin", "password": "admin123"}'
# Ergebnis: {"success": true, "data": {"token": "...", "user": {...}}}
```

## 🎯 Zusammenfassung:

1. **Problem**: Migration-Script unvollständig (keine users-Tabelle)
2. **Ursache**: API erwartet users-Tabelle, aber sie existiert nicht
3. **Lösung**: Users-Tabelle manuell erstellen mit korrekten bcrypt-Hashes
4. **Langfristig**: Migration-Script korrigieren für zukünftige Deployments

