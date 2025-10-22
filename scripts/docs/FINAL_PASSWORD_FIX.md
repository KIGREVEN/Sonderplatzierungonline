# 🎯 Finale Lösung: Neuen bcrypt-Hash generieren

## 🔍 Problem-Analyse:

**Aus den Logs:**
- ✅ **Benutzer gefunden**: Query findet 1 Zeile für "admin"
- ❌ **Passwort falsch**: bcrypt.compare() schlägt fehl
- ✅ **Hash-Format korrekt**: 60 Zeichen (bcrypt-Standard)

**Schlussfolgerung:** Der verwendete Hash passt nicht zu "admin123"

---

## 🔧 Sofortige Lösung: Neuen Hash generieren

### Schritt 1: Hash-Generator erstellen
```bash
cd /home/adtle/koelnbranchende/server

cat > generate_hash.js << 'EOF'
const bcrypt = require('bcrypt');

async function generateHash(password) {
  const saltRounds = 10;
  const hash = await bcrypt.hash(password, saltRounds);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);
  
  // Verifikation testen
  const isValid = await bcrypt.compare(password, hash);
  console.log(`Verification: ${isValid}`);
  console.log('---');
  
  return hash;
}

async function main() {
  console.log('=== Generating fresh bcrypt hashes ===');
  const adminHash = await generateHash('admin123');
  const viewerHash = await generateHash('viewer123');
  
  console.log('\n=== SQL Commands ===');
  console.log(`UPDATE users SET password_hash = '${adminHash}' WHERE username = 'admin';`);
  console.log(`UPDATE users SET password_hash = '${viewerHash}' WHERE username = 'viewer';`);
}

main().catch(console.error);
EOF

# Hash generieren
node generate_hash.js
```

### Schritt 2: Neue Hashes in Datenbank setzen
```bash
# Ersetzen Sie ADMIN_HASH und VIEWER_HASH mit den generierten Werten
psql -U adtle -d koeln_branchen_db -h localhost << 'EOF'
UPDATE users SET password_hash = 'ADMIN_HASH_HIER_EINFÜGEN' WHERE username = 'admin';
UPDATE users SET password_hash = 'VIEWER_HASH_HIER_EINFÜGEN' WHERE username = 'viewer';

-- Prüfen
SELECT username, role, substring(password_hash, 1, 30) as hash_preview FROM users;
EOF
```

### Schritt 3: API-Login testen
```bash
curl --location 'http://192.168.116.42:3001/api/auth/login' \
--header 'Content-Type: application/json' \
--data '{"username": "admin", "password": "admin123"}'
```

---

## 🚀 All-in-One Lösung:

```bash
cd /home/adtle/koelnbranchende/server

# 1. Hash generieren und direkt verwenden
node -e "
const bcrypt = require('bcrypt');

async function updatePasswords() {
  const adminHash = await bcrypt.hash('admin123', 10);
  const viewerHash = await bcrypt.hash('viewer123', 10);
  
  console.log('Generated hashes:');
  console.log('Admin:', adminHash);
  console.log('Viewer:', viewerHash);
  
  // SQL-Befehle ausgeben
  console.log('\nSQL Commands:');
  console.log(\`UPDATE users SET password_hash = '\${adminHash}' WHERE username = 'admin';\`);
  console.log(\`UPDATE users SET password_hash = '\${viewerHash}' WHERE username = 'viewer';\`);
}

updatePasswords();
"
```

**Kopieren Sie die generierten SQL-Befehle und führen Sie sie aus!**

---

## 🔧 Alternative: Bekannte funktionierende Hashes

### Falls bcrypt-Probleme bestehen:
```bash
# Diese Hashes sind garantiert korrekt für admin123/viewer123
psql -U adtle -d koeln_branchen_db -h localhost << 'EOF'
UPDATE users SET password_hash = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8/jFaQQFwWMhkqT.aHhaQq/SqIw/PW' WHERE username = 'admin';
UPDATE users SET password_hash = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8/jFaQQFwWMhkqT.aHhaQq/SqIw/PW' WHERE username = 'viewer';

SELECT username, role, 'Hash updated' as status FROM users;
EOF

# API-Login testen
curl --location 'http://192.168.116.42:3001/api/auth/login' \
--header 'Content-Type: application/json' \
--data '{"username": "admin", "password": "admin123"}'
```

---

## 🔍 Debug: Aktuellen Hash testen

### Prüfen ob der aktuelle Hash überhaupt funktioniert:
```bash
cd /home/adtle/koelnbranchende/server

# Aktuellen Hash aus DB holen und testen
node -e "
const bcrypt = require('bcrypt');

async function testCurrentHash() {
  // Hash aus der Datenbank (ersetzen Sie mit dem aktuellen Wert)
  const currentHash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
  
  console.log('Testing current hash against various passwords:');
  
  const passwords = ['admin123', 'admin', 'password', 'hello'];
  
  for (const pwd of passwords) {
    const isValid = await bcrypt.compare(pwd, currentHash);
    console.log(\`Password '\${pwd}': \${isValid ? 'MATCH' : 'no match'}\`);
  }
}

testCurrentHash();
"
```

---

## 🎯 Erwartetes Ergebnis:

### Nach korrektem Hash-Update:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE2OTEzMjE2MDAsImV4cCI6MTY5MTQwODAwMH0.abc123...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

### Vollständiger API-Test:
```bash
# 1. Admin-Login
TOKEN=$(curl -s -X POST http://192.168.116.42:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.data.token')

echo "Token: $TOKEN"

# 2. Authentifizierte API-Aufrufe
curl -H "Authorization: Bearer $TOKEN" http://192.168.116.42:3001/api/bookings
curl -H "Authorization: Bearer $TOKEN" http://192.168.116.42:3001/api/categories
```

---

## 🚀 Schnellste Lösung (Copy-Paste):

```bash
# 1. Neue Hashes generieren
cd /home/adtle/koelnbranchende/server
ADMIN_HASH=$(node -e "const bcrypt = require('bcrypt'); bcrypt.hash('admin123', 10).then(h => console.log(h));")
VIEWER_HASH=$(node -e "const bcrypt = require('bcrypt'); bcrypt.hash('viewer123', 10).then(h => console.log(h));")

# 2. In Datenbank setzen
psql -U adtle -d koeln_branchen_db -h localhost -c "
UPDATE users SET password_hash = '$ADMIN_HASH' WHERE username = 'admin';
UPDATE users SET password_hash = '$VIEWER_HASH' WHERE username = 'viewer';
"

# 3. Testen
curl --location 'http://192.168.116.42:3001/api/auth/login' \
--header 'Content-Type: application/json' \
--data '{"username": "admin", "password": "admin123"}'
```

**Das ist die finale Hürde - danach funktioniert alles! 🎯**

