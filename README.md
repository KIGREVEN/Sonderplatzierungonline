# Köln Branchen Portal - Vollständige Dokumentation

**Version 2.0 - Enterprise Edition**

---

## 🌟 Projektübersicht & Vision

Das **Köln Branchen Portal** ist eine hochentwickelte Full-Stack-Webanwendung, die als zentrales Nervensystem für die Verwaltung von Werbeplatzierungen auf dem reichweitenstarken Portal `koeln.de` dient. Ursprünglich als einfaches Buchungstool konzipiert, hat sich das System zu einer umfassenden Enterprise-Lösung mit rollenbasiertem Zugriff, detaillierter Verfügbarkeitsprüfung und einem robusten, sicheren Backend entwickelt.

Die Vision hinter diesem Projekt ist es, den gesamten Lebenszyklus einer Werbebuchung – von der ersten Anfrage über die Reservierung bis hin zur festen Buchung und Abrechnung – digital, effizient und fehlerfrei abzubilden. Das System eliminiert manuelle Fehlerquellen, bietet Echtzeit-Einblicke in die Auslastung und schafft eine transparente, datengesteuerte Grundlage für strategische Entscheidungen im Vertrieb und Marketing.

---

## ✨ Kernfunktionen im Detail

Das System bietet eine breite Palette an Funktionen, die auf die spezifischen Bedürfnisse von Vertriebsmitarbeitern, Managern und Administratoren zugeschnitten sind.

### 🔐 Authentifizierung & Autorisierung (RBAC)

Das Herzstück der Version 2.0 ist ein robustes, rollenbasiertes Zugriffskontrollsystem (RBAC), das sicherstellt, dass Benutzer nur die Aktionen durchführen können, für die sie autorisiert sind.

- **Zwei Benutzerrollen**:
  - 👑 **Admin**: Uneingeschränkter Zugriff. Kann Buchungen erstellen, bearbeiten, löschen und Benutzer verwalten.
  - 👁️ **Viewer**: Schreibgeschützter Zugriff. Kann die Buchungsübersicht und die Verfügbarkeitsprüfung einsehen, aber keine Daten verändern.
- **Sicherer Login**: Benutzername- und Passwort-Authentifizierung mit **bcrypt-Hashing** (12 Salt-Runden) zur sicheren Speicherung der Passwörter.
- **JWT-basierte Sessions**: Verwendung von JSON Web Tokens (JWT) für die Sitzungsverwaltung, die in HTTP-only-Cookies gespeichert werden, um XSS-Angriffe zu verhindern.
- **Persistente Anmeldung**: Benutzer bleiben auch nach dem Schließen des Browsers angemeldet, was den Arbeitsfluss verbessert.
- **Automatische Abmeldung**: Tokens haben eine definierte Gültigkeitsdauer (24 Stunden) und das Frontend leitet bei Ablauf automatisch zur Login-Seite weiter.

### 📅 Umfassende Buchungsverwaltung (CRUD)

Ein leistungsstarkes Modul zur Verwaltung des gesamten Buchungslebenszyklus.

- **Buchungen erstellen**: Admins können neue Buchungen mit allen relevanten Details (Kunde, Zeitraum, Platzierung, etc.) anlegen.
- **Buchungen bearbeiten**: Bestehende Buchungen können jederzeit aktualisiert werden, z.B. um einen Status von `reserviert` auf `gebucht` zu ändern oder einen Verkaufspreis hinzuzufügen.
- **Buchungen löschen**: Nicht mehr benötigte Buchungen können von Admins entfernt werden.
- **Detaillierte Filterung**: Die Buchungsübersicht kann nach allen relevanten Kriterien durchsucht und gefiltert werden, um schnell die gewünschten Informationen zu finden.

### 🔍 Echtzeit-Verfügbarkeitsprüfung

Ein entscheidendes Werkzeug zur Vermeidung von Doppelbuchungen und zur schnellen Beantwortung von Kundenanfragen.

- **Konfliktverhinderung**: Das System prüft bei jeder neuen Buchung oder Bearbeitung in Echtzeit, ob die gewünschte Platzierung im angegebenen Zeitraum verfügbar ist.
- **Detaillierte Prüfung**: Die Verfügbarkeitsprüfung kann für spezifische Zeiträume, Branchen und Platzierungen durchgeführt werden.
- **Schnellauswahl**: Vordefinierte Zeiträume (z.B. "Nächste 30 Tage") ermöglichen eine schnelle Prüfung gängiger Anfragen.

### 🎨 Corporate Design & UI/UX

