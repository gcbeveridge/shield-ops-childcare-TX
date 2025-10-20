const { v4: uuidv4 } = require('uuid');

class MedicationLog {
  constructor({
    id = uuidv4(),
    medicationId,
    facilityId,
    administeredBy,
    witnessedBy,
    dateTime,
    dosageGiven,
    notes = '',
    childResponse = '',
    photo = null,
    photoFilename = null,
    createdAt = new Date().toISOString()
  }) {
    this.id = id;
    this.medicationId = medicationId;
    this.facilityId = facilityId;
    this.administeredBy = administeredBy;
    this.witnessedBy = witnessedBy;
    this.dateTime = dateTime;
    this.dosageGiven = dosageGiven;
    this.notes = notes;
    this.childResponse = childResponse;
    this.photo = photo;
    this.photoFilename = photoFilename;
    this.createdAt = createdAt;
  }

  toJSON() {
    return {
      id: this.id,
      medicationId: this.medicationId,
      facilityId: this.facilityId,
      administeredBy: this.administeredBy,
      witnessedBy: this.witnessedBy,
      dateTime: this.dateTime,
      dosageGiven: this.dosageGiven,
      notes: this.notes,
      childResponse: this.childResponse,
      photo: this.photo,
      photoFilename: this.photoFilename,
      createdAt: this.createdAt
    };
  }

  validate() {
    const errors = [];

    if (!this.medicationId) errors.push('Medication ID is required');
    if (!this.facilityId) errors.push('Facility ID is required');
    if (!this.administeredBy || !this.administeredBy.name) {
      errors.push('Administrator information is required');
    }
    if (!this.witnessedBy || !this.witnessedBy.name) {
      errors.push('Witness information is required (Texas §744.2655 requires dual verification)');
    }
    if (!this.dateTime) errors.push('Date and time are required');
    if (!this.dosageGiven) errors.push('Dosage given is required');

    if (this.administeredBy && this.witnessedBy && 
        this.administeredBy.id === this.witnessedBy.id) {
      errors.push('Administrator and witness must be different staff members');
    }

    return errors;
  }
}

module.exports = MedicationLog;
