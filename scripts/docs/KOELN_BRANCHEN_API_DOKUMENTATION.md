# 🚀 Köln Branchen API - Komplette Dokumentation

## 📋 Übersicht

Das Köln Branchen API-System verwaltet Buchungen für 6 anonyme Plätze pro Belegung/Zeitraum. Die API bietet vollständige CRUD-Operationen für Buchungen, Verfügbarkeitsprüfung und Benutzerverwaltung.

**Base URL**: `http://192.168.116.42:3001`

---

## 🔐 Authentifizierung

### Login
Erhalten Sie einen JWT-Token für API-Zugriff.

**Endpunkt**: `POST /api/auth/login`

**Request Body**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Anmeldung erfolgreich",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "created_at": "2025-08-06T11:22:13.015Z",
    "updated_at": "2025-08-06T11:22:13.015Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Verfügbare Benutzer**:
- **Admin**: `admin` / `admin123` (Vollzugriff)
- **Viewer**: `viewer` / `viewer123` (Nur Verfügbarkeitsprüfung)

### Benutzerprofil abrufen
**Endpunkt**: `GET /api/auth/profile`
**Authorization**: Bearer Token erforderlich

---

## 📅 Buchungen verwalten

### Alle Buchungen abrufen
**Endpunkt**: `GET /api/bookings`
**Authorization**: Bearer Token erforderlich

**Query Parameter** (optional):
- `search`: Suche in Kundenname/Kundennummer
- `belegung`: Filter nach Belegung
- `berater`: Filter nach Berater
- `status`: Filter nach Status
- `zeitraum_von`: Startdatum (YYYY-MM-DD)
- `zeitraum_bis`: Enddatum (YYYY-MM-DD)

**Beispiel**:
```
GET /api/bookings?belegung=Reisebüro&status=gebucht
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "kundenname": "Max Mustermann",
      "kundennummer": "K001",
      "belegung": "Reisebüro",
      "zeitraum_von": "2025-08-01T00:00:00.000Z",
      "zeitraum_bis": "2025-08-31T00:00:00.000Z",
      "platzierung": 1,
      "status": "gebucht",
      "berater": "Schmidt",
      "verkaufspreis": 1500.00,
      "created_at": "2025-08-06T10:00:00.000Z"
    }
  ]
}
```

### Einzelne Buchung abrufen
**Endpunkt**: `GET /api/bookings/:id`
**Authorization**: Bearer Token erforderlich

**Beispiel**: `GET /api/bookings/1`

### Neue Buchung erstellen
**Endpunkt**: `POST /api/bookings`
**Authorization**: Bearer Token erforderlich

**Request Body**:
```json
{
  "kundenname": "Max Mustermann",
  "kundennummer": "K001",
  "belegung": "Reisebüro",
  "zeitraum_von": "2025-08-01",
  "zeitraum_bis": "2025-08-31",
  "status": "gebucht",
  "berater": "Schmidt",
  "verkaufspreis": 1500.00
}
```

**Wichtige Hinweise**:
- **Platzierung wird automatisch vergeben** (nicht angeben!)
- **Für Abo-Buchungen**: `zeitraum_bis` leer lassen oder weglassen
- **Status**: `vorreserviert`, `reserviert`, `gebucht`
- **Verkaufspreis**: Optional, kann null sein

**Response**:
```json
{
  "success": true,
  "message": "Buchung erfolgreich erstellt",
  "data": {
    "id": 2,
    "kundenname": "Max Mustermann",
    "kundennummer": "K001",
    "belegung": "Reisebüro",
    "zeitraum_von": "2025-08-01T00:00:00.000Z",
    "zeitraum_bis": "2025-08-31T00:00:00.000Z",
    "platzierung": 2,
    "status": "gebucht",
    "berater": "Schmidt",
    "verkaufspreis": 1500.00,
    "created_at": "2025-08-06T12:00:00.000Z"
  }
}
```

### Buchung aktualisieren
**Endpunkt**: `PUT /api/bookings/:id`
**Authorization**: Bearer Token erforderlich

**Request Body**: Gleich wie bei POST, aber alle Felder optional

**Beispiel**: `PUT /api/bookings/1`
```json
{
  "status": "gebucht",
  "verkaufspreis": 1800.00
}
```

### Buchung löschen
**Endpunkt**: `DELETE /api/bookings/:id`
**Authorization**: Bearer Token erforderlich

**Beispiel**: `DELETE /api/bookings/1`

**Response**:
```json
{
  "success": true,
  "message": "Buchung erfolgreich gelöscht"
}
```

---

## 🔍 Verfügbarkeitsprüfung

### Verfügbare Plätze prüfen
**Endpunkt**: `GET /api/availability/check`
**Authorization**: Bearer Token erforderlich

