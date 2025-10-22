#!/bin/bash

# Köln Branchen Portal - Clean Build Script
# Löscht alle Caches vor dem Build

CLIENT_DIR="/home/ubuntu/koelnbranchende/client"
INTERNAL_IP="http://192.168.116.42:3001"
EXTERNAL_IP="http://217.110.253.198:3001"

echo "🧹 Köln Branchen Portal - Clean Build"
echo "====================================="

# Prüfe Parameter
if [ "$1" = "internal" ]; then
    TARGET_IP="$INTERNAL_IP"
    echo "🏠 Konfiguriere für INTERNE IP: $TARGET_IP"
elif [ "$1" = "external" ]; then
    TARGET_IP="$EXTERNAL_IP"
    echo "🌍 Konfiguriere für EXTERNE IP: $TARGET_IP"
else
    echo "❌ Ungültige Option!"
    echo ""
    echo "Verwendung:"
    echo "  $0 internal   # Für interne IP (192.168.116.42)"
    echo "  $0 external   # Für externe IP (217.110.253.198)"
    exit 1
fi

echo ""
echo "🧹 Lösche alle Caches..."

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

# 4. Package-lock Cache löschen
echo "🗑️ Lösche npm Cache..."
npm cache clean --force 2>/dev/null || echo "npm cache bereits sauber"

# 5. Browser Cache Hinweise
echo "🗑️ Lösche .env.local (falls vorhanden)..."
rm -f .env.local

echo ""
echo "⚙️ Setze neue IP-Konfiguration..."
echo "VITE_API_BASE_URL=$TARGET_IP" > .env.local

echo ""
echo "📦 Installiere Dependencies neu..."
npm install --legacy-peer-deps

echo ""
echo "🏗️ Baue Frontend neu (ohne Cache)..."
npm run build -- --force

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Clean Build erfolgreich!"
    echo ""
    echo "🔍 Verwendete API-URL im Build:"
    grep -o "http://[0-9.]*:3001" dist/assets/*.js | head -1 || echo "⚠️ IP nicht im Build gefunden"
    echo ""
    echo "📊 Build-Statistik:"
    ls -lh dist/assets/
    echo ""
    echo "🎉 Frontend bereit für Deployment!"
    echo ""
    echo "💡 Empfehlung: Browser-Cache auch löschen (Ctrl+Shift+R)"
else
    echo ""
    echo "❌ Build fehlgeschlagen!"
    echo "Versuche manuell: cd $CLIENT_DIR && npm install --legacy-peer-deps && npm run build"
    exit 1
fi
