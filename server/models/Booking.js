const { query, transaction } = require('../config/database');
const Joi = require('joi');
const Category = require('./Category');
const Platform = require('./Platform');
const Product = require('./Product');
const Location = require('./Location');
const Campaign = require('./Campaign');

// Validation schema for booking data
const bookingSchema = Joi.object({
  platformKey: Joi.string().required().messages({ 'string.empty': 'Platform key is required' }),
  productKey: Joi.string().required().messages({ 'string.empty': 'Product key is required' }),
  locationId: Joi.number().integer().required().messages({ 'number.base': 'Location ID is required' }),
  campaignLabel: Joi.string().allow(null).optional(),
  customerRef: Joi.string().allow(null).optional(),
  meta: Joi.object().optional(),
  kundenname: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Kundenname ist erforderlich',
    'string.min': 'Kundenname muss mindestens 2 Zeichen lang sein',
    'string.max': 'Kundenname darf maximal 100 Zeichen lang sein'
  }),
  kundennummer: Joi.string().min(1).max(50).required().messages({
    'string.empty': 'Kundennummer ist erforderlich',
    'string.max': 'Kundennummer darf maximal 50 Zeichen lang sein'
  }),
  belegung: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Belegung (Branche) ist erforderlich',
    'string.min': 'Belegung muss mindestens 2 Zeichen lang sein',
    'string.max': 'Belegung darf maximal 100 Zeichen lang sein'
  }),
  zeitraum_von: Joi.date().iso().required().messages({
    'date.base': 'Zeitraum von muss ein gültiges Datum sein',
    'any.required': 'Zeitraum von ist erforderlich'
  }),
  zeitraum_bis: Joi.date().iso().min(Joi.ref('zeitraum_von')).allow(null).optional().messages({
    'date.base': 'Zeitraum bis muss ein gültiges Datum sein',
    'date.min': 'Zeitraum bis muss nach dem Startdatum liegen'
  }),
  // platzierung wird automatisch vom System vergeben
  status: Joi.string().valid('vorreserviert', 'reserviert', 'gebucht').default('reserviert').messages({
    'any.only': 'Status muss vorreserviert, reserviert oder gebucht sein'
  }),
  berater: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Berater ist erforderlich',
    'string.min': 'Berater muss mindestens 2 Zeichen lang sein',
    'string.max': 'Berater darf maximal 100 Zeichen lang sein'
  }),
  verkaufspreis: Joi.number().positive().precision(2).optional().messages({
    'number.base': 'Verkaufspreis muss eine Zahl sein',
    'number.positive': 'Verkaufspreis muss positiv sein'
  })
});

class Booking {
  // Validate booking data
  static validate(data) {
    const { error, value } = bookingSchema.validate(data, { abortEarly: false });
    if (error) {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.details = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      throw validationError;
    }
    return value;
  }

  // Get available places count for a specific belegung and time range
  static async getAvailablePlacesCount(belegung, zeitraum_von, zeitraum_bis) {
    let queryText = `
      SELECT COUNT(*) as occupied_count
      FROM bookings 
      WHERE belegung = $1 
        AND status IN ('reserviert', 'gebucht')
    `;
    
    const params = [belegung, zeitraum_von];
    let paramCount = 2;
    
    if (zeitraum_bis === null || (zeitraum_bis && new Date(zeitraum_bis).getFullYear() === 2099)) {
      // Für offene Abos: Prüfe auf Konflikte ab dem Startdatum
      queryText += `
        AND (
          -- Bestehende offene Abos (zeitraum_bis ist NULL oder 2099)
          zeitraum_bis IS NULL OR
          EXTRACT(YEAR FROM zeitraum_bis) = 2099 OR
          -- Bestehende Buchungen, die nach dem neuen Startdatum enden
          zeitraum_bis > $2
        )
      `;
    } else {
      // Für normale Buchungen mit Enddatum
      paramCount++;
      queryText += `
        AND (
          -- Offene Abos (zeitraum_bis ist NULL oder 2099) blockieren alles ab zeitraum_von
          ((zeitraum_bis IS NULL OR EXTRACT(YEAR FROM zeitraum_bis) = 2099) AND zeitraum_von <= $3) OR
          -- Normale Buchungen mit Enddatum
          (zeitraum_bis IS NOT NULL AND EXTRACT(YEAR FROM zeitraum_bis) != 2099 AND (
            (zeitraum_von <= $2 AND zeitraum_bis > $2) OR
            (zeitraum_von < $3 AND zeitraum_bis >= $3) OR
            (zeitraum_von >= $2 AND zeitraum_bis <= $3)
          ))
        )
      `;
      params.push(zeitraum_bis);
    }
    
    const result = await query(queryText, params);
    const occupiedCount = parseInt(result.rows[0].occupied_count);
    return 6 - occupiedCount; // Verfügbare Plätze von maximal 6
  }

