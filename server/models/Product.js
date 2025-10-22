const { query } = require('../config/database');

class Product {
  constructor(data) {
    this.id = data.id;
    this.platform_key = data.platform_key;
    this.key = data.key;
    this.name = data.name;
    this.description = data.description;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findAllByPlatform(platformKey) {
    const result = await query('SELECT * FROM products WHERE platform_key = $1 ORDER BY name', [platformKey]);
    return result.rows.map(r => new Product(r));
  }

  static async findByPlatformAndKey(platformKey, key) {
    const result = await query('SELECT * FROM products WHERE platform_key = $1 AND key = $2', [platformKey, key]);
    if (result.rows.length === 0) return null;
    return new Product(result.rows[0]);
  }

  static async create(data) {
    const result = await query(`INSERT INTO products (platform_key, key, name, description, is_active) VALUES ($1,$2,$3,$4,$5) RETURNING *`, [data.platform_key, data.key, data.name, data.description || null, data.is_active ?? true]);
    return new Product(result.rows[0]);
  }
}

module.exports = Product;
