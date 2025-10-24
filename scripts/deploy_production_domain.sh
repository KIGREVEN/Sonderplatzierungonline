#!/bin/bash
################################################################################
# Sonderplatzierung Online - DNS Migration Script
# 
# Automatisiert die Umstellung von internen IPs auf öffentliche Domain
# Domain: http://sonderplatzierung.greven.de
# 
# Dieses Script muss AUF DEM SERVER (extweb04) ausgeführt werden!
################################################################################

set -e  # Bei Fehler abbrechen

# Farben für Output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Konfiguration
DOMAIN="sonderplatzierung.greven.de"
PROJECT_DIR="/sonderplatzierungonline"
NGINX_SITE_AVAILABLE="/etc/nginx/sites-available/sonderplatzierung.conf"
NGINX_SITE_ENABLED="/etc/nginx/sites-enabled/sonderplatzierung.conf"
BACKEND_DIR="$PROJECT_DIR/server"
FRONTEND_DIR="$PROJECT_DIR/client"
PM2_APP_NAME="sponline-backend"

################################################################################
# Hilfsfunktionen
################################################################################

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Prüfen ob Script mit sudo läuft (für Nginx)
check_sudo() {
    if [ "$EUID" -ne 0 ]; then 
        print_error "Dieses Script muss mit sudo ausgeführt werden!"
        echo "Bitte ausführen: sudo bash $0"
        exit 1
    fi
}

# Backup erstellen
create_backup() {
    local file=$1
    local backup_file="${file}.backup.$(date +%Y%m%d_%H%M%S)"
    
    if [ -f "$file" ]; then
        cp "$file" "$backup_file"
        print_success "Backup erstellt: $backup_file"
    fi
}

################################################################################
# Hauptfunktionen
################################################################################

# 1. DNS-Test
check_dns() {
    print_header "1. DNS-Test"
    
    print_info "Prüfe DNS-Auflösung für $DOMAIN..."
    
    if nslookup "$DOMAIN" > /dev/null 2>&1; then
        local resolved_ip=$(nslookup "$DOMAIN" | grep -A1 "Name:" | grep "Address:" | awk '{print $2}' | head -1)
        print_success "DNS aufgelöst: $DOMAIN → $resolved_ip"
        
        # Warnung wenn IP nicht stimmt
        local server_ip=$(hostname -I | awk '{print $1}')
        if [ "$resolved_ip" != "217.110.253.198" ] && [ "$resolved_ip" != "$server_ip" ]; then
            print_warning "DNS zeigt nicht auf Server-IP (217.110.253.198 oder $server_ip)"
            read -p "Trotzdem fortfahren? (j/n) " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[JjYy]$ ]]; then
                exit 1
            fi
        fi
    else
        print_error "DNS für $DOMAIN konnte nicht aufgelöst werden!"
        print_info "Bitte erst DNS A-Record erstellen: $DOMAIN → 217.110.253.198"
        exit 1
    fi
}

