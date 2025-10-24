# Deployment: Campaign vs. Duration Feature auf extweb04

## Übersicht
Diese Anleitung beschreibt die Schritte zum Deployment des Campaign vs. Duration Features auf dem Server extweb04.grevendmz.de.

## Voraussetzungen
- SSH-Zugang zum Server extweb04
- Sudo-Rechte für Datenbank-Operationen
- Git Repository ist bereits auf dem Server geclont

## Deployment-Schritte

### 1. Auf Server einloggen
```bash
ssh tobias.leyendecker@extweb04.grevendmz.de
# oder mit vollständigem Pfad:
ssh tobias.leyendecker@217.110.253.198
```

### 2. In Projekt-Verzeichnis wechseln
```bash
cd /pfad/zum/projekt  # Anpassen an deinen tatsächlichen Pfad
# Beispiel: cd /var/www/sonderplatzierung
```

### 3. Git Pull - Neue Änderungen holen
```bash
git pull origin master
```

**Erwartete Ausgabe:**
```
remote: Enumerating objects: 30, done.
...
Fast-forward
 CAMPAIGN_VS_DURATION_FEATURE.md                  | 367 ++++++++++++++++++++
 client/src/components/AvailabilityChecker.jsx    | 125 ++++---
 client/src/components/BookingForm.jsx            | 123 ++++---
 client/src/components/ProductsPage.jsx           |  45 ++-
 server/models/Booking.js                         | 231 +++++++-----
 server/routes/articleTypes.js                    |  54 ++-
 server/scripts/add_booking_duration_fields.js    | 102 ++++++
 server/scripts/add_campaign_duration_mode.js     |  68 ++++
 8 files changed, 915 insertions(+), 110 deletions(-)
```

### 4. Backend - Dependencies installieren (falls neue hinzugefügt wurden)
```bash
cd server
npm install
```

### 5. **WICHTIG: Datenbank-Migrationen ausführen**

#### Migration 1: is_campaign_based Flag hinzufügen
```bash
node scripts/add_campaign_duration_mode.js
```

**Erwartete Ausgabe:**
```
🔧 Erweitere article_types um is_campaign_based Flag...
✅ Spalte is_campaign_based hinzugefügt (DEFAULT true = kampagnen-basiert)

📋 Aktuelle Artikel-Typen:
  📅 Kampagnen-basiert - Banner (ID: 4)
  📅 Kampagnen-basiert - Premium-Listing (ID: 2)
  📅 Kampagnen-basiert - Standard-Listing (ID: 3)
  📅 Kampagnen-basiert - Top-Ranking (ID: 1)

🎉 Article-Types Schema-Update abgeschlossen!
```

#### Migration 2: Duration-Felder zur Bookings-Tabelle hinzufügen
```bash
node scripts/add_booking_duration_fields.js
```

**Erwartete Ausgabe:**
```
🔧 Erweitere bookings-Tabelle um Laufzeit-Felder...
✅ Spalten duration_start und duration_end hinzugefügt (NULL erlaubt)
✅ Constraint hinzugefügt: Entweder Kampagne ODER Laufzeit
✅ Indizes erstellt

📋 Bookings-Spalten (Kampagne/Laufzeit):
  - campaign_id (integer) ✅ NULL
  - duration_start (date) ✅ NULL
  - duration_end (date) ✅ NULL

🎉 Bookings Schema-Update abgeschlossen!
```

### 6. Backend neu starten
```bash
# Mit PM2 (falls verwendet):
pm2 restart sonderplatzierung-backend
# oder
pm2 restart all

# Logs prüfen:
pm2 logs sonderplatzierung-backend --lines 50
```

**Ohne PM2:**
```bash
# Aktuellen Prozess beenden
pkill -f "node index.js"

# Neu starten
npm run dev &
# oder für Production:
npm start &
```

### 7. Frontend neu bauen
```bash
cd ../client
npm install  # Falls neue Dependencies
npm run build
```

**Erwartete Ausgabe:**
```
vite v6.4.1 building for production...
✓ built in 2.34s
```

### 8. Frontend-Build auf Nginx kopieren (falls nötig)
```bash
# Falls dein Nginx aus einem anderen Verzeichnis served:
sudo cp -r dist/* /var/www/sonderplatzierung/
# oder
sudo rsync -av dist/ /var/www/sonderplatzierung/
```

### 9. Nginx neu laden
```bash
sudo nginx -t  # Config testen
sudo systemctl reload nginx
```

### 10. Services prüfen
```bash
# PM2 Status
pm2 status

# Backend erreichbar?
curl http://localhost:3001/health

# Nginx Status
sudo systemctl status nginx
```

## Testen auf dem Server

### Test 1: Backend API
```bash
# Artikel-Typen abrufen (should include is_campaign_based):
curl http://localhost:3001/api/article-types | jq

# Einzelnen Artikel-Typ abrufen:
curl http://localhost:3001/api/article-types/1 | jq
```

