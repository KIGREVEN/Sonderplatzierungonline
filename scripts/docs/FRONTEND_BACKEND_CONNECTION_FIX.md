# 🎯 Frontend verbindet sich nicht mit Backend

## 🔍 Problem-Analyse:

**Aus den PM2-Logs:**
- ✅ **Postman-Login**: Erreicht Backend, 200 Status, "User logged in: admin"
- ❌ **Frontend-Login**: Keine Backend-Logs, erreicht Backend nicht
- 🔍 **Verschiedene IPs**: curl (192.168.116.42) vs Postman (192.168.121.161)

**Mögliche Ursachen:**
1. **Frontend API-URL falsch konfiguriert**
2. **CORS-Probleme** zwischen Frontend und Backend
3. **Frontend zeigt auf andere Backend-Instanz**
4. **Netzwerk-Routing-Probleme**

---

## 🔧 Sofortige Diagnose:

### Schritt 1: Frontend-Konfiguration prüfen
```bash
cd /home/adtle/koelnbranchende/client

# Suche nach API-URL-Konfiguration
grep -r "localhost:3001\|api\|backend" src/ --include="*.js" --include="*.jsx"
grep -r "192.168" src/ --include="*.js" --include="*.jsx"

# .env Datei prüfen (falls vorhanden)
ls -la .env* 2>/dev/null || echo "Keine .env Datei gefunden"
cat .env* 2>/dev/null || echo "Keine .env Inhalte"
```

### Schritt 2: Browser-Entwicklertools verwenden
```bash
# Frontend öffnen und Entwicklertools verwenden
echo "1. Öffnen Sie http://localhost:3000 im Browser"
echo "2. Drücken Sie F12 für Entwicklertools"
echo "3. Gehen Sie zum 'Network' Tab"
echo "4. Versuchen Sie sich anzumelden"
echo "5. Schauen Sie, welche URL für den Login-Request verwendet wird"
```

### Schritt 3: CORS-Konfiguration prüfen
```bash
cd /home/adtle/koelnbranchende/server

# CORS-Konfiguration in index.js prüfen
grep -A 10 -B 5 "cors\|origin" index.js
```

---

## 🚀 Wahrscheinliche Lösungen:

### Lösung 1: Frontend API-URL korrigieren

**Falls Frontend auf falsche URL zeigt:**
```bash
cd /home/adtle/koelnbranchende/client

# Suche nach API-Basis-URL
find src/ -name "*.js" -o -name "*.jsx" | xargs grep -l "api\|fetch\|axios" | head -5

# Häufige Dateien prüfen:
cat src/config.js 2>/dev/null || echo "Keine config.js"
cat src/utils/api.js 2>/dev/null || echo "Keine api.js"
cat src/services/api.js 2>/dev/null || echo "Keine services/api.js"
```

**Korrekte API-URL setzen:**
```bash
# Falls .env Datei verwendet wird
echo "REACT_APP_API_URL=http://localhost:3001" > /home/adtle/koelnbranchende/client/.env

# Frontend neu bauen
cd /home/adtle/koelnbranchende/client
npm run build

# PM2 Frontend neu starten
pm2 restart koeln-branchen-frontend
```

### Lösung 2: CORS-Problem beheben

**Backend CORS-Konfiguration erweitern:**
```bash
cd /home/adtle/koelnbranchende/server

# Backup der aktuellen index.js
cp index.js index.js.backup

# CORS-Konfiguration prüfen und erweitern
grep -n "cors" index.js
```

**Falls CORS-Problem:**
```javascript
// In server/index.js nach const app = express();
const cors = require('cors');

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://192.168.116.42:3000',
    'http://192.168.121.161:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Lösung 3: Frontend-Backend-Verbindung testen

**Direkte Verbindung testen:**
```bash
# Vom Frontend-Server aus Backend testen
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Von externer IP testen
curl -X POST http://192.168.116.42:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

---

## 🔍 Debug-Schritte:

### 1. Frontend-Requests verfolgen
```bash
# Browser-Konsole öffnen und eingeben:
# localStorage.clear(); // Alte Tokens löschen
# Dann Login versuchen und Network-Tab beobachten
```