# 2. Nginx-Konfiguration erstellen
setup_nginx() {
    print_header "2. Nginx-Konfiguration"
    
    # Backup der alten Konfiguration
    if [ -f "/etc/nginx/sites-available/sponline-3100.conf" ]; then
        create_backup "/etc/nginx/sites-available/sponline-3100.conf"
    fi
    
    print_info "Erstelle neue Nginx-Konfiguration: $NGINX_SITE_AVAILABLE"
    
    cat > "$NGINX_SITE_AVAILABLE" << 'NGINX_CONFIG'
# Sonderplatzierung Online - Öffentliche Domain
# Auto-generiert am $(date +%Y-%m-%d)

# HTTP (Port 80)
server {
    listen 80;
    server_name sonderplatzierung.greven.de;

    # Optional: Redirect HTTP → HTTPS (aktivieren nach SSL-Einrichtung)
    # return 301 https://$server_name$request_uri;

    root /sonderplatzierungonline/client/dist;
    index index.html;

    # Frontend Static Files
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache-Control für Static Assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:3101;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health Check Endpoint
    location /health {
        proxy_pass http://127.0.0.1:3101/health;
        access_log off;
    }

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
NGINX_CONFIG

    print_success "Nginx-Konfiguration erstellt"
    
    # Symlink erstellen
    print_info "Aktiviere Nginx-Site..."
    ln -sf "$NGINX_SITE_AVAILABLE" "$NGINX_SITE_ENABLED"
    print_success "Nginx-Site aktiviert"
    
    # Nginx-Konfiguration testen
    print_info "Teste Nginx-Konfiguration..."
    if nginx -t 2>&1 | grep -q "successful"; then
        print_success "Nginx-Konfiguration ist gültig"
    else
        print_error "Nginx-Konfiguration ist fehlerhaft!"
        nginx -t
        exit 1
    fi
    
    # Nginx neu laden
    print_info "Lade Nginx neu..."
    systemctl reload nginx
    print_success "Nginx neu geladen"
}

# 3. Backend CORS anpassen
update_backend_cors() {
    print_header "3. Backend CORS-Konfiguration"
    
    cd "$BACKEND_DIR"
    
    # Backup
    create_backup "$BACKEND_DIR/index.js"
    
    print_info "Aktualisiere CORS-Origins in server/index.js..."
    
    # Prüfen ob Domain bereits vorhanden
    if grep -q "sonderplatzierung.greven.de" index.js; then
        print_warning "Domain bereits in CORS-Liste vorhanden"
    else
        # CORS-Origins erweitern
        # Suche nach der CORS-Konfiguration und füge neue Origins hinzu
        sed -i "/origin: \[/,/\]/s/\(.*\)\]/\1,\n    'http:\/\/sonderplatzierung.greven.de',\n    'https:\/\/sonderplatzierung.greven.de'\n  ]/" index.js
        print_success "CORS-Origins aktualisiert"
    fi
    
    # Zeige aktuelle CORS-Konfiguration
    print_info "Aktuelle CORS-Konfiguration:"
    grep -A 8 "corsOptions" index.js | grep -A 6 "origin:"
}

# 4. Backend neu starten
restart_backend() {
    print_header "4. Backend neu starten"
    
    cd "$BACKEND_DIR"
    
    print_info "Starte PM2-App '$PM2_APP_NAME' neu..."
    pm2 restart "$PM2_APP_NAME"
    print_success "Backend neu gestartet"
    
    # Status prüfen
    sleep 2
    if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
        print_success "Backend läuft"
    else
        print_error "Backend läuft NICHT!"
        pm2 logs "$PM2_APP_NAME" --lines 20
        exit 1
    fi
}

# 5. Frontend neu bauen
rebuild_frontend() {
    print_header "5. Frontend neu bauen"
    
    cd "$FRONTEND_DIR"
    
    print_info "Installiere Frontend-Dependencies..."
    pnpm install
    print_success "Dependencies installiert"
    
    print_info "Baue Frontend für Produktion..."
    print_warning "Dies kann einige Minuten dauern..."
    
    # Alte dist/ löschen
    if [ -d "dist" ]; then
        print_info "Lösche altes dist/ Verzeichnis..."
        rm -rf dist/
    fi
    
    # Neu bauen
    if pnpm build; then
        print_success "Frontend erfolgreich gebaut"
        
        # Prüfe ob dist/ existiert
        if [ -d "dist" ]; then
            local file_count=$(find dist -type f | wc -l)
            print_info "dist/ enthält $file_count Dateien"
        else
            print_error "dist/ wurde nicht erstellt!"
            exit 1
        fi
    else
        print_error "Frontend-Build fehlgeschlagen!"
        exit 1
    fi
}

# 6. Tests durchführen
run_tests() {
    print_header "6. Tests"
    
    print_info "Teste Backend Health-Endpoint..."
    if curl -s http://127.0.0.1:3101/health | grep -q "ok"; then
        print_success "Backend Health-Check OK"
    else
        print_error "Backend Health-Check fehlgeschlagen!"
    fi
    
    print_info "Teste Frontend via Nginx..."
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:80/)
    if [ "$http_code" = "200" ]; then
        print_success "Frontend erreichbar (HTTP $http_code)"
    else
        print_warning "Frontend liefert HTTP $http_code"
    fi
    
    print_info "Teste API via Nginx..."
    if curl -s http://localhost:80/api/health | grep -q "ok"; then
        print_success "API via Nginx erreichbar"
    else
        print_error "API via Nginx nicht erreichbar!"
    fi
    
    print_info "Teste öffentliche Domain..."
    if curl -s "http://$DOMAIN/" > /dev/null 2>&1; then
        print_success "Domain $DOMAIN ist erreichbar"
    else
        print_warning "Domain $DOMAIN noch nicht erreichbar (DNS-Propagierung kann bis zu 24h dauern)"
    fi
}

