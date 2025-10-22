-- Migration: Add verkaufspreis column to bookings table
-- Date: 2025-01-01
-- Description: Add verkaufspreis (sales price) field to bookings

-- Add verkaufspreis column to bookings table
ALTER TABLE bookings 
ADD COLUMN verkaufspreis DECIMAL(10,2) DEFAULT NULL;

-- Add comment to the column
COMMENT ON COLUMN bookings.verkaufspreis IS 'Verkaufspreis der Buchung in Euro';

-- Optional: Add index for better performance when filtering by price
CREATE INDEX idx_bookings_verkaufspreis ON bookings(verkaufspreis) WHERE verkaufspreis IS NOT NULL;

