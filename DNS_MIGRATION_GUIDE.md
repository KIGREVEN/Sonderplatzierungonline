# DNS Migration Guide - Sonderplatzierung Online

**Datum:** 24. Oktober 2025  
**Status:** Vorbereitung für DNS-Umstellung  
**Neue Domain:** `http://sonderplatzierung.greven.de`

---

## 📋 Übersicht

### Aktueller Zustand (nur intern erreichbar)
- **Frontend:** `http://extweb04.grevendmz.de:3100`
- **Backend/API:** `http://extweb04.grevendmz.de:3101` (via Nginx Proxy)
- **Server-IP:** `217.110.253.198`

### Ziel-Zustand (öffentlich über DNS)
- **Öffentliche Domain:** `http://sonderplatzierung.greven.de`
- **API-Zugriff:** Über Frontend-Domain mit Nginx Reverse Proxy `/api/*`
- **SSL/TLS:** Optional HTTPS mit Let's Encrypt (empfohlen für Produktion)

---

## 🔍 Was muss geändert werden?

### 1. **Server Backend - CORS-Konfiguration** ⚠️ KRITISCH

#### `server/index.js` (Zeile ~82)

**AKTUELL:**
```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:3000', 
    'http://extweb04.grevendmz.de:3100',
    'http://217.110.253.198:3100'
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
```

**ÄNDERN ZU:**
```javascript
const corsOptions = {
  origin: [
    'http://localhost:5173',                     // Lokale Entwicklung
    'http://localhost:3000',                     // Lokale Entwicklung
    'http://sonderplatzierung.greven.de',       // ← NEUE ÖFFENTLICHE DOMAIN (HTTP)
    'https://sonderplatzierung.greven.de',      // ← HTTPS (falls SSL eingerichtet)
    'http://extweb04.grevendmz.de:3100',        // Intern (optional behalten für Fallback)
    'http://217.110.253.198:3100'               // Intern (optional behalten)
  ],
  credentials: true,
  optionsSuccessStatus: 200
};
```

**Nach der Änderung Backend neu starten:**
```bash
cd /sonderplatzierungonline/server
pm2 restart sponline-backend
```

---

### 2. **Nginx Konfiguration - Neue Domain einrichten**

#### Option A: Neue separate Vhost-Datei (empfohlen)

**Neue Datei:** `/etc/nginx/sites-available/sonderplatzierung.conf`

```nginx
# HTTP (Standard Port 80)
server {
    listen 80;
    server_name sonderplatzierung.greven.de;

    # Optional: Redirect HTTP → HTTPS (aktivieren nach SSL-Einrichtung)
    # return 301 https://$server_name$request_uri;

    root /sonderplatzierungonline/client/dist;
    index index.html;

    # Frontend Static Files
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3101;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health Check Endpoint
    location /health {
        proxy_pass http://127.0.0.1:3101/health;
        access_log off;
    }
}

# HTTPS (nur nach SSL-Einrichtung mit Let's Encrypt)
server {
    listen 443 ssl http2;
    server_name sonderplatzierung.greven.de;

    # SSL-Zertifikate (Pfade werden von certbot automatisch eingefügt)
    ssl_certificate /etc/letsencrypt/live/sonderplatzierung.greven.de/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/sonderplatzierung.greven.de/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /sonderplatzierungonline/client/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3101;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://127.0.0.1:3101/health;
        access_log off;
    }
}
```

**Aktivierung auf dem Server:**
```bash
# 1. Nginx-Konfiguration anlegen
sudo nano /etc/nginx/sites-available/sonderplatzierung.conf
# (Inhalt von oben einfügen)

# 2. Symlink aktivieren
sudo ln -s /etc/nginx/sites-available/sonderplatzierung.conf /etc/nginx/sites-enabled/

# 3. Nginx Konfiguration testen
sudo nginx -t

# 4. Nginx neu laden
sudo systemctl reload nginx
```

#### Option B: Bestehende Vhost erweitern (schneller, aber weniger sauber)

In `/etc/nginx/sites-available/sponline-3100.conf`:

```nginx
server {
    listen 3100;
    listen 80;  # ← Port 80 für öffentlichen Zugriff hinzufügen
    server_name extweb04.grevendmz.de 217.110.253.198 sonderplatzierung.greven.de;  # ← Domain hinzufügen
    # ... Rest bleibt gleich
}
```

---

### 3. **Frontend - Rebuild nach DNS-Umstellung** ⚠️ WICHTIG

Das Frontend nutzt bereits `window.location.origin` als Fallback, daher ist **kein Code-Change nötig**, aber ein **Rebuild NACH der DNS-Umstellung** erforderlich:

