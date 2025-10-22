const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { optionalAuth, authenticateToken, requireAdmin } = require('../middleware/auth');
const { query } = require('../config/database');

// GET /products?platformKey=
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const platformKey = req.query.platformKey;
    if (!platformKey) {
      return res.status(400).json({ success: false, error: 'platformKey is required' });
    }
    const products = await Product.findAllByPlatform(platformKey);
    res.json({ success: true, data: products });
  } catch (error) {
    next(error);
  }
});

// Admin CRUD
router.post('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const data = req.body;
    const created = await Product.create(data);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
});

// PUT /products/:id
router.put('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const existing = await Product.findByPlatformAndKey(data.platform_key, data.key);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    await query('UPDATE products SET name=$1, description=$2, is_active=$3, updated_at=NOW() WHERE id=$4', [data.name, data.description || null, data.is_active ?? true, existing.id]);
    const updated = await Product.findByPlatformAndKey(data.platform_key, data.key);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// DELETE /products/:id
router.delete('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
