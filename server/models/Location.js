const { query } = require('../config/database');

class Location {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.code = data.code;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findAll(search) {
    if (search) {
      const result = await query('SELECT * FROM locations WHERE name ILIKE $1 ORDER BY name', [`%${search}%`]);
      return result.rows.map(r => new Location(r));
    }
    const result = await query('SELECT * FROM locations ORDER BY name');
    return result.rows.map(r => new Location(r));
  }

  static async findById(id) {
    const result = await query('SELECT * FROM locations WHERE id = $1', [id]);
    if (result.rows.length === 0) return null;
    return new Location(result.rows[0]);
  }

  static async create(data) {
    const result = await query('INSERT INTO locations (name, code, is_active) VALUES ($1,$2,$3) RETURNING *', [data.name, data.code || null, data.is_active ?? true]);
    return new Location(result.rows[0]);
  }
}

module.exports = Location;