```bash
cd /sonderplatzierungonline/client
pnpm install
pnpm build
```

**Warum?** Sobald die Anwendung auf `http://sonderplatzierung.greven.de` läuft, erkennt `window.location.origin` automatisch die neue Domain und sendet API-Requests an die richtige Adresse.

#### Bereits vorbereitet ✅

`client/src/context/AuthContext.jsx` (Zeile 20-24):
```javascript
const baseUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL)
    || (typeof window !== 'undefined' ? window.location.origin : undefined)
    || 'http://localhost:3001';
```

`client/src/hooks/useCategories.js` (bereits gefixt ✅):
```javascript
const { apiRequest } = useAuth();  // Nutzt AuthContext baseUrl
const res = await apiRequest('/api/categories', { method: 'GET' });
```

---

### 4. **SSL/HTTPS-Einrichtung** (optional, aber empfohlen)

**Let's Encrypt mit Certbot:**

```bash
# 1. Certbot installieren (falls nicht vorhanden)
sudo apt update
sudo apt install certbot python3-certbot-nginx

# 2. SSL-Zertifikat für Domain anfordern
sudo certbot --nginx -d sonderplatzierung.greven.de

# 3. Automatische Erneuerung testen
sudo certbot renew --dry-run
```

Certbot konfiguriert Nginx automatisch für HTTPS und richtet Port 443 ein.

**Hinweis:** Falls nur HTTP (Port 80) verwendet werden soll, kann dieser Schritt übersprungen werden.

---

### 5. **Keine Änderungen nötig** ✅

Folgende Komponenten benötigen **KEINE** Anpassungen:
- ✅ **PM2-Konfiguration** (`ecosystem.config.js`) - Backend läuft weiter auf Port 3101
- ✅ **PostgreSQL-Datenbank** - Keine Domain-Abhängigkeit
- ✅ **Environment-Variablen** - `window.location.origin` übernimmt automatisch
- ✅ **Frontend-Hooks** - Bereits über `AuthContext.apiRequest` vereinheitlicht

---

## ✅ Checkliste für DNS-Migration

### **Phase 1: Vorbereitung**
- [ ] **DNS-Eintrag erstellen** (A-Record `sonderplatzierung.greven.de` → `217.110.253.198`)
- [ ] **Firewall/Router prüfen** (Port 80 und optional 443 öffnen)
- [ ] **Backup erstellen:**
  ```bash
  sudo cp /etc/nginx/sites-available/sponline-3100.conf /etc/nginx/sites-available/sponline-3100.conf.backup
  ```

### **Phase 2: Server-Konfiguration**
- [ ] **Nginx Vhost anlegen** (siehe Abschnitt 2, Option A)
- [ ] **Nginx neu laden:**
  ```bash
  sudo nginx -t
  sudo systemctl reload nginx
  ```
- [ ] **DNS-Propagierung testen:**
  ```bash
  nslookup sonderplatzierung.greven.de
  ping sonderplatzierung.greven.de
  ```

### **Phase 3: Backend anpassen**
- [ ] **CORS-Origins erweitern** (`server/index.js` - siehe Abschnitt 1)
- [ ] **Backend neu starten:**
  ```bash
  cd /sonderplatzierungonline/server
  pm2 restart sponline-backend
  ```
- [ ] **API-Test via curl:**
  ```bash
  curl http://sonderplatzierung.greven.de/api/health
  ```

### **Phase 4: Frontend neu bauen**
- [ ] **Frontend-Build:**
  ```bash
  cd /sonderplatzierungonline/client
  pnpm build
  ```
- [ ] **Browser-Test:** `http://sonderplatzierung.greven.de` öffnen
- [ ] **Login testen** und Buchung erstellen

### **Phase 5: SSL einrichten** (optional)
- [ ] **Let's Encrypt Zertifikat holen** (siehe Abschnitt 4)
- [ ] **HTTPS-Redirect aktivieren** (Nginx-Konfiguration)
- [ ] **Backend CORS für HTTPS erweitern** (`https://sonderplatzierung.greven.de`)
- [ ] **Backend neu starten** und HTTPS testen

### **Phase 6: Monitoring & Cleanup**
- [ ] **PM2-Logs prüfen:**
  ```bash
  pm2 logs sponline-backend --lines 50
  ```
- [ ] **Nginx-Logs prüfen:**
  ```bash
  sudo tail -f /var/log/nginx/access.log /var/log/nginx/error.log
  ```
