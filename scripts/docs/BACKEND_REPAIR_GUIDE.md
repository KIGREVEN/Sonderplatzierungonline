# 🚨 Backend-Reparatur - PM2 Status "errored"

## 🎯 **PROBLEM IDENTIFIZIERT:**
```
│ 0  │ koeln-branchen-backend     │ default     │ 1.0.0   │ cluster │ 0        │ 0      │ 11   │ errored   │
```
- **Backend ist "errored"** (nicht online)
- **PID = 0** (Prozess läuft nicht)
- **11 Restarts** (Backend crasht immer wieder)

## 🔍 **DIAGNOSE DURCHFÜHREN:**

### **Schritt 1: PM2-Logs prüfen**
```bash
pm2 logs koeln-branchen-backend --lines 50
```

### **Schritt 2: Backend-Fehler identifizieren**
```bash
cd ~/koelnbranchende/server
pm2 logs 0 --lines 20
```

---

## 🚀 **REPARATUR-SCHRITTE:**

### **SCHRITT 1: Backend stoppen und löschen**
```bash
pm2 stop koeln-branchen-backend
pm2 delete koeln-branchen-backend
```

### **SCHRITT 2: Manuell testen**
```bash
cd ~/koelnbranchende/server

# Prüfe ob alle Dependencies installiert sind
npm install

# Teste Backend manuell
node index.js
```

### **SCHRITT 3: Häufige Probleme beheben**

#### **Problem A: Datenbank-Verbindung**
```bash
# Prüfe PostgreSQL
sudo systemctl status postgresql
sudo systemctl start postgresql

# Teste Datenbank-Verbindung
psql -U adtle -d koeln_branchen_db -c "SELECT 1;"
```

#### **Problem B: Environment-Variablen**
```bash
# Prüfe .env Datei
cat ~/koelnbranchende/server/.env

# Falls nicht vorhanden, erstelle sie:
cat > ~/koelnbranchende/server/.env << 'EOF'
DATABASE_URL=postgresql://adtle:password@localhost:5432/koeln_branchen_db
PORT=3001
NODE_ENV=production
CORS_ORIGIN=http://217.110.253.198:3000,http://192.168.116.42:3000,http://localhost:3000
JWT_SECRET=koeln-branchen-jwt-secret-key-2025
JWT_EXPIRES_IN=24h
EOF
```

#### **Problem C: Port bereits belegt**
```bash
# Prüfe welcher Prozess Port 3001 verwendet
sudo netstat -tlnp | grep 3001
sudo lsof -i :3001

# Falls nötig, Prozess beenden
sudo kill -9 [PID]
```

### **SCHRITT 4: Backend neu starten**
```bash
cd ~/koelnbranchende/server

# Manuell starten (zum Testen)
node index.js

# Falls erfolgreich, mit PM2 starten
pm2 start index.js --name koeln-branchen-backend --no-watch
```

---

## ⚡ **SCHNELL-REPARATUR-SCRIPT:**

### **Alles in einem Befehl:**
```bash
# Backend reparieren
cd ~/koelnbranchende/server

# PM2 aufräumen
pm2 stop koeln-branchen-backend 2>/dev/null
pm2 delete koeln-branchen-backend 2>/dev/null

# Dependencies installieren
npm install

# Environment prüfen/erstellen
if [ ! -f .env ]; then
cat > .env << 'EOF'
DATABASE_URL=postgresql://adtle:password@localhost:5432/koeln_branchen_db
PORT=3001
NODE_ENV=production
CORS_ORIGIN=http://217.110.253.198:3000,http://192.168.116.42:3000,http://localhost:3000
JWT_SECRET=koeln-branchen-jwt-secret-key-2025
JWT_EXPIRES_IN=24h
EOF
fi

# PostgreSQL starten
sudo systemctl start postgresql

# Backend mit PM2 starten
pm2 start index.js --name koeln-branchen-backend --no-watch

# Status prüfen
pm2 status
```

---

## 🔍 **HÄUFIGE FEHLERURSACHEN:**

### **1. Datenbank-Probleme:**
```bash
# PostgreSQL nicht gestartet
sudo systemctl start postgresql

# Falsche Datenbank-URL
# Prüfe: DATABASE_URL in .env

# Datenbank existiert nicht
createdb -U adtle koeln_branchen_db
```

### **2. Port-Konflikte:**
```bash
# Port 3001 bereits belegt
sudo lsof -i :3001
sudo kill -9 [PID]
```

### **3. Fehlende Dependencies:**
```bash
# Node modules fehlen
npm install

# Veraltete Dependencies
npm update
```

### **4. Berechtigungsprobleme:**
```bash
# Falsche Dateiberechtigungen
chmod +x index.js
chown -R adtle:adtle ~/koelnbranchende
```

---

## 🧪 **VALIDIERUNG:**

### **Nach der Reparatur prüfen:**

#### **1. PM2-Status:**
```bash
pm2 status
# Backend sollte "online" sein
```

#### **2. Backend-Erreichbarkeit:**
```bash
curl http://localhost:3001/health
curl http://192.168.116.42:3001/health
curl http://217.110.253.198:3001/health
```

#### **3. API-Test:**
```bash
curl -X POST http://217.110.253.198:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

## 🎯 **ERWARTETE AUSGABE:**

### **Erfolgreiches Backend:**
```bash
pm2 status
┌────┬────────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                       │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼────────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ koeln-branchen-backend     │ default     │ 1.0.0   │ cluster │ 12345    │ 30s    │ 0    │ online    │ 0%       │ 45.2mb   │ adtle    │ disabled │
│ 2  │ koeln-branchen-frontend    │ default     │ N/A     │ cluster │ 79524    │ 111s   │ 11   │ online    │ 0%       │ 65.5mb   │ adtle    │ disabled │
└────┴────────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

### **Health-Check:**
```bash
curl http://217.110.253.198:3001/health
{"status":"ok","timestamp":"2025-08-07T...","uptime":30}
```

---

## 🚨 **NOTFALL-LÖSUNG:**

### **Falls alles andere fehlschlägt:**
```bash
# Kompletter Neustart
cd ~/koelnbranchende/server

# Alles stoppen
pm2 kill

# Dependencies neu installieren
rm -rf node_modules package-lock.json
npm install

# Backend direkt starten (ohne PM2)
node index.js

# In separatem Terminal: PM2 neu starten
pm2 start index.js --name koeln-branchen-backend
```

**🎯 Führen Sie diese Schritte aus, um das Backend zu reparieren und die CORS-Probleme zu lösen!**

