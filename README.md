# Sonderplatzierung Online

Professionelle Buchungs- und Verwaltungsplattform für digitale Sonderplatzierungen der Greven Group.

Letzte Aktualisierung: Oktober 2025

---

## Inhaltsverzeichnis

- Überblick
- Kernfunktionen
- Architektur & Technologie-Stack
- Projektstruktur
- Systemvoraussetzungen
- Lokales Setup (Entwicklung)
- Umgebungsvariablen
- Datenbankmigrationen & Initialdaten
- Starten & Skripte
- Deployment (Nginx, pm2, SSL)
- API-Überblick
- Datenmodell (Kurzüberblick)
- Sicherheit
- Betrieb, Logs & Monitoring
- Troubleshooting
- Lizenz & Kontakt

---

## Überblick

Sonderplatzierung Online digitalisiert den kompletten Lebenszyklus von Buchungen für Sonderplatzierungen: von der Anfrage über Reservierung bis zur festen Buchung. Die Anwendung bietet moderne UI/UX, rollenbasierte Rechte, Echtzeit-Verfügbarkeitsprüfung und ein sicheres Express/PostgreSQL-Backend. Live-Betrieb unter der Domain sonderplatzierung.greven.de.

---

## Kernfunktionen

- Rollenbasierte Authentifizierung (RBAC): Admin und Viewer
- Buchungsverwaltung (CRUD) mit Status: vorreserviert, reserviert, gebucht
- Kampagnen- und Laufzeitmodus: automatisch je nach Artikel-Typ
- Cascading-Auswahl: Plattform → Artikel-Typ → Produkt (Artikel)
- Echtzeit-Verfügbarkeitsprüfung, Konflikterkennung (409)
- Intuitive Edit-Modal-UI mit automatischer Vorbefüllung aller Felder
- Dark Mode, responsive UI, Tailwind CSS Styling
- Sicheres Backend mit JWT in httpOnly-Cookies, CORS, Rate Limiting, Helmet

---

## Architektur & Technologie-Stack

Frontend
- React 18 (Vite)
- Tailwind CSS, shadcn/ui, Lucide Icons
- AuthContext (React Context API), Fetch-Wrapper

Backend
- Node.js (Express)
- PostgreSQL
- Auth: bcrypt, jsonwebtoken
- Sicherheit: Helmet, express-rate-limit, CORS
- Validierung: Joi

Operations
- Linux-Server (extweb04), Nginx (Reverse Proxy)
- pm2 (Prozessmanager), Let's Encrypt (SSL)
- Domain: sonderplatzierung.greven.de

---

## Projektstruktur

```
Sonderplatzierungonline/
├── client/                     # React-Frontend
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── EditBookingModal.jsx     # Modernes Bearbeiten-Modal
│   │   │   ├── BookingForm.jsx          # Neue Buchung
│   │   │   ├── BookingOverview.jsx      # Übersicht & Filter
│   │   │   ├── AvailabilityChecker.jsx  # Verfügbarkeit
│   │   │   └── ...
│   │   ├── context/AuthContext.jsx
│   │   └── ...
│   └── package.json
├── server/                     # Express-Backend
│   ├── config/
│   ├── middleware/
│   ├── models/
│   ├── routes/                 # u.a. platforms.js, products.js, articleTypes.js, bookings.js
│   ├── migrations/
│   ├── scripts/
│   ├── index.js
│   ├── migrate.js
│   └── package.json
├── scripts/
│   └── docs/                   # Betriebs- und Fix-Guides
├── nginx-sonderplatzierung.conf
├── ecosystem.config.js         # pm2 Konfiguration
├── docker-compose.yml          # optional
└── README.md
```

---

## Systemvoraussetzungen

- Node.js 18+
- npm oder pnpm
- PostgreSQL 12+
- Git

---

## Lokales Setup (Entwicklung)

Repository klonen
```bash
git clone https://github.com/KIGREVEN/Sonderplatzierungonline.git
cd Sonderplatzierungonline
```

Backend installieren
```bash
cd server
npm install
```

Frontend installieren
```bash
cd ../client
npm install
```

Umgebungsvariablen anlegen
```bash
cd ../server
cp .env.example .env
# Werte in .env anpassen (siehe unten)
```

Datenbank migrieren
```bash
node migrate.js
```

Entwicklungsstart
```bash
# Terminal 1 (Backend)
cd server
npm run dev

# Terminal 2 (Frontend)
cd client
npm run dev
```

Frontend erreichbar unter http://localhost:5173.

---

## Umgebungsvariablen (Beispiel .env)

```
DATABASE_URL=postgresql://user:password@localhost:5432/sonderplatzierung
JWT_SECRET=changeme
NODE_ENV=development
PORT=3101
CORS_ORIGINS=http://localhost:5173,http://sonderplatzierung.greven.de
```

