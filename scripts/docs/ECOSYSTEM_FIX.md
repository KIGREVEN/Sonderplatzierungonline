# 🔧 PM2 Ecosystem Konfiguration Fix

## Problem
Der Pfad in ecosystem.config.js ist falsch: `/server/server/index.js` statt `/server/index.js`

## 🚀 Lösung

```bash
# Ins Projekt-Verzeichnis wechseln
cd /home/adtle/koelnbranchende

# Korrigierte ecosystem.config.js erstellen
nano ecosystem.config.js
```

**Ersetzen Sie den kompletten Inhalt mit:**

```javascript
module.exports = {
  apps: [
    {
      name: 'koeln-branchen-backend',
      script: './index.js',
      cwd: '/home/adtle/koelnbranchende/server',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      error_file: '/home/adtle/logs/backend-error.log',
      out_file: '/home/adtle/logs/backend-out.log',
      log_file: '/home/adtle/logs/backend-combined.log'
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
      max_memory_restart: '512M',
      error_file: '/home/adtle/logs/frontend-error.log',
      out_file: '/home/adtle/logs/frontend-out.log',
      log_file: '/home/adtle/logs/frontend-combined.log'
    }
  ]
};
```

## ✅ Nach der Korrektur

```bash
# Alle PM2-Prozesse stoppen
pm2 delete all

# Serve global installieren (für Frontend)
sudo npm install -g serve

# Services neu starten
pm2 start ecosystem.config.js

# Status überprüfen
pm2 status

# Backend testen
curl http://localhost:3001/api/health
```

## 🔍 Debugging

```bash
# Logs anzeigen
pm2 logs koeln-branchen-backend

# Detaillierte Logs
pm2 logs koeln-branchen-backend --lines 50
```

