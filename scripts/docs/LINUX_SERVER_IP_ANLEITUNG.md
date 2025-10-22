# 🖥️ IP-Adressen im Code ändern - Linux Server Anleitung

## 🎯 **EINFACHE LÖSUNG FÜR DUAL-IP-PROBLEM**

Diese Anleitung zeigt, wie Sie die API-URLs direkt im Code auf dem Linux-Server ändern.

---

## 📋 **DATEIEN DIE GEÄNDERT WERDEN MÜSSEN:**

### **1. AuthContext.jsx** ✅ (bereits aktualisiert)
### **2. useCategories.js** ⚠️ (muss geändert werden)
### **3. Environment-Dateien** 📝 (optional)

---

## 🚀 **SCHRITT-FÜR-SCHRITT ANLEITUNG:**

### **SCHRITT 1: useCategories.js anpassen**

```bash
# Datei öffnen
nano /home/ubuntu/koelnbranchende/client/src/hooks/useCategories.js
```

**ÄNDERN SIE ZEILE 11 VON:**
```javascript
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'https://koeln-branchen-api.onrender.com';
```

**ZU (für automatische IP-Erkennung):**
```javascript
const baseUrl = import.meta.env.VITE_API_BASE_URL || (
  window.location.hostname.startsWith('192.168.') || window.location.hostname === 'localhost'
    ? 'http://192.168.116.42:3001'
    : 'http://217.110.253.198:3001'
);
```

**ODER ZU (für feste externe IP):**
```javascript
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://217.110.253.198:3001';
```

**ODER ZU (für feste interne IP):**
```javascript
const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://192.168.116.42:3001';
```

---

### **SCHRITT 2: Environment-Datei setzen (EINFACHSTE LÖSUNG)**

```bash
# Für externe Zugriffe
echo "VITE_API_BASE_URL=http://217.110.253.198:3001" > /home/ubuntu/koelnbranchende/client/.env.local

# ODER für interne Zugriffe
echo "VITE_API_BASE_URL=http://192.168.116.42:3001" > /home/ubuntu/koelnbranchende/client/.env.local
```

---

### **SCHRITT 3: Frontend neu builden**

```bash
cd /home/ubuntu/koelnbranchende/client
npm run build
```

---

## 🎯 **VERSCHIEDENE LÖSUNGSANSÄTZE:**

### **LÖSUNG A: Feste externe IP (EINFACHSTE)**

```bash
# 1. Environment-Variable setzen
echo "VITE_API_BASE_URL=http://217.110.253.198:3001" > /home/ubuntu/koelnbranchende/client/.env.local

# 2. Neu builden
cd /home/ubuntu/koelnbranchende/client
npm run build
```

### **LÖSUNG B: Feste interne IP**

```bash
# 1. Environment-Variable setzen
echo "VITE_API_BASE_URL=http://192.168.116.42:3001" > /home/ubuntu/koelnbranchende/client/.env.local

# 2. Neu builden
cd /home/ubuntu/koelnbranchende/client
npm run build
```

### **LÖSUNG C: Automatische Erkennung im Code**

```bash
# 1. useCategories.js bearbeiten
nano /home/ubuntu/koelnbranchende/client/src/hooks/useCategories.js

# 2. Zeile 11 ersetzen mit:
const baseUrl = import.meta.env.VITE_API_BASE_URL || (
  window.location.hostname.startsWith('192.168.') || window.location.hostname === 'localhost'
    ? 'http://192.168.116.42:3001'
    : 'http://217.110.253.198:3001'
);

# 3. Neu builden
cd /home/ubuntu/koelnbranchende/client
npm run build
```

---

## 🔧 **SCHNELL-BEFEHLE:**

### **Für externe IP (217.110.253.198):**
```bash
cd /home/ubuntu/koelnbranchende/client
echo "VITE_API_BASE_URL=http://217.110.253.198:3001" > .env.local
npm run build
echo "✅ Frontend für externe IP konfiguriert!"
```

### **Für interne IP (192.168.116.42):**
```bash
cd /home/ubuntu/koelnbranchende/client
echo "VITE_API_BASE_URL=http://192.168.116.42:3001" > .env.local
npm run build
echo "✅ Frontend für interne IP konfiguriert!"
```

### **Für automatische Erkennung:**
```bash
cd /home/ubuntu/koelnbranchende/client
rm -f .env.local  # Entferne feste IP-Konfiguration
# Dann useCategories.js manuell bearbeiten (siehe LÖSUNG C)
npm run build
echo "✅ Frontend für automatische IP-Erkennung konfiguriert!"
```

---

## 🔍 **PRÜFEN OB ES FUNKTIONIERT:**

### **1. Build-Ausgabe prüfen:**
```bash
cd /home/ubuntu/koelnbranchende/client
npm run build
# Sollte erfolgreich sein ohne Fehler
```

### **2. Gebaute Dateien prüfen:**
```bash
ls -la /home/ubuntu/koelnbranchende/client/dist/
# Sollte index.html und assets/ enthalten
```

### **3. API-URL in gebauter Datei prüfen:**
```bash
grep -o "http://[0-9.]*:3001" /home/ubuntu/koelnbranchende/client/dist/assets/*.js | head -5
# Sollte die richtige IP zeigen
```

---

## 🚨 **TROUBLESHOOTING:**

### **Problem: "npm run build" schlägt fehl**
```bash
cd /home/ubuntu/koelnbranchende/client
npm install --legacy-peer-deps
npm run build
```

### **Problem: "Falsche IP wird verwendet"**
```bash
# Prüfe .env.local
cat /home/ubuntu/koelnbranchende/client/.env.local

# Überschreibe mit gewünschter IP
echo "VITE_API_BASE_URL=http://217.110.253.198:3001" > /home/ubuntu/koelnbranchende/client/.env.local
npm run build
```

### **Problem: "Environment-Variable wird ignoriert"**
```bash
# Lösche Node-Cache
rm -rf /home/ubuntu/koelnbranchende/client/node_modules/.vite
npm run build
```

---

## 📝 **WELCHE DATEIEN WERDEN GEÄNDERT:**

### **Automatisch durch Environment-Variable:**
- ✅ **AuthContext.jsx** (verwendet bereits neue API-Konfiguration)
- ✅ **useCategories.js** (respektiert VITE_API_BASE_URL)
- ✅ **Alle anderen Komponenten** (verwenden AuthContext)

### **Manuell zu ändern (falls gewünscht):**
- 📝 **useCategories.js** (Zeile 11 - Fallback-URL)
- 📝 **.env.local** (neue Datei für IP-Überschreibung)

---

## 🎉 **EMPFOHLENES VORGEHEN:**

### **FÜR EXTERNE ZUGRIFFE (EMPFOHLEN):**
```bash
cd /home/ubuntu/koelnbranchende/client
echo "VITE_API_BASE_URL=http://217.110.253.198:3001" > .env.local
npm run build
```

### **VALIDIERUNG:**
```bash
# Prüfe ob richtige IP im Build ist
grep -o "217\.110\.253\.198" /home/ubuntu/koelnbranchende/client/dist/assets/*.js
# Sollte die externe IP zeigen
```

**🎯 Mit diesen Befehlen ist das Frontend in wenigen Minuten für beide IPs konfiguriert!**