### 2. Backend-Logs in Echtzeit verfolgen
```bash
# In separatem Terminal:
pm2 logs koeln-branchen-backend --lines 0

# Dann Frontend-Login versuchen
# Sollten Logs erscheinen, wenn Request ankommt
```

### 3. Netzwerk-Konnektivität prüfen
```bash
# Ports prüfen
netstat -tlnp | grep :3001
netstat -tlnp | grep :3000

# Firewall prüfen
sudo ufw status
```

---

## 🚀 Schnellste Lösung (All-in-One):

### Schritt 1: Frontend-API-Konfiguration finden und korrigieren
```bash
cd /home/adtle/koelnbranchende/client

# Alle API-URLs finden
echo "=== Suche nach API-URLs ==="
grep -r "localhost.*300\|192\.168\|api.*url\|baseURL" src/ --include="*.js" --include="*.jsx" || echo "Keine URLs gefunden"

# AuthContext prüfen (wahrscheinlichster Ort)
echo "=== AuthContext prüfen ==="
cat src/context/AuthContext.jsx | grep -A 5 -B 5 "fetch\|api\|url"
```

### Schritt 2: Korrekte API-URL setzen
```bash
# Falls AuthContext oder andere Datei falsche URL hat:
cd /home/adtle/koelnbranchende/client

# .env Datei erstellen
cat > .env << 'EOF'
REACT_APP_API_URL=http://localhost:3001
REACT_APP_API_BASE_URL=http://localhost:3001/api
EOF

# Frontend neu bauen
npm run build

# PM2 neu starten
pm2 restart koeln-branchen-frontend
```

### Schritt 3: CORS erweitern
```bash
cd /home/adtle/koelnbranchende/server

# CORS-Konfiguration erweitern
sed -i '/app.use(cors/,/));/c\
app.use(cors({\
  origin: ["http://localhost:3000", "http://127.0.0.1:3000", "http://192.168.116.42:3000"],\
  credentials: true,\
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],\
  allowedHeaders: ["Content-Type", "Authorization"]\
}));' index.js

# Backend neu starten
pm2 restart koeln-branchen-backend
```

### Schritt 4: Test
```bash
# 1. Backend-Logs verfolgen
pm2 logs koeln-branchen-backend --lines 0 &

# 2. Frontend öffnen und Login versuchen
echo "Öffnen Sie http://localhost:3000 und versuchen Sie sich anzumelden"
echo "Schauen Sie, ob jetzt Logs im Backend erscheinen"
```

---

## 🎯 Erwartetes Ergebnis:

**Nach der Korrektur sollten Sie sehen:**
```bash
# In PM2-Logs beim Frontend-Login:
0|koeln-br | Executed query {
0|koeln-br |   text: 'SELECT * FROM users WHERE username = $1',
0|koeln-br |   duration: 1,
0|koeln-br |   rows: 1
0|koeln-br | }
0|koeln-br | ✅ User logged in: admin (admin)
0|koeln-br | 127.0.0.1 - - [06/Aug/2025:12:00:00 +0000] "POST /api/auth/login HTTP/1.1" 200 374 "-" "Mozilla/5.0..."
```

**Browser-Entwicklertools sollten zeigen:**
- Request URL: `http://localhost:3001/api/auth/login`
- Status: 200 OK
- Response: `{"success": true, "data": {"token": "...", "user": {...}}}`

---

## 🔧 Häufige Frontend-API-Konfigurationsdateien:

### AuthContext.jsx (wahrscheinlichster Ort):
```javascript
// Suchen Sie nach:
const API_BASE_URL = 'http://localhost:3001/api';
// oder
fetch('http://localhost:3001/api/auth/login', ...)
// oder
const response = await fetch(`${process.env.REACT_APP_API_URL}/auth/login`, ...)
```

### config.js oder constants.js:
```javascript
export const API_CONFIG = {
  baseURL: 'http://localhost:3001/api'
};
```

### .env Datei:
```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

**Das Frontend muss auf `http://localhost:3001` zeigen, nicht auf eine externe IP oder andere URL!**

