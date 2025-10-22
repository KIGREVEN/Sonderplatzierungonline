# API-Dokumentation - Köln Branchen Portal

Diese Dokumentation beschreibt alle verfügbaren API-Endpoints des Köln Branchen Portal Buchungsverwaltungssystems.

## 🌐 Basis-Informationen

### Basis-URL
```
https://your-api-service.onrender.com/api
```

### Content-Type
Alle Requests und Responses verwenden `application/json`.

### Rate Limiting
- **Limit**: 100 Requests pro 15 Minuten pro IP-Adresse
- **Headers**: Rate-Limit-Informationen werden in Response-Headers zurückgegeben

### Fehlerbehandlung
Alle API-Responses folgen einem einheitlichen Format:

**Erfolgreiche Antwort:**
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

**Fehlerantwort:**
```json
{
  "success": false,
  "error": "Error Type",
  "message": "Detailed error message",
  "details": [ ... ]
}
```

### HTTP-Status-Codes
- `200` - OK (Erfolgreiche GET/PUT-Requests)
- `201` - Created (Erfolgreiche POST-Requests)
- `400` - Bad Request (Validierungsfehler)
- `404` - Not Found (Ressource nicht gefunden)
- `409` - Conflict (Buchungskonflikt)
- `429` - Too Many Requests (Rate Limit überschritten)
- `500` - Internal Server Error (Serverfehler)

## 📊 Health Check

### GET /health

Überprüft den Status des API-Services.

**Request:**
```http
GET /health
```

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-06-27T10:30:00.000Z",
  "service": "Köln Branchen Portal API"
}
```

## 🗂️ Branchen (Categories)

### GET /api/categories

Liefert alle verfügbaren Branchen. Optional kann mit dem Query-Parameter `search` nach einem Teilstring gefiltert werden.

**Request:**
```http
GET /api/categories?search=kanal
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "id": 1, "name": "Kanalreinigung" }
  ]
}
```

## 📅 Buchungen (Bookings)

### GET /api/bookings

Ruft alle Buchungen ab, optional mit Filtern.

**Request:**
```http
GET /api/bookings?belegung=Gastronomie&status=gebucht&platzierung=1
```

**Query Parameter:**
| Parameter | Typ | Beschreibung |
|-----------|-----|--------------|
| `belegung` | string | Filter nach Branche (Teilstring-Suche) |
| `berater` | string | Filter nach Berater (Teilstring-Suche) |
| `status` | string | Filter nach Status (`frei`, `reserviert`, `gebucht`) |
| `platzierung` | integer | Filter nach Platzierung (1-6) |
| `zeitraum_von` | datetime | Filter: Buchungen die nach diesem Datum enden |
| `zeitraum_bis` | datetime | Filter: Buchungen die vor diesem Datum beginnen |

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "kundenname": "Max Mustermann",
      "kundennummer": "K-001",
      "belegung": "Gastronomie",
      "zeitraum_von": "2024-07-01T09:00:00.000Z",
      "zeitraum_bis": "2024-07-01T17:00:00.000Z",
      "platzierung": 1,
      "status": "gebucht",
      "berater": "Anna Schmidt",
      "created_at": "2024-06-27T10:00:00.000Z",
      "updated_at": "2024-06-27T10:00:00.000Z"
    }
  ],
  "count": 1,
  "filters": {
    "belegung": "Gastronomie",
    "status": "gebucht",
    "platzierung": 1
  }
}
```

### GET /api/bookings/:id

Ruft eine spezifische Buchung anhand der ID ab.

**Request:**
```http
GET /api/bookings/1
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "kundenname": "Max Mustermann",
    "kundennummer": "K-001",
    "belegung": "Gastronomie",
    "zeitraum_von": "2024-07-01T09:00:00.000Z",
    "zeitraum_bis": "2024-07-01T17:00:00.000Z",
    "platzierung": 1,
    "status": "gebucht",
    "berater": "Anna Schmidt",
    "created_at": "2024-06-27T10:00:00.000Z",
    "updated_at": "2024-06-27T10:00:00.000Z"
  }
}
```

**Fehler (404):**
```json
{
  "success": false,
  "error": "Booking not found"
}
```

### POST /api/bookings

Erstellt eine neue Buchung.