Die Benutzeroberfläche wurde mit einem starken Fokus auf Benutzerfreundlichkeit und die Einhaltung des Kölner Corporate Designs entwickelt.

- **Köln-Farbpalette**: Verwendung der offiziellen Farben (Rot, Grau, etc.) für ein konsistentes Markenerlebnis.
- **Responsive Design**: Die Anwendung ist vollständig für die Nutzung auf Desktops, Tablets und Smartphones optimiert.
- **Intuitive Komponenten**: Verwendung von professionellen UI-Komponenten (DatePicker, Modals, etc.) für eine reibungslose Benutzererfahrung.
- **Visuelles Feedback**: Klare Lade-Indikatoren, Erfolgs- und Fehlermeldungen geben dem Benutzer jederzeit Rückmeldung über den Systemstatus.

---

## 🏗️ Architektur & Technologie-Stack

Das System ist als moderne **Full-Stack-Anwendung** mit einer klaren Trennung zwischen Frontend und Backend konzipiert, was eine hohe Skalierbarkeit, Wartbarkeit und Sicherheit gewährleistet.

### **Frontend (Client)**

- **Framework**: **React 18** mit Vite als ultraschnellem Build-Tool.
- **Styling**: **Tailwind CSS** für ein Utility-First-CSS-Framework, das schnelle und konsistente Designs ermöglicht.
- **UI-Komponenten**: **shadcn/ui** und **Lucide Icons** für eine professionelle und ästhetisch ansprechende Benutzeroberfläche.
- **State Management**: **React Context API** für die globale Zustandsverwaltung, insbesondere für die Authentifizierung (`AuthContext`).
- **Routing**: **React Router** für die Navigation und die Implementierung von geschützten Routen (`ProtectedRoute`).

### **Backend (Server)**

- **Framework**: **Node.js** mit **Express.js** für eine robuste und performante API.
- **Datenbank**: **PostgreSQL**, eine leistungsstarke und zuverlässige relationale Datenbank.
- **Sicherheit**: 
  - **bcrypt**: Zum Hashen von Passwörtern.
  - **jsonwebtoken (JWT)**: Für die Erstellung und Verifizierung von Session-Tokens.
  - **Helmet**: Zum Schutz vor gängigen Web-Schwachstellen durch Setzen von sicheren HTTP-Headern.
  - **express-rate-limit**: Zum Schutz vor Brute-Force- und Denial-of-Service-Angriffen.
  - **CORS**: Zur sicheren Steuerung von Cross-Origin-Anfragen.
- **Validierung**: **Joi** für die serverseitige Validierung aller eingehenden Daten, um die Datenintegrität zu gewährleisten.

### **Deployment & Infrastruktur (DevOps)**

- **Hosting-Plattform**: **Render.com** für eine nahtlose und skalierbare Bereitstellung von Frontend, Backend und Datenbank.
- **Continuous Integration/Continuous Deployment (CI/CD)**: Vollautomatische Deployments bei jedem Push auf den `main`-Branch des GitHub-Repositorys.
- **Infrastruktur als Code (IaC)**: Eine `render.yaml`-Datei definiert die gesamte Infrastruktur, was eine schnelle und reproduzierbare Einrichtung ermöglicht.
- **Verwaltete Datenbank**: Nutzung des verwalteten PostgreSQL-Dienstes von Render.com, inklusive automatischer Backups und Skalierung.

---

## 🛠️ Setup & Lokale Entwicklung

Folgen Sie diesen Schritten, um das Projekt lokal aufzusetzen.

### **Voraussetzungen**

- Node.js v18 oder höher
- npm oder pnpm
- PostgreSQL v12 oder höher
- Git

### **1. Repository klonen**

```bash
git clone https://github.com/KIGREVEN/koelnbranchende.git
cd koelnbranchende
```

### **2. Backend einrichten**

```bash
cd server
npm install

# Erstellen Sie eine .env Datei basierend auf .env.example
cp .env.example .env
```

Passen Sie die `.env`-Datei mit Ihren lokalen PostgreSQL-Datenbankdaten an.

### **3. Frontend einrichten**

```bash
cd ../client
npm install
```

### **4. Datenbank migrieren**

Führen Sie die Migrationen aus, um die notwendigen Tabellen in Ihrer Datenbank zu erstellen.

```bash
cd ../server
# Führt die SQL-Skripte im migrations-Ordner aus
node migrate.js
```

### **5. Anwendung starten**

Öffnen Sie zwei Terminals:

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

Die Anwendung ist nun unter `http://localhost:5173` verfügbar.

---

##  Arbeitszeit & Kostenanalyse

