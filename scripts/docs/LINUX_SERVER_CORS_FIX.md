# 🔧 CORS-Problem auf Ihrem Linux-Server lösen

## 🎯 **DAS PROBLEM:**
- Frontend läuft auf: `http://217.110.253.198:3000`
- Versucht API-Zugriff auf: `http://192.168.116.42:3001`
- **CORS blockiert** Cross-Origin-Requests

---

## 🚀 **LÖSUNG AUF IHREM LINUX-SERVER:**

### **SCHRITT 1: Frontend-Code anpassen**

#### **1.1 AuthContext.jsx ändern:**
```bash
# Auf Ihrem Server:
nano /home/ubuntu/koelnbranchende/client/src/context/AuthContext.jsx

# Suchen Sie Zeile ~20 und ändern Sie:
# VON:
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://192.168.116.42:3001';

# ZU:
const baseUrl = 'http://217.110.253.198:3001';
```

#### **1.2 useCategories.js ändern:**
```bash
# Auf Ihrem Server:
nano /home/ubuntu/koelnbranchende/client/src/hooks/useCategories.js

# Suchen Sie Zeile ~15 und ändern Sie:
# VON:
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://koeln-branchen-api.onrender.com';

# ZU:
const baseUrl = 'http://217.110.253.198:3001';
```

### **SCHRITT 2: Frontend neu builden**
```bash
# Auf Ihrem Server:
cd /home/ubuntu/koelnbranchende/client

# Cache löschen
rm -rf node_modules/.cache
rm -rf node_modules/.vite
rm -rf dist

# Neu builden
npm run build
```

---

## 🔧 **ALTERNATIVE: BACKEND CORS ANPASSEN**

### **Falls Sie das Backend anpassen möchten:**

#### **Backend .env erstellen:**
```bash
# Auf Ihrem Server:
nano /home/ubuntu/koelnbranchende/server/.env

# Inhalt:
DATABASE_URL=postgresql://adtle:password@localhost:5432/koeln_branchen_db
PORT=3001
NODE_ENV=production
CORS_ORIGIN=http://217.110.253.198:3000,http://192.168.116.42:3000,http://localhost:3000
```

#### **Backend CORS-Konfiguration anpassen:**
```bash
# Auf Ihrem Server:
nano /home/ubuntu/koelnbranchende/server/index.js

# Suchen Sie die CORS-Konfiguration (ca. Zeile 75) und ersetzen Sie:
app.use(cors({
  origin: process.env.CORS_ORIGIN || true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

# ZU:
app.use(cors({
  origin: [
    'http://217.110.253.198:3000',
    'http://192.168.116.42:3000', 
    'http://localhost:3000'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

#### **Backend neu starten:**
```bash
# Auf Ihrem Server:
cd /home/ubuntu/koelnbranchende/server
pm2 restart koeln-branchen-backend
# ODER
pkill node
node index.js
```

---

## ⚡ **SCHNELL-LÖSUNG (EMPFOHLEN):**

### **Nur Frontend anpassen:**
```bash
# 1. AuthContext anpassen
sed -i "s|import.meta.env.VITE_API_BASE_URL.*|'http://217.110.253.198:3001';|" /home/ubuntu/koelnbranchende/client/src/context/AuthContext.jsx

# 2. useCategories anpassen  
sed -i "s|import.meta.env.VITE_API_BASE_URL.*|'http://217.110.253.198:3001';|" /home/ubuntu/koelnbranchende/client/src/hooks/useCategories.js

# 3. Frontend neu builden
cd /home/ubuntu/koelnbranchende/client
rm -rf node_modules/.cache node_modules/.vite dist
npm run build

# 4. Prüfen ob externe IP im Build ist
grep -o "217\.110\.253\.198" dist/assets/*.js | head -1
```

---

## 🔍 **VALIDIERUNG:**

### **Prüfen Sie nach den Änderungen:**

#### **1. Frontend-Build prüfen:**
```bash
cd /home/ubuntu/koelnbranchende/client
grep -r "217.110.253.198" dist/assets/
# Sollte die externe IP zeigen
```

#### **2. Backend-Erreichbarkeit testen:**
```bash
curl http://217.110.253.198:3001/health
# Sollte {"status":"ok"} zurückgeben
```

#### **3. CORS-Test:**
```bash
curl -H "Origin: http://217.110.253.198:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://217.110.253.198:3001/api/auth/login
# Sollte CORS-Headers zurückgeben
```

---

## 🎯 **WARUM DIESE LÖSUNG:**

### **Problem war:**
- Frontend auf `217.110.253.198:3000`
- API-Calls an `192.168.116.42:3001`
- **Cross-Origin** = CORS-Fehler

### **Lösung:**
- Frontend auf `217.110.253.198:3000`
- API-Calls an `217.110.253.198:3001`
- **Same-Origin** = Kein CORS-Problem

---

## 🚨 **TROUBLESHOOTING:**

### **Falls immer noch CORS-Fehler:**
```bash
# 1. Browser-Cache löschen (Ctrl+Shift+R)
# 2. Backend-Logs prüfen:
tail -f /var/log/your-backend.log

# 3. Netzwerk-Tab in Browser prüfen:
# - Welche URL wird aufgerufen?
# - Welche CORS-Headers kommen zurück?
```

### **Falls Backend nicht erreichbar:**
```bash
# Prüfe ob Backend läuft:
netstat -tlnp | grep 3001

# Prüfe Firewall:
sudo ufw status

# Starte Backend neu:
cd /home/ubuntu/koelnbranchende/server
node index.js
```

**🎯 Führen Sie diese Befehle auf Ihrem Linux-Server aus, dann sollte das CORS-Problem gelöst sein!**

