const { query } = require('../config/database');

class Campaign {
  constructor(data) {
    this.id = data.id;
    this.label = data.label;
    this.from_date = data.from_date;
    this.to_date = data.to_date;
    this.is_active = data.is_active;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  static async findAll() {
    const result = await query('SELECT * FROM campaigns ORDER BY label');
    return result.rows.map(r => new Campaign(r));
  }

  static async findByLabel(label) {
    const result = await query('SELECT * FROM campaigns WHERE label = $1', [label]);
    if (result.rows.length === 0) return null;
    return new Campaign(result.rows[0]);
  }

  static async create(data) {
    const result = await query('INSERT INTO campaigns (label, from_date, to_date, is_active) VALUES ($1,$2,$3,$4) RETURNING *', [data.label, data.from_date || null, data.to_date || null, data.is_active ?? true]);
    return new Campaign(result.rows[0]);
  }
}

module.exports = Campaign;