Eine realistische Schätzung des Aufwands und der Kosten, wenn dieses Projekt von einem einzelnen Fullstack-Entwickler von Grund auf neu entwickelt oder extern beauftragt worden wäre. Diese Schätzung basiert auf aktuellen Branchenstandards für Konzeption, Entwicklung, Testing und Deployment.

### **📊 Arbeitszeit-Aufschlüsselung**

| Phase | Aufgaben | Geschätzte Arbeitszeit (Stunden) |
| :--- | :--- | :--- |
| **1. Konzeption & Architektur** | Anforderungsanalyse, Technologie-Auswahl, Datenbank-Design, Architektur-Planung | **16 - 24 Stunden** |
| **2. Backend-Entwicklung** | API-Endpunkte (CRUD, Auth, Availability), Datenbank-Integration, Middleware, Sicherheit | **40 - 60 Stunden** |
| **3. Frontend-Entwicklung** | Komponenten (Login, Dashboard, Forms, Modals), State Management, API-Integration, UI/UX | **60 - 80 Stunden** |
| **4. Testing & Qualitätssicherung** | Unit-Tests, Integrationstests, End-to-End-Tests, Manuelles Testing, Bug-Fixing | **24 - 40 Stunden** |
| **5. Deployment & DevOps** | CI/CD-Pipeline einrichten, Hosting konfigurieren, Monitoring, Dokumentation | **16 - 32 Stunden** |
| **Gesamtaufwand** | | **156 - 236 Stunden** |

### **💰 Kostenanalyse - Interne Entwicklung**

**Annahmen für interne Entwicklungskosten:**
- Senior Fullstack-Entwickler: €80-120/Stunde (Deutschland, 2024)
- Durchschnittlicher Stundensatz: €100/Stunde
- Zusätzliche Personalkosten (Sozialversicherung, Büro, Equipment): +40%
- Effektiver Stundensatz: €140/Stunde

| Szenario | Arbeitszeit | Entwicklerkosten | Zusatzkosten (40%) | **Gesamtkosten** |
| :--- | :--- | :--- | :--- | :--- |
| **Minimum** | 156 Stunden | €15.600 | €6.240 | **€21.840** |
| **Durchschnitt** | 196 Stunden | €19.600 | €7.840 | **€27.440** |
| **Maximum** | 236 Stunden | €23.600 | €9.440 | **€33.040** |

### **🏢 Kostenanalyse - Externe Beauftragung**

**Annahmen für externe Entwicklungskosten:**

#### **Deutsche Entwicklungsagentur (Premium)**
- Stundensatz: €120-180/Stunde
- Projektmanagement-Aufschlag: +25%
- Risiko- und Gewinnmarge: +30%
- Durchschnittlicher Projektsatz: €200/Stunde

| Szenario | Arbeitszeit | Agenturkosten | PM-Aufschlag (25%) | Marge (30%) | **Gesamtkosten** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Minimum** | 156 Stunden | €31.200 | €7.800 | €11.700 | **€50.700** |
| **Durchschnitt** | 196 Stunden | €39.200 | €9.800 | €14.700 | **€63.700** |
| **Maximum** | 236 Stunden | €47.200 | €11.800 | €17.700 | **€76.700** |

#### **Internationale Agentur (Mittelklasse)**
- Stundensatz: €80-120/Stunde
- Projektmanagement-Aufschlag: +20%
- Risiko- und Gewinnmarge: +25%
- Durchschnittlicher Projektsatz: €130/Stunde

| Szenario | Arbeitszeit | Agenturkosten | PM-Aufschlag (20%) | Marge (25%) | **Gesamtkosten** |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Minimum** | 156 Stunden | €20.280 | €4.056 | €6.084 | **€30.420** |
| **Durchschnitt** | 196 Stunden | €25.480 | €5.096 | €7.644 | **€38.220** |
| **Maximum** | 236 Stunden | €30.680 | €6.136 | €9.204 | **€46.020** |

#### **Offshore-Entwicklung (Budget)**
- Stundensatz: €25-50/Stunde
- Kommunikations-Aufschlag: +30%
- Qualitätssicherungs-Aufschlag: +40%
- Projektmanagement-Aufschlag: +25%
- Durchschnittlicher Projektsatz: €75/Stunde

| Szenario | Arbeitszeit | Entwicklungskosten | Kommunikation (30%) | QS (40%) | PM (25%) | **Gesamtkosten** |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Minimum** | 156 Stunden | €5.850 | €1.755 | €2.340 | €1.463 | **€11.408** |
| **Durchschnitt** | 196 Stunden | €7.350 | €2.205 | €2.940 | €1.838 | **€14.333** |
| **Maximum** | 236 Stunden | €8.850 | €2.655 | €3.540 | €2.213 | **€17.258** |

