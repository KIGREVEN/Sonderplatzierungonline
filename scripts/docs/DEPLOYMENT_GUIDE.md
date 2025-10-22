# 🚀 Köln Branchen System - Lokales Deployment Guide

## 📋 Komplette Anleitung für Linux-Server (Benutzer: adtle)

Diese Anleitung führt Sie durch die komplette Installation und Konfiguration des Köln Branchen Buchungssystems auf Ihrem lokalen Linux-Server.

---

## 🔧 Voraussetzungen

### System-Requirements:
- **Linux-Server** (Ubuntu 20.04+ empfohlen)
- **Benutzer**: `adtle` mit sudo-Berechtigung
- **RAM**: Mindestens 2GB
- **Speicher**: Mindestens 5GB freier Speicherplatz
- **Netzwerk**: Internetverbindung für Installation

---

## 📦 1. System-Dependencies installieren

```bash
# Als Benutzer adtle anmelden
sudo su - adtle

# System aktualisieren
sudo apt update && sudo apt upgrade -y

# Grundlegende Tools installieren
sudo apt install -y curl wget git build-essential

# Node.js 20.x installieren
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# PostgreSQL installieren
sudo apt install -y postgresql postgresql-contrib

# PM2 für Prozess-Management installieren
sudo npm install -g pm2

# Nginx für Reverse Proxy installieren (optional)
sudo apt install -y nginx

# Versionen überprüfen
node --version    # Sollte v20.x.x sein
npm --version     # Sollte 10.x.x sein
psql --version    # Sollte 14.x oder höher sein
```

---

## 🗄️ 2. PostgreSQL Datenbank einrichten

```bash
# PostgreSQL Service starten
sudo systemctl start postgresql
sudo systemctl enable postgresql

# PostgreSQL Benutzer erstellen
sudo -u postgres createuser --interactive
# Eingaben:
# - Name: adtle
# - Superuser: y

# Passwort für Benutzer setzen
sudo -u postgres psql
```

```sql
-- In der PostgreSQL-Konsole:
ALTER USER adtle PASSWORD 'IhrSicheresPasswort123';
CREATE DATABASE koeln_branchen_db OWNER adtle;
\q
```

```bash
# Datenbankverbindung testen
psql -U adtle -d koeln_branchen_db -h localhost
# Passwort eingeben und mit \q beenden
```

---

## 📁 3. Projekt-Repository klonen

```bash
# Ins Home-Verzeichnis wechseln
cd /home/adtle

# Repository klonen
git clone https://github.com/KIGREVEN/koelnbranchende.git

# Ins Projekt-Verzeichnis wechseln
cd koelnbranchende

# Projekt-Struktur anzeigen
ls -la
# Sollte zeigen: client/, server/, README.md, etc.
```

---

## ⚙️ 4. Backend konfigurieren

```bash
# Ins Server-Verzeichnis wechseln
cd /home/adtle/koelnbranchende/server

# Dependencies installieren
npm install

# Umgebungsvariablen-Datei erstellen
cp .env.example .env
# Falls .env.example nicht existiert:
touch .env
```

### .env Datei bearbeiten:
```bash
nano .env
```

```env
# Datenbank-Konfiguration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=koeln_branchen_db
DB_USER=adtle
DB_PASSWORD=IhrSicheresPasswort123

# Server-Konfiguration
PORT=3001
NODE_ENV=production

# JWT-Konfiguration
JWT_SECRET=IhrSuperSicheresJWTSecret123!@#
JWT_EXPIRES_IN=24h

# CORS-Konfiguration
FRONTEND_URL=http://localhost:3000
```

### Datenbank-Schema erstellen:
```bash
# Datenbank-Migrationen ausführen
npm run migrate
# Falls kein migrate-Script existiert:
psql -U adtle -d koeln_branchen_db -f migrations/create_tables.sql
psql -U adtle -d koeln_branchen_db -f migrations/insert_default_data.sql
```

---

## 🎨 5. Frontend konfigurieren

```bash
# Ins Client-Verzeichnis wechseln
cd /home/adtle/koelnbranchende/client

# Dependencies installieren
npm install

# Umgebungsvariablen-Datei erstellen
touch .env.local
```

### .env.local Datei bearbeiten:
```bash
nano .env.local
```

```env
# API-Konfiguration
VITE_API_BASE_URL=http://localhost:3001

# Produktions-Modus
NODE_ENV=production
```

### Frontend für Produktion bauen:
```bash
npm run build
```

---

## 🚀 6. Services mit PM2 starten

```bash
# PM2-Konfigurationsdatei erstellen
cd /home/adtle/koelnbranchende
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'koeln-branchen-backend',
      script: './server/index.js',
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

```bash
# Log-Verzeichnis erstellen
mkdir -p /home/adtle/logs

# Serve-Package global installieren (für Frontend)
sudo npm install -g serve

# Services starten
pm2 start ecosystem.config.js

# PM2 Status überprüfen
pm2 status

# PM2 beim Systemstart automatisch starten
pm2 startup
# Führen Sie den angezeigten Befehl aus (mit sudo)

pm2 save
```

---

## 🌐 7. Nginx Reverse Proxy einrichten (Optional aber empfohlen)

```bash
# Nginx-Konfiguration erstellen
sudo nano /etc/nginx/sites-available/koeln-branchen
```

```nginx
server {
    listen 80;
    server_name localhost ihr-domain.de;

    # Frontend (React)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Gzip-Kompression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
}
```

```bash
# Konfiguration aktivieren
sudo ln -s /etc/nginx/sites-available/koeln-branchen /etc/nginx/sites-enabled/

# Standard-Konfiguration deaktivieren
sudo rm /etc/nginx/sites-enabled/default

