#!/bin/bash

# Backend-Reparatur-Script für Köln Branchen Portal
# Behebt PM2 "errored" Status

echo "🚨 Backend-Reparatur - PM2 Status 'errored'"
echo "============================================"

SERVER_DIR="$HOME/koelnbranchende/server"

# Prüfe ob Verzeichnis existiert
if [ ! -d "$SERVER_DIR" ]; then
    echo "❌ Fehler: $SERVER_DIR nicht gefunden!"
    exit 1
fi

echo "🔍 Aktueller PM2-Status:"
pm2 status

echo ""
echo "🛠️ Schritt 1: Backend stoppen und aufräumen..."
pm2 stop koeln-branchen-backend 2>/dev/null || echo "Backend war bereits gestoppt"
pm2 delete koeln-branchen-backend 2>/dev/null || echo "Backend war bereits gelöscht"

echo "🛠️ Schritt 2: Dependencies prüfen..."
cd "$SERVER_DIR"
if [ ! -d "node_modules" ]; then
    echo "📦 Installiere Dependencies..."
    npm install
else
    echo "✅ Dependencies bereits vorhanden"
fi

echo "🛠️ Schritt 3: Environment-Datei prüfen/erstellen..."
if [ ! -f ".env" ]; then
    echo "📝 Erstelle .env Datei..."
    cat > .env << 'EOF'
DATABASE_URL=postgresql://adtle:password@localhost:5432/koeln_branchen_db
PORT=3001
NODE_ENV=production
CORS_ORIGIN=http://217.110.253.198:3000,http://192.168.116.42:3000,http://localhost:3000
JWT_SECRET=koeln-branchen-jwt-secret-key-2025
JWT_EXPIRES_IN=24h
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET=koeln-branchen-portal-secret-key-2025
CLEANUP_INTERVAL_MINUTES=30
RESERVATION_TIMEOUT_MINUTES=30
EOF
    echo "✅ .env Datei erstellt"
else
    echo "✅ .env Datei bereits vorhanden"
fi

echo "🛠️ Schritt 4: PostgreSQL prüfen..."
if sudo systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL läuft bereits"
else
    echo "🔄 Starte PostgreSQL..."
    sudo systemctl start postgresql
    sleep 2
    if sudo systemctl is-active --quiet postgresql; then
        echo "✅ PostgreSQL gestartet"
    else
        echo "⚠️ PostgreSQL-Start fehlgeschlagen - prüfen Sie manuell"
    fi
fi

echo "🛠️ Schritt 5: Port-Konflikte prüfen..."
if netstat -tlnp 2>/dev/null | grep -q ":3001 "; then
    echo "⚠️ Port 3001 ist belegt:"
    netstat -tlnp 2>/dev/null | grep ":3001 "
    echo "Beende bestehende Prozesse..."
    sudo pkill -f "node.*index.js" 2>/dev/null || echo "Keine Node-Prozesse gefunden"
    sleep 2
fi

echo "🛠️ Schritt 6: Backend manuell testen..."
echo "Teste Backend-Start (5 Sekunden)..."
timeout 5s node index.js &
TEST_PID=$!
sleep 3

if kill -0 $TEST_PID 2>/dev/null; then
    echo "✅ Backend startet erfolgreich"
    kill $TEST_PID 2>/dev/null
    wait $TEST_PID 2>/dev/null
else
    echo "❌ Backend-Start fehlgeschlagen"
    echo "Prüfe Logs manuell: cd $SERVER_DIR && node index.js"
    exit 1
fi

echo "🛠️ Schritt 7: Backend mit PM2 starten..."
pm2 start index.js --name koeln-branchen-backend --no-watch

sleep 3

echo ""
echo "🔍 Neuer PM2-Status:"
pm2 status

echo ""
echo "🧪 Backend-Test:"
if curl -s http://localhost:3001/health >/dev/null 2>&1; then
    echo "✅ Backend erreichbar auf localhost:3001"
else
    echo "⚠️ Backend nicht erreichbar auf localhost:3001"
fi

if curl -s http://192.168.116.42:3001/health >/dev/null 2>&1; then
    echo "✅ Backend erreichbar auf 192.168.116.42:3001"
else
    echo "⚠️ Backend nicht erreichbar auf 192.168.116.42:3001"
fi

if curl -s http://217.110.253.198:3001/health >/dev/null 2>&1; then
    echo "✅ Backend erreichbar auf 217.110.253.198:3001"
else
    echo "⚠️ Backend nicht erreichbar auf 217.110.253.198:3001"
fi

echo ""
echo "🎉 Backend-Reparatur abgeschlossen!"
echo ""
echo "📋 Nächste Schritte:"
echo "  1. Prüfe PM2-Status: pm2 status"
echo "  2. Prüfe Backend-Logs: pm2 logs koeln-branchen-backend"
echo "  3. Teste Frontend-Login erneut"
echo ""
echo "🚨 Bei Problemen:"
echo "  - Logs prüfen: pm2 logs koeln-branchen-backend --lines 50"
echo "  - Manuell starten: cd $SERVER_DIR && node index.js"
echo "  - PostgreSQL prüfen: sudo systemctl status postgresql"

