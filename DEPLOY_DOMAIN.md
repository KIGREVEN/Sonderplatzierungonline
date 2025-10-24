# Deployment-Anleitung: Domain sonderplatzierung.greven.de einrichten

## Voraussetzungen
- DNS-Eintrag: `sonderplatzierung.greven.de` muss auf `217.110.253.198` (extweb04) zeigen
- Backend läuft auf Port 3100
- Frontend wird als statische Dateien aus `client/dist` ausgeliefert

## Schritt 1: DNS prüfen
```bash
# Prüfen ob Domain auf richtige IP zeigt
nslookup sonderplatzierung.greven.de
# Sollte 217.110.253.198 anzeigen
```

## Schritt 2: Code auf Server aktualisieren
```bash
cd /home/tobiasleyendecker/Sonderplatzierungonline
git pull origin master
```

## Schritt 3: Nginx vHost einrichten
```bash
# Nginx-Konfiguration kopieren
sudo cp nginx-sonderplatzierung.conf /etc/nginx/sites-available/sonderplatzierung.greven.de

# Symlink zu sites-enabled erstellen
sudo ln -s /etc/nginx/sites-available/sonderplatzierung.greven.de /etc/nginx/sites-enabled/

# Nginx-Konfiguration testen
sudo nginx -t

# Nginx neu laden
sudo systemctl reload nginx
```

## Schritt 4: Frontend neu bauen
```bash
cd /home/tobiasleyendecker/Sonderplatzierungonline/client
npm run build
```

## Schritt 5: Backend neu starten
```bash
pm2 restart all
pm2 save
```

## Schritt 6: SSL-Zertifikat einrichten (Optional aber empfohlen)
```bash
# Certbot installieren (falls noch nicht vorhanden)
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx

# Zertifikat für Domain erstellen
sudo certbot --nginx -d sonderplatzierung.greven.de

# Certbot fragt nach E-Mail und aktualisiert automatisch die Nginx-Konfiguration
```

## Schritt 7: Testen
```bash
# HTTP testen
curl http://sonderplatzierung.greven.de

# API testen
curl http://sonderplatzierung.greven.de/api/health

# Falls SSL eingerichtet:
curl https://sonderplatzierung.greven.de
```

## Firewall-Regeln prüfen
```bash
# Port 80 (HTTP) und 443 (HTTPS) müssen offen sein
sudo ufw status
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

## Troubleshooting

### Problem: Domain nicht erreichbar
- DNS-Propagation abwarten (kann bis 24h dauern)
- `ping sonderplatzierung.greven.de` - zeigt die richtige IP?
- Firewall-Regeln prüfen

### Problem: 502 Bad Gateway
- Backend läuft auf Port 3100: `pm2 status`
- Backend-Logs prüfen: `pm2 logs`

### Problem: CORS-Fehler
- CORS-Origins in `server/index.js` prüfen
- Backend neu starten: `pm2 restart all`

### Problem: Frontend zeigt alte Version
- Browser-Cache leeren (Strg+Shift+R)
- `npm run build` im client/ Ordner erneut ausführen
- Nginx-Cache leeren: `sudo systemctl reload nginx`

## Dateistruktur auf Server
```
/home/tobiasleyendecker/Sonderplatzierungonline/
├── client/
│   ├── dist/              # Gebautes Frontend (wird von Nginx ausgeliefert)
│   ├── src/
│   └── package.json
├── server/
│   ├── index.js           # Backend läuft auf Port 3100 via PM2
│   └── package.json
└── nginx-sonderplatzierung.conf
```

## Backend-Konfiguration
Das Backend wurde bereits angepasst:
- CORS erlaubt: `http://sonderplatzierung.greven.de` und `https://sonderplatzierung.greven.de`
- Rate Limit erhöht auf 500 Requests/15min
- Läuft auf Port 3100 (via PM2)

## Frontend-Konfiguration
Das Frontend nutzt `window.location.origin` um die Backend-API zu erkennen:
- Lokal: `http://localhost:5173` → API: `http://localhost:3100`
- Produktion: `http://sonderplatzierung.greven.de` → API: `http://sonderplatzierung.greven.de/api`

Nach dem Build passt sich die API-URL automatisch an die Domain an.