**Request:**
```http
POST /api/bookings
Content-Type: application/json

{
  "kundenname": "Erika Musterfrau",
  "kundennummer": "K-002",
  "belegung": "Einzelhandel",
  "zeitraum_von": "2024-07-02T10:00:00.000Z",
  "zeitraum_bis": "2024-07-02T18:00:00.000Z",
  "platzierung": 2,
  "status": "reserviert",
  "berater": "Thomas Müller"
}
```

**Validierungsregeln:**
- `kundenname`: 2-100 Zeichen, erforderlich
- `kundennummer`: 1-50 Zeichen, erforderlich
- `belegung`: 2-100 Zeichen, erforderlich
- `zeitraum_von`: ISO 8601 Datum, erforderlich
- `zeitraum_bis`: ISO 8601 Datum, muss nach `zeitraum_von` liegen, erforderlich
- `platzierung`: Integer 1-6, erforderlich
- `status`: `frei`, `reserviert`, oder `gebucht`, Standard: `reserviert`
- `berater`: 2-100 Zeichen, erforderlich

**Response (201):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "id": 2,
    "kundenname": "Erika Musterfrau",
    "kundennummer": "K-002",
    "belegung": "Einzelhandel",
    "zeitraum_von": "2024-07-02T10:00:00.000Z",
    "zeitraum_bis": "2024-07-02T18:00:00.000Z",
    "platzierung": 2,
    "status": "reserviert",
    "berater": "Thomas Müller",
    "created_at": "2024-06-27T10:30:00.000Z",
    "updated_at": "2024-06-27T10:30:00.000Z"
  }
}
```

**Validierungsfehler (400):**
```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "field": "kundenname",
      "message": "Kundenname ist erforderlich"
    },
    {
      "field": "zeitraum_bis",
      "message": "Zeitraum bis muss nach dem Startdatum liegen"
    }
  ]
}
```

**Buchungskonflikt (409):**
```json
{
  "success": false,
  "error": "Booking Conflict",
  "message": "Ein Termin für diese Belegung, Platzierung und Zeitraum ist bereits vorhanden.",
  "conflicts": [
    {
      "id": 1,
      "kundenname": "Max Mustermann",
      "status": "gebucht",
      "zeitraum_von": "2024-07-02T09:00:00.000Z",
      "zeitraum_bis": "2024-07-02T17:00:00.000Z"
    }
  ]
}
```

### PUT /api/bookings/:id

Aktualisiert eine bestehende Buchung.

**Request:**
```http
PUT /api/bookings/2
Content-Type: application/json