**Query Parameter** (alle erforderlich):
- `belegung`: Belegungstyp (z.B. "Reisebüro")
- `zeitraum_von`: Startdatum (YYYY-MM-DD)
- `zeitraum_bis`: Enddatum (YYYY-MM-DD)

**Beispiel**:
```
GET /api/availability/check?belegung=Reisebüro&zeitraum_von=2025-08-01&zeitraum_bis=2025-08-31
```

**Response**:
```json
{
  "success": true,
  "data": {
    "belegung": "Reisebüro",
    "zeitraum_von": "2025-08-01",
    "zeitraum_bis": "2025-08-31",
    "total_places": 6,
    "available_places": 4,
    "occupied_places": 2,
    "is_available": true,
    "message": "4 von 6 Plätzen verfügbar"
  }
}
```

**Verfügbarkeitsstatus**:
- `is_available: true`: Mindestens 1 Platz frei
- `is_available: false`: Alle 6 Plätze belegt

---

## 📂 Kategorien verwalten

### Alle Belegungskategorien abrufen
**Endpunkt**: `GET /api/categories`
**Authorization**: Bearer Token erforderlich

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Reisebüro",
      "created_at": "2025-08-06T10:00:00.000Z"
    },
    {
      "id": 2,
      "name": "Versicherung",
      "created_at": "2025-08-06T10:00:00.000Z"
    }
  ]
}
```

---

## 📊 System & Administration

### Datenbank-Status prüfen
**Endpunkt**: `GET /api/db-status`
**Authorization**: Bearer Token erforderlich

**Response**:
```json
{
  "success": true,
  "message": "Datenbankverbindung erfolgreich",
  "timestamp": "2025-08-06T12:00:00.000Z"
}
```

### Datenbank-Migration ausführen
**Endpunkt**: `POST /api/admin/migrate`
**Authorization**: Bearer Token erforderlich (nur Admin)

**Response**:
```json
{
  "success": true,
  "message": "Database migration completed successfully"
}
```

### Beispieldaten hinzufügen
**Endpunkt**: `POST /api/admin/seed`
**Authorization**: Bearer Token erforderlich (nur Admin)

**Response**:
```json
{
  "success": true,
  "message": "Sample data seeded successfully"
}
```

---

## 🎯 Postman Collection Setup

### 1. Environment erstellen
**Name**: `Köln Branchen Local`
**Variables**:
- `base_url`: `http://192.168.116.42:3001`
- `jwt_token`: (wird automatisch gesetzt)

### 2. Collection Authorization
- **Type**: Bearer Token
- **Token**: `{{jwt_token}}`

### 3. Login-Request mit Auto-Token
**Tests Script** für Login-Request:
```javascript
pm.test("Login successful", function () {
    pm.response.to.have.status(200);
    
    var jsonData = pm.response.json();
    if (jsonData.success && jsonData.data && jsonData.data.token) {
        pm.environment.set("jwt_token", jsonData.data.token);
        console.log("JWT Token automatisch gespeichert!");
    } else if (jsonData.success && jsonData.token) {
        pm.environment.set("jwt_token", jsonData.token);
        console.log("JWT Token automatisch gespeichert!");
    }
});
```

---

## 🔧 Häufige Anwendungsfälle

### 1. Kompletter Buchungsworkflow
```bash
# 1. Login
POST /api/auth/login

# 2. Verfügbarkeit prüfen
GET /api/availability/check?belegung=Reisebüro&zeitraum_von=2025-08-01&zeitraum_bis=2025-08-31

# 3. Buchung erstellen (wenn verfügbar)
POST /api/bookings

# 4. Alle Buchungen anzeigen
GET /api/bookings
```

### 2. Kundendaten analysieren
```bash
# Alle Buchungen eines Kunden
GET /api/bookings?search=Max Mustermann

# Buchungen nach Berater
GET /api/bookings?berater=Schmidt

# Buchungen nach Status
GET /api/bookings?status=gebucht
```

### 3. Verfügbarkeitsanalyse
```bash
# Verschiedene Zeiträume prüfen
GET /api/availability/check?belegung=Reisebüro&zeitraum_von=2025-08-01&zeitraum_bis=2025-08-31
GET /api/availability/check?belegung=Versicherung&zeitraum_von=2025-09-01&zeitraum_bis=2025-09-30

# Alle Kategorien abrufen
GET /api/categories
```

---

## ⚠️ Wichtige Hinweise

### Anonyme Platzierungen
- **Keine spezifischen Plätze wählbar**: System vergibt automatisch Plätze 1-6
- **Nur Verfügbarkeitszählung**: "X von 6 Plätzen verfügbar"
- **Platzierung nicht in Request**: Wird automatisch vom Backend vergeben

