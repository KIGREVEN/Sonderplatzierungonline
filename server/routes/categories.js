const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { query } = require('../config/database');

// GET /api/categories - list categories, optional search
router.get('/', async (req, res, next) => {
  try {
    const { search, active_only } = req.query;
    
    let queryText = 'SELECT id, name, is_active FROM categories WHERE 1=1';
    const queryParams = [];
    
    // Filter by active status if requested
    if (active_only === 'true') {
      queryText += ' AND is_active = true';
    }
    
    // Search by name if provided
    if (search) {
      queryParams.push(`%${search}%`);
      queryText += ` AND name ILIKE $${queryParams.length}`;
    }
    
    queryText += ' ORDER BY name';
    
    const result = await query(queryText, queryParams);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// POST /api/categories - create new category (admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { name, is_active = true } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name ist erforderlich' });
    }
    
    // Check if category already exists
    const exists = await Category.exists(name.trim());
    if (exists) {
      return res.status(409).json({ success: false, message: 'Kategorie existiert bereits' });
    }
    
    // Create category
    const result = await query(
      'INSERT INTO categories (name, is_active) VALUES ($1, $2) RETURNING *',
      [name.trim(), is_active]
    );
    
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// PUT /api/categories/:id - update category (admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, is_active } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Name ist erforderlich' });
    }
    
    // Check if another category with this name exists
    const existing = await query(
      'SELECT id FROM categories WHERE name = $1 AND id != $2',
      [name.trim(), id]
    );
    
    if (existing.rowCount > 0) {
      return res.status(409).json({ success: false, message: 'Kategorie mit diesem Namen existiert bereits' });
    }
    
    // Build update query dynamically
    const updates = ['name = $1'];
    const params = [name.trim()];
    
    if (is_active !== undefined) {
      updates.push(`is_active = $${params.length + 1}`);
      params.push(is_active);
    }
    
    params.push(id);
    
    // Update category
    const result = await query(
      `UPDATE categories SET ${updates.join(', ')}, updated_at = NOW() WHERE id = $${params.length} RETURNING *`,
      params
    );
    
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Kategorie nicht gefunden' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/categories/:id - delete category (admin only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Get the category name first
    const categoryResult = await query('SELECT name FROM categories WHERE id = $1', [id]);
    
    if (categoryResult.rowCount === 0) {
      return res.status(404).json({ success: false, message: 'Kategorie nicht gefunden' });
    }
    
    const categoryName = categoryResult.rows[0].name;
    
    // Check if category is used in bookings (by name in 'belegung' field)
    const usage = await query(
      'SELECT COUNT(*) as count FROM bookings WHERE belegung = $1',
      [categoryName]
    );
    
    if (parseInt(usage.rows[0].count) > 0) {
      return res.status(409).json({ 
        success: false, 
        message: 'Kategorie kann nicht gelöscht werden, da sie in Buchungen verwendet wird' 
      });
    }
    
    // Delete category
    const result = await query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    
    res.json({ success: true, message: 'Kategorie erfolgreich gelöscht' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
