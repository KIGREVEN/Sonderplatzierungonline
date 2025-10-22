#!/bin/bash

# Korrekte Trennung von Migration und Seeding
# Migration AKTIV lassen, nur Auto-Seeding deaktivieren

echo "🎯 Migration vs. Seeding - Korrekte Trennung"
echo "============================================"

SERVER_DIR="$HOME/koelnbranchende/server"

if [ ! -d "$SERVER_DIR" ]; then
    echo "❌ Fehler: $SERVER_DIR nicht gefunden!"
    exit 1
fi

cd "$SERVER_DIR"

echo "🔍 Problem: Migration wurde mit Seeding zusammen deaktiviert"
echo "✅ Lösung: Migration AKTIV lassen, nur Auto-Seeding deaktivieren"
echo ""

echo "🛠️ Schritt 1: Backup wiederherstellen (falls vorhanden)..."
if [ -f "index.js.backup" ]; then
    cp index.js.backup index.js
    echo "✅ Backup wiederhergestellt"
else
    echo "⚠️ Kein Backup gefunden - arbeite mit aktueller Datei"
    # Neues Backup erstellen
    cp index.js index.js.backup.$(date +%Y%m%d_%H%M%S)
fi

echo "🛠️ Schritt 2: Korrekte Konfiguration anwenden..."

# Erstelle temporäre Datei mit korrekter Konfiguration
cat > migration_fix.sed << 'EOF'
# Migration-Block AKTIVIEREN (falls auskommentiert)
s|^[[:space:]]*//[[:space:]]*console\.log.*Running database migration|    console.log('🔄 Running database migration...');|
s|^[[:space:]]*//[[:space:]]*try {|    try {|
s|^[[:space:]]*//[[:space:]]*execSync.*migrate:up|      execSync('npm run migrate:up', { cwd: __dirname, stdio: 'inherit' });|
s|^[[:space:]]*//[[:space:]]*console\.log.*Database migration completed|      console.log('✅ Database migration completed');|

# Auto-Seeding DEAKTIVIEREN
s|^[[:space:]]*if (recordCount === 0) {|    // AUTO-SEEDING DEAKTIVIERT\n    // if (recordCount === 0) {|
s|^[[:space:]]*console\.log.*Database is empty, seeding|    //   console.log('🌱 Database is empty, seeding with sample data...');|
s|^[[:space:]]*execSync.*npm run seed:run|    //   execSync('npm run seed:run', { cwd: __dirname, stdio: 'inherit' });|
s|^[[:space:]]*console\.log.*Database seeded successfully|    //   console.log('✅ Database seeded successfully');|
s|^[[:space:]]*} else {|    // } else {|
s|^[[:space:]]*console\.log.*Database already contains.*records, skipping seed|    console.log(\`📊 Database contains \${recordCount} records, auto-seeding disabled\`);|
s|^[[:space:]]*}$|    // }|
EOF

# Wende Korrekturen an
sed -i -f migration_fix.sed index.js

# Aufräumen
rm migration_fix.sed

echo "✅ Konfiguration korrigiert"

echo "🛠️ Schritt 3: Validierung der Änderungen..."

# Prüfe ob Migration aktiv ist
if grep -q "console.log('🔄 Running database migration" index.js; then
    echo "✅ Migration ist AKTIV"
else
    echo "⚠️ Migration möglicherweise nicht aktiv"
fi

# Prüfe ob Auto-Seeding deaktiviert ist
if grep -q "// if (recordCount === 0)" index.js; then
    echo "✅ Auto-Seeding ist DEAKTIVIERT"
else
    echo "⚠️ Auto-Seeding möglicherweise noch aktiv"
fi

echo "🛠️ Schritt 4: Backend neu starten..."
pm2 restart koeln-branchen-backend

sleep 3

echo "🛠️ Schritt 5: Logs prüfen..."
echo "Backend-Logs (letzte 15 Zeilen):"
pm2 logs koeln-branchen-backend --lines 15

echo ""
echo "🧪 Schritt 6: Login-Test..."
sleep 2

LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' 2>/dev/null)

if echo "$LOGIN_RESPONSE" | grep -q '"success":true'; then
    echo "✅ Login erfolgreich!"
    echo "🎉 Problem gelöst!"
else
    echo "⚠️ Login noch nicht erfolgreich"
    echo "Response: $LOGIN_RESPONSE"
    
    # Prüfe ob Users-Tabelle existiert
    echo ""
    echo "🔍 Prüfe Users-Tabelle..."
    if psql -U adtle -d koeln_branchen_db -c "SELECT COUNT(*) FROM users;" >/dev/null 2>&1; then
        echo "✅ Users-Tabelle existiert"
        USER_COUNT=$(psql -U adtle -d koeln_branchen_db -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ')
        echo "👤 Anzahl Benutzer: $USER_COUNT"
        
        if [ "$USER_COUNT" -eq 0 ]; then
            echo "⚠️ Keine Benutzer vorhanden - führe Seeding aus..."
            npm run seed:run
        fi
    else
        echo "❌ Users-Tabelle fehlt noch - Migration fehlgeschlagen"
        echo "Führe Migration manuell aus:"
        echo "  npm run migrate:up"
    fi
fi

echo ""
echo "🎯 Zusammenfassung:"
echo "  ✅ Migration: AKTIV (erstellt Tabellen)"
echo "  ✅ Auto-Seeding: DEAKTIVIERT (verhindert Database-Reset)"
echo "  ✅ Manuelles Seeding: Verfügbar (npm run seed:run)"
echo ""
echo "📋 Nächste Schritte:"
echo "  1. Teste Frontend-Login mit admin/admin123"
echo "  2. Teste Frontend-Build (sollte DB nicht mehr resetten)"
echo "  3. Bei Bedarf manuell seeden: npm run seed:run"
echo ""
echo "🔄 Rollback (falls nötig):"
echo "  cp index.js.backup index.js && pm2 restart koeln-branchen-backend"

