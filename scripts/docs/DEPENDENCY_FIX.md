# 🔧 Dependency-Konflikt Lösung

## Problem: date-fns Version-Konflikt

Der Fehler tritt auf, weil `react-day-picker` nur `date-fns` Version 2.x oder 3.x unterstützt, aber Version 4.1.0 installiert ist.

## 🚀 Lösung 1: Legacy Peer Dependencies (Schnell)

```bash
# Im client-Verzeichnis ausführen
cd /home/adtle/koelnbranchende/client

# Mit legacy peer deps installieren
npm install --legacy-peer-deps
```

## 🎯 Lösung 2: date-fns downgraden (Empfohlen)

```bash
# Im client-Verzeichnis ausführen
cd /home/adtle/koelnbranchende/client

# Aktuelle node_modules und package-lock.json löschen
rm -rf node_modules package-lock.json

# date-fns auf kompatible Version downgraden
npm install date-fns@^3.6.0

# Alle Dependencies installieren
npm install
```

## 🔄 Lösung 3: package.json manuell anpassen

```bash
# package.json bearbeiten
nano package.json
```

Ändern Sie die date-fns Version von:
```json
"date-fns": "^4.1.0"
```

zu:
```json
"date-fns": "^3.6.0"
```

Dann:
```bash
rm -rf node_modules package-lock.json
npm install
```

## ✅ Nach der Lösung

```bash
# Build testen
npm run build

# Entwicklungsserver testen (optional)
npm run dev
```

## 📝 Empfehlung

Verwenden Sie **Lösung 2** (date-fns downgraden), da dies die sauberste Lösung ist und zukünftige Kompatibilitätsprobleme vermeidet.

