# 🎯 Database Name Fix

## Problem: `database "adtle" does not exist`
## Ursache: Backend verbindet sich mit falscher Datenbank

## 🔍 1. .env Datei überprüfen

```bash
cd /home/adtle/koelnbranchende/server
cat .env
```

## 🔧 2. .env Datei korrigieren

```bash
cd /home/adtle/koelnbranchende/server
nano .env
```

**Stellen Sie sicher, dass der Inhalt exakt so aussieht:**

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

**Wichtig: Keine Leerzeichen um das = Zeichen!**

## 🗄️ 3. Datenbank erstellen (falls nicht vorhanden)

```bash
# Überprüfen ob Datenbank existiert
sudo -u postgres psql -c "\l" | grep koeln_branchen_db

# Falls nicht vorhanden, erstellen:
sudo -u postgres psql -c "CREATE DATABASE koeln_branchen_db OWNER adtle;"
```

## 🧪 4. Datenbankverbindung direkt testen

```bash
# Direkte Verbindung zur richtigen Datenbank
psql -U adtle -d koeln_branchen_db -h localhost -c "SELECT current_database();"
```

## 🚀 5. Backend erneut testen

```bash
cd /home/adtle/koelnbranchende/server
node index.js
```

## 🔍 6. Falls Problem weiterhin besteht

### Backend-Code überprüfen:
```bash
# Suchen nach Datenbank-Konfiguration im Code
cd /home/adtle/koelnbranchende/server
grep -r "database.*adtle" .
grep -r "DB_NAME" .
```

### Alternative .env erstellen:
```bash
cd /home/adtle/koelnbranchende/server
rm .env
cat > .env << 'EOF'
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
EOF
```

## ✅ Erwartetes Ergebnis:

```
[dotenv@16.6.0] injecting env (10) from .env
🚀 Starting Köln Branchen Portal API...
🔄 Checking database connection...
✅ Database connected successfully
🚀 Server running on port 3001
```

## 🆘 Debug-Informationen:

```bash
# Umgebungsvariablen überprüfen
cd /home/adtle/koelnbranchende/server
node -e "require('dotenv').config(); console.log('DB_NAME:', process.env.DB_NAME);"

# Verfügbare Datenbanken anzeigen
sudo -u postgres psql -c "\l"

# .env Datei Inhalt anzeigen
cat .env | cat -A  # Zeigt versteckte Zeichen
```

