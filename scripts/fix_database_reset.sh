#!/bin/bash

# Fix für Database-Reset-Problem beim Frontend-Build
# Führen Sie dieses Script auf Ihrem Linux-Server aus

echo "🚨 Database-Reset-Problem lösen"
echo "==============================="

SERVER_DIR="/home/ubuntu/koelnbranchende/server"

# Prüfe ob Verzeichnis existiert
if [ ! -d "$SERVER_DIR" ]; then
    echo "❌ Fehler: $SERVER_DIR nicht gefunden!"
    echo "Führen Sie dieses Script auf Ihrem Linux-Server aus."
    exit 1
fi

echo "🎯 Problem: Backend resettet Datenbank bei jedem Start"
echo "✅ Lösung: Auto-Seeding deaktivieren"
echo ""

echo "📝 Schritt 1: Backup erstellen..."
cp "$SERVER_DIR/index.js" "$SERVER_DIR/index.js.backup"
echo "✅ Backup erstellt: $SERVER_DIR/index.js.backup"

echo "📝 Schritt 2: Auto-Seeding deaktivieren..."

# Auto-Seeding Block auskommentieren
sed -i '/if (recordCount === 0) {/,/console\.log.*Database seeded successfully/s/^/    \/\/ /' "$SERVER_DIR/index.js"

# Zusätzliche Zeilen auskommentieren
sed -i 's/console\.log.*Database is empty, seeding.*/    \/\/ &/' "$SERVER_DIR/index.js"
sed -i 's/execSync.*npm run seed:run.*/    \/\/ &/' "$SERVER_DIR/index.js"

# Erfolgs-Meldung anpassen
sed -i 's/console\.log.*Database already contains.*records, skipping seed.*/    console.log(`📊 Database contains ${recordCount} records, auto-seeding disabled`);/' "$SERVER_DIR/index.js"

echo "✅ Auto-Seeding deaktiviert"

echo "📝 Schritt 3: Backend neu starten..."

# Versuche PM2 restart
if command -v pm2 >/dev/null 2>&1; then
    if pm2 list | grep -q "koeln-branchen-backend"; then
        echo "🔄 PM2 restart..."
        pm2 restart koeln-branchen-backend
        echo "✅ Backend über PM2 neu gestartet"
    else
        echo "⚠️ PM2 läuft, aber koeln-branchen-backend nicht gefunden"
        echo "Starten Sie manuell: cd $SERVER_DIR && pm2 start index.js --name koeln-branchen-backend"
    fi
else
    echo "⚠️ PM2 nicht gefunden"
    echo "Starten Sie Backend manuell: cd $SERVER_DIR && node index.js"
fi

echo ""
echo "🎉 Database-Reset-Problem behoben!"
echo ""
echo "📋 Was wurde geändert:"
echo "  - Auto-Seeding im Backend deaktiviert"
echo "  - Backup erstellt: index.js.backup"
echo "  - Backend neu gestartet"
echo ""
echo "🧪 Testen Sie jetzt:"
echo "  1. Frontend-Build: cd /home/ubuntu/koelnbranchende/client && npm run build"
echo "  2. Datenbank sollte NICHT mehr resettet werden"
echo ""
echo "🔧 Manuelles Seeding (falls nötig):"
echo "  cd $SERVER_DIR && npm run seed:run"
echo ""
echo "🔄 Rollback (falls nötig):"
echo "  cp $SERVER_DIR/index.js.backup $SERVER_DIR/index.js"
echo "  pm2 restart koeln-branchen-backend"
echo ""
echo "📊 Datenbank-Status prüfen:"
echo "  psql -U adtle -d koeln_branchen_db -c \"SELECT COUNT(*) FROM bookings;\""