### Test 2: Frontend im Browser
1. Öffne http://217.110.253.198:3100 (oder deine Domain)
2. Gehe zu "Artikel" → "Artikel-Typ hinzufügen"
3. Prüfe ob Toggle "Kampagnen-basiert" erscheint
4. Erstelle Test-Artikel-Typ mit Laufzeit-Modus (Toggle AUS)
5. Gehe zu "Neue Buchung"
6. Wähle den Laufzeit-Artikel-Typ → Form sollte Datums-Felder zeigen statt Kampagne

### Test 3: Verfügbarkeitsprüfung
1. Gehe zu "Verfügbarkeit"
2. Wähle Laufzeit-Artikel-Typ
3. Prüfe ob Start-/Enddatum-Felder erscheinen (vorausgefüllt: heute + 1 Jahr)
4. Ändere Zeitraum und prüfe

## Optional: Artikel-Typ auf Laufzeit umstellen

Falls du einen bestehenden Artikel-Typ auf Laufzeit-Modus umstellen willst:

### Via psql (PostgreSQL Client):
```bash
# Mit psql verbinden
sudo -u postgres psql -d sonderplatzierung_db

# Artikel-Typ auf Laufzeit umstellen:
UPDATE article_types SET is_campaign_based = false WHERE name = 'Jahresanzeige';

# Prüfen:
SELECT id, name, is_campaign_based FROM article_types;

# Beenden:
\q
```

### Via pgAdmin:
1. Verbinde mit Datenbank
2. Tools → Query Tool
3. SQL ausführen:
   ```sql
   UPDATE article_types 
   SET is_campaign_based = false 
   WHERE name = 'Name-des-Artikel-Typs';
   ```

## Rollback (Falls Probleme auftreten)

### Datenbank zurücksetzen:
```sql
-- is_campaign_based entfernen:
ALTER TABLE article_types DROP COLUMN IF EXISTS is_campaign_based;

-- Duration-Felder entfernen:
ALTER TABLE bookings DROP COLUMN IF EXISTS duration_start;
ALTER TABLE bookings DROP COLUMN IF EXISTS duration_end;
ALTER TABLE bookings DROP CONSTRAINT IF EXISTS chk_bookings_campaign_or_duration;
```

### Code zurücksetzen:
```bash
git log --oneline -5  # Letzten Commit-Hash finden
git revert a25b735   # Commit rückgängig machen (Hash anpassen!)
git push origin master
```

### Services neu starten:
```bash
pm2 restart all
cd client && npm run build
sudo systemctl reload nginx
```

## Troubleshooting

### Problem: Migration-Skript schlägt fehl
**Lösung:** Prüfe Datenbank-Verbindung in `server/.env`:
```bash
cat server/.env | grep DB
```

### Problem: Backend startet nicht
**Lösung:** Prüfe PM2 Logs:
```bash
pm2 logs --err
```

### Problem: Frontend zeigt keine Duration-Felder
**Lösung:** 
1. Browser-Cache leeren (Strg+Shift+R)
2. Prüfe ob neuer Build deployed wurde: `ls -la /var/www/sonderplatzierung/`
3. Prüfe Browser Console auf Fehler (F12)

### Problem: API gibt 500 Error
**Lösung:** Prüfe ob Migrationen erfolgreich waren:
```sql
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'article_types' AND column_name = 'is_campaign_based';

SELECT column_name FROM information_schema.columns 
WHERE table_name = 'bookings' AND column_name IN ('duration_start', 'duration_end');
```

## Verifizierung

Nach erfolgreichem Deployment sollten folgende Dinge funktionieren:

- ✅ Artikel-Typ erstellen mit Toggle "Kampagnen-basiert"
- ✅ Buchung mit Kampagnen-Typ zeigt Campaign-Select
- ✅ Buchung mit Laufzeit-Typ zeigt Datums-Felder
- ✅ Verfügbarkeitsprüfung mit Kampagnen-Typ zeigt Campaign-Select
- ✅ Verfügbarkeitsprüfung mit Laufzeit-Typ zeigt Datums-Felder + Overlap-Check
- ✅ Backend validiert korrekt (campaign XOR duration)
- ✅ Datenbank-Constraints funktionieren

## Support

Bei Problemen siehe:
- `CAMPAIGN_VS_DURATION_FEATURE.md` für technische Details
- PM2 Logs: `pm2 logs`
- Nginx Logs: `sudo tail -f /var/log/nginx/error.log`
- PostgreSQL Logs: `sudo tail -f /var/log/postgresql/postgresql-*.log`

---
**Deployment-Datum:** 24.10.2025  
**Version:** 1.0.0  
**Feature:** Campaign vs. Duration Booking Modes
