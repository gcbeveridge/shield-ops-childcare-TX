const { v4: uuidv4 } = require('uuid');

class Medication {
  constructor({
    id = uuidv4(),
    facilityId,
    childInfo,
    medicationName,
    dosage,
    route,
    schedule,
    startDate,
    endDate,
    prescribedBy,
    parentAuthorization,
    storageInstructions,
    sideEffects = [],
    specialInstructions = '',
    status = 'active',
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    this.id = id;
    this.facilityId = facilityId;
    this.childInfo = childInfo;
    this.medicationName = medicationName;
    this.dosage = dosage;
    this.route = route;
    this.schedule = schedule;
    this.startDate = startDate;
    this.endDate = endDate;
    this.prescribedBy = prescribedBy;
    this.parentAuthorization = parentAuthorization;
    this.storageInstructions = storageInstructions;
    this.sideEffects = sideEffects;
    this.specialInstructions = specialInstructions;
    this.status = status;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toJSON() {
    return {
      id: this.id,
      facilityId: this.facilityId,
      childInfo: this.childInfo,
      medicationName: this.medicationName,
      dosage: this.dosage,
      route: this.route,
      schedule: this.schedule,
      startDate: this.startDate,
      endDate: this.endDate,
      prescribedBy: this.prescribedBy,
      parentAuthorization: this.parentAuthorization,
      storageInstructions: this.storageInstructions,
      sideEffects: this.sideEffects,
      specialInstructions: this.specialInstructions,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  validate() {
    const errors = [];

    if (!this.facilityId) errors.push('Facility ID is required');
    if (!this.childInfo || !this.childInfo.name) errors.push('Child information is required');
    if (!this.medicationName) errors.push('Medication name is required');
    if (!this.dosage) errors.push('Dosage is required');
    if (!this.route) errors.push('Route of administration is required');
    if (!this.schedule) errors.push('Schedule is required');
    if (!this.startDate) errors.push('Start date is required');
    if (!this.prescribedBy) errors.push('Prescriber information is required');
    if (!this.parentAuthorization || !this.parentAuthorization.signedBy) {
      errors.push('Parent authorization is required');
    }

    const validRoutes = ['oral', 'topical', 'inhaled', 'injection', 'eye drops', 'ear drops', 'other'];
    if (this.route && !validRoutes.includes(this.route.toLowerCase())) {
      errors.push(`Route must be one of: ${validRoutes.join(', ')}`);
    }

    const validStatuses = ['active', 'completed', 'discontinued'];
    if (this.status && !validStatuses.includes(this.status.toLowerCase())) {
      errors.push(`Status must be one of: ${validStatuses.join(', ')}`);
    }

    return errors;
  }
}

module.exports = Medication;
