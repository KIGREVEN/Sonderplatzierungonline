# 🎯 Problem gefunden: API verwendet falsche Datenbank

## 🔍 Analyse der Logs:

**Konfiguration (.env):**
- ✅ DB_NAME=koeln_branchen_db (korrekt)
- ✅ DB_HOST=localhost (korrekt)
- ✅ DB_USER=adtle (korrekt)

**Tatsächliche Datenbanknutzung:**
- ❌ API verwendet `adtle` Datenbank statt `koeln_branchen_db`
- ✅ In `adtle` DB: bookings, categories, users Tabellen vorhanden
- ❌ In `koeln_branchen_db` DB: nur users Tabelle vorhanden

## 🔧 Ursache: Backend-Code ignoriert DB_NAME

### config/database.js analysieren:
```bash
cd /home/adtle/koelnbranchende/server
cat config/database.js
```

**Wahrscheinliche Ursachen:**
1. **DATABASE_URL überschreibt einzelne Variablen**
2. **Fallback-Logik verwendet Benutzername als DB-Name**
3. **Pool-Konfiguration ist falsch**

---

## ⚡ Schnellste Lösung: Daten in richtige DB kopieren

### Option A: Alle Daten von `adtle` nach `koeln_branchen_db` kopieren
```bash
# 1. Daten aus adtle DB exportieren
pg_dump -U adtle -h localhost -d adtle --data-only --inserts > /tmp/adtle_data.sql

# 2. Schema in koeln_branchen_db erstellen
psql -U adtle -d koeln_branchen_db -h localhost << 'EOF'
-- Categories Tabelle
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE
);

-- Bookings Tabelle
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
EOF

# 3. Daten importieren
psql -U adtle -d koeln_branchen_db -h localhost -f /tmp/adtle_data.sql

# 4. Prüfen
psql -U adtle -d koeln_branchen_db -h localhost -c "\dt"
psql -U adtle -d koeln_branchen_db -h localhost -c "SELECT COUNT(*) FROM bookings;"
```

### Option B: .env korrigieren (falls Backend falsch konfiguriert)
```bash
cd /home/adtle/koelnbranchende/server

# config/database.js analysieren
cat config/database.js

# Falls DATABASE_URL Problem:
echo "DATABASE_URL=postgresql://adtle@localhost:5432/koeln_branchen_db" >> .env

# Backend neu starten
pm2 restart koeln-branchen-backend
```

### Option C: Backend-Code korrigieren
```bash
cd /home/adtle/koelnbranchende/server

# Backup der aktuellen Konfiguration
cp config/database.js config/database.js.backup

# Neue Konfiguration mit expliziter DB-Auswahl
cat > config/database.js << 'EOF'
const { Pool } = require('pg');

// Explizite Datenbank-Konfiguration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'koeln_branchen_db', // Explizit gesetzt
  user: process.env.DB_USER || 'adtle',
  password: process.env.DB_PASSWORD || '',
  connectionTimeoutMillis: 2000,
  idleTimeoutMillis: 30000,
  max: 20,
};

console.log('🔧 Database config:', {
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  user: dbConfig.user
});

const pool = new Pool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT current_database(), current_user');
    console.log('✅ Database connected:', result.rows[0]);
    client.release();
    return true;
  } catch (err) {
    console.error('❌ Database connection failed:', err.message);
    return false;
  }
};

// Query function with logging
const query = async (text, params) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', {
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      duration,
      rows: res.rowCount
    });
    return res;
  } catch (err) {
    console.error('Query error:', err);
    throw err;
  }
};

// Transaction function
const transaction = async (callback) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

module.exports = {
  pool,
  query,
  transaction,
  testConnection
};
EOF

# Backend neu starten
pm2 restart koeln-branchen-backend
```

---

## 🚀 Empfohlenes Vorgehen:

### Schritt 1: Backend-Code analysieren
```bash
cd /home/adtle/koelnbranchende/server
cat config/database.js | grep -A 10 -B 5 "database\|Pool"
```

### Schritt 2: Schnellste Lösung (Option A)
```bash
# Alle Tabellen und Daten in koeln_branchen_db kopieren
pg_dump -U adtle -h localhost -d adtle --schema-only > /tmp/schema.sql
pg_dump -U adtle -h localhost -d adtle --data-only --inserts > /tmp/data.sql

# In Ziel-DB importieren
psql -U adtle -d koeln_branchen_db -h localhost -f /tmp/schema.sql
psql -U adtle -d koeln_branchen_db -h localhost -f /tmp/data.sql

# Prüfen
psql -U adtle -d koeln_branchen_db -h localhost -c "\dt"
```

### Schritt 3: API-Login testen
```bash
curl --location 'http://192.168.116.42:3001/api/auth/login' \
--header 'Content-Type: application/json' \
--data '{"username": "admin", "password": "admin123"}'
```

---

## 🎯 Warum passiert das?

**Mögliche Ursachen:**
1. **DATABASE_URL überschreibt DB_NAME**
2. **Pool-Konfiguration verwendet Fallback**
3. **Migration lief in falscher Datenbank**
4. **Backend-Code hat Hardcoded-Datenbank**

**Beweis aus Logs:**
- `adtle` DB hat: bookings (10 Datensätze), categories, users
- `koeln_branchen_db` hat: nur users (2 Datensätze)
- API findet bookings → verwendet `adtle` DB
- API findet keine users in `adtle` DB → Fehler

---

## ✅ Nach der Lösung erwarten Sie:

```bash
# Tabellen in koeln_branchen_db
psql -U adtle -d koeln_branchen_db -h localhost -c "\dt"
# Ergebnis: bookings, categories, users

# API-Login erfolgreich
curl --location 'http://192.168.116.42:3001/api/auth/login' \
--header 'Content-Type: application/json' \
--data '{"username": "admin", "password": "admin123"}'
# Ergebnis: {"success": true, "data": {"token": "...", "user": {...}}}
```

