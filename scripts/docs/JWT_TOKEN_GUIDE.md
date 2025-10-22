# 🔑 JWT-Token finden und verwenden

## 🤔 JWT-Tokens werden NICHT fest hinterlegt!

JWT-Tokens werden **dynamisch beim Login generiert** und haben eine begrenzte Gültigkeitsdauer (24 Stunden).

## 🚀 1. Neuen JWT-Token generieren (API)

### Login-Request:
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Response mit Token:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MjI1MjY3MjgsImV4cCI6MTcyMjYxMzEyOH0.abc123...",
    "user": {
      "id": 1,
      "username": "admin",
      "role": "admin"
    }
  }
}
```

**Der Token ist der Wert von `data.token`!**

## 🔧 2. Token automatisch extrahieren

### Bash-Script:
```bash
#!/bin/bash
# JWT-Token automatisch holen und verwenden

# Token generieren und speichern
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | \
  jq -r '.data.token')

echo "JWT Token: $TOKEN"

# Token verwenden
curl http://localhost:3001/api/bookings \
  -H "Authorization: Bearer $TOKEN"
```

### PowerShell (Windows):
```powershell
# Login und Token extrahieren
$response = Invoke-RestMethod -Uri "http://localhost:3001/api/auth/login" -Method POST -ContentType "application/json" -Body '{"username":"admin","password":"admin123"}'
$token = $response.data.token

Write-Host "JWT Token: $token"

# Token verwenden
Invoke-RestMethod -Uri "http://localhost:3001/api/bookings" -Headers @{"Authorization"="Bearer $token"}
```

## 🌐 3. Token im Browser finden

### Über Browser-Entwicklertools:

1. **Frontend öffnen**: http://localhost:3000
2. **Als Admin anmelden**: admin / admin123
3. **Entwicklertools öffnen**: F12
4. **Application/Storage Tab**:
   - **localStorage**: Suchen Sie nach `token` oder `authToken`
   - **sessionStorage**: Ebenfalls nach Token suchen
   - **Cookies**: Falls Token als Cookie gespeichert

### Network Tab:
1. **Network Tab öffnen**
2. **Login durchführen**
3. **Login-Request finden**
4. **Response anschauen** → Token kopieren

## 🔍 4. JWT-Secret finden (Backend-Konfiguration)

Falls Sie das **JWT-Secret** meinen (zum Signieren der Tokens):

```bash
# .env Datei anschauen
cd /home/adtle/koelnbranchende/server
cat .env | grep JWT_SECRET
```

**Ausgabe:**
```
JWT_SECRET=koeln-branchen-jwt-secret-2025
```

## 🧪 5. Token validieren/dekodieren

### Online JWT-Decoder:
- Gehen Sie zu: https://jwt.io/
- Fügen Sie Ihren Token ein
- Sehen Sie den Inhalt (ohne Secret zu verraten)

### Kommandozeile (mit jq):
```bash
# Token-Payload dekodieren (ohne Verifikation)
echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInVzZXJuYW1lIjoiYWRtaW4iLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE3MjI1MjY3MjgsImV4cCI6MTcyMjYxMzEyOH0.abc123..." | \
cut -d. -f2 | base64 -d | jq
```

## ⏰ 6. Token-Gültigkeit prüfen

### Token-Inhalt anschauen:
```json
{
  "userId": 1,
  "username": "admin",
  "role": "admin",
  "iat": 1722526728,  // Ausgestellt am (Unix-Timestamp)
  "exp": 1722613128   // Läuft ab am (Unix-Timestamp)
}
```

### Timestamp in Datum umwandeln:
```bash
# Linux/Mac
date -d @1722613128

# Oder online: https://www.epochconverter.com/
```

## 🔄 7. Automatisches Token-Management

### Bash-Funktion:
```bash
#!/bin/bash

# Funktion für API-Calls mit automatischem Token
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    # Token holen
    TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
      -H "Content-Type: application/json" \
      -d '{"username":"admin","password":"admin123"}' | \
      jq -r '.data.token')
    
    # API-Call ausführen
    if [ "$method" = "GET" ]; then
        curl -s "$endpoint" -H "Authorization: Bearer $TOKEN"
    elif [ "$method" = "POST" ]; then
        curl -s -X POST "$endpoint" \
          -H "Content-Type: application/json" \
          -H "Authorization: Bearer $TOKEN" \
          -d "$data"
    fi
}

# Verwendung:
api_call "GET" "http://localhost:3001/api/bookings"
api_call "POST" "http://localhost:3001/api/bookings" '{"kundenname":"Test",...}'
```

## 🛡️ 8. Token-Sicherheit

### Token-Eigenschaften:
- **Gültigkeitsdauer**: 24 Stunden (JWT_EXPIRES_IN=24h)
- **Signiert mit**: JWT_SECRET aus .env
- **Enthält**: Benutzer-ID, Username, Rolle
- **Automatischer Ablauf**: Nach 24h ungültig

### Sicherheitshinweise:
- ✅ Token niemals in URLs verwenden
- ✅ Token sicher speichern (localStorage/sessionStorage)
- ✅ Token bei Logout löschen
- ✅ HTTPS in Produktion verwenden

## 🎯 Praktische Beispiele:

### Schneller Token-Test:
```bash
# 1. Token holen
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.data.token'

# 2. Token kopieren und verwenden
curl http://localhost:3001/api/bookings \
  -H "Authorization: Bearer HIER_DEN_TOKEN_EINFÜGEN"
```

### Token in Variable speichern:
```bash
# Token in Variable speichern
export JWT_TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.data.token')

# Token verwenden
curl http://localhost:3001/api/bookings \
  -H "Authorization: Bearer $JWT_TOKEN"

curl http://localhost:3001/api/categories \
  -H "Authorization: Bearer $JWT_TOKEN"
```

## 🔍 Troubleshooting:

### "Token expired" Fehler:
```bash
# Neuen Token generieren
TOKEN=$(curl -s -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' | jq -r '.data.token')
```

### "Invalid token" Fehler:
- Token korrekt kopiert?
- "Bearer " vor dem Token?
- Token nicht abgelaufen?
- Richtiges JWT_SECRET im Backend?

