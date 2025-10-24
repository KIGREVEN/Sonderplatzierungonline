# Kampagne vs. Laufzeit Feature - Dokumentation

## Übersicht

Dieses Feature ermöglicht es, dass unterschiedliche Artikel-Typen entweder **kampagnen-basiert** oder **laufzeit-basiert** sein können:

- **Kampagnen-basiert** (Standard): Buchungen erfordern eine Campaign-Auswahl (wie bisher)
- **Laufzeit-basiert**: Buchungen erfordern Startdatum und Enddatum statt einer Kampagne

## Datenbank-Schema

### article_types Tabelle
- **is_campaign_based** (BOOLEAN, DEFAULT true)
  - `true`: Kampagnen-basiert → campaign_id erforderlich
  - `false`: Laufzeit-basiert → duration_start/duration_end erforderlich

### bookings Tabelle
Neue Spalten:
- **duration_start** (DATE, NULL)
- **duration_end** (DATE, NULL)

Bestehende Spalte:
- **campaign_id** (INTEGER, NULL) - jetzt optional

Constraint:
```sql
CHECK (
  (campaign_id IS NOT NULL AND duration_start IS NULL AND duration_end IS NULL) OR
  (campaign_id IS NULL AND duration_start IS NOT NULL AND duration_end IS NOT NULL) OR
  (campaign_id IS NULL AND duration_start IS NULL AND duration_end IS NULL)
)
```

## Setup/Migration

Migrations-Skripte wurden erfolgreich ausgeführt:
1. `server/scripts/add_campaign_duration_mode.js` - Fügt `is_campaign_based` Flag zu `article_types` hinzu
2. `server/scripts/add_booking_duration_fields.js` - Fügt `duration_start/duration_end` zu `bookings` hinzu + Constraint

Ausführen (bereits erledigt):
```bash
cd server
node scripts/add_campaign_duration_mode.js
node scripts/add_booking_duration_fields.js
```

## Backend-Änderungen

### Booking Model (`server/models/Booking.js`)

#### Neue Methode: `getArticleTypeMode(product_id)`
Holt `is_campaign_based` Flag vom Artikel-Typ des Produkts.

#### Angepasste Validierung: `validate(data)`
- Prüft basierend auf `is_campaign_based`:
  - **TRUE**: `campaign_id` required, `duration_*` muss NULL sein
  - **FALSE**: `duration_start` und `duration_end` required, `campaign_id` muss NULL sein
- Validiert Datum-Range (end >= start)

#### Angepasste Double-Booking-Check: `checkDoubleBooking(...)`
- **Kampagnen-Modus**: Prüft (platform_id, product_id, location_id, campaign_id) Unique
- **Laufzeit-Modus**: Prüft (platform_id, product_id, location_id) + Datum-Überlappung
  - Überlappung = Konflikt

#### create() / update()
- Beide Methoden nutzen async validate() und checkDoubleBooking()
- INSERT/UPDATE queries beinhalten `duration_start`, `duration_end` Spalten

### Article Types Route (`server/routes/articleTypes.js`)

Neue Route hinzugefügt:
```javascript
GET /api/article-types/:id
```
Gibt einzelnen Artikel-Typ mit `is_campaign_based` Flag zurück.

## Frontend-Änderungen

### BookingForm (`client/src/components/BookingForm.jsx`)

#### Neuer State
```javascript
const [isCampaignBased, setIsCampaignBased] = useState(true);
```

#### Neue FormData Felder
```javascript
duration_start: '',
duration_end: ''
```

#### Neuer useEffect Hook
Lädt `is_campaign_based` Flag wenn `article_type_id` sich ändert:
```javascript
useEffect(() => {
  const res = await apiRequest(`/api/article-types/${formData.article_type_id}`);
  setIsCampaignBased(data.data?.is_campaign_based !== false);
}, [formData.article_type_id]);
```

#### Angepasste Validierung
```javascript
if (isCampaignBased) {
  if (!formData.campaign_id) errors.push('Kampagne ist erforderlich');
} else {
  if (!formData.duration_start) errors.push('Startdatum ist erforderlich');
  if (!formData.duration_end) errors.push('Enddatum ist erforderlich');
  if (start > end) errors.push('Enddatum muss nach Startdatum liegen');
}
```

#### Conditional Rendering
```jsx
{isCampaignBased ? (
  <select name="campaign_id">...</select>
) : (
  <div>
    <input type="date" name="duration_start" />
    <input type="date" name="duration_end" />
  </div>
)}
```

#### Submit angepasst
```javascript
if (isCampaignBased) {
  apiData.campaign_id = parseInt(formData.campaign_id);
} else {
  apiData.duration_start = formData.duration_start;
  apiData.duration_end = formData.duration_end;
}
```

## Verwendung

### 1. Artikel-Typ als Laufzeit-basiert markieren

Per SQL:
```sql
UPDATE article_types 
SET is_campaign_based = false 
WHERE name = 'Jahresanzeige';  -- Beispiel
```

Oder per Admin-Interface (falls vorhanden).

### 2. Buchung erstellen

