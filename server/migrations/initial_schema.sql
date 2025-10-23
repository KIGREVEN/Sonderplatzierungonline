-- Create platforms table
CREATE TABLE IF NOT EXISTS platforms (
    key VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    platform_key VARCHAR(50) REFERENCES platforms(key),
    key VARCHAR(50),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    PRIMARY KEY (platform_key, key)
);

-- Create locations table
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    name VARCHAR(100) PRIMARY KEY,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
    label VARCHAR(100) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create bookings table
CREATE TABLE IF NOT EXISTS bookings (
    id SERIAL PRIMARY KEY,
    platform_key VARCHAR(50),
    product_key VARCHAR(50),
    location_id INTEGER REFERENCES locations(id),
    campaign_label VARCHAR(100) REFERENCES campaigns(label),
    customer_ref VARCHAR(100),
    meta JSONB,
    kundenname VARCHAR(100) NOT NULL,
    kundennummer VARCHAR(50) NOT NULL,
    belegung VARCHAR(100) REFERENCES categories(name),
    zeitraum_von DATE NOT NULL,
    zeitraum_bis DATE,
    platzierung INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'reserviert',
    berater VARCHAR(100) NOT NULL,
    verkaufspreis DECIMAL(10,2),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    FOREIGN KEY (platform_key, product_key) REFERENCES products(platform_key, key),
    CHECK (status IN ('vorreserviert', 'reserviert', 'gebucht')),
    CHECK (platzierung BETWEEN 1 AND 6)
);

-- Create indexes
CREATE INDEX idx_bookings_belegung ON bookings(belegung);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_zeitraum ON bookings(zeitraum_von, zeitraum_bis);
CREATE INDEX idx_bookings_platform ON bookings(platform_key);
CREATE INDEX idx_bookings_customer ON bookings(kundennummer);
CREATE INDEX idx_bookings_berater ON bookings(berater);