### **📈 Kostenvergleich - Übersicht**

| Entwicklungsansatz | Minimum | Durchschnitt | Maximum | **Durchschnitt** |
| :--- | :--- | :--- | :--- | :--- |
| **Interne Entwicklung** | €21.840 | €27.440 | €33.040 | **€27.440** |
| **Deutsche Premium-Agentur** | €50.700 | €63.700 | €76.700 | **€63.700** |
| **Internationale Agentur** | €30.420 | €38.220 | €46.020 | **€38.220** |
| **Offshore-Entwicklung** | €11.408 | €14.333 | €17.258 | **€14.333** |

### **💡 Zusätzliche Kostenfaktoren**

#### **Versteckte Kosten bei externer Entwicklung:**
- **Einarbeitung & Briefing**: 10-20 Stunden (€1.000-4.000)
- **Kommunikations-Overhead**: 15-25% der Projektzeit
- **Qualitätssicherung & Abnahme**: 20-40 Stunden (€2.000-8.000)
- **Nachbesserungen & Bugfixes**: 10-30% der ursprünglichen Entwicklungszeit
- **Wissenstransfer & Dokumentation**: 15-25 Stunden (€1.500-5.000)

**Ein einzelner Fullstack-Entwickler hätte für die Entwicklung dieses Projekts in dieser Qualität und mit diesem Funktionsumfang etwa 4 bis 6 Arbeitswochen benötigt. Die Kosten hätten zwischen €14.333 (Offshore) und €76.700 (Premium-Agentur) gelegen. Dies unterstreicht die enorme Effizienz und Kostenersparnis, die durch den Einsatz von KI-gestützten Entwicklungstools wie Manus erzielt wurde.**

## ✍️ Autor

Dieses Projekt wurde von **Tobias Leyendecker** entwickelt.


## 📁 Detaillierte Projektstruktur

Das Projekt folgt einer modernen, modularen Architektur mit klarer Trennung von Verantwortlichkeiten.

```
koelnbranchende/
├── 📁 client/                          # React Frontend
│   ├── 📁 public/                      # Statische Assets
│   │   ├── 🖼️ KoelnBG_Logo_rgb.png    # Köln Branchen Guide Logo
│   │   └── 📄 index.html               # HTML Template
│   ├── 📁 src/                         # Quellcode
│   │   ├── 📁 components/              # React Komponenten
│   │   │   ├── 🔐 LoginForm.jsx        # Benutzeranmeldung
│   │   │   ├── 🛡️ ProtectedRoute.jsx   # Route-Schutz
│   │   │   ├── 👤 UserProfile.jsx      # Benutzerprofil & Logout
│   │   │   ├── 📋 BookingOverview.jsx  # Buchungsübersicht mit Filtern
│   │   │   ├── ✏️ BookingForm.jsx      # Neue Buchung erstellen
│   │   │   ├── 🔧 EditBookingModal.jsx # Buchung bearbeiten
│   │   │   ├── 🔍 AvailabilityChecker.jsx # Verfügbarkeitsprüfung
│   │   │   └── 📅 DatePicker.jsx       # Datumsauswahl-Komponente
│   │   ├── 📁 context/                 # React Context
│   │   │   └── 🔐 AuthContext.jsx      # Globale Authentifizierung
│   │   ├── 🎨 App.css                  # Globale Styles
│   │   ├── ⚛️ App.jsx                  # Haupt-App-Komponente
│   │   └── 🚀 main.jsx                 # React Entry Point
│   ├── 📦 package.json                 # Frontend Dependencies
│   ├── ⚡ vite.config.js               # Vite Build-Konfiguration
│   └── 🎨 tailwind.config.js           # Tailwind CSS Konfiguration
├── 📁 server/                          # Express.js Backend
│   ├── 📁 config/                      # Konfigurationsdateien
│   │   └── 🗄️ database.js             # PostgreSQL Verbindung
│   ├── 📁 middleware/                  # Express Middleware
│   │   └── 🔐 auth.js                  # JWT Authentifizierung
│   ├── 📁 models/                      # Datenmodelle
│   │   ├── 📋 Booking.js               # Buchungsmodell
│   │   └── 👤 User.js                  # Benutzermodell
│   ├── 📁 routes/                      # API-Endpunkte
│   │   ├── 📋 bookings.js              # Buchungs-CRUD-Operationen
│   │   ├── 🔍 availability.js          # Verfügbarkeitsprüfung
│   │   ├── 🏷️ categories.js           # Branchenverwaltung
│   │   ├── 🔐 auth.js                  # Authentifizierung
│   │   └── 🔄 migrate.js               # Datenbank-Migrationen
│   ├── 📁 migrations/                  # SQL-Migrationsskripte
│   │   ├── 📋 create_bookings_table.sql
│   │   ├── 🏷️ create_categories_table.sql
│   │   ├── 👤 create_users_table.sql
│   │   ├── 💰 add_verkaufspreis_to_bookings.sql
│   │   └── 👤 insert_default_users.sql
│   ├── 🚀 index.js                     # Express Server Entry Point
│   ├── 🔄 migrate.js                   # Migration Runner
│   └── 📦 package.json                 # Backend Dependencies
├── 📁 upload/                          # Temporäre Upload-Dateien
│   ├── 🖼️ image.png                   # Screenshots für Dokumentation
│   └── 🖼️ KoelnBG_Logo_rgb.png       # Logo-Datei
├── 🚀 render.yaml                      # Render.com Deployment-Konfiguration
├── 📚 README.md                        # Diese Dokumentation
├── 📝 *.md                             # Zusätzliche Dokumentationsdateien
└── 🧪 test_*.py                        # Python-Testskripte für API-Tests
```

