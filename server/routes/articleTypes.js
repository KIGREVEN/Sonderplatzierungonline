const express = require('express');
const router = express.Router();
const { query } = require('../config/database');
const { optionalAuth, authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all article types (optionally filtered by platform)
router.get('/', optionalAuth, async (req, res) => {
    try {
        const { platform_key } = req.query;
        
        let queryText;
        let queryParams = [];
        
        if (platform_key) {
            // Filter article types by platform: nur Typen die Artikel haben, die mit dieser Plattform verknüpft sind
            queryText = `
                SELECT DISTINCT at.* 
                FROM article_types at
                INNER JOIN products p ON at.id = p.article_type_id
                INNER JOIN article_platforms ap ON p.id = ap.article_id
                WHERE ap.platform_key = $1
                ORDER BY at.name ASC
            `;
            queryParams = [platform_key];
        } else {
            queryText = 'SELECT * FROM article_types ORDER BY name ASC';
        }
        
        const result = await query(queryText, queryParams);
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get single article type by ID
router.get('/:id', optionalAuth, async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await query(
            'SELECT * FROM article_types WHERE id = $1',
            [parseInt(id)]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Artikel-Typ nicht gefunden' 
            });
        }
        
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Create a new article type (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { key, name, description, is_campaign_based } = req.body;
        
        // Check if key already exists
        const existing = await query(
            'SELECT id FROM article_types WHERE key = $1',
            [key]
        );
        
        if (existing.rows.length > 0) {
            return res.status(409).json({ 
                success: false, 
                error: 'Ein Artikel-Typ mit diesem Schlüssel existiert bereits' 
            });
        }
        
        const result = await query(
            'INSERT INTO article_types (key, name, description, is_campaign_based) VALUES ($1, $2, $3, $4) RETURNING *',
            [key, name, description || null, is_campaign_based !== undefined ? is_campaign_based : true]
        );
        
        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Update article type (Admin only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, is_campaign_based } = req.body;
        
        const result = await query(
            'UPDATE article_types SET name = $1, description = $2, is_campaign_based = $3, updated_at = NOW() WHERE id = $4 RETURNING *',
            [name, description || null, is_campaign_based !== undefined ? is_campaign_based : true, parseInt(id)]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Artikel-Typ nicht gefunden' 
            });
        }
        
        res.json({ success: true, data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// Get articles by type
router.get('/:typeId/articles', optionalAuth, async (req, res) => {
    try {
        const { typeId } = req.params;
        const result = await query(
            'SELECT * FROM products WHERE article_type_id = $1',
            [typeId]
        );
        res.json({ success: true, data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;