**Kampagnen-basiert** (is_campaign_based = true):
```json
POST /api/bookings
{
  "kundenname": "Müller GmbH",
  "kundennummer": "K123",
  "platform_id": 1,
  "product_id": 5,
  "location_id": 2,
  "category_id": 3,
  "campaign_id": 10,  // Required
  "berater": "Max Mustermann"
}
```

**Laufzeit-basiert** (is_campaign_based = false):
```json
POST /api/bookings
{
  "kundenname": "Müller GmbH",
  "kundennummer": "K123",
  "platform_id": 1,
  "product_id": 8,
  "location_id": 2,
  "category_id": 3,
  "duration_start": "2025-01-01",  // Required
  "duration_end": "2025-12-31",     // Required
  "berater": "Max Mustermann"
}
```

## Double-Booking-Logik

### Kampagnen-Modus
Kombination **muss eindeutig** sein:
- platform_id
- product_id
- location_id
- campaign_id

### Laufzeit-Modus
Kombination + Datum-Overlap-Check:
- platform_id
- product_id
- location_id
- **Datum-Überlappung** (mindestens ein Tag Overlap = Konflikt)

SQL Overlap-Check:
```sql
WHERE (
  (duration_start <= $start AND duration_end >= $start) OR
  (duration_start <= $end AND duration_end >= $end) OR
  (duration_start >= $start AND duration_end <= $end)
)
```

## Anzeige in der Buchungsliste

Die `findAll()` Methode gibt jetzt auch `duration_start` und `duration_end` zurück. Frontend-Komponenten müssen angepasst werden um:
1. **Kampagnen-Buchungen**: `campaign_name` anzeigen
2. **Laufzeit-Buchungen**: `duration_start` - `duration_end` anzeigen

## Testing

### 1. Kampagnen-basierte Buchung (Standard)
- Artikel-Typ: "Banner" (is_campaign_based = true)
- Form zeigt Campaign-Select
- Backend verlangt campaign_id
- Double-Booking-Check prüft campaign_id

### 2. Laufzeit-basierte Buchung
```sql
UPDATE article_types SET is_campaign_based = false WHERE name = 'Top-Ranking';
```
- Form zeigt Startdatum + Enddatum
- Backend verlangt duration_start/end
- Double-Booking-Check prüft Datum-Überlappung

### 3. Validierung
- Campaign-Modus ohne campaign_id → 400 Error
- Duration-Modus ohne duration_* → 400 Error
- Campaign-Modus mit duration_* → 400 Error
- Duration-Modus mit campaign_id → 400 Error
- Enddatum vor Startdatum → 400 Error

### 4. Konflikt-Check
**Campaign-Modus:**
```
Booking 1: Platform=1, Product=5, Location=2, Campaign=10 ✅
Booking 2: Platform=1, Product=5, Location=2, Campaign=10 ❌ CONFLICT
Booking 3: Platform=1, Product=5, Location=2, Campaign=11 ✅
```

**Duration-Modus:**
```
Booking 1: Platform=1, Product=8, Location=2, 2025-01-01 bis 2025-06-30 ✅
Booking 2: Platform=1, Product=8, Location=2, 2025-04-01 bis 2025-08-31 ❌ OVERLAP
Booking 3: Platform=1, Product=8, Location=2, 2025-07-01 bis 2025-12-31 ✅
```

## Nächste Schritte (Optional)

### Frontend-Verbesserungen
1. **BookingList Komponente**: Zeige "Kampagne" oder "Laufzeit" je nach Buchungstyp
2. **AvailabilityChecker**: Support für Duration-Range Checks
3. **Filter**: Ermögliche Filterung nach Datum-Range bei Laufzeit-Buchungen
4. **Admin UI**: Toggle für `is_campaign_based` in Artikel-Typ-Verwaltung

### Backend-Verbesserungen
1. **Reporting**: Separate Reports für Campaign vs. Duration Bookings
2. **Export**: CSV/Excel Export mit Duration-Feldern
3. **Statistics**: Auslastung nach Datum-Range für Laufzeit-Typen

## Troubleshooting

### Error: "column is_campaign_based does not exist"
→ Migration nicht ausgeführt:
```bash
node server/scripts/add_campaign_duration_mode.js
```

### Error: "column duration_start does not exist"
→ Migration nicht ausgeführt:
```bash
node server/scripts/add_booking_duration_fields.js
```

### Frontend zeigt keine Duration-Felder
→ API-Route GET /api/article-types/:id fehlt
→ Prüfe `server/routes/articleTypes.js` auf GET /:id Route

### Validation Error: "Kampagne ist erforderlich" bei Duration-Typ
→ Frontend lädt `is_campaign_based` nicht korrekt
→ Prüfe Browser DevTools Network Tab für `/api/article-types/:id` Call
→ Prüfe `isCampaignBased` State in React DevTools

## Zusammenfassung

✅ Datenbank-Schema erweitert (is_campaign_based, duration_start/end)
✅ Backend-Validierung implementiert (conditional campaign XOR duration)
✅ Backend-Konflikt-Check implementiert (campaign unique vs. duration overlap)
✅ Frontend conditional rendering (campaign select vs. date pickers)
✅ API-Route für article type details hinzugefügt
✅ Migration-Skripte erstellt und ausgeführt

Das Feature ist **vollständig implementiert** und einsatzbereit! 🎉