{
  "status": "gebucht",
  "berater": "Lisa Wagner"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Booking updated successfully",
  "data": {
    "id": 2,
    "kundenname": "Erika Musterfrau",
    "kundennummer": "K-002",
    "belegung": "Einzelhandel",
    "zeitraum_von": "2024-07-02T10:00:00.000Z",
    "zeitraum_bis": "2024-07-02T18:00:00.000Z",
    "platzierung": 2,
    "status": "gebucht",
    "berater": "Lisa Wagner",
    "created_at": "2024-06-27T10:30:00.000Z",
    "updated_at": "2024-06-27T11:00:00.000Z"
  }
}
```

### DELETE /api/bookings/:id

Löscht eine Buchung.

**Request:**
```http
DELETE /api/bookings/2
```

**Response (200):**
```json
{
  "success": true,
  "message": "Booking deleted successfully",
  "data": {
    "id": 2,
    "kundenname": "Erika Musterfrau",
    // ... weitere Felder der gelöschten Buchung
  }
}
```

### POST /api/bookings/cleanup

Bereinigt abgelaufene Reservierungen (älter als 30 Minuten).

**Request:**
```http
POST /api/bookings/cleanup
```

**Response:**
```json
{
  "success": true,
  "message": "2 expired reservations cleaned up",
  "data": [
    {
      "id": 3,
      "kundenname": "Hans Weber",
      "status": "frei",
      // ... weitere Felder
    }
  ]
}
```

## 🔍 Verfügbarkeit (Availability)

### GET /api/availability/check

Prüft die Verfügbarkeit für spezifische Kriterien.

**Request:**
```http
GET /api/availability/check?belegung=Gastronomie&platzierung=1&zeitraum_von=2024-07-03T09:00:00.000Z&zeitraum_bis=2024-07-03T17:00:00.000Z
```

**Query Parameter (alle erforderlich):**
| Parameter | Typ | Beschreibung |
|-----------|-----|--------------|
| `belegung` | string | Branche/Kategorie |
| `platzierung` | integer | Platzierung (1-6) |
| `zeitraum_von` | datetime | Startdatum (ISO 8601) |
| `zeitraum_bis` | datetime | Enddatum (ISO 8601) |

**Response (verfügbar):**
```json
{
  "success": true,
  "data": {
    "belegung": "Gastronomie",
    "platzierung": 1,
    "zeitraum_von": "2024-07-03T09:00:00.000Z",
    "zeitraum_bis": "2024-07-03T17:00:00.000Z",
    "available": true,
    "conflicts": [],
    "status": "frei"
  }
}
```

**Response (nicht verfügbar):**
```json
{
  "success": true,
  "data": {
    "belegung": "Gastronomie",
    "platzierung": 1,
    "zeitraum_von": "2024-07-01T09:00:00.000Z",
    "zeitraum_bis": "2024-07-01T17:00:00.000Z",
    "available": false,
    "conflicts": [
      {
        "id": 1,
        "kundenname": "Max Mustermann",
        "status": "gebucht",
        "zeitraum_von": "2024-07-01T09:00:00.000Z",
        "zeitraum_bis": "2024-07-01T17:00:00.000Z"
      }
    ],
    "status": "belegt"
  }
}
```

### GET /api/availability/overview

Erstellt eine Verfügbarkeitsübersicht für einen Zeitraum.

**Request:**
```http
GET /api/availability/overview?zeitraum_von=2024-07-01T00:00:00.000Z&zeitraum_bis=2024-07-07T23:59:59.000Z&belegung=Gastronomie&platzierung_min=1&platzierung_max=3
```

**Query Parameter:**
| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|--------------|--------------|
| `zeitraum_von` | datetime | Ja | Startdatum (ISO 8601) |
| `zeitraum_bis` | datetime | Ja | Enddatum (ISO 8601) |
| `belegung` | string | Nein | Spezifische Branche (leer = alle) |
| `platzierung_min` | integer | Nein | Min. Platzierung (Standard: 1) |
| `platzierung_max` | integer | Nein | Max. Platzierung (Standard: 6) |

**Response:**
```json
{
  "success": true,
  "data": {
    "zeitraum_von": "2024-07-01T00:00:00.000Z",
    "zeitraum_bis": "2024-07-07T23:59:59.000Z",
    "belegung": "Gastronomie",
    "platzierung_range": "1-3",
    "overview": [
      {
        "platzierung": 1,
        "belegung": "Gastronomie",
        "available": false,
        "conflicts": [
          {
            "id": 1,
            "kundenname": "Max Mustermann",
            "status": "gebucht",
            "zeitraum_von": "2024-07-01T09:00:00.000Z",
            "zeitraum_bis": "2024-07-01T17:00:00.000Z"
          }
        ],
        "status": "belegt"
      },
      {
        "platzierung": 2,
        "belegung": "Gastronomie",
        "available": true,
        "conflicts": [],
        "status": "frei"
      },
      {
        "platzierung": 3,
        "belegung": "Gastronomie",
        "available": true,
        "conflicts": [],
        "status": "frei"
      }
    ]
  }
}
```

### GET /api/availability/calendar

Erstellt eine Kalenderansicht der Buchungen.

**Request:**
```http
GET /api/availability/calendar?start_date=2024-07-01&end_date=2024-07-07&belegung=Gastronomie
```

**Query Parameter:**
| Parameter | Typ | Erforderlich | Beschreibung |
|-----------|-----|--------------|--------------|
| `start_date` | date | Ja | Startdatum (YYYY-MM-DD) |
| `end_date` | date | Ja | Enddatum (YYYY-MM-DD) |
| `belegung` | string | Nein | Filter nach Branche |
| `platzierung` | integer | Nein | Filter nach Platzierung |

**Response:**
```json
{
  "success": true,
  "data": {
    "start_date": "2024-07-01",
    "end_date": "2024-07-07",
    "filters": {
      "belegung": "Gastronomie"
    },
    "calendar": {
      "2024-07-01": {
        "1": [
          {
            "id": 1,
            "kundenname": "Max Mustermann",
            "belegung": "Gastronomie",
            "status": "gebucht",
            "berater": "Anna Schmidt",
            "zeitraum_von": "2024-07-01T09:00:00.000Z",
            "zeitraum_bis": "2024-07-01T17:00:00.000Z"
          }
        ]
      },
      "2024-07-02": {
        "2": [
          {
            "id": 2,
            "kundenname": "Erika Musterfrau",
            "belegung": "Gastronomie",
            "status": "reserviert",
            "berater": "Thomas Müller",
            "zeitraum_von": "2024-07-02T10:00:00.000Z",
            "zeitraum_bis": "2024-07-02T18:00:00.000Z"
          }
        ]
      }
    },
    "total_bookings": 2
  }
}
```

## 🔧 Beispiel-Workflows

### 1. Neue Buchung erstellen

```javascript
// 1. Verfügbarkeit prüfen
const availabilityResponse = await fetch('/api/availability/check?' + new URLSearchParams({
  belegung: 'Gastronomie',
  platzierung: '1',
  zeitraum_von: '2024-07-03T09:00:00.000Z',
  zeitraum_bis: '2024-07-03T17:00:00.000Z'
}));

