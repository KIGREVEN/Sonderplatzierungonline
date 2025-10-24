// GET /platforms/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await Platform.findByPk(id);
    if (!result) {
      return res.status(404).json({ success: false, error: 'Platform not found' });
    }
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});
const express = require('express');
const router = express.Router();
const Platform = require('../models/Platform');
const { optionalAuth } = require('../middleware/auth');

// GET /platforms
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const platforms = await Platform.findAll();
    res.json({ success: true, data: platforms });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
