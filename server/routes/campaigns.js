const express = require('express');
const router = express.Router();
const Campaign = require('../models/Campaign');
const { authenticateToken, requireAdmin, optionalAuth } = require('../middleware/auth');
const { query } = require('../config/database');

// GET /campaigns
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const campaigns = await Campaign.findAll();
    res.json({ success: true, data: campaigns });
  } catch (error) {
    next(error);
  }
});

// Admin create
router.post('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const data = req.body;
    const created = await Campaign.create(data);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
});

// PUT /campaigns/:id
router.put('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    await query('UPDATE campaigns SET label=$1, from_date=$2, to_date=$3, is_active=$4, updated_at=NOW() WHERE id=$5', [data.label, data.from_date || null, data.to_date || null, data.is_active ?? true, id]);
    const updated = await Campaign.findByLabel(data.label);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// DELETE /campaigns/:id
router.delete('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM campaigns WHERE id = $1', [id]);
    res.json({ success: true, message: 'Campaign deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
