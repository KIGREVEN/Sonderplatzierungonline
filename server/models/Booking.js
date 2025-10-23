const { query, transaction } = require('../config/database');
const Joi = require('joi');

// Validation schema for booking data (NEW SIMPLIFIED LOGIC)
const bookingSchema = Joi.object({
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
  campaign_id: Joi.number().integer().required().messages({
    'number.base': 'Kampagne ist erforderlich',
    'any.required': 'Kampagne ist erforderlich'
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

  // Check for double booking (NEW SIMPLIFIED LOGIC)
  // Kombination (platform_id, product_id, location_id, campaign_id) darf nur einmal existieren
  static async checkDoubleBooking(platform_id, product_id, location_id, campaign_id, excludeId = null) {
    let queryText = `
      SELECT id, kundenname, berater
      FROM bookings 
      WHERE platform_id = $1 
        AND product_id = $2 
        AND location_id = $3 
        AND campaign_id = $4
        AND platform_id IS NOT NULL
        AND product_id IS NOT NULL
        AND location_id IS NOT NULL
        AND campaign_id IS NOT NULL
    `;
    
    const params = [platform_id, product_id, location_id, campaign_id];
    
    if (excludeId) {
      queryText += ` AND id != $5`;
      params.push(excludeId);
    }

    const result = await query(queryText, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  }



  // Create a new booking (NEW SIMPLIFIED LOGIC)
  static async create(bookingData) {
    const validatedData = this.validate(bookingData);

    // Check for double booking
    const existingBooking = await this.checkDoubleBooking(
      validatedData.platform_id,
      validatedData.product_id,
      validatedData.location_id,
      validatedData.campaign_id
    );

    if (existingBooking) {
      const error = new Error('Die gewünschte Belegung ist bereits belegt');
      error.name = 'ConflictError';
      error.details = {
        message: 'Die gewünschte Belegung ist bereits belegt',
        existingBooking: {
          id: existingBooking.id,
          kundenname: existingBooking.kundenname,
          berater: existingBooking.berater
        }
      };
      throw error;
    }

    const queryText = `
      INSERT INTO bookings (
        kundenname, kundennummer, platform_id, product_id, location_id, 
        category_id, campaign_id, status, berater, verkaufspreis, 
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW(), NOW())
      RETURNING *
    `;

    const values = [
      validatedData.kundenname,
      validatedData.kundennummer,
      validatedData.platform_id,
      validatedData.product_id,
      validatedData.location_id,
      validatedData.category_id,
      validatedData.campaign_id,
      validatedData.status || 'reserviert',
      validatedData.berater,
      validatedData.verkaufspreis || null
    ];

    const result = await query(queryText, values);
    return result.rows[0];
  }

  // Get all bookings with optional filters (NEW SIMPLIFIED LOGIC)
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
        AND b.campaign_id IS NOT NULL
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

    const validatedData = this.validate(updateData);

    // Check for double booking (excluding current booking)
    const conflictingBooking = await this.checkDoubleBooking(
      validatedData.platform_id,
      validatedData.product_id,
      validatedData.location_id,
      validatedData.campaign_id,
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
          berater: conflictingBooking.berater
        }
      };
      throw error;
    }

    const queryText = `
      UPDATE bookings 
      SET kundenname = $1, kundennummer = $2, platform_id = $3, product_id = $4, 
          location_id = $5, category_id = $6, campaign_id = $7, status = $8, 
          berater = $9, verkaufspreis = $10, updated_at = NOW()
      WHERE id = $11
      RETURNING *
    `;

    const values = [
      validatedData.kundenname,
      validatedData.kundennummer,
      validatedData.platform_id,
      validatedData.product_id,
      validatedData.location_id,
      validatedData.category_id,
      validatedData.campaign_id,
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

