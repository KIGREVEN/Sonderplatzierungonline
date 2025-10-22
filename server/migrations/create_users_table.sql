-- Migration: Erstelle users Tabelle für Authentifizierung
-- Datum: 2025-01-07
-- Beschreibung: Fügt Benutzer-Authentifizierung mit Rollen (admin/viewer) hinzu

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'viewer' CHECK (role IN ('admin', 'viewer')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index für bessere Performance bei Username-Suchen
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Index für Rollen-basierte Abfragen
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Trigger für automatische updated_at Aktualisierung
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Kommentare für Dokumentation
COMMENT ON TABLE users IS 'Benutzer-Tabelle für Authentifizierung und Autorisierung';
COMMENT ON COLUMN users.id IS 'Eindeutige Benutzer-ID';
COMMENT ON COLUMN users.username IS 'Eindeutiger Benutzername für Login';
COMMENT ON COLUMN users.password_hash IS 'Gehashtes Passwort (bcrypt)';
COMMENT ON COLUMN users.role IS 'Benutzerrolle: admin (Vollzugriff) oder viewer (nur lesen)';
COMMENT ON COLUMN users.created_at IS 'Zeitstempel der Benutzer-Erstellung';
COMMENT ON COLUMN users.updated_at IS 'Zeitstempel der letzten Aktualisierung';

