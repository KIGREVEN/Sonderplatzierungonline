const { query } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.password_hash = data.password_hash;
    this.role = data.role;
    this.created_at = data.created_at;
    this.updated_at = data.updated_at;
  }

  // Erstelle einen neuen Benutzer
  static async create(userData) {
    const { username, password, role = 'viewer' } = userData;
    
    // Validierung
    if (!username || !password) {
      throw new Error('Username und Password sind erforderlich');
    }

    if (!['admin', 'viewer'].includes(role)) {
      throw new Error('Role muss "admin" oder "viewer" sein');
    }

    // Prüfe ob Username bereits existiert
    const existingUser = await this.findByUsername(username);
    if (existingUser) {
      throw new Error('Username bereits vergeben');
    }

    // Hash das Passwort
    const saltRounds = 12;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const result = await query(
      `INSERT INTO users (username, password_hash, role) 
       VALUES ($1, $2, $3) 
       RETURNING id, username, role, created_at, updated_at`,
      [username, password_hash, role]
    );

    return new User({
      ...result.rows[0],
      password_hash // Für interne Verwendung
    });
  }

  // Finde Benutzer nach Username
  static async findByUsername(username) {
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new User(result.rows[0]);
  }

  // Finde Benutzer nach ID
  static async findById(id) {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return new User(result.rows[0]);
  }

  // Alle Benutzer abrufen (ohne Passwort-Hash)
  static async findAll() {
    const result = await query(
      'SELECT id, username, role, created_at, updated_at FROM users ORDER BY created_at DESC'
    );

    return result.rows.map(row => new User(row));
  }

  // Passwort verifizieren
  async verifyPassword(password) {
    return await bcrypt.compare(password, this.password_hash);
  }

  // JWT Token generieren
  generateToken() {
    const payload = {
      id: this.id,
      username: this.username,
      role: this.role
    };

    return jwt.sign(
      payload,
      process.env.JWT_SECRET || 'koeln-branchen-secret-key-2025',
      { expiresIn: '24h' }
    );
  }

  // JWT Token verifizieren
  static verifyToken(token) {
    try {
      return jwt.verify(
        token,
        process.env.JWT_SECRET || 'koeln-branchen-secret-key-2025'
      );
    } catch (error) {
      throw new Error('Ungültiger Token');
    }
  }

  // Benutzer-Objekt ohne sensible Daten
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      role: this.role,
      created_at: this.created_at,
      updated_at: this.updated_at
    };
  }

  // Prüfe ob Benutzer Admin ist
  isAdmin() {
    return this.role === 'admin';
  }

  // Prüfe ob Benutzer Viewer ist
  isViewer() {
    return this.role === 'viewer';
  }

  // Aktualisiere Benutzer-Rolle (nur für Admins)
  async updateRole(newRole) {
    if (!['admin', 'viewer'].includes(newRole)) {
      throw new Error('Role muss "admin" oder "viewer" sein');
    }

    const result = await query(
      'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [newRole, this.id]
    );

    if (result.rows.length === 0) {
      throw new Error('Benutzer nicht gefunden');
    }

    this.role = newRole;
    this.updated_at = result.rows[0].updated_at;
    return this;
  }

  // Lösche Benutzer
  async delete() {
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING id',
      [this.id]
    );

    return result.rows.length > 0;
  }
}

module.exports = User;

