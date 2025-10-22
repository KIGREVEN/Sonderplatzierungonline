# 🔧 Einfache PostgreSQL-Lösung (Trust-Authentifizierung)

## Problem: SCRAM-Authentifizierung funktioniert nicht
## Lösung: Trust-Authentifizierung für localhost (sicher für lokale Entwicklung)

## 🚀 Schritt-für-Schritt Lösung:

### 1. PostgreSQL-Konfiguration auf trust umstellen:
```bash
# pg_hba.conf finden
sudo find /etc -name "pg_hba.conf" 2>/dev/null

# Meist einer dieser Pfade:
# /etc/postgresql/12/main/pg_hba.conf
# /etc/postgresql/13/main/pg_hba.conf
# /etc/postgresql/14/main/pg_hba.conf
# /etc/postgresql/15/main/pg_hba.conf

# Datei bearbeiten (ersetzen Sie XX mit Ihrer Version)
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

### 2. pg_hba.conf ändern:
**Suchen Sie diese Zeilen am Ende der Datei:**
```
# "local" is for Unix domain socket connections only
local   all             all                                     peer
# IPv4 local connections:
host    all             all             127.0.0.1/32            scram-sha-256
# IPv6 local connections:
host    all             all             ::1/128                 scram-sha-256
```

**Ändern Sie zu:**
```
# "local" is for Unix domain socket connections only
local   all             all                                     trust
# IPv4 local connections:
host    all             all             127.0.0.1/32            trust
# IPv6 local connections:
host    all             all             ::1/128                 trust
```

### 3. PostgreSQL neu starten:
```bash
sudo systemctl restart postgresql
```

### 4. Benutzer ohne Passwort erstellen:
```bash
# PostgreSQL-Konsole (jetzt ohne Passwort)
sudo -u postgres psql
```

```sql
-- Alles löschen und neu erstellen
DROP DATABASE IF EXISTS koeln_branchen_db;
DROP USER IF EXISTS adtle;

-- Benutzer ohne Passwort erstellen
CREATE USER adtle;
ALTER USER adtle CREATEDB;
ALTER USER adtle WITH SUPERUSER;

-- Datenbank erstellen
CREATE DATABASE koeln_branchen_db OWNER adtle;
GRANT ALL PRIVILEGES ON DATABASE koeln_branchen_db TO adtle;

-- Überprüfen
\du
\l

-- Beenden
\q
```

### 5. .env Datei anpassen (Passwort entfernen):
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

**Wichtig: DB_PASSWORD ist leer!**

### 6. Verbindung testen:
```bash
# Sollte jetzt ohne Passwort funktionieren
psql -U adtle -d koeln_branchen_db -h localhost -c "SELECT 1 as test;"
```

### 7. Backend testen:
```bash
cd /home/adtle/koelnbranchende/server
node index.js
```

## ✅ Erwartetes Ergebnis:
```
[dotenv@16.6.0] injecting env (10) from .env
🚀 Starting Köln Branchen Portal API...
🔄 Checking database connection...
✅ Database connected successfully
🚀 Server running on port 3001
```

## 🔍 Falls PostgreSQL-Version unbekannt:
```bash
# PostgreSQL-Version finden
sudo -u postgres psql -c "SELECT version();"

# Alle pg_hba.conf Dateien finden
sudo find /etc -name "pg_hba.conf" -exec ls -la {} \;

# PostgreSQL-Konfigurationsverzeichnis finden
sudo -u postgres psql -c "SHOW config_file;"
```

## 🛡️ Sicherheitshinweis:
Trust-Authentifizierung ist nur für localhost sicher. Für Produktionsumgebungen sollten Sie Passwort-Authentifizierung verwenden. Da dies ein lokaler Entwicklungsserver ist, ist trust für localhost völlig in Ordnung.

## 📝 Komplette Befehlssequenz:
```bash
# 1. PostgreSQL-Version finden
sudo find /etc -name "pg_hba.conf" 2>/dev/null

# 2. pg_hba.conf bearbeiten (ersetzen Sie den Pfad)
sudo nano /etc/postgresql/14/main/pg_hba.conf
# Ändern Sie alle "peer" und "scram-sha-256" zu "trust" für localhost

# 3. PostgreSQL neu starten
sudo systemctl restart postgresql

# 4. Benutzer neu erstellen
sudo -u postgres psql -c "DROP DATABASE IF EXISTS koeln_branchen_db;"
sudo -u postgres psql -c "DROP USER IF EXISTS adtle;"
sudo -u postgres psql -c "CREATE USER adtle;"
sudo -u postgres psql -c "ALTER USER adtle CREATEDB;"
sudo -u postgres psql -c "CREATE DATABASE koeln_branchen_db OWNER adtle;"

# 5. .env anpassen
cd /home/adtle/koelnbranchende/server
sed -i 's/DB_PASSWORD=.*/DB_PASSWORD=/' .env

# 6. Backend testen
node index.js
```