const availability = await availabilityResponse.json();

if (availability.data.available) {
  // 2. Buchung erstellen
  const bookingResponse = await fetch('/api/bookings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      kundenname: 'Neuer Kunde',
      kundennummer: 'K-003',
      belegung: 'Gastronomie',
      zeitraum_von: '2024-07-03T09:00:00.000Z',
      zeitraum_bis: '2024-07-03T17:00:00.000Z',
      platzierung: 1,
      status: 'reserviert',
      berater: 'Anna Schmidt'
    })
  });
  
  const booking = await bookingResponse.json();
  console.log('Buchung erstellt:', booking.data);
} else {
  console.log('Zeitslot nicht verfügbar:', availability.data.conflicts);
}
```

### 2. Buchungsübersicht mit Filtern

```javascript
// Alle Buchungen für einen bestimmten Berater abrufen
const response = await fetch('/api/bookings?' + new URLSearchParams({
  berater: 'Anna Schmidt',
  status: 'gebucht'
}));

const bookings = await response.json();
console.log(`${bookings.count} Buchungen gefunden:`, bookings.data);
```

### 3. Verfügbarkeitsübersicht

```javascript
// Übersicht für alle Plätze in der nächsten Woche
const overview = await fetch('/api/availability/overview?' + new URLSearchParams({
  zeitraum_von: '2024-07-01T00:00:00.000Z',
  zeitraum_bis: '2024-07-07T23:59:59.000Z'
}));

const data = await overview.json();
data.data.overview.forEach(slot => {
  console.log(`Platz ${slot.platzierung}: ${slot.status}`);
});
```

## 🚨 Fehlerbehandlung

### Häufige Fehler

**400 - Validierungsfehler:**
```json
{
  "success": false,
  "error": "Validation Error",
  "details": [
    {
      "field": "platzierung",
      "message": "Platzierung muss zwischen 1 und 6 liegen"
    }
  ]
}
```

**409 - Buchungskonflikt:**
```json
{
  "success": false,
  "error": "Booking Conflict",
  "message": "Ein Termin für diese Belegung, Platzierung und Zeitraum ist bereits vorhanden.",
  "conflicts": [...]
}
```

**429 - Rate Limit:**
```json
{
  "error": "Too many requests from this IP, please try again later."
}
```

### Empfohlene Fehlerbehandlung

```javascript
async function createBooking(bookingData) {
  try {
    const response = await fetch('/api/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      if (response.status === 409) {
        // Buchungskonflikt behandeln
        throw new Error(`Konflikt: ${data.message}`);
      } else if (response.status === 400) {
        // Validierungsfehler behandeln
        const errors = data.details.map(d => d.message).join(', ');
        throw new Error(`Validierung fehlgeschlagen: ${errors}`);
      } else {
        throw new Error(data.message || 'Unbekannter Fehler');
      }
    }
    
    return data.data;
  } catch (error) {
    console.error('Buchung fehlgeschlagen:', error.message);
    throw error;
  }
}
```

## 📝 Changelog

### Version 1.0.0
- Initiale API-Version
- Vollständige CRUD-Operationen für Buchungen
- Verfügbarkeitsprüfung und Konfliktverhinderung
- Kalender- und Übersichts-Endpoints
- Rate Limiting und Sicherheitsfeatures

---

**Für weitere Fragen zur API kontaktieren Sie das Entwicklungsteam oder erstellen Sie ein GitHub Issue.**

