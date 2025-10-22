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
