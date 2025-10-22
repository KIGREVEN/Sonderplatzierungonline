const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { authenticateToken } = require('../middleware/auth');

// GET /api/availability/check - Check availability for specific criteria (Auth required)
router.get('/check', authenticateToken, async (req, res, next) => {
  try {
    const { belegung, zeitraum_von, zeitraum_bis } = req.query;
    
    // Validate required parameters
    if (!belegung || !zeitraum_von || !zeitraum_bis) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        required: ['belegung', 'zeitraum_von', 'zeitraum_bis']
      });
    }

    // Validate dates
    const vonDate = new Date(zeitraum_von);
    const bisDate = new Date(zeitraum_bis);
    
    if (isNaN(vonDate.getTime()) || isNaN(bisDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)'
      });
    }

    if (bisDate <= vonDate) {
      return res.status(400).json({
        success: false,
        error: 'zeitraum_bis must be after zeitraum_von'
      });
    }

    // Prüfe verfügbare Plätze (max. 6 pro Belegung/Zeitraum)
    const availablePlaces = await Booking.getAvailablePlacesCount(
      belegung,
      zeitraum_von,
      zeitraum_bis
    );

    const occupiedPlaces = 6 - availablePlaces;

    res.json({
      success: true,
      data: {
        belegung,
        zeitraum_von,
        zeitraum_bis,
        total_places: 6,
        available_places: availablePlaces,
        occupied_places: occupiedPlaces,
        is_available: availablePlaces > 0,
        message: availablePlaces > 0 
          ? `${availablePlaces} von 6 Plätzen verfügbar`
          : 'Alle 6 Plätze belegt - keine Verfügbarkeit'
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/availability/overview - Get availability overview for a time range (Auth required)
router.get('/overview', authenticateToken, async (req, res, next) => {
  try {
    const { 
      belegung, 
      zeitraum_von, 
      zeitraum_bis,
      platzierung_min = 1,
      platzierung_max = 6
    } = req.query;
    
    // Validate required parameters
    if (!zeitraum_von || !zeitraum_bis) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        required: ['zeitraum_von', 'zeitraum_bis']
      });
    }

    // Validate dates
    const vonDate = new Date(zeitraum_von);
    const bisDate = new Date(zeitraum_bis);
    
    if (isNaN(vonDate.getTime()) || isNaN(bisDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss.sssZ)'
      });
    }

    if (bisDate <= vonDate) {
      return res.status(400).json({
        success: false,
        error: 'zeitraum_bis must be after zeitraum_von'
      });
    }

    const minPlatz = parseInt(platzierung_min);
    const maxPlatz = parseInt(platzierung_max);

    if (isNaN(minPlatz) || isNaN(maxPlatz) || minPlatz < 1 || maxPlatz > 6 || minPlatz > maxPlatz) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platzierung range. Must be between 1-6 and min <= max'
      });
    }

    const overview = [];
    
    // Check availability for each placement position
    for (let platz = minPlatz; platz <= maxPlatz; platz++) {
      let availability;
      
      if (belegung) {
        // Check specific belegung
        availability = await Booking.getAvailability(
          belegung,
          platz,
          zeitraum_von,
          zeitraum_bis
        );
      } else {
        // Check all existing belegungen for this placement
        const existingBookings = await Booking.findAll({
          platzierung: platz,
          zeitraum_von,
          zeitraum_bis
        });
        
        availability = {
          available: existingBookings.length === 0,
          conflicts: existingBookings,
          status: existingBookings.length === 0 ? 'frei' : 'belegt'
        };
      }
      
      overview.push({
        platzierung: platz,
        belegung: belegung || 'alle',
        ...availability
      });
    }

    res.json({
      success: true,
      data: {
        zeitraum_von,
        zeitraum_bis,
        belegung: belegung || 'alle',
        platzierung_range: `${minPlatz}-${maxPlatz}`,
        overview
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/availability/calendar - Get calendar view of bookings (Auth required)
router.get('/calendar', authenticateToken, async (req, res, next) => {
  try {
    const { 
      start_date, 
      end_date,
      belegung,
      platzierung
    } = req.query;
    
    // Validate required parameters
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        required: ['start_date', 'end_date']
      });
    }

    // Validate dates
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DD)'
      });
    }

    if (endDate <= startDate) {
      return res.status(400).json({
        success: false,
        error: 'end_date must be after start_date'
      });
    }

    // Build filters
    const filters = {
      zeitraum_von: start_date,
      zeitraum_bis: end_date
    };

    if (belegung) filters.belegung = belegung;
    if (platzierung) filters.platzierung = parseInt(platzierung);

    const bookings = await Booking.findAll(filters);
    
    // Group bookings by date and platzierung for calendar view
    const calendar = {};
    
    bookings.forEach(booking => {
      const startDate = new Date(booking.zeitraum_von).toISOString().split('T')[0];
      const endDate = new Date(booking.zeitraum_bis).toISOString().split('T')[0];
      
      if (!calendar[startDate]) {
        calendar[startDate] = {};
      }
      
      if (!calendar[startDate][booking.platzierung]) {
        calendar[startDate][booking.platzierung] = [];
      }
      
      calendar[startDate][booking.platzierung].push({
        id: booking.id,
        kundenname: booking.kundenname,
        belegung: booking.belegung,
        status: booking.status,
        berater: booking.berater,
        zeitraum_von: booking.zeitraum_von,
        zeitraum_bis: booking.zeitraum_bis
      });
    });

    res.json({
      success: true,
      data: {
        start_date,
        end_date,
        filters,
        calendar,
        total_bookings: bookings.length
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/availability/all - Check availability for all placements (Auth required)
router.post('/all', authenticateToken, async (req, res, next) => {
  try {
    const { belegung, zeitraum_von, zeitraum_bis } = req.body;
    
    // Validate required parameters
    if (!belegung || !zeitraum_von || !zeitraum_bis) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        required: ['belegung', 'zeitraum_von', 'zeitraum_bis']
      });
    }

    // Validate dates
    const vonDate = new Date(zeitraum_von);
    const bisDate = new Date(zeitraum_bis);
    
    if (isNaN(vonDate.getTime()) || isNaN(bisDate.getTime())) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)'
      });
    }

    if (bisDate <= vonDate) {
      return res.status(400).json({
        success: false,
        error: 'zeitraum_bis must be after zeitraum_von'
      });
    }

    const available_placements = [];
    const occupied_placements = [];
    
    // Check all 6 placements
    for (let platzierung = 1; platzierung <= 6; platzierung++) {
      try {
        const availability = await Booking.getAvailability(
          belegung,
          platzierung,
          zeitraum_von,
          zeitraum_bis
        );
        
        if (availability.available) {
          // Placement is free
          available_placements.push({
            platzierung,
            name: `Position ${platzierung}`,
            status: 'verfügbar'
          });
        } else {
          // Placement is occupied - get details and calculate free_from date
          const conflicts = availability.conflicts || [];
          
          if (conflicts.length > 0) {
            // Find the latest end date among conflicts to determine when it's free again
            let latestEndDate = null;
            let hasOpenSubscription = false;
            
            conflicts.forEach(conflict => {
              // Prüfe auf Abo-Buchungen (31.12.2099 oder NULL)
              const isSubscription = conflict.zeitraum_bis === null || 
                                   (conflict.zeitraum_bis && new Date(conflict.zeitraum_bis).getFullYear() === 2099);
              
              if (isSubscription) {
                // Offenes Abo - nie wieder frei
                hasOpenSubscription = true;
              } else {
                const conflictEndDate = new Date(conflict.zeitraum_bis);
                if (!latestEndDate || conflictEndDate > latestEndDate) {
                  latestEndDate = conflictEndDate;
                }
              }
            });
            
            // Use the first conflict for display (most relevant)
            const mainConflict = conflicts[0];
            
            const occupiedPlacement = {
              platzierung,
              kundenname: mainConflict.kundenname,
              kundennummer: mainConflict.kundennummer,
              belegung: mainConflict.belegung,
              zeitraum_von: mainConflict.zeitraum_von,
              zeitraum_bis: mainConflict.zeitraum_bis,
              status: mainConflict.status,
              berater: mainConflict.berater,
              conflicts_count: conflicts.length,
              is_subscription: mainConflict.zeitraum_bis === null || 
                              (mainConflict.zeitraum_bis && new Date(mainConflict.zeitraum_bis).getFullYear() === 2099)
            };

            if (hasOpenSubscription) {
              // Offenes Abo - nie wieder frei
              occupiedPlacement.free_from = null;
              occupiedPlacement.subscription_note = 'Unbefristetes Abo - Kündigung erforderlich';
            } else if (latestEndDate) {
              // Add one day to the latest end date to get the "free from" date
              const freeFromDate = new Date(latestEndDate);
              freeFromDate.setDate(freeFromDate.getDate() + 1);
              occupiedPlacement.free_from = freeFromDate.toISOString();
            }
            
            occupied_placements.push(occupiedPlacement);
          }
        }
      } catch (error) {
        console.error(`Error checking placement ${platzierung}:`, error);
        // Continue with other placements even if one fails
      }
    }
    
    res.json({
      success: true,
      data: {
        belegung,
        zeitraum_von,
        zeitraum_bis,
        available_placements,
        occupied_placements,
        summary: {
          total_placements: 6,
          available_count: available_placements.length,
          occupied_count: occupied_placements.length
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;

