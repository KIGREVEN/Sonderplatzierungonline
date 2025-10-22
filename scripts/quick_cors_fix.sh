#!/bin/bash

# Quick CORS Fix für Köln Branchen Portal
# Führen Sie dieses Script auf Ihrem Linux-Server aus

echo "🔧 CORS-Problem lösen - Quick Fix"
echo "================================="

CLIENT_DIR="/home/ubuntu/koelnbranchende/client"
EXTERNAL_IP="217.110.253.198"

echo "🎯 Problem: Frontend (${EXTERNAL_IP}:3000) → API (192.168.116.42:3001) = CORS-Fehler"
echo "✅ Lösung: Frontend (${EXTERNAL_IP}:3000) → API (${EXTERNAL_IP}:3001) = Kein CORS"
echo ""

# Prüfe ob Verzeichnis existiert
if [ ! -d "$CLIENT_DIR" ]; then
    echo "❌ Fehler: $CLIENT_DIR nicht gefunden!"
    echo "Führen Sie dieses Script auf Ihrem Linux-Server aus, nicht hier."
    exit 1
fi

echo "📝 Schritt 1: AuthContext.jsx anpassen..."
# Backup erstellen
cp "$CLIENT_DIR/src/context/AuthContext.jsx" "$CLIENT_DIR/src/context/AuthContext.jsx.backup"

# IP ändern in AuthContext
sed -i "s|const baseUrl = import.meta.env.VITE_API_BASE_URL.*|const baseUrl = 'http://${EXTERNAL_IP}:3001';|" "$CLIENT_DIR/src/context/AuthContext.jsx"

echo "📝 Schritt 2: useCategories.js anpassen..."
# Backup erstellen
cp "$CLIENT_DIR/src/hooks/useCategories.js" "$CLIENT_DIR/src/hooks/useCategories.js.backup"

# IP ändern in useCategories
sed -i "s|const baseUrl = import.meta.env.VITE_API_BASE_URL.*|const baseUrl = 'http://${EXTERNAL_IP}:3001';|" "$CLIENT_DIR/src/hooks/useCategories.js"

echo "🧹 Schritt 3: Cache löschen..."
cd "$CLIENT_DIR"
rm -rf node_modules/.cache
rm -rf node_modules/.vite  
rm -rf dist

echo "📦 Schritt 4: Frontend neu builden..."
if npm run build; then
    echo ""
    echo "✅ Build erfolgreich!"
    
    echo "🔍 Schritt 5: Validierung..."
    if grep -q "${EXTERNAL_IP}" dist/assets/*.js; then
        echo "✅ Externe IP ${EXTERNAL_IP} im Build gefunden"
    else
        echo "⚠️ Externe IP nicht im Build gefunden - prüfen Sie die Änderungen"
    fi
    
    echo ""
    echo "🎉 CORS-Fix abgeschlossen!"
    echo ""
    echo "📋 Was wurde geändert:"
    echo "  - AuthContext.jsx: API-URL → http://${EXTERNAL_IP}:3001"
    echo "  - useCategories.js: API-URL → http://${EXTERNAL_IP}:3001"
    echo "  - Frontend neu gebaut mit Cache-Clearing"
    echo ""
    echo "🧪 Nächste Schritte:"
    echo "  1. Browser-Cache löschen (Ctrl+Shift+R)"
    echo "  2. Login erneut versuchen"
    echo "  3. Bei Problemen: Backend-Logs prüfen"
    echo ""
    echo "🔄 Rollback (falls nötig):"
    echo "  cp $CLIENT_DIR/src/context/AuthContext.jsx.backup $CLIENT_DIR/src/context/AuthContext.jsx"
    echo "  cp $CLIENT_DIR/src/hooks/useCategories.js.backup $CLIENT_DIR/src/hooks/useCategories.js"
    echo "  npm run build"
    
else
    echo ""
    echo "❌ Build fehlgeschlagen!"
    echo "Versuchen Sie:"
    echo "  cd $CLIENT_DIR"
    echo "  npm install --legacy-peer-deps"
    echo "  npm run build"
    exit 1
fi

