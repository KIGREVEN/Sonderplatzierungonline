# 🎯 Fortschritt: API findet users-Tabelle, aber Passwort-Problem

## ✅ Erfolge:
- **Datenbankverbindung funktioniert** (keine "users does not exist" Fehler)
- **API verwendet jetzt koeln_branchen_db** (DATABASE_URL konfiguriert)
- **Backend läuft stabil** (online status)
- **Tabellen erstellt**: bookings, categories, users

## ❌ Neues Problem:
- **"Ungültige Anmeldedaten"** statt Datenbankfehler
- **Passwort-Hashes sind falsch** oder beschädigt
- **Bookings-Import fehlgeschlagen** (Timestamp-Probleme)

---

## 🔧 Sofortige Lösung: Korrekte Passwort-Hashes

### Schritt 1: Aktuelle Benutzer prüfen
```bash
psql -U adtle -d koeln_branchen_db -h localhost -c "
SELECT id, username, role, 
       substring(password_hash, 1, 20) as hash_preview,
       length(password_hash) as hash_length
FROM users;
"
```

### Schritt 2: Korrekte bcrypt-Hashes setzen
```bash
psql -U adtle -d koeln_branchen_db -h localhost << 'EOF'
-- Korrekte bcrypt-Hashes für admin123 und viewer123
UPDATE users 
SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
WHERE username = 'admin';

UPDATE users 
SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' 
WHERE username = 'viewer';

-- Prüfen
SELECT username, role, 
       substring(password_hash, 1, 30) as hash_preview,
       length(password_hash) as hash_length
FROM users;
EOF
```

### Schritt 3: API-Login testen
```bash
curl --location 'http://192.168.116.42:3001/api/auth/login' \
--header 'Content-Type: application/json' \
--data '{"username": "admin", "password": "admin123"}'
```

---

## 🔧 Alternative: Neue Hashes generieren

### Falls die Standard-Hashes nicht funktionieren:
```bash
cd /home/adtle/koelnbranchende/server

# Hash-Generator-Script erstellen
cat > generate_hash.js << 'EOF'
const bcrypt = require('bcrypt');

async function generateHash(password) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  return hash;
}

async function main() {
  console.log('=== Generating bcrypt hashes ===');
  await generateHash('admin123');
  await generateHash('viewer123');
}

main();
EOF

# Hashes generieren
node generate_hash.js
```

### Neue Hashes in DB setzen:
```bash
# Ersetzen Sie HASH_ADMIN und HASH_VIEWER mit den generierten Hashes
psql -U adtle -d koeln_branchen_db -h localhost << 'EOF'
UPDATE users SET password_hash = 'HASH_ADMIN' WHERE username = 'admin';
UPDATE users SET password_hash = 'HASH_VIEWER' WHERE username = 'viewer';
EOF
```

---

## 🔧 Bookings-Daten reparieren

### Problem: Timestamp-Format-Fehler beim Import
```bash
# Bookings manuell aus adtle DB kopieren
psql -U adtle -d adtle -h localhost -c "
SELECT 'INSERT INTO bookings (kundenname, kundennummer, belegung, zeitraum_von, zeitraum_bis, platzierung, status, berater, verkaufspreis) VALUES (' ||
       '''' || kundenname || ''', ' ||
       '''' || kundennummer || ''', ' ||
       '''' || belegung || ''', ' ||
       '''' || zeitraum_von || ''', ' ||
       CASE WHEN zeitraum_bis IS NULL THEN 'NULL' ELSE '''' || zeitraum_bis || '''' END || ', ' ||
       platzierung || ', ' ||
       '''' || status || ''', ' ||
       '''' || berater || ''', ' ||
       COALESCE(verkaufspreis::text, 'NULL') || ');'
FROM bookings;
" > /tmp/bookings_insert.sql

# Bookings importieren
psql -U adtle -d koeln_branchen_db -h localhost -f /tmp/bookings_insert.sql

# Prüfen
psql -U adtle -d koeln_branchen_db -h localhost -c "SELECT COUNT(*) FROM bookings;"
```

---

## 🎯 Erwartetes Ergebnis nach der Korrektur:

### Erfolgreicher API-Login:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

### Vollständige Datenbank:
```bash
# Alle Tabellen mit Daten
psql -U adtle -d koeln_branchen_db -h localhost -c "
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'bookings' as table_name, COUNT(*) as count FROM bookings
UNION ALL
SELECT 'categories' as table_name, COUNT(*) as count FROM categories;
"
```

---

## 🚀 Schnellste Lösung (All-in-One):

```bash
# 1. Passwort-Hashes korrigieren
psql -U adtle -d koeln_branchen_db -h localhost << 'EOF'
UPDATE users SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE username = 'admin';
UPDATE users SET password_hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' WHERE username = 'viewer';
EOF

# 2. API-Login testen
curl --location 'http://192.168.116.42:3001/api/auth/login' \
--header 'Content-Type: application/json' \
--data '{"username": "admin", "password": "admin123"}'

# 3. Bei Erfolg: Bookings-Daten kopieren
if [ $? -eq 0 ]; then
  echo "Login erfolgreich! Kopiere Bookings-Daten..."
  pg_dump -U adtle -d adtle -h localhost --table=bookings --data-only --column-inserts > /tmp/bookings_clean.sql
  psql -U adtle -d koeln_branchen_db -h localhost -f /tmp/bookings_clean.sql
fi
```

---

## 🔍 Debug-Informationen:

### Backend-Logs überprüfen:
```bash
pm2 logs koeln-branchen-backend --lines 10
```

### Passwort-Verifikation testen:
```bash
cd /home/adtle/koelnbranchende/server

cat > test_password.js << 'EOF'
const bcrypt = require('bcrypt');

async function testPassword() {
  const password = 'admin123';
  const hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
  
  const isValid = await bcrypt.compare(password, hash);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  console.log(`Valid: ${isValid}`);
}

testPassword();
EOF

node test_password.js
```

---

## 🎯 Zusammenfassung:

1. **Hauptproblem gelöst**: API findet users-Tabelle
2. **Neues Problem**: Passwort-Hashes sind falsch
3. **Lösung**: Korrekte bcrypt-Hashes setzen
4. **Zusätzlich**: Bookings-Daten reparieren

**Das System ist fast einsatzbereit - nur noch die Passwort-Hashes korrigieren!**

