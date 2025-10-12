const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');

class FacilityDB {
  static async create(data) {
    const id = data.id || uuidv4();
    const address = data.address || {};
    const settings = data.settings || {
      timezone: 'America/Chicago',
      hoursOfOperation: {
        monday: { open: '06:00', close: '18:00' },
        tuesday: { open: '06:00', close: '18:00' },
        wednesday: { open: '06:00', close: '18:00' },
        thursday: { open: '06:00', close: '18:00' },
        friday: { open: '06:00', close: '18:00' },
        saturday: { open: 'closed', close: 'closed' },
        sunday: { open: 'closed', close: 'closed' }
      }
    };

    const query = `
      INSERT INTO facilities (id, name, address, phone, email, license_number, capacity, owner_id, settings)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        address = EXCLUDED.address,
        phone = EXCLUDED.phone,
        email = EXCLUDED.email,
        license_number = EXCLUDED.license_number,
        capacity = EXCLUDED.capacity,
        owner_id = EXCLUDED.owner_id,
        settings = EXCLUDED.settings,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      id,
      data.name,
      JSON.stringify(address),
      data.phone || '',
      data.email || '',
      data.licenseNumber || '',
      data.capacity || 60,
      data.ownerId || null,
      JSON.stringify(settings)
    ];

    const result = await pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  static async findById(id) {
    const query = 'SELECT * FROM facilities WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  static async findAll() {
    const query = 'SELECT * FROM facilities ORDER BY created_at DESC';
    const result = await pool.query(query);
    return result.rows.map(row => this.mapRow(row));
  }

  static mapRow(row) {
    return {
      id: row.id,
      name: row.name,
      address: row.address,
      phone: row.phone,
      email: row.email,
      licenseNumber: row.license_number,
      capacity: row.capacity,
      ownerId: row.owner_id,
      settings: row.settings,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = FacilityDB;
