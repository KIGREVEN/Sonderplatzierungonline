#!/bin/bash

# Fix für externes Zugriffsproblem
# Frontend von interner IP (192.168.116.42) auf externe IP (217.110.253.198) umstellen

echo "🌐 Externes Zugriffsproblem beheben"
echo "=================================="

CLIENT_DIR="$HOME/koelnbranchende/client"
INTERNAL_IP="192.168.116.42"
EXTERNAL_IP="217.110.253.198"

if [ ! -d "$CLIENT_DIR" ]; then
    echo "❌ Fehler: $CLIENT_DIR nicht gefunden!"
    exit 1
fi

cd "$CLIENT_DIR"

echo "🔍 Problem: Frontend verwendet interne IP ($INTERNAL_IP)"
echo "✅ Lösung: Umstellung auf externe IP ($EXTERNAL_IP)"
echo ""

echo "🛠️ Schritt 1: Aktuelle IP-Konfiguration analysieren..."

INTERNAL_COUNT=$(find src/ -name "*.js" -o -name "*.jsx" | xargs grep -l "$INTERNAL_IP" 2>/dev/null | wc -l)
EXTERNAL_COUNT=$(find src/ -name "*.js" -o -name "*.jsx" | xargs grep -l "$EXTERNAL_IP" 2>/dev/null | wc -l)

echo "📊 Dateien mit interner IP ($INTERNAL_IP): $INTERNAL_COUNT"
echo "📊 Dateien mit externer IP ($EXTERNAL_IP): $EXTERNAL_COUNT"

if [ "$INTERNAL_COUNT" -gt 0 ]; then
    echo ""
    echo "🔍 Dateien mit interner IP:"
    find src/ -name "*.js" -o -name "*.jsx" | xargs grep -l "$INTERNAL_IP" 2>/dev/null
fi

echo ""
echo "🛠️ Schritt 2: Backup erstellen..."
if [ ! -d "src_backup_$(date +%Y%m%d)" ]; then
    cp -r src "src_backup_$(date +%Y%m%d)"
    echo "✅ Backup erstellt: src_backup_$(date +%Y%m%d)"
else
    echo "✅ Backup bereits vorhanden"
fi

echo "🛠️ Schritt 3: Alle Frontend-Dateien auf externe IP umstellen..."

# Finde und korrigiere alle Dateien
CHANGED_FILES=0
for file in $(find src/ -name "*.js" -o -name "*.jsx"); do
    if grep -q "$INTERNAL_IP" "$file" 2>/dev/null; then
        echo "🔧 Korrigiere: $file"
        sed -i "s|$INTERNAL_IP|$EXTERNAL_IP|g" "$file"
        CHANGED_FILES=$((CHANGED_FILES + 1))
    fi
done

echo "✅ $CHANGED_FILES Dateien korrigiert"

echo "🛠️ Schritt 4: Environment-Dateien prüfen..."
for env_file in .env .env.local .env.production; do
    if [ -f "$env_file" ]; then
        if grep -q "$INTERNAL_IP" "$env_file" 2>/dev/null; then
            echo "🔧 Korrigiere Environment: $env_file"
            sed -i "s|$INTERNAL_IP|$EXTERNAL_IP|g" "$env_file"
        fi
    fi
done

echo "🛠️ Schritt 5: Cache vollständig löschen..."
echo "🗑️ Lösche node_modules/.cache..."
rm -rf node_modules/.cache

echo "🗑️ Lösche node_modules/.vite..."
rm -rf node_modules/.vite

echo "🗑️ Lösche dist/ Ordner..."
rm -rf dist

echo "🗑️ Lösche npm Cache..."
npm cache clean --force 2>/dev/null || echo "npm cache bereits sauber"

echo "🛠️ Schritt 6: Frontend neu builden..."
echo "📦 Starte Build-Prozess..."

if npm run build; then
    echo "✅ Build erfolgreich!"
else
    echo "❌ Build fehlgeschlagen!"
    echo "Versuche: npm install --legacy-peer-deps && npm run build"
    exit 1
fi

echo "🛠️ Schritt 7: Build-Validierung..."

# Prüfe ob interne IP noch im Build ist
if grep -r "$INTERNAL_IP" dist/ >/dev/null 2>&1; then
    echo "❌ WARNUNG: Interne IP noch im Build gefunden!"
    echo "Gefundene Stellen:"
    grep -r "$INTERNAL_IP" dist/ | head -5
    echo ""
    echo "Mögliche Ursachen:"
    echo "  - Nicht alle Dateien wurden korrigiert"
    echo "  - Cache nicht vollständig geleert"
    echo "  - Environment-Variablen überschreiben Code"
else
    echo "✅ Keine interne IP im Build gefunden"
fi

# Prüfe ob externe IP im Build ist
if grep -r "$EXTERNAL_IP" dist/ >/dev/null 2>&1; then
    echo "✅ Externe IP im Build gefunden"
    EXTERNAL_OCCURRENCES=$(grep -r "$EXTERNAL_IP" dist/ | wc -l)
    echo "📊 Externe IP kommt $EXTERNAL_OCCURRENCES mal im Build vor"
else
    echo "⚠️ Externe IP nicht im Build gefunden"
    echo "Das könnte bedeuten, dass Environment-Variablen verwendet werden"
fi

echo ""
echo "🧪 Schritt 8: Netzwerk-Test..."

# Teste ob externe API erreichbar ist
echo "Teste externe API-Erreichbarkeit..."
if curl -s --connect-timeout 5 "http://$EXTERNAL_IP:3001/health" >/dev/null 2>&1; then
    echo "✅ Externe API ($EXTERNAL_IP:3001) ist erreichbar"
else
    echo "⚠️ Externe API ($EXTERNAL_IP:3001) nicht erreichbar"
    echo "Prüfen Sie:"
    echo "  - Backend läuft: pm2 status"
    echo "  - Firewall-Einstellungen"
    echo "  - Port 3001 ist offen"
fi

echo ""
echo "🎉 Externes Zugriffsproblem behoben!"
echo ""
echo "📋 Zusammenfassung:"
echo "  🔄 $CHANGED_FILES Dateien von interner auf externe IP umgestellt"
echo "  🧹 Cache vollständig geleert"
echo "  📦 Frontend neu gebaut"
echo "  🌐 Konfiguriert für: http://$EXTERNAL_IP:3001"
echo ""
echo "🧪 Testen Sie jetzt:"
echo "  1. Extern (VPN/Internet): Login sollte funktionieren"
echo "  2. Intern (LAN): Login sollte weiterhin funktionieren"
echo "  3. Browser-Konsole: Keine ERR_CONNECTION_TIMED_OUT Fehler"
echo ""
echo "🔍 Bei Problemen:"
echo "  - Browser-Cache löschen: Ctrl+Shift+R"
echo "  - Build prüfen: grep -r '$INTERNAL_IP' dist/"
echo "  - Backend-Status: pm2 status"
echo ""
echo "🔄 Rollback (falls nötig):"
echo "  cp -r src_backup_$(date +%Y%m%d)/* src/"
echo "  npm run build"