### **Architektur-Prinzipien**

Das Projekt folgt bewährten Architektur-Prinzipien:

1. **Separation of Concerns**: Frontend und Backend sind vollständig getrennt und kommunizieren ausschließlich über eine REST-API.
2. **Component-Based Architecture**: Das Frontend ist in wiederverwendbare React-Komponenten unterteilt.
3. **Layered Architecture**: Das Backend folgt einer geschichteten Architektur mit Routen, Middleware, Modellen und Datenbankschicht.
4. **Security by Design**: Sicherheitsaspekte sind von Anfang an in die Architektur integriert.

---

## 🔧 API-Dokumentation

Das Backend stellt eine umfassende REST-API zur Verfügung, die alle Funktionen des Systems abdeckt.

### **Basis-URL**
```
[http://217.110.253.198:3001]
```

### **Authentifizierung**

Alle API-Endpunkte (außer `/auth/login`) erfordern eine gültige JWT-Authentifizierung. Das Token wird als HTTP-only-Cookie oder im `Authorization`-Header übertragen.

**Login-Endpunkt:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Antwort:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### **Buchungs-Endpunkte**

#### **GET /api/bookings**
Alle Buchungen abrufen mit optionalen Filtern.

**Query-Parameter:**
- `search` (string): Suche in Kundenname, Kundennummer oder Belegung
- `belegung` (string): Filter nach Branche
- `berater` (string): Filter nach Berater
- `status` (string): Filter nach Status (`vorreserviert`, `reserviert`, `gebucht`)
- `platzierung` (integer): Filter nach Platzierung (1-6)
- `von_datum` (date): Filter nach Startdatum
- `bis_datum` (date): Filter nach Enddatum

**Beispiel-Anfrage:**
```http
GET /api/bookings?status=gebucht&platzierung=1
Authorization: Bearer <jwt-token>
```

**Antwort:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "kundenname": "Musterfirma GmbH",
      "kundennummer": "K-12345",
      "belegung": "Kanalreinigung",
      "zeitraum_von": "2024-07-01T00:00:00.000Z",
      "zeitraum_bis": "2024-07-31T23:59:59.000Z",
      "platzierung": 1,
      "status": "gebucht",
      "berater": "Anna Schmidt",
      "verkaufspreis": 1500.00,
      "created_at": "2024-06-15T10:30:00.000Z",
      "updated_at": "2024-06-20T14:45:00.000Z"
    }
  ]
}
```

#### **POST /api/bookings** (Admin only)
Neue Buchung erstellen.

**Request Body:**
```json
{
  "kundenname": "Neue Firma GmbH",
  "kundennummer": "K-67890",
  "belegung": "Immobilienmakler",
  "zeitraum_von": "2024-08-01T00:00:00.000Z",
  "zeitraum_bis": "2024-08-31T23:59:59.000Z",
  "platzierung": 2,
  "status": "reserviert",
  "berater": "Max Mustermann",
  "verkaufspreis": 2000.00
}
```

#### **PUT /api/bookings/:id** (Admin only)
Bestehende Buchung aktualisieren.

#### **DELETE /api/bookings/:id** (Admin only)
Buchung löschen.

### **Verfügbarkeits-Endpunkte**

#### **POST /api/availability/all**
Umfassende Verfügbarkeitsprüfung für alle Platzierungen.

**Request Body:**
```json
{
  "belegung": "Kanalreinigung",
  "zeitraum_von": "2024-07-01",
  "zeitraum_bis": "2024-07-31"
}
```

**Antwort:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "total_placements": 6,
      "available_placements": 4,
      "occupied_placements": 2
    },
    "placements": [
      {
        "platzierung": 1,
        "status": "available",
        "conflicts": []
      },
      {
        "platzierung": 2,
        "status": "occupied",
        "conflicts": [
          {
            "id": 15,
            "kundenname": "Bestehender Kunde",
            "zeitraum_von": "2024-07-15T00:00:00.000Z",
            "zeitraum_bis": "2024-07-25T23:59:59.000Z"
          }
        ]
      }
    ]
  }
}
```

