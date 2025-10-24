const { query, transaction } = require('../config/database');
const Joi = require('joi');

// Base validation schema - campaign_id and duration fields are conditionally required
const bookingSchemaBase = Joi.object({
  // Required fields
  kundenname: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Kundenname ist erforderlich',
    'string.min': 'Kundenname muss mindestens 2 Zeichen lang sein',
    'string.max': 'Kundenname darf maximal 100 Zeichen lang sein'
  }),
  kundennummer: Joi.string().min(1).max(50).required().messages({
    'string.empty': 'Kundennummer ist erforderlich',
    'string.max': 'Kundennummer darf maximal 50 Zeichen lang sein'
  }),
  platform_id: Joi.number().integer().required().messages({
    'number.base': 'Plattform ist erforderlich',
    'any.required': 'Plattform ist erforderlich'
  }),
  product_id: Joi.number().integer().required().messages({
    'number.base': 'Artikel ist erforderlich',
    'any.required': 'Artikel ist erforderlich'
  }),
  location_id: Joi.number().integer().required().messages({
    'number.base': 'Ort ist erforderlich',
    'any.required': 'Ort ist erforderlich'
  }),
  category_id: Joi.number().integer().required().messages({
    'number.base': 'Branche ist erforderlich',
    'any.required': 'Branche ist erforderlich'
  }),
  // Campaign OR Duration (conditionally required based on article type)
  campaign_id: Joi.number().integer().allow(null).optional().messages({
    'number.base': 'Kampagne muss eine Zahl sein'
  }),
  duration_start: Joi.date().iso().allow(null).optional().messages({
    'date.base': 'Startdatum muss ein gültiges Datum sein',
    'date.format': 'Startdatum muss im Format YYYY-MM-DD sein'
  }),
  duration_end: Joi.date().iso().min(Joi.ref('duration_start')).allow(null).optional().messages({
    'date.base': 'Enddatum muss ein gültiges Datum sein',
    'date.min': 'Enddatum muss nach dem Startdatum liegen',
    'date.format': 'Enddatum muss im Format YYYY-MM-DD sein'
  }),
  status: Joi.string().valid('vorreserviert', 'reserviert', 'gebucht').default('reserviert').messages({
    'any.only': 'Status muss vorreserviert, reserviert oder gebucht sein'
  }),
  berater: Joi.string().min(2).max(100).required().messages({
    'string.empty': 'Berater ist erforderlich',
    'string.min': 'Berater muss mindestens 2 Zeichen lang sein',
    'string.max': 'Berater darf maximal 100 Zeichen lang sein'
  }),
  // Optional field
  verkaufspreis: Joi.number().positive().precision(2).allow(null).optional().messages({
    'number.base': 'Verkaufspreis muss eine Zahl sein',
    'number.positive': 'Verkaufspreis muss positiv sein'
  })
});

class Booking {
  // Get article type's campaign mode (is_campaign_based flag)
  static async getArticleTypeMode(product_id) {
    const result = await query(`
      SELECT at.is_campaign_based 
      FROM products p
      JOIN article_types at ON p.article_type_id = at.id
      WHERE p.id = $1
    `, [product_id]);

    if (result.rows.length === 0) {
      throw new Error('Produkt nicht gefunden');
    }

    return result.rows[0].is_campaign_based;
  }

  // Validate booking data (with conditional campaign/duration requirement)
  static async validate(data) {
    // Base validation first
    const { error: baseError, value } = bookingSchemaBase.validate(data, { abortEarly: false });
    if (baseError) {
      const validationError = new Error('Validation failed');
      validationError.name = 'ValidationError';
      validationError.details = baseError.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      throw validationError;
    }

    // Get article type mode to determine campaign vs duration requirement
    const isCampaignBased = await this.getArticleTypeMode(value.product_id);

    // Conditional validation: Campaign XOR Duration
    if (isCampaignBased) {
      // Campaign-based: campaign_id required, duration fields must be null
      if (!value.campaign_id) {
        const error = new Error('Validation failed');
        error.name = 'ValidationError';
        error.details = [{
          field: 'campaign_id',
          message: 'Kampagne ist für diesen Artikel-Typ erforderlich'
        }];
        throw error;
      }
      if (value.duration_start || value.duration_end) {
        const error = new Error('Validation failed');
        error.name = 'ValidationError';
        error.details = [{
          field: 'duration',
          message: 'Laufzeit-Felder sind für kampagnen-basierte Artikel nicht erlaubt'
        }];
        throw error;
      }
    } else {
      // Duration-based: duration_start/end required, campaign_id must be null
      if (!value.duration_start || !value.duration_end) {
        const error = new Error('Validation failed');
        error.name = 'ValidationError';
        error.details = [{
          field: 'duration',
          message: 'Start- und Enddatum sind für diesen Artikel-Typ erforderlich'
        }];
        throw error;
      }
      if (value.campaign_id) {
        const error = new Error('Validation failed');
        error.name = 'ValidationError';
        error.details = [{
          field: 'campaign_id',
          message: 'Kampagne ist für laufzeit-basierte Artikel nicht erlaubt'
        }];
        throw error;
      }
    }

    return value;
  }