- [ ] **Browser DevTools testen** (Network-Tab: keine CORS-Fehler)
- [ ] **Alte Port-3100-Konfiguration optional deaktivieren** (Fallback behalten empfohlen)
- [ ] **Dokumentation aktualisieren** (`README.md`, interne Wikis)

---

## 🆘 Troubleshooting

### Problem: CORS-Fehler nach Domain-Umstellung
**Symptom:** Browser-Konsole zeigt `Access-Control-Allow-Origin` Error

**Lösung:**
```bash
# Prüfen, ob neue Domain in server/index.js CORS-Liste steht
cd /sonderplatzierungonline/server
grep -A 8 "corsOptions" index.js

# Falls fehlt: server/index.js editieren (siehe Abschnitt 1)
# Backend neu starten:
pm2 restart sponline-backend
```

---

### Problem: API-Calls gehen noch an alte IP
**Symptom:** Netzwerk-Tab zeigt Requests zu `extweb04:3100` oder `localhost`

**Lösung:**
```bash
# Frontend neu bauen
cd /sonderplatzierungonline/client
rm -rf dist/
pnpm build

# Browser-Cache leeren oder Inkognito-Modus testen
```

---

### Problem: 404 bei `/api/*` Requests
**Symptom:** Backend antwortet nicht, Nginx liefert 404

**Lösung:**
```bash
# 1. Backend-Status prüfen
pm2 status

# 2. Backend direkt testen
curl http://127.0.0.1:3101/api/health

# 3. Nginx-Proxy-Konfiguration prüfen
sudo nginx -t
sudo nano /etc/nginx/sites-available/sonderplatzierung.conf
# → location /api/ muss auf http://127.0.0.1:3101 proxyen

# 4. Nginx neu laden
sudo systemctl reload nginx
```

---

### Problem: SSL-Zertifikat nicht gültig
**Symptom:** Browser-Warnung "Ihre Verbindung ist nicht privat"

**Lösung:**
```bash
# Certbot erneut ausführen
sudo certbot --nginx -d sonderplatzierung.greven.de

# Nginx-Pfade prüfen
sudo nginx -t

# Nginx neu laden
sudo systemctl reload nginx
```

---

### Problem: Backend nicht erreichbar über neue Domain
**Symptom:** `502 Bad Gateway` oder `504 Gateway Timeout`

**Lösung:**
```bash
# Backend-Status prüfen
pm2 status
pm2 logs sponline-backend

# Backend-Port prüfen
curl http://127.0.0.1:3101/health

# Nginx-Error-Log prüfen
sudo tail -f /var/log/nginx/error.log
```

---

## 📞 Kontakt & Support

**Repository:** [GitHub - KIGREVEN/Sonderplatzierungonline](https://github.com/KIGREVEN/Sonderplatzierungonline)  
**Letzte Aktualisierung:** 24. Oktober 2025

Bei Fragen oder Problemen:
- PM2-Logs: `pm2 logs sponline-backend`
- Nginx-Logs: `sudo tail -f /var/log/nginx/error.log`
- Issue im Repository öffnen

---

## 🎯 Quick Commands Cheat Sheet

```bash
# ========== DNS-Test ==========
nslookup sonderplatzierung.greven.de
ping sonderplatzierung.greven.de

# ========== Backend ==========
pm2 status
pm2 logs sponline-backend --lines 50
pm2 restart sponline-backend

# ========== Nginx ==========
sudo systemctl status nginx
sudo nginx -t
sudo systemctl reload nginx

# ========== SSL ==========
sudo certbot --nginx -d sonderplatzierung.greven.de
sudo certbot renew --dry-run

# ========== Frontend ==========
cd /sonderplatzierungonline/client
pnpm build

# ========== API-Tests ==========
curl http://sonderplatzierung.greven.de/api/health
curl http://sonderplatzierung.greven.de/api/categories
curl -H "Origin: http://sonderplatzierung.greven.de" \
     -H "Access-Control-Request-Method: POST" \
     -X OPTIONS http://sonderplatzierung.greven.de/api/auth/login -v
```

---

## 🔄 Rollback-Plan

Falls nach der Migration Probleme auftreten:

1. **Nginx auf alten Zustand zurücksetzen:**
   ```bash
   sudo cp /etc/nginx/sites-available/sponline-3100.conf.backup /etc/nginx/sites-available/sponline-3100.conf
   sudo systemctl reload nginx
   ```

2. **Backend CORS zurücksetzen:**
   - In `server/index.js` neue Domain aus `origin` entfernen
   - `pm2 restart sponline-backend`

3. **Intern weiter nutzen:**
   - Über `http://extweb04.grevendmz.de:3100` oder `http://217.110.253.198:3100`

---

**Ende der Migration Guide**
