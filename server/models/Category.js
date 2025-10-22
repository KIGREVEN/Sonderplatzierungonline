const { query } = require('../config/database');

class Category {
  static async all() {
    const result = await query('SELECT id, name FROM categories ORDER BY name');
    return result.rows;
  }

  static async search(term) {
    const result = await query(
      'SELECT id, name FROM categories WHERE name ILIKE $1 ORDER BY name LIMIT 10',
      [`%${term}%`]
    );
    return result.rows;
  }

  static async exists(name) {
    const result = await query('SELECT 1 FROM categories WHERE name = $1', [name]);
    return result.rowCount > 0;
  }
}

module.exports = Category;