### Abo-Buchungen
- **Enddatum weglassen**: Für unbefristete Buchungen
- **Automatisch 31.12.2099**: System setzt intern Enddatum auf 2099
- **Frontend-Anzeige**: "🔄 Abo (unbefristet)"

### Datumsformate
- **API Input**: YYYY-MM-DD (ISO-Format)
- **Frontend Display**: TT.MM.JJJJ (deutsches Format)
- **Zeitzone**: UTC in Datenbank

### Berechtigungen
- **Admin**: Vollzugriff auf alle Endpunkte
- **Viewer**: Nur Verfügbarkeitsprüfung und eigenes Profil
- **Token-Gültigkeit**: 24 Stunden

---

## 🚨 Fehlercodes

### Authentifizierung
- `401 Unauthorized`: Token fehlt oder ungültig
- `403 Forbidden`: Keine Berechtigung für diese Aktion

### Buchungen
- `400 Bad Request`: Ungültige Eingabedaten
- `404 Not Found`: Buchung nicht gefunden
- `409 Conflict`: Keine Plätze verfügbar

### Allgemein
- `500 Internal Server Error`: Server-/Datenbankfehler

---

## 📞 Support & Troubleshooting

### Häufige Probleme
1. **"Token expired"**: Neuen Login durchführen
2. **"Keine Plätze verfügbar"**: Verfügbarkeit mit `/availability/check` prüfen
3. **"Ungültige Anmeldedaten"**: Username/Passwort überprüfen

### Logs überprüfen
```bash
# Backend-Logs anzeigen
pm2 logs koeln-branchen-backend

# Datenbank-Status prüfen
psql -U adtle -d koeln_branchen_db -h localhost -c "SELECT COUNT(*) FROM bookings;"
```

---

**🎉 Diese API-Dokumentation deckt alle verfügbaren Funktionen des Köln Branchen Systems ab!**



---

## 👥 Benutzerverwaltung (Admin-only)

### Alle Benutzer abrufen
**Endpunkt**: `GET /api/auth/users`
**Authorization**: Bearer Token erforderlich (nur Admin)

**Response**:
```json
{
  "success": true,
  "users": [
    {
      "id": 1,
      "username": "admin",
      "role": "admin",
      "created_at": "2025-08-06T11:22:13.015Z",
      "updated_at": "2025-08-06T11:22:13.015Z"
    },
    {
      "id": 2,
      "username": "viewer",
      "role": "viewer",
      "created_at": "2025-08-06T11:22:13.015Z",
      "updated_at": "2025-08-06T11:22:13.015Z"
    }
  ],
  "count": 2
}
```

### Neuen Benutzer erstellen
**Endpunkt**: `POST /api/auth/users`
**Authorization**: Bearer Token erforderlich (nur Admin)

**Request Body**:
```json
{
  "username": "neuer_benutzer",
  "password": "sicheres_passwort123",
  "role": "viewer"
}
```

**Parameter**:
- `username`: Eindeutiger Benutzername (erforderlich)
- `password`: Passwort (erforderlich, min. 6 Zeichen)
- `role`: Benutzerrolle (optional, Standard: "viewer")
  - `"admin"`: Vollzugriff auf alle Funktionen
  - `"viewer"`: Nur Verfügbarkeitsprüfung

**Response**:
```json
{
  "success": true,
  "message": "Benutzer erfolgreich erstellt",
  "user": {
    "id": 3,
    "username": "neuer_benutzer",
    "role": "viewer",
    "created_at": "2025-08-06T13:00:00.000Z",
    "updated_at": "2025-08-06T13:00:00.000Z"
  }
}
```

**Fehlercodes**:
- `400 Bad Request`: Username/Passwort fehlt oder ungültige Rolle
- `409 Conflict`: Username bereits vergeben
- `403 Forbidden`: Keine Admin-Berechtigung

### Benutzer-Rolle ändern
**Endpunkt**: `PUT /api/auth/users/:id/role`
**Authorization**: Bearer Token erforderlich (nur Admin)

**Request Body**:
```json
{
  "role": "admin"
}
```

**Beispiel**: `PUT /api/auth/users/3/role`

**Response**:
```json
{
  "success": true,
  "message": "Benutzer-Rolle erfolgreich aktualisiert",
  "user": {
    "id": 3,
    "username": "neuer_benutzer",
    "role": "admin",
    "created_at": "2025-08-06T13:00:00.000Z",
    "updated_at": "2025-08-06T13:05:00.000Z"
  }
}
```

**Sicherheitshinweise**:
- Admins können ihre eigene Rolle nicht degradieren
- Verhindert versehentlichen Verlust von Admin-Rechten

