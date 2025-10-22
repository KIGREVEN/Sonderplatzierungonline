#!/bin/bash

# Fix für fehlende Users-Tabelle
# Behebt "relation 'users' does not exist" Fehler

echo "🚨 Users-Tabelle reparieren"
echo "==========================="

DB_NAME="koeln_branchen_db"
DB_USER="adtle"

echo "🔍 Problem: relation 'users' does not exist"
echo "✅ Lösung: Users-Tabelle manuell erstellen"
echo ""

echo "🛠️ Schritt 1: Datenbank-Verbindung testen..."
if psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Datenbank-Verbindung erfolgreich"
else
    echo "❌ Datenbank-Verbindung fehlgeschlagen"
    echo "Prüfen Sie:"
    echo "  - PostgreSQL läuft: sudo systemctl status postgresql"
    echo "  - Datenbank existiert: psql -U $DB_USER -l | grep $DB_NAME"
    echo "  - Benutzer-Berechtigung: psql -U $DB_USER -d $DB_NAME -c 'SELECT 1;'"
    exit 1
fi

echo "🛠️ Schritt 2: Prüfe ob Users-Tabelle existiert..."
if psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1 FROM users LIMIT 1;" >/dev/null 2>&1; then
    echo "✅ Users-Tabelle existiert bereits"
    echo "Zeige vorhandene Benutzer:"
    psql -U "$DB_USER" -d "$DB_NAME" -c "SELECT id, username, role, created_at FROM users;"
else
    echo "❌ Users-Tabelle fehlt - wird erstellt..."
    
    echo "🛠️ Schritt 3: Users-Tabelle erstellen..."
    psql -U "$DB_USER" -d "$DB_NAME" << 'EOF'
-- Users-Tabelle erstellen
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index für bessere Performance
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Admin-Benutzer erstellen (Passwort: admin123)
INSERT INTO users (username, password_hash, role) VALUES 
('admin', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Viewer-Benutzer erstellen (Passwort: viewer123)  
INSERT INTO users (username, password_hash, role) VALUES 
('viewer', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'viewer')
ON CONFLICT (username) DO NOTHING;

-- Ergebnis anzeigen
SELECT 'Users-Tabelle erfolgreich erstellt!' as status;
SELECT id, username, role, created_at FROM users;
EOF

    if [ $? -eq 0 ]; then
        echo "✅ Users-Tabelle erfolgreich erstellt"
    else
        echo "❌ Fehler beim Erstellen der Users-Tabelle"
        exit 1
    fi
fi

echo "🛠️ Schritt 4: Backend neu starten..."
if command -v pm2 >/dev/null 2>&1; then
    if pm2 list | grep -q "koeln-branchen-backend"; then
        echo "🔄 PM2 restart..."
        pm2 restart koeln-branchen-backend
        sleep 2
        echo "✅ Backend neu gestartet"
    else
        echo "⚠️ Backend nicht in PM2 gefunden"
        echo "Starten Sie manuell: cd ~/koelnbranchende/server && pm2 start index.js --name koeln-branchen-backend"
    fi
else
    echo "⚠️ PM2 nicht gefunden"
    echo "Starten Sie Backend manuell: cd ~/koelnbranchende/server && node index.js"
fi

echo "🛠️ Schritt 5: Login-Test..."
sleep 3

# Test Login
echo "Teste Admin-Login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' 2>/dev/null)

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Admin-Login erfolgreich!"
    echo "Token erhalten: $(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4 | cut -c1-20)..."
else
    echo "⚠️ Login-Test fehlgeschlagen"
    echo "Response: $LOGIN_RESPONSE"
    echo "Prüfen Sie Backend-Logs: pm2 logs koeln-branchen-backend"
fi

echo ""
echo "🎉 Users-Tabelle-Reparatur abgeschlossen!"
echo ""
echo "📋 Erstelle Benutzer:"
echo "  👤 admin / admin123 (Administrator)"
echo "  👤 viewer / viewer123 (Nur-Lesen)"
echo ""
echo "🧪 Testen Sie jetzt:"
echo "  1. Frontend-Login mit admin/admin123"
echo "  2. Alle API-Funktionen sollten funktionieren"
echo ""
echo "🔍 Bei Problemen:"
echo "  - Backend-Logs: pm2 logs koeln-branchen-backend"
echo "  - Datenbank prüfen: psql -U $DB_USER -d $DB_NAME -c 'SELECT * FROM users;'"
echo "  - Login testen: curl -X POST http://localhost:3001/api/auth/login -H 'Content-Type: application/json' -d '{\"username\":\"admin\",\"password\":\"admin123\"}'"

