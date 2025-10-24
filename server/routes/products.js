const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { optionalAuth, authenticateToken, requireAdmin } = require('../middleware/auth');
const { query } = require('../config/database');

// GET /products/:id
router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT p.*, COALESCE(array_agg(ap.platform_key) FILTER (WHERE ap.platform_key IS NOT NULL), '{}') as platforms
       FROM products p
       LEFT JOIN article_platforms ap ON p.id = ap.article_id
       WHERE p.id = $1
       GROUP BY p.id`,
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

// GET /products?platformKey=&articleTypeId=&active_only=
router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const { platformKey, articleTypeId, active_only } = req.query;
    const activeOnly = active_only === 'true';
    
    let queryText = `
      SELECT DISTINCT p.*, 
        COALESCE(array_agg(ap.platform_key) FILTER (WHERE ap.platform_key IS NOT NULL), '{}') as platforms
      FROM products p
      LEFT JOIN article_platforms ap ON p.id = ap.article_id
    `;
    const queryParams = [];
    let whereConditions = [];
    
    if (platformKey) {
      whereConditions.push(`ap.platform_key = $${queryParams.length + 1}`);
      queryParams.push(platformKey);
    }
    
    if (articleTypeId) {
      whereConditions.push(`p.article_type_id = $${queryParams.length + 1}`);
      queryParams.push(articleTypeId);
    }
    
    if (activeOnly) {
      whereConditions.push(`p.is_active = true`);
    }
    
    if (whereConditions.length > 0) {
      queryText += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    queryText += ' GROUP BY p.id ORDER BY p.name ASC';
    
    const result = await query(queryText, queryParams);
    res.json({ success: true, data: result.rows });
  } catch (error) {
    next(error);
  }
});

// Admin CRUD
router.post('/', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const data = req.body;
    console.log('Received data:', JSON.stringify(data, null, 2));
    const { platforms = [], ...productData } = data;
    console.log('Platforms array:', platforms);
    
    // Start a transaction
    await query('BEGIN');
    
    // Create the product
    const result = await query(
      'INSERT INTO products (key, name, description, is_active, article_type_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [productData.key, productData.name, productData.description, productData.is_active ?? true, productData.article_type_id]
    );
    
    const product = result.rows[0];
    
    // Add platform relationships
    if (platforms.length > 0) {
      const platformValues = platforms
        .map((_, idx) => `($1, $${idx + 2})`)
        .join(', ');
      
      await query(
        `INSERT INTO article_platforms (article_id, platform_key) VALUES ${platformValues}`,
        [product.id, ...platforms]
      );
    }
    
    await query('COMMIT');
    
    // Fetch the complete product with platforms
    const finalResult = await query(
      `SELECT p.*, 
        COALESCE(array_agg(ap.platform_key) FILTER (WHERE ap.platform_key IS NOT NULL), '{}') as platforms
       FROM products p
       LEFT JOIN article_platforms ap ON p.id = ap.article_id
       WHERE p.id = $1
       GROUP BY p.id`,
      [product.id]
    );
    
    res.status(201).json({ success: true, data: finalResult.rows[0] });
  } catch (error) {
    await query('ROLLBACK');
    next(error);
  }
});

// PUT /products/:id
router.put('/:id', authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const { platforms = [], ...productData } = data;
    
    // Check if product exists
    const checkResult = await query('SELECT id FROM products WHERE id = $1', [id]);
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Start a transaction
    await query('BEGIN');
    
    // Update the product
    await query(
      'UPDATE products SET name=$1, description=$2, is_active=$3, article_type_id=$4, updated_at=NOW() WHERE id=$5',
      [productData.name, productData.description || null, productData.is_active ?? true, productData.article_type_id, id]
    );
    
    // Delete existing platform relationships
    await query('DELETE FROM article_platforms WHERE article_id = $1', [id]);
    
    // Add new platform relationships
    if (platforms.length > 0) {
      const platformValues = platforms
        .map((_, idx) => `($1, $${idx + 2})`)
        .join(', ');
      
      await query(
        `INSERT INTO article_platforms (article_id, platform_key) VALUES ${platformValues}`,
        [id, ...platforms]
      );
    }
    
    await query('COMMIT');
    
    // Fetch the updated product with platforms
    const finalResult = await query(
      `SELECT p.*, 
        COALESCE(array_agg(ap.platform_key) FILTER (WHERE ap.platform_key IS NOT NULL), '{}') as platforms
       FROM products p
       LEFT JOIN article_platforms ap ON p.id = ap.article_id
       WHERE p.id = $1
       GROUP BY p.id`,
      [id]
    );
    
    res.json({ success: true, data: finalResult.rows[0] });
  } catch (error) {
    await query('ROLLBACK');
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
