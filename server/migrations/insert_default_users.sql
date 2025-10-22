-- Migration: Füge Standard-Benutzer hinzu
-- Datum: 2025-01-07
-- Beschreibung: Erstellt Standard Admin- und Viewer-Benutzer

-- Standard Admin-Benutzer
-- Username: admin
-- Password: admin123
-- Passwort-Hash für 'admin123' (bcrypt mit 12 Runden)
INSERT INTO users (username, password_hash, role) 
VALUES (
    'admin', 
    '$2b$12$LQv3c1yqBw2fyuDxAiO1KOHGeaNHiCRlsBAu.H0LhubTRBKr4qiAi', 
    'admin'
) ON CONFLICT (username) DO NOTHING;

-- Standard Viewer-Benutzer
-- Username: viewer
-- Password: viewer123
-- Passwort-Hash für 'viewer123' (bcrypt mit 12 Runden)
INSERT INTO users (username, password_hash, role) 
VALUES (
    'viewer', 
    '$2b$12$8Y6.V7QGsqrdy4q2rjwIve7FGsL6l8J8VvBUy.vEcOnlre7EMW.H.', 
    'viewer'
) ON CONFLICT (username) DO NOTHING;

-- Bestätige die Erstellung
SELECT 
    id, 
    username, 
    role, 
    created_at 
FROM users 
ORDER BY created_at;

-- Ausgabe der Standard-Anmeldedaten für Dokumentation
DO $$
BEGIN
    RAISE NOTICE '=== STANDARD-BENUTZER ERSTELLT ===';
    RAISE NOTICE 'Admin-Benutzer:';
    RAISE NOTICE '  Username: admin';
    RAISE NOTICE '  Password: admin123';
    RAISE NOTICE '  Rolle: admin (Vollzugriff)';
    RAISE NOTICE '';
    RAISE NOTICE 'Viewer-Benutzer:';
    RAISE NOTICE '  Username: viewer';
    RAISE NOTICE '  Password: viewer123';
    RAISE NOTICE '  Rolle: viewer (nur lesen)';
    RAISE NOTICE '';
    RAISE NOTICE 'WICHTIG: Ändern Sie diese Passwörter in der Produktion!';
END $$;

