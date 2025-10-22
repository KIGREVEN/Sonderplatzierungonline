# 🚀 PostgreSQL Kategorien-Import - Kommandozeile

## 📋 Übersicht

**2 SQL-Scripts erstellt** für direkten PostgreSQL-Import:
- `kategorien_import_komplett.sql` - Mit Statistiken und Sicherheit
- `kategorien_import_einfach.sql` - Nur der reine Import

## 🎯 **METHODE 1: Vollständiges Script (EMPFOHLEN)**

### ✅ **Vorteile:**
- **Transaktions-sicher** (BEGIN/COMMIT)
- **Duplikat-sicher** (ON CONFLICT DO NOTHING)
- **Vollständige Statistiken** vor/nach Import
- **Rollback-fähig** bei Problemen

### 🚀 **Ausführung:**

#### **Option A: Direkt über psql**
```bash
psql -U adtle -d koeln_branchen_db -h localhost -f kategorien_import_komplett.sql
```

#### **Option B: Mit Passwort-Prompt**
```bash
psql -U adtle -d koeln_branchen_db -h localhost -W -f kategorien_import_komplett.sql
```

#### **Option C: Interaktiv in psql**
```bash
# 1. PostgreSQL-Shell öffnen
psql -U adtle -d koeln_branchen_db -h localhost

# 2. Script ausführen
\i kategorien_import_komplett.sql

# 3. Shell verlassen
\q
```

## 🎯 **METHODE 2: Einfaches Script**

### ✅ **Vorteile:**
- **Minimal** - nur der reine INSERT
- **Schnell** - keine zusätzlichen Abfragen
- **Klein** - einfacher zu übertragen

### 🚀 **Ausführung:**
```bash
psql -U adtle -d koeln_branchen_db -h localhost -f kategorien_import_einfach.sql
```

## 🎯 **METHODE 3: Copy & Paste**

### **Für kleine Teile oder Tests:**

#### **1. PostgreSQL-Shell öffnen:**
```bash
psql -U adtle -d koeln_branchen_db -h localhost
```

#### **2. SQL direkt eingeben:**
```sql
-- Beispiel für erste 5 Kategorien
INSERT INTO categories (name, created_at) VALUES
('AIDS-Hilfe und -Beratung', CURRENT_TIMESTAMP),
('Abbeizarbeiten', CURRENT_TIMESTAMP),
('Abbrucharbeiten', CURRENT_TIMESTAMP),
('Abdichtarbeiten', CURRENT_TIMESTAMP),
('Abendmoden', CURRENT_TIMESTAMP);
```

## 📊 **Erwartete Ausgabe (Vollständiges Script):**

```
BEGIN
    status     | kategorien_anzahl 
---------------+-------------------
 BEFORE IMPORT |                 5

INSERT 0 3728

    status     | kategorien_anzahl 
--------------+-------------------
 AFTER IMPORT |              3733

       info        |           name            
-------------------+---------------------------
 ERSTE 10 KATEGORIEN | AIDS-Hilfe und -Beratung
 ERSTE 10 KATEGORIEN | Abbeizarbeiten
 ERSTE 10 KATEGORIEN | Abbrucharbeiten
 ...

COMMIT

              result               
-----------------------------------
 ✅ IMPORT ERFOLGREICH ABGESCHLOSSEN!
```

## 🚨 **Troubleshooting**

### **Problem: "psql: command not found"**
```bash
# PostgreSQL-Client installieren
sudo apt update
sudo apt install postgresql-client
```

### **Problem: "connection refused"**
```bash
# PostgreSQL-Server starten
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### **Problem: "database does not exist"**
```bash
# Datenbank erstellen
sudo -u postgres createdb koeln_branchen_db
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE koeln_branchen_db TO adtle;"
```

### **Problem: "relation categories does not exist"**
```bash
# Tabelle erstellen
psql -U adtle -d koeln_branchen_db -h localhost -c "
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);"
```

### **Problem: "permission denied"**
```bash
# Als postgres-User ausführen
sudo -u postgres psql -d koeln_branchen_db -f kategorien_import_komplett.sql
```

## 🔍 **Validierung nach Import**

### **Anzahl prüfen:**
```sql
SELECT COUNT(*) FROM categories;
-- Erwartung: 3733 (oder mehr, falls schon Kategorien vorhanden)
```

### **Stichproben prüfen:**
```sql
-- Erste 10 alphabetisch
SELECT name FROM categories ORDER BY name LIMIT 10;

-- Suche nach spezifischen Kategorien
SELECT name FROM categories WHERE name LIKE '%Reise%';
SELECT name FROM categories WHERE name LIKE '%Auto%';
```

### **Duplikate prüfen:**
```sql
SELECT name, COUNT(*) 
FROM categories 
GROUP BY name 
HAVING COUNT(*) > 1;
-- Sollte leer sein (keine Duplikate)
```

## ⚡ **Performance-Tipps**

### **Für sehr große Imports:**
```sql
-- Indizes temporär deaktivieren
DROP INDEX IF EXISTS idx_categories_name;

-- Import durchführen
\i kategorien_import_einfach.sql

-- Indizes wieder erstellen
CREATE UNIQUE INDEX idx_categories_name ON categories(name);
```

### **Batch-Import (falls Script zu groß):**
```bash
# Script in kleinere Teile aufteilen
split -l 1000 kategorien_import_einfach.sql import_part_

# Teile einzeln importieren
for file in import_part_*; do
    psql -U adtle -d koeln_branchen_db -h localhost -f "$file"
done
```

## 🎉 **Zusammenfassung**

### **✅ Für sofortigen Import:**
```bash
psql -U adtle -d koeln_branchen_db -h localhost -f kategorien_import_komplett.sql
```

### **✅ Für schnellen Import:**
```bash
psql -U adtle -d koeln_branchen_db -h localhost -f kategorien_import_einfach.sql
```

### **✅ Für interaktiven Import:**
```bash
psql -U adtle -d koeln_branchen_db -h localhost
\i kategorien_import_komplett.sql
\q
```

**🎯 Alle 3.733 Kategorien werden in wenigen Sekunden importiert!**
