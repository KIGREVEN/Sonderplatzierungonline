const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');

// GET /api/bookings - Get all bookings with optional filters (Auth required)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const filters = {
      belegung: req.query.belegung,
      berater: req.query.berater,
      status: req.query.status,
      platzierung: req.query.platzierung ? parseInt(req.query.platzierung) : undefined,
      zeitraum_von: req.query.zeitraum_von,
      zeitraum_bis: req.query.zeitraum_bis
    };

    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key] === undefined || filters[key] === '') {
        delete filters[key];
      }
    });

    const bookings = await Booking.findAll(filters);
    
    res.json({
      success: true,
      data: bookings,
      count: bookings.length,
      filters: filters
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/bookings/:id - Get booking by ID
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID'
      });
    }

    const booking = await Booking.findById(parseInt(id));
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      data: booking
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/bookings - Create new booking (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const bookingData = req.body;
    
    // Validate required fields
    if (!bookingData) {
      return res.status(400).json({
        success: false,
        error: 'Booking data is required'
      });
    }

    const newBooking = await Booking.create(bookingData);
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: newBooking
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.details
      });
    }
    
    if (error.name === 'ConflictError') {
      return res.status(409).json({
        success: false,
        error: 'Booking Conflict',
        message: 'Ein Termin für diese Belegung, Platzierung und Zeitraum ist bereits vorhanden.',
        conflicts: error.conflicts
      });
    }
    
    next(error);
  }
});

// PUT /api/bookings/:id - Update booking (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID'
      });
    }

    if (!updateData) {
      return res.status(400).json({
        success: false,
        error: 'Update data is required'
      });
    }

    const updatedBooking = await Booking.update(parseInt(id), updateData);
    
    if (!updatedBooking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: updatedBooking
    });
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.details
      });
    }
    
    if (error.name === 'ConflictError') {
      return res.status(409).json({
        success: false,
        error: 'Booking Conflict',
        message: 'Ein Termin für diese Belegung, Platzierung und Zeitraum ist bereits vorhanden.',
        conflicts: error.conflicts
      });
    }
    
    next(error);
  }
});

// DELETE /api/bookings/:id - Delete booking (Admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid booking ID'
      });
    }

    const deletedBooking = await Booking.delete(parseInt(id));
    
    if (!deletedBooking) {
      return res.status(404).json({
        success: false,
        error: 'Booking not found'
      });
    }

    res.json({
      success: true,
      message: 'Booking deleted successfully',
      data: deletedBooking
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/bookings/cleanup - Clean up expired reservations (Admin only)
router.post('/cleanup', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const cleanedBookings = await Booking.cleanupExpiredReservations();
    
    res.json({
      success: true,
      message: `${cleanedBookings.length} expired reservations cleaned up`,
      data: cleanedBookings
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

