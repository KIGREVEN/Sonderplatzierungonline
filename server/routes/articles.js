const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const { optionalAuth, authenticateToken, requireAdmin } = require('../middleware/auth');
const { query } = require('../config/database');

// GET /articles?platformKey=
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const platformKey = req.query.platformKey;
    if (!platformKey) {
      return res.status(400).json({ success: false, error: 'platformKey is required' });
    }
    const articles = await Article.findAllByPlatform(platformKey);
    res.json({ success: true, data: articles });
  } catch (error) {
    next(error);
  }
});

// Admin CRUD
router.post('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const data = req.body;
    const created = await Article.create(data);
    res.status(201).json({ success: true, data: created });
  } catch (error) {
    next(error);
  }
});

// PUT /articles/:id
router.put('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const existing = await Article.findByPlatformAndKey(data.platform_key, data.key);
    if (!existing) {
      return res.status(404).json({ success: false, error: 'Article not found' });
    }
    await query(
      'UPDATE articles SET name=$1, description=$2, article_type=$3, is_active=$4, updated_at=NOW() WHERE id=$5',
      [data.name, data.description || null, data.article_type || 'standard', data.is_active ?? true, existing.id]
    );
    const updated = await Article.findByPlatformAndKey(data.platform_key, data.key);
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

// DELETE /articles/:id
router.delete('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM articles WHERE id = $1', [id]);
    res.json({ success: true, message: 'Article deleted' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;