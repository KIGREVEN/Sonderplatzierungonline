#!/bin/bash

# Köln Branchen Portal - IP-Wechsel Script mit Cache-Clearing
# Verwendung: ./switch_ip.sh [internal|external]

CLIENT_DIR="/home/ubuntu/koelnbranchende/client"
INTERNAL_IP="http://192.168.116.42:3001"
EXTERNAL_IP="http://217.110.253.198:3001"

echo "🌐 Köln Branchen Portal - IP-Konfiguration (mit Cache-Clearing)"
echo "================================================================"

if [ "$1" = "internal" ]; then
    echo "🏠 Konfiguriere für INTERNE IP: $INTERNAL_IP"
    TARGET_IP="$INTERNAL_IP"
    
elif [ "$1" = "external" ]; then
    echo "🌍 Konfiguriere für EXTERNE IP: $EXTERNAL_IP"
    TARGET_IP="$EXTERNAL_IP"
    
elif [ "$1" = "auto" ]; then
    echo "🤖 Konfiguriere für AUTOMATISCHE Erkennung"
    rm -f "$CLIENT_DIR/.env.local"
    echo "Environment-Variable entfernt - verwendet automatische Erkennung"
    TARGET_IP="auto"
    
else
    echo "❌ Ungültige Option!"
    echo ""
    echo "Verwendung:"
    echo "  $0 internal   # Für interne IP (192.168.116.42)"
    echo "  $0 external   # Für externe IP (217.110.253.198)"
    echo "  $0 auto       # Für automatische Erkennung"
    echo ""
    echo "Aktuelle Konfiguration:"
    if [ -f "$CLIENT_DIR/.env.local" ]; then
        cat "$CLIENT_DIR/.env.local"
    else
        echo "Keine .env.local - verwendet automatische Erkennung"
    fi
    exit 1
fi

echo ""
echo "🧹 Lösche alle Caches vor Build..."
cd "$CLIENT_DIR"

# 1. Node modules Cache löschen
echo "🗑️ Lösche node_modules/.cache..."
rm -rf node_modules/.cache

# 2. Vite Cache löschen
echo "🗑️ Lösche node_modules/.vite..."
rm -rf node_modules/.vite

# 3. Dist Ordner löschen
echo "🗑️ Lösche dist/ Ordner..."
rm -rf dist

# 4. NPM Cache löschen
echo "🗑️ Lösche npm Cache..."
npm cache clean --force 2>/dev/null || echo "npm cache bereits sauber"

# 5. Environment-Variable setzen (außer bei auto)
if [ "$TARGET_IP" != "auto" ]; then
    echo ""
    echo "⚙️ Setze IP-Konfiguration..."
    echo "VITE_API_BASE_URL=$TARGET_IP" > "$CLIENT_DIR/.env.local"
fi

echo ""
echo "📦 Baue Frontend neu (ohne Cache)..."

if npm run build --force; then
    echo ""
    echo "✅ Frontend erfolgreich gebaut!"
    echo ""
    echo "🔍 Verwendete API-URL im Build:"
    if [ "$TARGET_IP" != "auto" ]; then
        if [ "$1" = "internal" ]; then
            grep -o "$INTERNAL_IP" dist/assets/*.js | head -1 || echo "⚠️ IP nicht im Build gefunden"
        elif [ "$1" = "external" ]; then
            grep -o "$EXTERNAL_IP" dist/assets/*.js | head -1 || echo "⚠️ IP nicht im Build gefunden"
        fi
    else
        echo "Automatische Erkennung aktiv"
    fi
    echo ""
    echo "📊 Build-Statistik:"
    ls -lh dist/assets/ | head -5
    echo ""
    echo "🎉 Konfiguration abgeschlossen!"
    echo ""
    echo "💡 Empfehlung: Browser-Cache auch löschen (Ctrl+Shift+R oder F5)"
else
    echo ""
    echo "❌ Build fehlgeschlagen!"
    echo "Versuche: npm install --legacy-peer-deps"
    exit 1
fi
