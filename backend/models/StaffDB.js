const { v4: uuidv4 } = require('uuid');
const pool = require('../config/db');

class StaffDB {
  static async create(data) {
    const id = data.id || uuidv4();
    const certifications = data.certifications || {
      cpr: { valid: false, expiresAt: null, certificateUrl: '' },
      firstAid: { valid: false, expiresAt: null, certificateUrl: '' },
      backgroundCheck: { status: 'Pending', completedAt: null, expiresAt: null },
      tuberculosisScreening: { status: 'Pending', completedAt: null }
    };

    const trainingCompletion = this.calculateTrainingCompletion(data);

    const query = `
      INSERT INTO staff (id, facility_id, name, email, role, hire_date, certifications, training_completion)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        role = EXCLUDED.role,
        hire_date = EXCLUDED.hire_date,
        certifications = EXCLUDED.certifications,
        training_completion = EXCLUDED.training_completion,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *
    `;

    const values = [
      id,
      data.facilityId,
      data.name,
      data.email || '',
      data.role || 'Assistant Teacher',
      data.hireDate || new Date().toISOString().split('T')[0],
      JSON.stringify(certifications),
      trainingCompletion
    ];

    const result = await pool.query(query, values);
    return this.mapRow(result.rows[0]);
  }

  static async findById(id) {
    const query = 'SELECT * FROM staff WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  static async findByFacilityId(facilityId) {
    const query = 'SELECT * FROM staff WHERE facility_id = $1 ORDER BY name ASC';
    const result = await pool.query(query, [facilityId]);
    return result.rows.map(row => this.mapRow(row));
  }

  static async update(id, data) {
    const query = `
      UPDATE staff 
      SET name = COALESCE($1, name),
          email = COALESCE($2, email),
          role = COALESCE($3, role),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $4
      RETURNING *
    `;

    const values = [data.name, data.email, data.role, id];
    const result = await pool.query(query, values);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  static async updateCertifications(id, certifications) {
    const query = `
      UPDATE staff 
      SET certifications = $1,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const values = [JSON.stringify(certifications), id];
    const result = await pool.query(query, values);
    return result.rows[0] ? this.mapRow(result.rows[0]) : null;
  }

  static calculateTrainingCompletion(data) {
    if (data.trainingCompletion !== undefined) {
      return data.trainingCompletion;
    }
    return data.trainingHours ? Math.round((data.trainingHours.completed / data.trainingHours.required) * 100) : 0;
  }

  static mapRow(row) {
    return {
      id: row.id,
      facilityId: row.facility_id,
      name: row.name,
      email: row.email,
      role: row.role,
      hireDate: row.hire_date,
      certifications: row.certifications,
      trainingCompletion: row.training_completion,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

module.exports = StaffDB;
