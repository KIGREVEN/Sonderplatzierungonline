-- Umbenennen der products Tabelle zu articles
ALTER TABLE products RENAME TO articles;

-- Hinzufügen der article_type Spalte
ALTER TABLE articles ADD COLUMN article_type VARCHAR(50) NOT NULL DEFAULT 'standard';

-- Entfernen der automatischen Platzvergabe (platzierung wird immer manuell gesetzt)
ALTER TABLE bookings DROP CONSTRAINT bookings_platzierung_check;

-- Aktualisieren der Foreign Keys
ALTER TABLE bookings 
  DROP CONSTRAINT bookings_platform_key_product_key_fkey;

ALTER TABLE bookings 
  ADD CONSTRAINT bookings_platform_key_article_key_fkey 
  FOREIGN KEY (platform_key, product_key) 
  REFERENCES articles(platform_key, key);

-- Umbenennen der product_key Spalte zu article_key in der bookings Tabelle
ALTER TABLE bookings RENAME COLUMN product_key TO article_key;

-- Aktualisieren der existierenden Indizes
DROP INDEX IF EXISTS idx_bookings_product;
CREATE INDEX idx_bookings_article ON bookings(article_key);

COMMENT ON TABLE articles IS 'Artikel-Tabelle für Sonderplatzierung Online';
COMMENT ON COLUMN articles.article_type IS 'Typ des Artikels (z.B. standard, premium, etc.)';