### Benutzer löschen
**Endpunkt**: `DELETE /api/auth/users/:id`
**Authorization**: Bearer Token erforderlich (nur Admin)

**Beispiel**: `DELETE /api/auth/users/3`

**Response**:
```json
{
  "success": true,
  "message": "Benutzer erfolgreich gelöscht"
}
```

**Sicherheitshinweise**:
- Admins können sich nicht selbst löschen
- Verhindert versehentliche Sperrung des Systems

### Eigenes Passwort ändern
**Endpunkt**: `PUT /api/auth/password`
**Authorization**: Bearer Token erforderlich

**Request Body**:
```json
{
  "currentPassword": "altes_passwort123",
  "newPassword": "neues_passwort456"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Passwort erfolgreich geändert"
}
```

**Validierung**:
- Aktuelles Passwort muss korrekt sein
- Neues Passwort mindestens 6 Zeichen
- Sichere bcrypt-Verschlüsselung

---

## 🔐 Erweiterte Authentifizierung

### Aktueller Benutzer
**Endpunkt**: `GET /api/auth/me`
**Authorization**: Bearer Token erforderlich

**Response**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin",
    "created_at": "2025-08-06T11:22:13.015Z",
    "updated_at": "2025-08-06T11:22:13.015Z"
  }
}
```

### Token validieren
**Endpunkt**: `POST /api/auth/validate`
**Authorization**: Bearer Token erforderlich

**Response**:
```json
{
  "success": true,
  "message": "Token ist gültig",
  "user": {
    "id": 1,
    "username": "admin",
    "role": "admin"
  }
}
```

### Logout
**Endpunkt**: `POST /api/auth/logout`

**Response**:
```json
{
  "success": true,
  "message": "Abmeldung erfolgreich"
}
```

---

## 🎯 Benutzerverwaltungs-Workflows

### 1. Neuen Mitarbeiter hinzufügen
```bash
# 1. Als Admin anmelden
POST /api/auth/login

# 2. Neuen Benutzer erstellen
POST /api/auth/users
Body: {"username": "mueller", "password": "temp123", "role": "viewer"}

# 3. Alle Benutzer überprüfen
GET /api/auth/users

# 4. Bei Bedarf Rolle upgraden
PUT /api/auth/users/3/role
Body: {"role": "admin"}
```

### 2. Benutzer-Audit durchführen
```bash
# Alle Benutzer anzeigen
GET /api/auth/users

# Inaktive Benutzer entfernen
DELETE /api/auth/users/5

# Rollen überprüfen und anpassen
PUT /api/auth/users/4/role
```

### 3. Passwort-Management
```bash
# Eigenes Passwort ändern
PUT /api/auth/password
Body: {"currentPassword": "alt", "newPassword": "neu"}

# Bei vergessenen Passwörtern: Neuen Benutzer erstellen und alten löschen
POST /api/auth/users
DELETE /api/auth/users/old_id
```

---

## ⚠️ Sicherheitsrichtlinien

### Berechtigungen
- **Nur Admins** können Benutzer verwalten
- **Selbstschutz**: Admins können sich nicht selbst löschen/degradieren
- **Passwort-Sicherheit**: Mindestens 6 Zeichen, bcrypt-Verschlüsselung

### Best Practices
- **Starke Passwörter**: Mindestens 8 Zeichen mit Zahlen/Sonderzeichen
- **Regelmäßige Audits**: Inaktive Benutzer entfernen
- **Prinzip der minimalen Berechtigung**: Nur nötige Admin-Rechte vergeben
- **Token-Rotation**: Bei Sicherheitsvorfällen alle Benutzer neu anmelden lassen

---

## 📊 Postman-Beispiele für Benutzerverwaltung

### Collection-Setup erweitern
**Neue Requests hinzufügen**:

1. **GET All Users**
   - URL: `{{base_url}}/api/auth/users`
   - Authorization: Bearer `{{jwt_token}}`

2. **POST Create User**
   - URL: `{{base_url}}/api/auth/users`
   - Body: `{"username": "test_user", "password": "test123", "role": "viewer"}`

3. **PUT Change Role**
   - URL: `{{base_url}}/api/auth/users/{{user_id}}/role`
   - Body: `{"role": "admin"}`

4. **DELETE User**
   - URL: `{{base_url}}/api/auth/users/{{user_id}}`

5. **PUT Change Password**
   - URL: `{{base_url}}/api/auth/password`
   - Body: `{"currentPassword": "old", "newPassword": "new"}`

### Environment-Variablen erweitern
- `user_id`: ID des zu bearbeitenden Benutzers
- `new_username`: Für Benutzererstellung
- `new_password`: Für Passwort-Tests

**🎉 Die Benutzerverwaltung ist vollständig über die API verfügbar und einsatzbereit!**