  // Get next available placement number (internal use)
  static async getNextAvailablePlacement(belegung, zeitraum_von, zeitraum_bis) {
    const availablePlaces = await this.getAvailablePlacesCount(belegung, zeitraum_von, zeitraum_bis);
    
    if (availablePlaces <= 0) {
      throw new Error('Keine Plätze verfügbar - alle 6 Plätze sind belegt');
    }
    
    // Vergebe nächste verfügbare interne Nummer (1-6)
    return 7 - availablePlaces;
  }

  // Check for booking conflicts
  static async checkConflict(belegung, platzierung, zeitraum_von, zeitraum_bis, excludeId = null) {
    let queryText = `
      SELECT id, kundenname, status, zeitraum_von, zeitraum_bis
      FROM bookings 
      WHERE belegung = $1 
        AND platzierung = $2 
        AND status IN ('reserviert', 'gebucht')
    `;
    
    const params = [belegung, platzierung, zeitraum_von];
    let paramCount = 3;
    
    if (zeitraum_bis === null || (zeitraum_bis && new Date(zeitraum_bis).getFullYear() === 2099)) {
      // Für offene Abos (NULL oder 31.12.2099): Prüfe auf Konflikte ab dem Startdatum
      queryText += `
        AND (
          -- Bestehende offene Abos (zeitraum_bis ist NULL oder 2099)
          zeitraum_bis IS NULL OR
          EXTRACT(YEAR FROM zeitraum_bis) = 2099 OR
          -- Bestehende Buchungen, die nach dem neuen Startdatum enden
          zeitraum_bis > $3
        )
      `;
    } else {
      // Für normale Buchungen mit Enddatum
      paramCount++;
      queryText += `
        AND (
          -- Offene Abos (zeitraum_bis ist NULL oder 2099) blockieren alles ab zeitraum_von
          ((zeitraum_bis IS NULL OR EXTRACT(YEAR FROM zeitraum_bis) = 2099) AND zeitraum_von <= $4) OR
          -- Normale Buchungen mit Enddatum
          (zeitraum_bis IS NOT NULL AND EXTRACT(YEAR FROM zeitraum_bis) != 2099 AND (
            (zeitraum_von <= $3 AND zeitraum_bis > $3) OR
            (zeitraum_von < $4 AND zeitraum_bis >= $4) OR
            (zeitraum_von >= $3 AND zeitraum_bis <= $4)
          ))
        )
      `;
      params.push(zeitraum_bis);
    }
    
    if (excludeId) {
      paramCount++;
      queryText += ` AND id != $${paramCount}`;
      params.push(excludeId);
    }

    const result = await query(queryText, params);
    return result.rows;
  }

  // Create a new booking
  static async create(bookingData) {
    const validatedData = this.validate(bookingData);

    const categoryExists = await Category.exists(validatedData.belegung);
    if (!categoryExists) {
      const error = new Error('Invalid category');
      error.name = 'ValidationError';
      error.details = [{ field: 'belegung', message: 'Ungültige Branche' }];
      throw error;
    }
      // Platform/product/location/campaign existence checks
      const platform = await Platform.findByKey(validatedData.platformKey);
      if (!platform) {
        const error = new Error('Invalid platform');
        error.name = 'ValidationError';
        error.details = [{ field: 'platformKey', message: 'Ungültige Plattform' }];
        throw error;
      }

      const product = await Product.findByPlatformAndKey(validatedData.platformKey, validatedData.productKey);
      if (!product) {
        const error = new Error('Invalid product');
        error.name = 'ValidationError';
        error.details = [{ field: 'productKey', message: 'Ungültiges Produkt für diese Plattform' }];
        throw error;
      }

      const locationObj = await Location.findById(validatedData.locationId);
      if (!locationObj) {
        const error = new Error('Invalid location');
        error.name = 'ValidationError';
        error.details = [{ field: 'locationId', message: 'Ungültiger Ort' }];
        throw error;
      }

      if (validatedData.campaignLabel) {
        const camp = await Campaign.findByLabel(validatedData.campaignLabel);
        if (!camp) {
          const error = new Error('Invalid campaign');
          error.name = 'ValidationError';
          error.details = [{ field: 'campaignLabel', message: 'Ungültige Kampagne' }];
          throw error;
        }
      }
    
    // Automatische Platzierungsvergabe
    const platzierung = await this.getNextAvailablePlacement(
      validatedData.belegung,
      validatedData.zeitraum_von,
      validatedData.zeitraum_bis || null
    );

    const queryText = `
      INSERT INTO bookings (
        platform_key, product_key, location_id, campaign_label, kundenname, kundennummer, belegung, zeitraum_von, zeitraum_bis, 
        platzierung, status, berater, customer_ref, meta, verkaufspreis, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW())
      RETURNING *
    `;

    const values = [
      validatedData.platformKey,
      validatedData.productKey,
      validatedData.locationId,
      validatedData.campaignLabel || null,
      validatedData.kundenname,
      validatedData.kundennummer,
      validatedData.belegung,
      validatedData.zeitraum_von,
      validatedData.zeitraum_bis || null, // NULL für offene Abos
      platzierung, // Automatisch vergeben
      validatedData.status,
      validatedData.berater,
      validatedData.customerRef || null,
      validatedData.meta ? JSON.stringify(validatedData.meta) : null,
      validatedData.verkaufspreis || null
    ];

    const result = await query(queryText, values);
    return result.rows[0];
  }