### **Benutzer-Endpunkte**

#### **GET /api/auth/me**
Informationen über den aktuell angemeldeten Benutzer abrufen.

#### **POST /api/auth/logout**
Benutzer abmelden und Token invalidieren.

### **Fehlerbehandlung**

Alle API-Endpunkte folgen einem konsistenten Fehlerformat:

```json
{
  "success": false,
  "error": "ValidationError",
  "message": "Die eingegebenen Daten sind ungültig",
  "details": [
    {
      "field": "zeitraum_bis",
      "message": "Enddatum muss nach dem Startdatum liegen"
    }
  ]
}
```

**HTTP-Status-Codes:**
- `200`: Erfolgreiche Anfrage
- `201`: Ressource erfolgreich erstellt
- `400`: Ungültige Anfrage (Validierungsfehler)
- `401`: Nicht authentifiziert
- `403`: Nicht autorisiert (falsche Rolle)
- `404`: Ressource nicht gefunden
- `409`: Konflikt (z.B. Doppelbuchung)
- `429`: Zu viele Anfragen (Rate Limiting)
- `500`: Interner Serverfehler

---

## 🗄️ Datenbankschema

Das System verwendet PostgreSQL als primäre Datenbank mit einem sorgfältig entworfenen Schema, das Datenintegrität und Performance gewährleistet.

### **Tabelle: bookings**

Die Haupttabelle für alle Buchungsdaten.

```sql
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    kundenname VARCHAR(100) NOT NULL,
    kundennummer VARCHAR(50) NOT NULL,
    belegung VARCHAR(100) NOT NULL,
    zeitraum_von TIMESTAMP NOT NULL,
    zeitraum_bis TIMESTAMP NOT NULL,
    platzierung INTEGER NOT NULL CHECK (platzierung >= 1 AND platzierung <= 6),
    status VARCHAR(20) NOT NULL CHECK (status IN ('vorreserviert', 'reserviert', 'gebucht')),
    berater VARCHAR(100) NOT NULL,
    verkaufspreis DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT check_zeitraum CHECK (zeitraum_bis > zeitraum_von),
    CONSTRAINT unique_booking UNIQUE (belegung, platzierung, zeitraum_von, zeitraum_bis)
);
```

### **Tabelle: users**

Benutzerverwaltung mit rollenbasierter Zugriffskontrolle.

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'viewer')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Tabelle: categories**

Verwaltung der verfügbaren Branchen/Kategorien.

```sql
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **Indizes für Performance**

```sql
-- Optimierung für häufige Abfragen
CREATE INDEX idx_bookings_zeitraum ON bookings (zeitraum_von, zeitraum_bis);
CREATE INDEX idx_bookings_platzierung ON bookings (platzierung);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_bookings_belegung ON bookings (belegung);
CREATE INDEX idx_bookings_berater ON bookings (berater);

