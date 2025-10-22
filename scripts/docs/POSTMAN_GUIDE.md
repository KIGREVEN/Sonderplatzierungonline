# 📮 Postman Setup für Köln Branchen API

## 🚀 Schritt-für-Schritt Anleitung

### 1. Neue Collection erstellen

1. **Postman öffnen**
2. **"New" klicken** → "Collection"
3. **Name**: `Köln Branchen API`
4. **Description**: `API für Buchungsverwaltung`
5. **Create** klicken

### 2. Environment einrichten (empfohlen)

1. **Environments** (links) → **"+"** klicken
2. **Environment Name**: `Köln Branchen Local`
3. **Variables hinzufügen**:

| Variable | Initial Value | Current Value |
|----------|---------------|---------------|
| `base_url` | `http://localhost:3001` | `http://localhost:3001` |
| `jwt_token` | | (leer lassen) |

4. **Save** klicken
5. **Environment aktivieren** (Dropdown oben rechts)

---

## 🔐 3. Login-Request einrichten (WICHTIG ZUERST!)

### Request erstellen:
1. **Collection** → **Add Request**
2. **Name**: `Login - Admin`
3. **Method**: `POST`
4. **URL**: `{{base_url}}/api/auth/login`

### Headers:
```
Content-Type: application/json
```

### Body (raw, JSON):
```json
{
  "username": "admin",
  "password": "admin123"
}
```

### Tests (automatische Token-Extraktion):
```javascript
// Test hinzufügen im "Tests" Tab
pm.test("Login successful", function () {
    pm.response.to.have.status(200);
    
    var jsonData = pm.response.json();
    if (jsonData.success && jsonData.data.token) {
        // Token automatisch in Environment speichern
        pm.environment.set("jwt_token", jsonData.data.token);
        console.log("JWT Token gespeichert:", jsonData.data.token);
    }
});
```

### 4. Login testen:
1. **Send** klicken
2. **Response prüfen**: Status 200, Token in Response
3. **Environment prüfen**: `jwt_token` sollte jetzt gefüllt sein

---

## 📋 5. Weitere Requests einrichten

### A) Alle Buchungen abrufen

**Request Details:**
- **Name**: `Get All Bookings`
- **Method**: `GET`
- **URL**: `{{base_url}}/api/bookings`

**Authorization:**
- **Type**: `Bearer Token`
- **Token**: `{{jwt_token}}`

**Oder Headers:**
```
Authorization: Bearer {{jwt_token}}
```

### B) Verfügbarkeit prüfen

**Request Details:**
- **Name**: `Check Availability`
- **Method**: `GET`
- **URL**: `{{base_url}}/api/availability/check`

**Params (Query Parameters):**
| Key | Value |
|-----|-------|
| `belegung` | `Reisebüro` |
| `zeitraum_von` | `2025-08-01` |
| `zeitraum_bis` | `2025-08-31` |

**Authorization:**
```
Bearer Token: {{jwt_token}}
```

### C) Neue Buchung erstellen

**Request Details:**
- **Name**: `Create Booking`
- **Method**: `POST`
- **URL**: `{{base_url}}/api/bookings`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {{jwt_token}}
```

**Body (raw, JSON):**
```json
{
  "kundenname": "Postman Test",
  "kundennummer": "PM001",
  "belegung": "Reisebüro",
  "zeitraum_von": "2025-08-01",
  "zeitraum_bis": "2025-08-31",
  "status": "gebucht",
  "berater": "Postman",
  "verkaufspreis": 1500.00
}
```

### D) Abo-Buchung erstellen

**Request Details:**
- **Name**: `Create Abo Booking`
- **Method**: `POST`
- **URL**: `{{base_url}}/api/bookings`

**Body (raw, JSON):**
```json
{
  "kundenname": "Abo Kunde Postman",
  "kundennummer": "ABO-PM001",
  "belegung": "Kanalreinigung",
  "zeitraum_von": "2025-08-01",
  "zeitraum_bis": "2099-12-31",
  "status": "gebucht",
  "berater": "Postman",
  "verkaufspreis": 2400.00
}
```

---

## 🔄 6. Collection-Level Authorization (Empfohlen)

### Automatische Authentifizierung für alle Requests:

1. **Collection auswählen**
2. **Authorization Tab**
3. **Type**: `Bearer Token`
4. **Token**: `{{jwt_token}}`
5. **Save**

**Vorteil**: Alle Requests in der Collection verwenden automatisch den Token!

---

## 🧪 7. Vollständige Request-Liste

### Authentifizierung:
- `POST /api/auth/login` - Login Admin
- `POST /api/auth/login` - Login Viewer (Body: `{"username":"viewer","password":"viewer123"}`)
- `GET /api/auth/profile` - User Profile

### Buchungen:
- `GET /api/bookings` - Alle Buchungen
- `GET /api/bookings/1` - Einzelne Buchung
- `POST /api/bookings` - Neue Buchung
- `PUT /api/bookings/1` - Buchung aktualisieren
- `DELETE /api/bookings/1` - Buchung löschen

### Verfügbarkeit:
- `GET /api/availability/check` - Verfügbarkeit prüfen

### System:
- `GET /api/db-status` - Datenbank Status
- `GET /api/categories` - Kategorien

---

## 🎯 8. Pre-request Scripts (Erweitert)

### Automatisches Token-Refresh:

**Collection Pre-request Script:**
```javascript
// Prüfen ob Token noch gültig ist
const token = pm.environment.get("jwt_token");

