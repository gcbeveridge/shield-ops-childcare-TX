const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');
const pool = require('../config/db');

class UserDB {
  static async create(data) {
    const id = data.id || uuidv4();
    let passwordHash = data.passwordHash;
    
    if (data.password && !passwordHash) {
      passwordHash = await bcrypt.hash(data.password, 10);
    }

    const query = `
      INSERT INTO users (id, email, password_hash, name, role, facility_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        facility_id = EXCLUDED.facility_id,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      id,
      data.email,
      passwordHash,
      data.name,
      data.role || 'owner',
      data.facilityId || null
    ];

    const result = await pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  static async findById(id) {
    const query = 'SELECT * FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  static async verifyPassword(user, password) {
    return await bcrypt.compare(password, user.passwordHash);
  }

  static mapRow(row) {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      name: row.name,
      role: row.role,
      facilityId: row.facility_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  static toJSON(user) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      facilityId: user.facilityId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }
}

module.exports = UserDB;
