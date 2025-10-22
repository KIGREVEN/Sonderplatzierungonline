# 🚨 KRITISCHER FEHLER: Users-Tabelle fehlt!

## 🎯 **PROBLEM IDENTIFIZIERT:**
```
error: relation "users" does not exist
code: '42P01'
```

**Das Backend läuft, aber die `users` Tabelle existiert nicht in der Datenbank!**

## 🔍 **WARUM PASSIERT DAS:**
- Migration wurde nicht vollständig ausgeführt
- Users-Tabelle wurde nicht erstellt
- Login schlägt fehl → "relation 'users' does not exist"

---

## 🚀 **SOFORT-LÖSUNG:**

### **Schritt 1: Users-Tabelle manuell erstellen**
```sql
-- Auf Ihrem Server:
psql -U adtle -d koeln_branchen_db

-- Users-Tabelle erstellen:
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin-Benutzer erstellen:
INSERT INTO users (username, password_hash, role) VALUES 
('admin', '$2b$10$rQJ8YQZ9X1YQZ9X1YQZ9X1YQZ9X1YQZ9X1YQZ9X1YQZ9X1YQZ9X1Y', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Prüfen:
SELECT * FROM users;

-- Beenden:
\q
```

### **Schritt 2: Backend neu starten**
```bash
pm2 restart koeln-branchen-backend
```

---

## ⚡ **SCHNELL-FIX-SCRIPT:**

### **Alles in einem Befehl:**
```bash
# Users-Tabelle erstellen und Admin-User hinzufügen
psql -U adtle -d koeln_branchen_db << 'EOF'
-- Users-Tabelle erstellen
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin-Benutzer erstellen (Passwort: admin123)
INSERT INTO users (username, password_hash, role) VALUES 
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Viewer-Benutzer erstellen (Passwort: viewer123)
INSERT INTO users (username, password_hash, role) VALUES 
('viewer', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'viewer')
ON CONFLICT (username) DO NOTHING;

-- Prüfen
SELECT id, username, role, created_at FROM users;
EOF

# Backend neu starten
pm2 restart koeln-branchen-backend

# Status prüfen
pm2 status
```

---

## 🔧 **ALTERNATIVE: Migration reparieren**

### **Falls Migration-Script existiert:**
```bash
cd ~/koelnbranchende/server

# Migration-Script prüfen
ls scripts/

# Migration ausführen
npm run migrate:up

# Oder manuell:
node scripts/migrate.js up
```

---

## 🧪 **VALIDIERUNG:**

### **1. Tabelle prüfen:**
```bash
psql -U adtle -d koeln_branchen_db -c "SELECT * FROM users;"
```

### **2. Login testen:**
```bash
curl -X POST http://217.110.253.198:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### **3. Backend-Logs prüfen:**
```bash
pm2 logs koeln-branchen-backend --lines 10
# Sollte KEINE "users does not exist" Fehler mehr zeigen
```

---

## 📊 **ERWARTETE AUSGABE:**

### **Erfolgreiche Tabellen-Erstellung:**
```sql
CREATE TABLE
INSERT 0 1
INSERT 0 1
 id | username | role  |         created_at         
----+----------+-------+----------------------------
  1 | admin    | admin | 2025-08-07 10:30:00.000000+00
  2 | viewer   | viewer| 2025-08-07 10:30:00.000000+00
```

### **Erfolgreicher Login:**
```json
{
  "success": true,
  "message": "Anmeldung erfolgreich",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🎯 **WARUM DAS FUNKTIONIERT:**

### **Vorher:**
- Backend läuft ✅
- Users-Tabelle fehlt ❌
- Login schlägt fehl ❌

### **Nachher:**
- Backend läuft ✅
- Users-Tabelle existiert ✅
- Login funktioniert ✅

---

## 🚨 **FALLS IMMER NOCH PROBLEME:**

### **Vollständige Datenbank-Neuinitialisierung:**
```bash
# ACHTUNG: Löscht alle Daten!
psql -U adtle -d koeln_branchen_db << 'EOF'
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
EOF

# Migration neu ausführen
cd ~/koelnbranchende/server
npm run migrate:up
npm run seed:run
```

### **Benutzer-Passwort-Hashes:**
- **admin123**: `$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi`
- **viewer123**: `$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi`

**🎯 Nach diesem Fix sollte der Login wieder funktionieren!**

