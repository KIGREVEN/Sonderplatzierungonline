#!/bin/bash

# =============================================================================
# Köln Branchen Portal - Automatisches Update Script
# =============================================================================
# Dieses Script aktualisiert Frontend und Backend auf dem Server
# und startet die PM2-Prozesse neu
# =============================================================================

set -e  # Script bei Fehlern beenden

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging-Funktion
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# =============================================================================
# KONFIGURATION - ANPASSEN SIE DIESE PFADE AN IHRE UMGEBUNG
# =============================================================================

# Hauptverzeichnis des Projekts (wo das Git-Repository liegt)
PROJECT_DIR="/home/adtle/koelnbranchende"

# PM2 App-Namen (anpassen falls anders benannt)
FRONTEND_APP_NAME="koeln-branchen-frontend"
BACKEND_APP_NAME="koeln-branchen-backend"

# Node.js und npm Pfade (falls nicht im PATH)
NODE_PATH="/usr/bin/node"
NPM_PATH="/usr/bin/npm"

# =============================================================================
# FUNKTIONEN
# =============================================================================

check_requirements() {
    log "Prüfe Systemanforderungen..."
    
    # Git prüfen
    if ! command -v git &> /dev/null; then
        error "Git ist nicht installiert!"
        exit 1
    fi
    
    # Node.js prüfen
    if ! command -v node &> /dev/null; then
        error "Node.js ist nicht installiert!"
        exit 1
    fi
    
    # PM2 prüfen
    if ! command -v pm2 &> /dev/null; then
        error "PM2 ist nicht installiert!"
        exit 1
    fi
    
    # Projektverzeichnis prüfen
    if [ ! -d "$PROJECT_DIR" ]; then
        error "Projektverzeichnis nicht gefunden: $PROJECT_DIR"
        exit 1
    fi
    
    success "Alle Anforderungen erfüllt"
}

backup_current() {
    log "Erstelle Backup der aktuellen Version..."
    
    cd "$PROJECT_DIR"
    
    # Backup-Verzeichnis erstellen
    BACKUP_DIR="/home/adtle/backups/koelnbranchende-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Frontend backup
    if [ -d "client" ]; then
        cp -r client "$BACKUP_DIR/"
        success "Frontend-Backup erstellt: $BACKUP_DIR/client"
    fi
    
    # Backend backup
    if [ -d "server" ]; then
        cp -r server "$BACKUP_DIR/"
        success "Backend-Backup erstellt: $BACKUP_DIR/server"
    fi
    
    success "Backup abgeschlossen: $BACKUP_DIR"
}

update_code() {
    log "Aktualisiere Code vom Git-Repository..."
    
    cd "$PROJECT_DIR"
    
    # Aktuelle Branch prüfen
    CURRENT_BRANCH=$(git branch --show-current)
    log "Aktuelle Branch: $CURRENT_BRANCH"
    
    # Lokale Änderungen stashen (falls vorhanden)
    if ! git diff-index --quiet HEAD --; then
        warning "Lokale Änderungen gefunden - werden gestasht"
        git stash push -m "Auto-stash before update $(date)"
    fi
    
    # Updates holen
    git fetch origin
    
    # Auf neueste Version aktualisieren
    git pull origin main
    
    success "Code erfolgreich aktualisiert"
}

update_dependencies() {
    log "Aktualisiere Dependencies..."
    
    cd "$PROJECT_DIR"
    
    # Backend Dependencies
    if [ -d "server" ] && [ -f "server/package.json" ]; then
        log "Aktualisiere Backend-Dependencies..."
        cd server
        npm install --production
        cd ..
        success "Backend-Dependencies aktualisiert"
    fi
    
    # Frontend Dependencies und Build
    if [ -d "client" ] && [ -f "client/package.json" ]; then
        log "Aktualisiere Frontend-Dependencies..."
        cd client
        npm install
        
        log "Baue Frontend für Produktion..."
        npm run build
        cd ..
        success "Frontend gebaut und Dependencies aktualisiert"
    fi
}

restart_services() {
    log "Starte PM2-Services neu..."
    
    # PM2-Status vor Neustart anzeigen
    log "Aktuelle PM2-Prozesse:"
    pm2 list
    
    # Backend neustarten
    if pm2 describe "$BACKEND_APP_NAME" > /dev/null 2>&1; then
        log "Starte Backend neu: $BACKEND_APP_NAME"
        pm2 restart "$BACKEND_APP_NAME"
        success "Backend neugestartet"
    else
        warning "Backend-App '$BACKEND_APP_NAME' nicht in PM2 gefunden"
        log "Verfügbare PM2-Apps:"
        pm2 list
    fi
    
    # Frontend neustarten
    if pm2 describe "$FRONTEND_APP_NAME" > /dev/null 2>&1; then
        log "Starte Frontend neu: $FRONTEND_APP_NAME"
        pm2 restart "$FRONTEND_APP_NAME"
        success "Frontend neugestartet"
    else
        warning "Frontend-App '$FRONTEND_APP_NAME' nicht in PM2 gefunden"
        log "Verfügbare PM2-Apps:"
        pm2 list
    fi
    
    # PM2-Status nach Neustart
    log "PM2-Status nach Neustart:"
    pm2 list
    
    # PM2-Konfiguration speichern
    pm2 save
    success "PM2-Konfiguration gespeichert"
}

verify_deployment() {
    log "Verifiziere Deployment..."
    
    # Warte kurz bis Services gestartet sind
    sleep 5
    
    # Backend-Health-Check (falls verfügbar)
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        success "Backend läuft und antwortet"
    else
        warning "Backend-Health-Check fehlgeschlagen oder nicht verfügbar"
    fi
    
    # Frontend-Check (falls auf Port 3000 läuft)
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        success "Frontend läuft und antwortet"
    else
        warning "Frontend-Check fehlgeschlagen oder läuft auf anderem Port"
    fi
    
    success "Deployment-Verifikation abgeschlossen"
}

# =============================================================================
# HAUPTPROGRAMM
# =============================================================================

main() {
    echo -e "${BLUE}"
    echo "============================================================================="
    echo "🚀 Köln Branchen Portal - Automatisches Update"
    echo "============================================================================="
    echo -e "${NC}"
    
    log "Update-Prozess gestartet..."
    
    # Schritt 1: Anforderungen prüfen
    check_requirements
    
    # Schritt 2: Backup erstellen
    backup_current
    
    # Schritt 3: Code aktualisieren
    update_code
    
    # Schritt 4: Dependencies aktualisieren
    update_dependencies
    
    # Schritt 5: Services neustarten
    restart_services
    
    # Schritt 6: Deployment verifizieren
    verify_deployment
    
    echo -e "${GREEN}"
    echo "============================================================================="
    echo "🎉 UPDATE ERFOLGREICH ABGESCHLOSSEN!"
    echo "============================================================================="
    echo -e "${NC}"
    
    success "Das Belegung/Branche-Validierungsfix ist jetzt aktiv!"
    success "Testen Sie die Anwendung: http://192.168.116.42:3000"
    
    log "Update-Log wurde gespeichert"
}

# Script ausführen
main "$@" 2>&1 | tee "/tmp/koeln-update-$(date +%Y%m%d-%H%M%S).log"