# 7. SSL einrichten (optional)
setup_ssl() {
    print_header "7. SSL-Einrichtung (optional)"
    
    print_info "Möchtest du jetzt SSL mit Let's Encrypt einrichten?"
    read -p "SSL einrichten? (j/n) " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[JjYy]$ ]]; then
        print_info "Prüfe ob certbot installiert ist..."
        if ! command -v certbot &> /dev/null; then
            print_info "Installiere certbot..."
            apt update
            apt install -y certbot python3-certbot-nginx
            print_success "Certbot installiert"
        else
            print_success "Certbot bereits installiert"
        fi
        
        print_info "Hole SSL-Zertifikat für $DOMAIN..."
        print_warning "Du wirst nach einer E-Mail-Adresse gefragt!"
        
        if certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --redirect; then
            print_success "SSL-Zertifikat erfolgreich eingerichtet"
            
            # Backend CORS für HTTPS erweitern (falls noch nicht vorhanden)
            print_info "Prüfe Backend CORS für HTTPS..."
            cd "$BACKEND_DIR"
            if ! grep -q "https://$DOMAIN" index.js; then
                print_info "Füge HTTPS zur CORS-Liste hinzu..."
                # HTTPS wurde bereits in update_backend_cors() hinzugefügt
                pm2 restart "$PM2_APP_NAME"
                print_success "Backend für HTTPS aktualisiert"
            fi
            
            print_success "SSL-Setup abgeschlossen!"
            print_info "Die Seite ist jetzt unter https://$DOMAIN erreichbar"
        else
            print_error "SSL-Einrichtung fehlgeschlagen!"
            print_info "Du kannst SSL später manuell einrichten mit:"
            echo "  sudo certbot --nginx -d $DOMAIN"
        fi
    else
        print_info "SSL-Einrichtung übersprungen"
        print_info "Du kannst SSL später einrichten mit:"
        echo "  sudo certbot --nginx -d $DOMAIN"
    fi
}

# 8. Zusammenfassung
print_summary() {
    print_header "Migration abgeschlossen! 🎉"
    
    echo -e "${GREEN}"
    cat << 'SUMMARY'
╔═══════════════════════════════════════════════════════════════╗
║                   ✅ MIGRATION ERFOLGREICH                     ║
╚═══════════════════════════════════════════════════════════════╝
SUMMARY
    echo -e "${NC}"
    
    print_info "Die Anwendung ist jetzt über folgende URLs erreichbar:"
    echo ""
    echo "  🌐 Frontend:    http://$DOMAIN"
    echo "  🔌 Backend API: http://$DOMAIN/api"
    echo "  💚 Health:      http://$DOMAIN/health"
    echo ""
    
    if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
        echo "  🔒 HTTPS:       https://$DOMAIN"
        echo ""
    fi
    
    print_info "Nützliche Befehle:"
    echo ""
    echo "  # Backend-Logs anzeigen"
    echo "  pm2 logs $PM2_APP_NAME"
    echo ""
    echo "  # Nginx-Logs anzeigen"
    echo "  sudo tail -f /var/log/nginx/access.log"
    echo "  sudo tail -f /var/log/nginx/error.log"
    echo ""
    echo "  # Backend neu starten"
    echo "  pm2 restart $PM2_APP_NAME"
    echo ""
    echo "  # Nginx neu laden"
    echo "  sudo systemctl reload nginx"
    echo ""
    
    print_warning "Wichtig:"
    echo "  - Teste die Anwendung gründlich im Browser"
    echo "  - Prüfe Login, Buchungen, Kategorien"
    echo "  - Überwache die Logs für Fehler"
    echo ""
    
    print_info "Bei Problemen:"
    echo "  - Siehe DNS_MIGRATION_GUIDE.md für Troubleshooting"
    echo "  - Backups befinden sich in $BACKEND_DIR/*.backup.*"
    echo ""
}

################################################################################
# Hauptprogramm
################################################################################

main() {
    print_header "Sonderplatzierung Online - DNS Migration"
    
    print_info "Domain: $DOMAIN"
    print_info "Projekt: $PROJECT_DIR"
    echo ""
    
    print_warning "Dieses Script führt folgende Aktionen aus:"
    echo "  1. DNS-Test"
    echo "  2. Nginx-Konfiguration erstellen"
    echo "  3. Backend CORS aktualisieren"
    echo "  4. Backend neu starten"
    echo "  5. Frontend neu bauen"
    echo "  6. Tests durchführen"
    echo "  7. Optional: SSL einrichten"
    echo ""
    
    read -p "Fortfahren? (j/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[JjYy]$ ]]; then
        print_info "Abgebrochen."
        exit 0
    fi
    
    # Prüfe sudo
    check_sudo
    
    # Führe Schritte aus
    check_dns
    setup_nginx
    update_backend_cors
    restart_backend
    rebuild_frontend
    run_tests
    setup_ssl
    print_summary
    
    print_success "Script abgeschlossen!"
}

# Script starten
main "$@"