  // Check for double booking (supports both campaign and duration mode)
  // Campaign mode: (platform_id, product_id, location_id, category_id, campaign_id) unique
  // Duration mode: (platform_id, product_id, location_id, category_id) + duration overlap check
  static async checkDoubleBooking(platform_id, product_id, location_id, category_id, campaign_id, duration_start, duration_end, excludeId = null) {
    // Campaign-based check
    if (campaign_id) {
      let queryText = `
        SELECT id, kundenname, berater
        FROM bookings 
        WHERE platform_id = $1 
          AND product_id = $2 
          AND location_id = $3 
          AND category_id = $4
          AND campaign_id = $5
          AND platform_id IS NOT NULL
          AND product_id IS NOT NULL
          AND location_id IS NOT NULL
          AND category_id IS NOT NULL
          AND campaign_id IS NOT NULL
      `;
      
      const params = [platform_id, product_id, location_id, category_id, campaign_id];
      
      if (excludeId) {
        queryText += ` AND id != $6`;
        params.push(excludeId);
      }

      const result = await query(queryText, params);
      return result.rows.length > 0 ? result.rows[0] : null;
    }

    // Duration-based check (overlapping ranges)
    if (duration_start && duration_end) {
      let queryText = `
        SELECT id, kundenname, berater, duration_start, duration_end
        FROM bookings 
        WHERE platform_id = $1 
          AND product_id = $2 
          AND location_id = $3 
          AND category_id = $4
          AND duration_start IS NOT NULL
          AND duration_end IS NOT NULL
          AND (
            (duration_start <= $5 AND duration_end >= $5) OR
            (duration_start <= $6 AND duration_end >= $6) OR
            (duration_start >= $5 AND duration_end <= $6)
          )
      `;
      
      const params = [platform_id, product_id, location_id, category_id, duration_start, duration_end];
      
      if (excludeId) {
        queryText += ` AND id != $7`;
        params.push(excludeId);
      }

      const result = await query(queryText, params);
      return result.rows.length > 0 ? result.rows[0] : null;
    }

    return null;
  }



