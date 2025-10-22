const express = require('express');
const router = express.Router();
const Location = require('../models/Location');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { query } = require('../config/database');

// GET /locations?search=
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const search = req.query.search;
    const locations = await Location.findAll(search);
    res.json({ success: true, data: locations });
  } catch (error) {
    next(error);
  }
});

// Admin create
router.post('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const data = req.body;
    const created = await Location.create(data);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
});

// PUT /locations/:id
router.put('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    await query('UPDATE locations SET name=$1, code=$2, is_active=$3, updated_at=NOW() WHERE id=$4', [data.name, data.code || null, data.is_active ?? true, id]);
    const updated = await Location.findById(id);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// DELETE /locations/:id
router.delete('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM locations WHERE id = $1', [id]);
    res.json({ success: true, message: 'Location deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