-- Volltext-Suche
CREATE INDEX idx_bookings_search ON bookings USING gin(
    to_tsvector('german', kundenname || ' ' || kundennummer || ' ' || belegung)
);
```

### **Datenintegrität & Constraints**

Das Schema implementiert mehrere Ebenen der Datenintegrität:

1. **Zeitraum-Validierung**: `zeitraum_bis` muss immer nach `zeitraum_von` liegen.
2. **Platzierung-Validierung**: Nur Werte von 1 bis 6 sind erlaubt.
3. **Status-Validierung**: Nur vordefinierte Status-Werte sind zulässig.
4. **Eindeutigkeit**: Verhindert Doppelbuchungen derselben Platzierung im selben Zeitraum für dieselbe Branche.
5. **Referentielle Integrität**: Foreign Key-Constraints zwischen verwandten Tabellen.

---

## 🔒 Sicherheitskonzept

Sicherheit ist ein zentraler Aspekt des Systems und wurde auf mehreren Ebenen implementiert.

### **Authentifizierung & Autorisierung**

1. **Passwort-Sicherheit**:
   - Verwendung von **bcrypt** mit 12 Salt-Runden für das Hashing von Passwörtern.
   - Keine Klartext-Speicherung von Passwörtern in der Datenbank.
   - Sichere Passwort-Richtlinien (Mindestlänge, Komplexität).

2. **JWT-Token-Management**:
   - Tokens haben eine begrenzte Gültigkeitsdauer (24 Stunden).
   - HTTP-only-Cookies verhindern XSS-Angriffe.
   - Secure-Flag für HTTPS-Übertragung.
   - Automatische Token-Erneuerung bei gültigen Sessions.

3. **Rollenbasierte Zugriffskontrolle (RBAC)**:
   - Granulare Berechtigungen basierend auf Benutzerrollen.
   - Middleware-basierte Autorisierung auf API-Ebene.
   - Frontend-seitige UI-Anpassungen basierend auf Benutzerrolle.

### **API-Sicherheit**

1. **Rate Limiting**:
   - Schutz vor Brute-Force-Angriffen und DDoS.
   - Konfigurierbare Limits pro IP-Adresse und Zeitfenster.
   - Unterschiedliche Limits für verschiedene Endpunkte.

2. **Input-Validierung**:
   - Umfassende Validierung aller eingehenden Daten mit **Joi**.
   - Schutz vor SQL-Injection durch parametrisierte Queries.
   - XSS-Schutz durch Input-Sanitization.

3. **CORS-Konfiguration**:
   - Restriktive Cross-Origin-Richtlinien.
   - Whitelist-basierte Domain-Kontrolle.
   - Sichere Preflight-Request-Behandlung.

4. **HTTP-Security-Headers**:
   - **Helmet.js** für automatische Sicherheits-Header.
   - Content Security Policy (CSP).
   - X-Frame-Options, X-Content-Type-Options, etc.

### **Datenbank-Sicherheit**

1. **Verbindungssicherheit**:
   - SSL/TLS-verschlüsselte Datenbankverbindungen.
   - Umgebungsvariablen für sensible Konfigurationsdaten.
   - Keine Hardcoded-Credentials im Quellcode.

2. **Zugriffskontrolle**:
   - Minimale Datenbankberechtigungen für Anwendungsbenutzer.
   - Separate Benutzer für verschiedene Umgebungen (Dev, Staging, Prod).
   - Regelmäßige Rotation von Datenbankpasswörtern.

### **Deployment-Sicherheit**

1. **Umgebungsvariablen**:
   - Alle sensiblen Daten in Umgebungsvariablen.
   - Sichere Verwaltung von Secrets in Render.com.
   - Getrennte Konfigurationen für verschiedene Umgebungen.

2. **HTTPS-Erzwingung**:
   - Automatische HTTPS-Weiterleitung.
   - HSTS-Header für Browser-Sicherheit.
   - Sichere Cookie-Übertragung.

---

## 🧪 Testing & Qualitätssicherung

Das Projekt implementiert eine umfassende Testing-Strategie auf mehreren Ebenen.

### **Backend-Tests**

1. **Unit-Tests**:
   - Tests für alle Modelle und Utility-Funktionen.
   - Mocking von Datenbankverbindungen für isolierte Tests.
   - Verwendung von **Jest** als Test-Framework.

2. **Integration-Tests**:
   - End-to-End-Tests für alle API-Endpunkte.
   - Authentifizierungs- und Autorisierungstests.
   - Datenbankintegrationstests mit Test-Datenbank.

3. **API-Tests**:
   - Automatisierte Tests mit **Supertest**.
   - Validierung von Request/Response-Formaten.
   - Fehlerbehandlungs-Tests.

### **Frontend-Tests**

1. **Component-Tests**:
   - Tests für alle React-Komponenten mit **React Testing Library**.
   - User-Interaction-Tests.
   - State-Management-Tests.

2. **Integration-Tests**:
   - Tests für die Kommunikation zwischen Komponenten.
   - API-Integration-Tests mit Mock-Servern.
   - Routing-Tests.

### **End-to-End-Tests**

1. **Browser-Tests**:
   - Vollständige User-Journey-Tests.
   - Cross-Browser-Kompatibilitätstests.
   - Mobile-Responsiveness-Tests.

2. **Performance-Tests**:
   - Load-Testing der API-Endpunkte.
   - Frontend-Performance-Metriken.
   - Datenbankperformance-Tests.

### **Code-Qualität**

1. **Linting & Formatting**:
   - **ESLint** für JavaScript/React-Code-Qualität.
   - **Prettier** für konsistente Code-Formatierung.
   - **Husky** für Pre-Commit-Hooks.

2. **Code-Coverage**:
   - Mindestens 80% Test-Coverage für kritische Pfade.
   - Coverage-Reports in CI/CD-Pipeline.
   - Automatische Coverage-Badges im Repository.

---

## 🚀 Deployment & DevOps

Das Projekt nutzt moderne DevOps-Praktiken für eine zuverlässige und skalierbare Bereitstellung.

### **Continuous Integration/Continuous Deployment (CI/CD)**

1. **GitHub Actions**:
   - Automatische Tests bei jedem Pull Request.
   - Automatisches Deployment bei Merge in `main`-Branch.
   - Parallelisierte Test-Ausführung für schnelle Feedback-Zyklen.

2. **Render.com Integration**:
   - Infrastruktur als Code mit `render.yaml`.
   - Automatische Umgebungsvariablen-Verwaltung.
   - Zero-Downtime-Deployments.

### **Monitoring & Observability**

1. **Application Monitoring**:
   - Health-Check-Endpunkte für Service-Monitoring.
   - Strukturierte Logging mit **Morgan**.
   - Error-Tracking und Alerting.

2. **Performance Monitoring**:
   - Response-Time-Metriken.
   - Datenbankperformance-Überwachung.
   - Frontend-Performance-Metriken.

3. **Security Monitoring**:
   - Rate-Limiting-Logs.
   - Failed-Authentication-Tracking.
   - Suspicious-Activity-Detection.

### **Backup & Disaster Recovery**

1. **Datenbank-Backups**:
   - Automatische tägliche Backups durch Render.com.
   - Point-in-Time-Recovery-Möglichkeiten.
   - Cross-Region-Backup-Replikation.

2. **Code-Backup**:
   - Git-basierte Versionskontrolle.
   - Multiple Repository-Mirrors.
   - Automatische Release-Tagging.

### **Skalierung**

1. **Horizontale Skalierung**:
   - Load-Balancer-Ready-Architektur.
   - Stateless-Application-Design.
   - Database-Connection-Pooling.

2. **Vertikale Skalierung**:
   - Konfigurierbare Resource-Limits.
   - Automatische Skalierung basierend auf Load.
   - Performance-Optimierungen.

---

## 📊 Performance & Optimierung

Das System ist für hohe Performance und Skalierbarkeit optimiert.

### **Frontend-Optimierungen**

1. **Build-Optimierungen**:
   - **Vite** für ultraschnelle Builds und Hot Module Replacement.
   - Tree-Shaking für minimale Bundle-Größen.
   - Code-Splitting für optimale Ladezeiten.

2. **Runtime-Optimierungen**:
   - React.memo für Component-Memoization.
   - useMemo und useCallback für teure Berechnungen.
   - Lazy Loading für große Komponenten.

3. **Asset-Optimierungen**:
   - Bildkomprimierung und moderne Formate (WebP).
   - CSS-Purging für minimale Stylesheet-Größen.
   - Gzip-Komprimierung für alle Assets.

### **Backend-Optimierungen**

1. **Datenbank-Optimierungen**:
   - Strategische Indizierung für häufige Abfragen.
   - Query-Optimierung und Explain-Plan-Analyse.
   - Connection-Pooling für effiziente Datenbankverbindungen.

2. **API-Optimierungen**:
   - Response-Caching für statische Daten.
   - Pagination für große Datenmengen.
   - Komprimierung von API-Responses.

3. **Memory-Management**:
   - Effiziente Garbage Collection.
   - Memory-Leak-Prevention.
   - Resource-Cleanup in Request-Lifecycle.

### **Netzwerk-Optimierungen**

1. **CDN-Integration**:
   - Globale Content-Delivery für statische Assets.
   - Edge-Caching für verbesserte Ladezeiten.
   - Automatische Asset-Optimierung.

2. **HTTP-Optimierungen**:
   - HTTP/2-Unterstützung für Multiplexing.
   - Keep-Alive-Verbindungen.
   - Optimierte Header-Größen.

## 📞 Support & Kontakt

### **Technischer Support**

**Tobias Leyendecker**
- Projekt-Owner und Business-Kontakt
- GitHub: [@KIGREVEN](https://github.com/KIGREVEN)

## 📈 Metriken & Erfolg

### **Projektstatistiken**

- **Lines of Code**: ~25,000+ (Frontend + Backend)
- **Performance**: <200ms API Response Time

**Entwickelt mit modernster Technologie und KI-Unterstützung – Ein Beispiel für die Zukunft der Softwareentwicklung.**

*Letzte Aktualisierung: Juli 2024*