if (!token) {
    console.log("Kein Token vorhanden, Login erforderlich");
} else {
    // Token dekodieren und Ablaufzeit prüfen
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);
        
        if (payload.exp < now) {
            console.log("Token abgelaufen, neuer Login erforderlich");
            pm.environment.unset("jwt_token");
        } else {
            console.log("Token noch gültig bis:", new Date(payload.exp * 1000));
        }
    } catch (e) {
        console.log("Token-Dekodierung fehlgeschlagen");
    }
}
```

---

## 📊 9. Tests für alle Requests

### Standard-Tests für GET-Requests:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    var jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('success');
    pm.expect(jsonData.success).to.be.true;
});

pm.test("Response time is less than 2000ms", function () {
    pm.expect(pm.response.responseTime).to.be.below(2000);
});
```

### Tests für POST-Requests (Buchung erstellen):
```javascript
pm.test("Booking created successfully", function () {
    pm.response.to.have.status(201);
    
    var jsonData = pm.response.json();
    pm.expect(jsonData.success).to.be.true;
    pm.expect(jsonData.data).to.have.property('id');
    
    // Booking ID für weitere Tests speichern
    pm.environment.set("last_booking_id", jsonData.data.id);
});
```

---

## 🔧 10. Troubleshooting

### Häufige Probleme:

#### "Unauthorized" (401):
- **Lösung**: Login-Request ausführen
- **Prüfen**: Environment `jwt_token` ist gesetzt
- **Token abgelaufen**: Neuer Login erforderlich

#### "Connection refused":
- **Lösung**: Backend läuft nicht
- **Prüfen**: `pm2 status` oder Backend manuell starten

#### Environment-Variablen nicht verfügbar:
- **Lösung**: Environment aktivieren (Dropdown oben rechts)
- **Prüfen**: Variablen korrekt gesetzt

---

## 📁 11. Collection Export/Import

### Collection exportieren:
1. **Collection** → **"..." (drei Punkte)** → **Export**
2. **Format**: Collection v2.1
3. **Export** → Datei speichern

### Collection importieren:
1. **Import** (oben links)
2. **File** → Collection-Datei auswählen
3. **Import**

---

## 🎯 12. Workflow-Beispiel

### Typischer Test-Workflow:
1. **Login Admin** ausführen → Token wird automatisch gespeichert
2. **Get All Bookings** → Aktuelle Buchungen anzeigen
3. **Check Availability** → Verfügbare Plätze prüfen
4. **Create Booking** → Neue Buchung erstellen
5. **Get All Bookings** → Neue Buchung in Liste sehen

### Abo-Workflow:
1. **Login Admin**
2. **Check Availability** (ohne zeitraum_bis für Abo)
3. **Create Abo Booking** (zeitraum_bis: 2099-12-31)
4. **Check Availability** → Weniger verfügbare Plätze

---

## 💡 13. Tipps & Tricks

### Schnelle Token-Überprüfung:
- **Console** (unten) → Token-Logs anschauen
- **Environment** → `jwt_token` Wert prüfen

### Bulk-Testing:
- **Collection Runner** → Alle Requests automatisch ausführen
- **Reihenfolge**: Login zuerst, dann andere Requests

### Daten-Driven Testing:
- **CSV/JSON-Datei** mit Testdaten
- **Collection Runner** mit Datenfile

### Environment für verschiedene Stages:
- `Local` (localhost:3001)
- `Staging` (staging-server)
- `Production` (production-server)

---

## 🚀 Schnellstart-Checklist:

- [ ] Collection "Köln Branchen API" erstellt
- [ ] Environment "Köln Branchen Local" eingerichtet
- [ ] Login-Request mit Token-Extraktion konfiguriert
- [ ] Collection-Level Authorization gesetzt
- [ ] Basis-Requests erstellt (GET bookings, POST booking, etc.)
- [ ] Login ausgeführt und Token erhalten
- [ ] Ersten API-Call erfolgreich getestet

**Jetzt können Sie alle API-Endpunkte bequem in Postman testen! 🎉**

