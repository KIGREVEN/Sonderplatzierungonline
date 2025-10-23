CREATE TABLE IF NOT EXISTS article_types (
    id SERIAL PRIMARY KEY,
    key VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Füge eine Referenz in der products (articles) Tabelle hinzu
ALTER TABLE products ADD COLUMN article_type_id INTEGER REFERENCES article_types(id);

-- Füge einige Beispiel-Artikel-Typen ein
INSERT INTO article_types (key, name, description) VALUES
('top-ranking', 'Top-Ranking', 'Top-Ranking Platzierungen'),
('premium-listing', 'Premium-Listing', 'Premium-Listing Platzierungen'),
('standard-listing', 'Standard-Listing', 'Standard-Listing Platzierungen');