  // Get all bookings with optional filters
  static async findAll(filters = {}) {
    let queryText = 'SELECT * FROM bookings WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (filters.belegung) {
      paramCount++;
      queryText += ` AND belegung ILIKE $${paramCount}`;
      params.push(`%${filters.belegung}%`);
    }

    if (filters.berater) {
      paramCount++;
      queryText += ` AND berater ILIKE $${paramCount}`;
      params.push(`%${filters.berater}%`);
    }

    if (filters.status) {
      paramCount++;
      queryText += ` AND status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.platzierung) {
      paramCount++;
      queryText += ` AND platzierung = $${paramCount}`;
      params.push(filters.platzierung);
    }

    if (filters.zeitraum_von) {
      paramCount++;
      queryText += ` AND zeitraum_bis >= $${paramCount}`;
      params.push(filters.zeitraum_von);
    }

    if (filters.zeitraum_bis) {
      paramCount++;
      queryText += ` AND zeitraum_von <= $${paramCount}`;
      params.push(filters.zeitraum_bis);
    }

    queryText += ' ORDER BY zeitraum_von ASC, platzierung ASC';

    const result = await query(queryText, params);
    return result.rows;
  }

  // Get booking by ID
  static async findById(id) {
    const result = await query('SELECT * FROM bookings WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Update booking
  static async update(id, updateData) {
    const existingBooking = await this.findById(id);
    if (!existingBooking) {
      throw new Error('Booking not found');
    }

    // Only validate the update data, not the existing booking fields
    const validatedData = this.validate(updateData);

    // Merge existing data with validated update data for conflict checking
    const mergedData = { ...existingBooking, ...validatedData };

    const categoryExists = await Category.exists(validatedData.belegung);
    if (!categoryExists) {
      const error = new Error('Invalid category');
      error.name = 'ValidationError';
      error.details = [{ field: 'belegung', message: 'Ungültige Branche' }];
      throw error;
    }

    // Check for conflicts (excluding current booking) using merged data
    const conflicts = await this.checkConflict(
      mergedData.belegung,
      mergedData.platzierung,
      mergedData.zeitraum_von,
      mergedData.zeitraum_bis,
      id
    );

    if (conflicts.length > 0) {
      const error = new Error('Booking conflict detected');
      error.name = 'ConflictError';
      error.conflicts = conflicts;
      throw error;
    }

    const queryText = `
      UPDATE bookings 
      SET kundenname = $1, kundennummer = $2, belegung = $3, zeitraum_von = $4, 
          zeitraum_bis = $5, platzierung = $6, status = $7, berater = $8, 
          verkaufspreis = $9, updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `;

    const values = [
      mergedData.kundenname,
      mergedData.kundennummer,
      mergedData.belegung,
      mergedData.zeitraum_von,
      mergedData.zeitraum_bis,
      mergedData.platzierung,
      mergedData.status,
      mergedData.berater,
      mergedData.verkaufspreis || null,
      id
    ];

    const result = await query(queryText, values);
    return result.rows[0];
  }

  // Delete booking
  static async delete(id) {
    const result = await query('DELETE FROM bookings WHERE id = $1 RETURNING *', [id]);
    return result.rows[0];
  }

  // Get availability for specific criteria
  static async getAvailability(belegung, platzierung, zeitraum_von, zeitraum_bis) {
    const conflicts = await this.checkConflict(belegung, platzierung, zeitraum_von, zeitraum_bis);
    
    return {
      available: conflicts.length === 0,
      conflicts: conflicts,
      status: conflicts.length === 0 ? 'vorreserviert' : 'belegt'
    };
  }

  // Clean up expired reservations (older than 30 minutes)
  static async cleanupExpiredReservations() {
    const queryText = `
      UPDATE bookings 
      SET status = 'vorreserviert', updated_at = NOW()
      WHERE status = 'reserviert' 
        AND created_at < NOW() - INTERVAL '30 minutes'
      RETURNING *
    `;
    
    const result = await query(queryText);
    return result.rows;
  }
}

module.exports = Booking;