---

## Datenbankmigrationen & Initialdaten

Migrationen ausführen
```bash
cd server
node migrate.js
```

Admin-Benutzer erstellen (falls Skript vorhanden)
```bash
node create_admin.js
```

Neue Felder/Hotfixes (nach Bedarf)
```bash
cd server
node scripts/add_booking_duration_fields.js
```

---

## Starten & Skripte

Entwicklung
```bash
# Backend
cd server
npm run dev

# Frontend
cd client
npm run dev
```

Produktion (pm2)
```bash
pm2 start ecosystem.config.js
pm2 status
pm2 logs --lines 200
```

Frontend-Build
```bash
cd client
npm run build
```

---

## Deployment (Nginx, pm2, SSL)

Server
- Domain: sonderplatzierung.greven.de
- Backend-Port: 3101
- Reverse Proxy: Nginx (siehe nginx-sonderplatzierung.conf)

Schritte
```bash
ssh <user>@217.110.253.198
cd /pfad/zu/Sonderplatzierungonline
git pull origin master

# Backend aktualisieren
cd server
npm install
pm2 restart ecosystem.config.js

# Frontend neu bauen
cd ../client
npm install
npm run build

# Nginx neu laden
sudo nginx -t
sudo systemctl reload nginx
```

SSL (Let's Encrypt)
```bash
sudo certbot --nginx -d sonderplatzierung.greven.de
sudo certbot renew --dry-run
```

---

## API-Überblick

Basis-URL
```
http://sonderplatzierung.greven.de/api/
```

Authentifizierung
- POST /api/auth/login
- GET  /api/auth/me
- POST /api/auth/logout

Stammdaten
- GET /api/platforms, GET /api/platforms/:id
- GET /api/article-types, GET /api/article-types/:id
- GET /api/products, GET /api/products/:id
- GET /api/categories
- GET /api/locations
- GET /api/campaigns

Buchungen
- GET    /api/bookings
- POST   /api/bookings
- PUT    /api/bookings/:id
- DELETE /api/bookings/:id

Verfügbarkeit
- POST /api/availability/all

Hinweis: Produkte können nach articleTypeId gefiltert werden. Artikel-Typen können über platform_key gefiltert werden.

---

## Datenmodell (Kurzüberblick)

Kerneinheiten
- platforms (Plattformen)
- article_types (Artikel-Typen; steuern Kampagne vs. Laufzeit)
- products (Artikel/Produkte)
- categories (Branchen)
- locations (Orte)
- campaigns (Kampagnen)
- bookings (Buchungen, inkl. campaign_id ODER duration_start/duration_end)
- users (Benutzer/Rollen)

Wichtige Constraints
- Eindeutigkeit und Foreign Keys zwischen bookings und Stammdaten
- Check: Entweder Kampagne ODER Laufzeit gesetzt
- Indexe auf häufige Filterfelder (status, platform_id, product_id, duration)

---

## Sicherheit

- Passwort-Hashing mit bcrypt
- JWT in httpOnly-Cookies (XSS-Schutz)
- CORS Whitelist (server/index.js konfigurieren)
- Helmet Security Headers
- Rate Limiting (Login & API)
- Joi-Validierung für Eingaben

---

## Betrieb, Logs & Monitoring

pm2
```bash
pm2 status
pm2 logs sponline-backend --lines 200
pm2 restart ecosystem.config.js
```

Nginx
```bash
sudo nginx -t
sudo systemctl reload nginx
sudo journalctl -u nginx -xe
```

PostgreSQL
```bash
psql <connection-string>
\dt
```

---

## Troubleshooting

404 bei /api/products/:id oder /api/platforms/:id
- Sicherstellen, dass die Detailrouten im Backend existieren (routes/products.js, routes/platforms.js)

ReferenceError: Cannot access 'router' before initialization
- In Route-Dateien müssen require(...) und `const router = express.Router()` VOR den Routen stehen

CORS-Fehler
- server/index.js: CORS Origins um die korrekte Domain erweitern

409 Konflikt bei Buchung
- Die gewünschte Belegung ist belegt: Zeitraum/Produkt/Kategorie/Ort prüfen

DB-Verbindung schlägt fehl
- DATABASE_URL prüfen, Migrationen erneut ausführen

---

## Lizenz & Kontakt

Copyright © Greven Group.

Kontakt
- Verantwortlich: Tobias Leyendecker
- GitHub: https://github.com/KIGREVEN/Sonderplatzierungonline

---

Hinweis
Diese README repräsentiert den aktuellen Stand des Projekts und deckt Entwicklung, Betrieb und API-Überblick ab. Für tiefere Betriebs- und Fix-Guides siehe den Ordner `scripts/docs/`.
 

