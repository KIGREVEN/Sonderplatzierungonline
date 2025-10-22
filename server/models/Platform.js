const { query } = require('../config/database');

class Platform {
  constructor(data) {
    this.id = data.id;
    this.key = data.key;
    this.name = data.name;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findAll() {
    const result = await query('SELECT * FROM platforms ORDER BY name');
    return result.rows.map(r => new Platform(r));
  }

  static async findByKey(key) {
    const result = await query('SELECT * FROM platforms WHERE key = $1', [key]);
    if (result.rows.length === 0) return null;
    return new Platform(result.rows[0]);
  }

  static async exists(key) {
    const p = await this.findByKey(key);
    return !!p;
  }

  static async create(data) {
    const result = await query('INSERT INTO platforms (key, name, is_active) VALUES ($1,$2,$3) RETURNING *', [data.key, data.name, data.is_active ?? true]);
    return new Platform(result.rows[0]);
  }
}

module.exports = Platform;
