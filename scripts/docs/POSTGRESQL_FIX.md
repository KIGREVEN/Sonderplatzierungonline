# 🔧 PostgreSQL Authentifizierung Fix

## Problem: "client password must be a string"

Dieses Problem tritt auf, wenn PostgreSQL-Authentifizierung nicht korrekt konfiguriert ist.

## 🔍 1. PostgreSQL-Status überprüfen

```bash
# PostgreSQL-Status
sudo systemctl status postgresql

# PostgreSQL-Version
psql --version

# Aktive Verbindungen
sudo -u postgres psql -c "SELECT usename FROM pg_user;"
```

## 🛠️ 2. Benutzer komplett neu erstellen

```bash
# Als postgres-Benutzer anmelden
sudo -u postgres psql

# In der PostgreSQL-Konsole:
```

```sql
-- Alle Verbindungen zur Datenbank beenden
SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'koeln_branchen_db';

-- Datenbank löschen (falls vorhanden)
DROP DATABASE IF EXISTS koeln_branchen_db;

-- Benutzer löschen (falls vorhanden)
DROP USER IF EXISTS adtle;

-- Neuen Benutzer erstellen
CREATE USER adtle WITH PASSWORD 'koeln123';

-- Benutzer-Berechtigung geben
ALTER USER adtle CREATEDB;
ALTER USER adtle WITH SUPERUSER;

-- Neue Datenbank erstellen
CREATE DATABASE koeln_branchen_db OWNER adtle;

-- Berechtigung explizit geben
GRANT ALL PRIVILEGES ON DATABASE koeln_branchen_db TO adtle;

-- Benutzer überprüfen
\du

-- Datenbank überprüfen
\l

-- Beenden
\q
```

## 🔧 3. PostgreSQL-Authentifizierung konfigurieren

```bash
# pg_hba.conf finden und bearbeiten
sudo find /etc -name "pg_hba.conf" 2>/dev/null
# Meist: /etc/postgresql/*/main/pg_hba.conf

# Datei bearbeiten (ersetzen Sie * mit Ihrer PostgreSQL-Version)
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

**Suchen Sie diese Zeilen und ändern Sie sie:**

```
# Vorher (möglicherweise):
local   all             all                                     peer
host    all             all             127.0.0.1/32            scram-sha-256

# Nachher (ändern zu):
local   all             all                                     md5
host    all             all             127.0.0.1/32            md5
```

```bash
# PostgreSQL neu starten
sudo systemctl restart postgresql
```

## 🧪 4. Verbindung testen

```bash
# Direkte Verbindung testen
psql -U adtle -d koeln_branchen_db -h localhost

# Passwort eingeben: koeln123
# Sollte erfolgreich verbinden

# Test-Query ausführen
psql -U adtle -d koeln_branchen_db -h localhost -c "SELECT 1 as test;"
```

## 🔄 5. Alternative: Einfachere Authentifizierung

Falls das nicht funktioniert, verwenden Sie trust-Authentifizierung (nur für lokale Entwicklung):

```bash
# pg_hba.conf bearbeiten
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

```
# Für lokale Entwicklung (NICHT für Produktion):
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
```

```bash
# PostgreSQL neu starten
sudo systemctl restart postgresql

# Benutzer ohne Passwort erstellen
sudo -u postgres psql -c "DROP USER IF EXISTS adtle;"
sudo -u postgres psql -c "CREATE USER adtle;"
sudo -u postgres psql -c "ALTER USER adtle CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE koeln_branchen_db OWNER adtle;"
```

**Dann .env anpassen:**

```bash
cd /home/adtle/koelnbranchende/server
nano .env
```

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=koeln_branchen_db
DB_USER=adtle
DB_PASSWORD=
PORT=3001
NODE_ENV=production
JWT_SECRET=koeln-branchen-jwt-secret-2025
JWT_EXPIRES_IN=24h
FRONTEND_URL=http://localhost:3000
```

## ✅ 6. Backend erneut testen

```bash
cd /home/adtle/koelnbranchende/server
node index.js
```

## 🆘 7. Falls immer noch Probleme

```bash
# PostgreSQL-Logs überprüfen
sudo tail -f /var/log/postgresql/postgresql-*-main.log

# In einem anderen Terminal Backend starten
cd /home/adtle/koelnbranchende/server
node index.js
```

## 📝 Debug-Informationen sammeln

```bash
# PostgreSQL-Konfiguration überprüfen
echo "=== PostgreSQL Version ===" > /home/adtle/pg_debug.log
psql --version >> /home/adtle/pg_debug.log
echo "=== PostgreSQL Status ===" >> /home/adtle/pg_debug.log
sudo systemctl status postgresql >> /home/adtle/pg_debug.log
echo "=== PostgreSQL Users ===" >> /home/adtle/pg_debug.log
sudo -u postgres psql -c "\du" >> /home/adtle/pg_debug.log
echo "=== PostgreSQL Databases ===" >> /home/adtle/pg_debug.log
sudo -u postgres psql -c "\l" >> /home/adtle/pg_debug.log
echo "=== pg_hba.conf ===" >> /home/adtle/pg_debug.log
sudo cat /etc/postgresql/*/main/pg_hba.conf >> /home/adtle/pg_debug.log
echo "=== .env File ===" >> /home/adtle/pg_debug.log
cat /home/adtle/koelnbranchende/server/.env >> /home/adtle/pg_debug.log

# Debug-Info anzeigen
cat /home/adtle/pg_debug.log
```

**Führen Sie Schritt 2 aus (PostgreSQL-Benutzer neu erstellen) und testen Sie dann das Backend erneut!**