  // Create a new booking (supports both campaign and duration mode)
  static async create(bookingData) {
    const validatedData = await this.validate(bookingData);

    // Check for double booking (pass category_id and duration fields)
    const existingBooking = await this.checkDoubleBooking(
      validatedData.platform_id,
      validatedData.product_id,
      validatedData.location_id,
      validatedData.category_id,
      validatedData.campaign_id || null,
      validatedData.duration_start || null,
      validatedData.duration_end || null
    );

    if (existingBooking) {
      const error = new Error('Die gewünschte Belegung ist bereits belegt');
      error.name = 'ConflictError';
      error.details = {
        message: 'Die gewünschte Belegung ist bereits belegt',
        existingBooking: {
          id: existingBooking.id,
          kundenname: existingBooking.kundenname,
          berater: existingBooking.berater,
          ...(existingBooking.duration_start && {
            duration_start: existingBooking.duration_start,
            duration_end: existingBooking.duration_end
          })
        }
      };
      throw error;
    }

    const queryText = `
      INSERT INTO bookings (
        kundenname, kundennummer, platform_id, product_id, location_id, 
        category_id, campaign_id, duration_start, duration_end, status, berater, verkaufspreis, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      validatedData.kundenname,
      validatedData.kundennummer,
      validatedData.platform_id,
      validatedData.product_id,
      validatedData.location_id,
      validatedData.category_id,
      validatedData.campaign_id || null,
      validatedData.duration_start || null,
      validatedData.duration_end || null,
      validatedData.status || 'reserviert',
      validatedData.berater,
      validatedData.verkaufspreis || null
    ];

    const result = await query(queryText, values);
    return result.rows[0];
  }

  // Get all bookings with optional filters (supports campaign and duration mode)
  static async findAll(filters = {}) {
    let queryText = `
      SELECT 
        b.*,
        p.name as platform_name,
        pr.name as product_name,
        l.name as location_name,
        c.name as category_name,
        ca.label as campaign_name
      FROM bookings b
      LEFT JOIN platforms p ON b.platform_id = p.id
      LEFT JOIN products pr ON b.product_id = pr.id
      LEFT JOIN locations l ON b.location_id = l.id
      LEFT JOIN categories c ON b.category_id = c.id
      LEFT JOIN campaigns ca ON b.campaign_id = ca.id
      WHERE 1=1
        AND b.platform_id IS NOT NULL
        AND b.product_id IS NOT NULL
        AND b.location_id IS NOT NULL
    `;
    const params = [];
    let paramCount = 0;

    if (filters.berater) {
      paramCount++;
      queryText += ` AND b.berater ILIKE $${paramCount}`;
      params.push(`%${filters.berater}%`);
    }

    if (filters.status) {
      paramCount++;
      queryText += ` AND b.status = $${paramCount}`;
      params.push(filters.status);
    }

    if (filters.platform_id) {
      paramCount++;
      queryText += ` AND b.platform_id = $${paramCount}`;
      params.push(filters.platform_id);
    }

    if (filters.product_id) {
      paramCount++;
      queryText += ` AND b.product_id = $${paramCount}`;
      params.push(filters.product_id);
    }

    if (filters.location_id) {
      paramCount++;
      queryText += ` AND b.location_id = $${paramCount}`;
      params.push(filters.location_id);
    }

    if (filters.category_id) {
      paramCount++;
      queryText += ` AND b.category_id = $${paramCount}`;
      params.push(filters.category_id);
    }

    if (filters.campaign_id) {
      paramCount++;
      queryText += ` AND b.campaign_id = $${paramCount}`;
      params.push(filters.campaign_id);
    }

    queryText += ' ORDER BY b.created_at DESC';

    const result = await query(queryText, params);
    return result.rows;
  }

  // Get booking by ID
  static async findById(id) {
    const result = await query('SELECT * FROM bookings WHERE id = $1', [id]);
    return result.rows[0];
  }

  // Update booking (NEW SIMPLIFIED LOGIC)
  static async update(id, updateData) {
    const existingBooking = await this.findById(id);
    if (!existingBooking) {
      throw new Error('Booking not found');
    }

    const validatedData = await this.validate(updateData);

    // Check for double booking (excluding current booking, pass category_id and duration fields)
    const conflictingBooking = await this.checkDoubleBooking(
      validatedData.platform_id,
      validatedData.product_id,
      validatedData.location_id,
      validatedData.category_id,
      validatedData.campaign_id || null,
      validatedData.duration_start || null,
      validatedData.duration_end || null,
      id
    );

    if (conflictingBooking) {
      const error = new Error('Die gewünschte Belegung ist bereits belegt');
      error.name = 'ConflictError';
      error.details = {
        message: 'Die gewünschte Belegung ist bereits belegt',
        existingBooking: {
          id: conflictingBooking.id,
          kundenname: conflictingBooking.kundenname,
          berater: conflictingBooking.berater,
          ...(conflictingBooking.duration_start && {
            duration_start: conflictingBooking.duration_start,
            duration_end: conflictingBooking.duration_end
          })
        }
      };
      throw error;
    }

    const queryText = `
      UPDATE bookings 
      SET kundenname = $1, kundennummer = $2, platform_id = $3, product_id = $4, 
          location_id = $5, category_id = $6, campaign_id = $7, duration_start = $8, 
          duration_end = $9, status = $10, berater = $11, verkaufspreis = $12, updated_at = NOW()
      WHERE id = $13
      RETURNING *
    `;

    const values = [
      validatedData.kundenname,
      validatedData.kundennummer,
      validatedData.platform_id,
      validatedData.product_id,
      validatedData.location_id,
      validatedData.category_id,
      validatedData.campaign_id || null,
      validatedData.duration_start || null,
      validatedData.duration_end || null,
      validatedData.status || 'reserviert',
      validatedData.berater,
      validatedData.verkaufspreis || null,
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

