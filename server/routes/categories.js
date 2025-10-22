const express = require('express');
const router = express.Router();
const Category = require('../models/Category');

// GET /api/categories - list categories, optional search
router.get('/', async (req, res, next) => {
  try {
    const { search } = req.query;
    const categories = search ? await Category.search(search) : await Category.all();
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
