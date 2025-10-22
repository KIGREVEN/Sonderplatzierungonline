# 🔧 PM2 Final Fix

## Probleme identifiziert:
1. **Backend**: Port 3001 bereits belegt (manuelles Backend läuft noch)
2. **Frontend**: serve-Argumente falsch konfiguriert

## 🚀 Schnelle Lösung:

### 1. Alle Prozesse stoppen und Port freigeben:
```bash
# PM2 stoppen
pm2 delete all

# Port 3001 freigeben (falls Backend noch manuell läuft)
sudo lsof -ti:3001 | xargs sudo kill -9 2>/dev/null || echo "Port 3001 already free"
sudo lsof -ti:3000 | xargs sudo kill -9 2>/dev/null || echo "Port 3000 already free"
```

### 2. Korrekte ecosystem.config.js erstellen:
```bash
cd /home/adtle/koelnbranchende
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'koeln-branchen-backend',
      script: 'index.js',
      cwd: '/home/adtle/koelnbranchende/server',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_restarts: 3,
      min_uptime: '10s'
    },
    {
      name: 'koeln-branchen-frontend',
      script: 'serve',
      args: '-s dist -l 3000',
      cwd: '/home/adtle/koelnbranchende/client',
      env: {
        NODE_ENV: 'production'
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_restarts: 3,
      min_uptime: '10s'
    }
  ]
};
EOF
```

### 3. Services einzeln starten:
```bash
# Zuerst nur Backend starten
pm2 start ecosystem.config.js --only koeln-branchen-backend

# Status überprüfen
pm2 status

# Backend testen
sleep 5
curl http://localhost:3001/api/db-status

# Dann Frontend starten
pm2 start ecosystem.config.js --only koeln-branchen-frontend

# Finaler Status
pm2 status
```

### 4. Vollständiger Test:
```bash
# Backend testen
curl http://localhost:3001/api/db-status

# Frontend testen
curl http://localhost:3000

# Browser-Test
echo "Öffnen Sie im Browser:"
echo "http://localhost:3000"
```

## 🔧 Alternative: Manuelle Services

Falls PM2 weiterhin Probleme macht:

```bash
# PM2 komplett stoppen
pm2 delete all

# Backend manuell starten (Terminal 1)
cd /home/adtle/koelnbranchende/server
node index.js

# Frontend manuell starten (Terminal 2)
cd /home/adtle/koelnbranchende/client
serve -s dist -l 3000
```

## ✅ Erwartetes Ergebnis:

```
┌────┬────────────────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id │ name                       │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├────┼────────────────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0  │ koeln-branchen-backend     │ default     │ 1.0.0   │ cluster │ XXXXX    │ Xs     │ 0    │ online    │ 0%       │ XXMb     │ adtle    │ disabled │
│ 1  │ koeln-branchen-frontend    │ default     │ 6.0.8   │ cluster │ XXXXX    │ Xs     │ 0    │ online    │ 0%       │ XXMb     │ adtle    │ disabled │
└────┴────────────────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘
```

## 🎯 Login-Daten:

- **Admin**: username `admin`, password `admin123`
- **Viewer**: username `viewer`, password `viewer123`

## 🌐 Nach erfolgreichem Start:

Das System ist dann verfügbar unter:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api/db-status

## 🔍 Troubleshooting:

```bash
# Logs überprüfen
pm2 logs

# Einzelne Service-Logs
pm2 logs koeln-branchen-backend
pm2 logs koeln-branchen-frontend

# Services neustarten
pm2 restart koeln-branchen-backend
pm2 restart koeln-branchen-frontend

# Ports überprüfen
sudo lsof -i:3000
sudo lsof -i:3001
```

