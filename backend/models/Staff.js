const { v4: uuidv4 } = require('uuid');

class Staff {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.facilityId = data.facilityId;
    this.name = data.name;
    this.email = data.email || '';
    this.role = data.role || 'Assistant Teacher';
    this.hireDate = data.hireDate || new Date().toISOString().split('T')[0];
    this.certifications = {
      cpr: {
        valid: data.certifications?.cpr?.valid || false,
        expiresAt: data.certifications?.cpr?.expiresAt || null,
        certificateUrl: data.certifications?.cpr?.certificateUrl || ''
      },
      firstAid: {
        valid: data.certifications?.firstAid?.valid || false,
        expiresAt: data.certifications?.firstAid?.expiresAt || null,
        certificateUrl: data.certifications?.firstAid?.certificateUrl || ''
      },
      backgroundCheck: {
        status: data.certifications?.backgroundCheck?.status || 'Pending',
        completedAt: data.certifications?.backgroundCheck?.completedAt || null,
        expiresAt: data.certifications?.backgroundCheck?.expiresAt || null
      },
      tuberculosisScreening: {
        status: data.certifications?.tuberculosisScreening?.status || 'Pending',
        completedAt: data.certifications?.tuberculosisScreening?.completedAt || null
      }
    };
    this.trainingHours = {
      required: data.role === 'Director' ? 20 : 15,
      completed: data.trainingHours?.completed || 0,
      year: new Date().getFullYear()
    };
    this.active = data.active !== undefined ? data.active : true;
    this.createdAt = data.createdAt || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      facilityId: this.facilityId,
      name: this.name,
      email: this.email,
      role: this.role,
      hireDate: this.hireDate,
      certifications: this.certifications,
      trainingHours: this.trainingHours,
      active: this.active,
      createdAt: this.createdAt
    };
  }
}

module.exports = Staff;
