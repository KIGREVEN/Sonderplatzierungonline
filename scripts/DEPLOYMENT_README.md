# Production Domain Deployment Script

Dieses Verzeichnis enthält das automatisierte Deployment-Script für die DNS-Migration.

## 📄 Verfügbare Scripts

### `deploy_production_domain.sh`
Hauptscript für die automatische Umstellung von internen IPs auf die öffentliche Domain `http://sonderplatzierung.greven.de`.

**Was macht das Script:**
1. ✅ DNS-Test (prüft ob Domain auflösbar ist)
2. ✅ Nginx-Konfiguration erstellen und aktivieren
3. ✅ Backend CORS für neue Domain erweitern
4. ✅ Backend (PM2) neu starten
5. ✅ Frontend neu bauen
6. ✅ Automatische Tests (Health-Checks)
7. ✅ Optional: SSL mit Let's Encrypt einrichten

**Voraussetzungen:**
- DNS A-Record muss bereits erstellt sein: `sonderplatzierung.greven.de → 217.110.253.198`
- Script muss AUF DEM SERVER ausgeführt werden (nicht lokal!)
- Benötigt `sudo`-Rechte

## 🚀 Verwendung

### Auf dem Server ausführen:

```bash
# 1. Zum Projektverzeichnis wechseln
cd /sonderplatzierungonline

# 2. Neueste Version pullen
git pull

# 3. Script ausführbar machen
chmod +x scripts/deploy_production_domain.sh

# 4. Script mit sudo ausführen
sudo bash scripts/deploy_production_domain.sh
```

Das Script führt dich interaktiv durch den Prozess und fragt vor kritischen Schritten nach Bestätigung.

## 📋 Was passiert automatisch

### Nginx
- Erstellt `/etc/nginx/sites-available/sonderplatzierung.conf`
- Aktiviert die neue Site
- Testet die Konfiguration
- Lädt Nginx neu

### Backend
- Erstellt automatisch Backup von `server/index.js`
- Erweitert CORS-Origins um:
  - `http://sonderplatzierung.greven.de`
  - `https://sonderplatzierung.greven.de`
- Startet PM2-App `sponline-backend` neu

### Frontend
- Löscht altes `client/dist/`
- Installiert Dependencies (`pnpm install`)
- Baut neue Production-Version (`pnpm build`)

### Tests
- Backend Health-Check (Port 3101)
- Frontend über Nginx (Port 80)
- API-Proxy über Nginx
- Öffentliche Domain-Erreichbarkeit

### SSL (optional)
- Installiert certbot (falls nötig)
- Holt Let's Encrypt Zertifikat
- Konfiguriert automatisch HTTPS
- Richtet HTTP→HTTPS Redirect ein

## 🔒 Sicherheit

Das Script:
- ✅ Erstellt automatisch Backups vor Änderungen
- ✅ Prüft Nginx-Konfiguration vor dem Reload
- ✅ Bricht bei Fehlern ab (`set -e`)
- ✅ Zeigt alle Änderungen mit Farb-Highlighting an

## 🆘 Bei Problemen

### Script bricht ab
```bash
# Logs anzeigen
pm2 logs sponline-backend
sudo tail -f /var/log/nginx/error.log

# Backend-Status prüfen
pm2 status

# Nginx-Status prüfen
sudo nginx -t
sudo systemctl status nginx
```

### Rollback durchführen
```bash
# Nginx auf Backup zurücksetzen
sudo cp /etc/nginx/sites-available/sponline-3100.conf.backup.* /etc/nginx/sites-available/sponline-3100.conf
sudo systemctl reload nginx

# Backend CORS zurücksetzen
cd /sonderplatzierungonline/server
cp index.js.backup.* index.js
pm2 restart sponline-backend
```

### Manuelle Schritte
Falls das Script abbricht, kannst du die Schritte einzeln ausführen (siehe `DNS_MIGRATION_GUIDE.md`).

## 📊 Output-Beispiel

```
========================================
1. DNS-Test
========================================

ℹ️  Prüfe DNS-Auflösung für sonderplatzierung.greven.de...
✅ DNS aufgelöst: sonderplatzierung.greven.de → 217.110.253.198

========================================
2. Nginx-Konfiguration
========================================

✅ Backup erstellt: /etc/nginx/sites-available/sponline-3100.conf.backup.20251024_123456
ℹ️  Erstelle neue Nginx-Konfiguration...
✅ Nginx-Konfiguration erstellt
✅ Nginx-Site aktiviert
✅ Nginx-Konfiguration ist gültig
✅ Nginx neu geladen

========================================
3. Backend CORS-Konfiguration
========================================

✅ Backup erstellt: /sonderplatzierungonline/server/index.js.backup.20251024_123456
✅ CORS-Origins aktualisiert

...
```

## 🎯 Nach erfolgreicher Migration

1. **Browser-Test:** `http://sonderplatzierung.greven.de`
2. **Login testen**
3. **Buchung erstellen**
4. **Logs überwachen:**
   ```bash
   pm2 logs sponline-backend
   sudo tail -f /var/log/nginx/access.log
   ```

## 📞 Support

Bei Fragen oder Problemen:
- Siehe `DNS_MIGRATION_GUIDE.md` für detaillierte Anleitung
- PM2-Logs: `pm2 logs sponline-backend`
- Nginx-Logs: `sudo tail -f /var/log/nginx/error.log`

---

**Letzte Aktualisierung:** 24. Oktober 2025  
**Repository:** [KIGREVEN/Sonderplatzierungonline](https://github.com/KIGREVEN/Sonderplatzierungonline)