# Nginx-Konfiguration testen
sudo nginx -t

# Nginx starten und aktivieren
sudo systemctl start nginx
sudo systemctl enable nginx
```

---

## 🔥 8. Firewall konfigurieren

```bash
# UFW Firewall aktivieren
sudo ufw enable

# HTTP und HTTPS erlauben
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# SSH erlauben (falls remote)
sudo ufw allow 22/tcp

# Firewall-Status überprüfen
sudo ufw status
```

---

## ✅ 9. Installation testen

### Backend testen:
```bash
curl http://localhost:3001/api/health
# Erwartete Antwort: {"status":"ok","timestamp":"..."}
```

### Frontend testen:
```bash
curl http://localhost:3000
# Sollte HTML-Inhalt zurückgeben
```

### Vollständiger Test:
```bash
# Browser öffnen und besuchen:
# http://localhost (mit Nginx)
# oder
# http://localhost:3000 (direkt)

# Login testen:
# Username: admin
# Password: admin123
```

---

## 🔄 10. Wartung und Updates

### Logs überprüfen:
```bash
# PM2 Logs anzeigen
pm2 logs

# Spezifische Service-Logs
pm2 logs koeln-branchen-backend
pm2 logs koeln-branchen-frontend

# Nginx-Logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Services neustarten:
```bash
# Alle Services neustarten
pm2 restart all

# Spezifischen Service neustarten
pm2 restart koeln-branchen-backend

# Nginx neustarten
sudo systemctl restart nginx
```

### Updates durchführen:
```bash
cd /home/adtle/koelnbranchende

# Code aktualisieren
git pull origin main

# Backend-Dependencies aktualisieren
cd server
npm install

# Frontend neu bauen
cd ../client
npm install
npm run build

# Services neustarten
pm2 restart all
```

### Backup erstellen:
```bash
# Datenbank-Backup
pg_dump -U adtle -h localhost koeln_branchen_db > /home/adtle/backup_$(date +%Y%m%d_%H%M%S).sql

# Code-Backup
tar -czf /home/adtle/koelnbranchende_backup_$(date +%Y%m%d_%H%M%S).tar.gz /home/adtle/koelnbranchende
```

---

## 🆘 11. Troubleshooting

### Häufige Probleme:

**Problem: Backend startet nicht**
```bash
# Logs überprüfen
pm2 logs koeln-branchen-backend

# Datenbankverbindung testen
psql -U adtle -d koeln_branchen_db -h localhost

# Port überprüfen
sudo netstat -tlnp | grep 3001
```

**Problem: Frontend zeigt Fehler**
```bash
# Build-Logs überprüfen
cd /home/adtle/koelnbranchende/client
npm run build

# PM2-Logs überprüfen
pm2 logs koeln-branchen-frontend
```

**Problem: Nginx-Fehler**
```bash
# Nginx-Konfiguration testen
sudo nginx -t

# Nginx-Logs überprüfen
sudo tail -f /var/log/nginx/error.log
```

### Nützliche Befehle:
```bash
# Alle Services-Status
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql

# Ports überprüfen
sudo netstat -tlnp | grep -E ':(80|3000|3001|5432)'

# Speicherverbrauch
free -h
df -h

# Prozesse überprüfen
top
htop
```

---

## 🎯 12. Produktions-Optimierungen

### SSL/HTTPS einrichten (mit Let's Encrypt):
```bash
# Certbot installieren
sudo apt install -y certbot python3-certbot-nginx

# SSL-Zertifikat erstellen
sudo certbot --nginx -d ihr-domain.de

# Auto-Renewal testen
sudo certbot renew --dry-run
```

### Performance-Monitoring:
```bash
# PM2 Monitoring aktivieren
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30

# System-Monitoring
sudo apt install -y htop iotop
```

### Automatische Backups:
```bash
# Backup-Script erstellen
nano /home/adtle/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/home/adtle/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Datenbank-Backup
pg_dump -U adtle -h localhost koeln_branchen_db > $BACKUP_DIR/db_backup_$DATE.sql

# Code-Backup
tar -czf $BACKUP_DIR/code_backup_$DATE.tar.gz /home/adtle/koelnbranchende

# Alte Backups löschen (älter als 30 Tage)
find $BACKUP_DIR -name "*.sql" -mtime +30 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
```

```bash
# Script ausführbar machen
chmod +x /home/adtle/backup.sh

# Cron-Job für tägliche Backups
crontab -e
# Hinzufügen: 0 2 * * * /home/adtle/backup.sh >> /home/adtle/backup.log 2>&1
```

---

## 📞 Support und Kontakt

Bei Problemen oder Fragen:

1. **Logs überprüfen** (siehe Troubleshooting)
2. **GitHub Issues** erstellen: https://github.com/KIGREVEN/koelnbranchende/issues
3. **Dokumentation** überprüfen: README.md im Repository

---

## ✅ Checkliste für erfolgreiche Installation

- [ ] PostgreSQL installiert und konfiguriert
- [ ] Node.js 20.x installiert
- [ ] Repository geklont
- [ ] Backend-Dependencies installiert
- [ ] Frontend-Dependencies installiert und gebaut
- [ ] Umgebungsvariablen konfiguriert
- [ ] Datenbank-Schema erstellt
- [ ] PM2-Services gestartet
- [ ] Nginx konfiguriert (optional)
- [ ] Firewall konfiguriert
- [ ] Login-Test erfolgreich
- [ ] Backup-Strategie implementiert

**🎉 Herzlichen Glückwunsch! Ihr Köln Branchen System läuft jetzt auf Ihrem lokalen Server!**

---

*Erstellt für Benutzer: adtle*  
*Letzte Aktualisierung: $(date)*

