const { v4: uuidv4 } = require('uuid');

class Incident {
  constructor({
    id = uuidv4(),
    facilityId,
    type,
    severity,
    description,
    childInfo,
    injuries = [],
    location,
    dateTime,
    witnesses = [],
    immediateActions,
    parentNotified = false,
    parentNotificationMethod = null,
    parentSignature = null,
    parentSignatureDate = null,
    photos = [],
    reportedBy,
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    this.id = id;
    this.facilityId = facilityId;
    this.type = type;
    this.severity = severity;
    this.description = description;
    this.childInfo = childInfo;
    this.injuries = injuries;
    this.location = location;
    this.dateTime = dateTime;
    this.witnesses = witnesses;
    this.immediateActions = immediateActions;
    this.parentNotified = parentNotified;
    this.parentNotificationMethod = parentNotificationMethod;
    this.parentSignature = parentSignature;
    this.parentSignatureDate = parentSignatureDate;
    this.photos = photos;
    this.reportedBy = reportedBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toJSON() {
    return {
      id: this.id,
      facilityId: this.facilityId,
      type: this.type,
      severity: this.severity,
      description: this.description,
      childInfo: this.childInfo,
      injuries: this.injuries,
      location: this.location,
      dateTime: this.dateTime,
      witnesses: this.witnesses,
      immediateActions: this.immediateActions,
      parentNotified: this.parentNotified,
      parentNotificationMethod: this.parentNotificationMethod,
      parentSignature: this.parentSignature,
      parentSignatureDate: this.parentSignatureDate,
      photos: this.photos,
      reportedBy: this.reportedBy,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  validate() {
    const errors = [];

    if (!this.facilityId) errors.push('Facility ID is required');
    if (!this.type) errors.push('Incident type is required');
    if (!this.severity) errors.push('Severity is required');
    if (!this.description) errors.push('Description is required');
    if (!this.childInfo || !this.childInfo.name) errors.push('Child information is required');
    if (!this.location) errors.push('Location is required');
    if (!this.dateTime) errors.push('Date and time are required');
    if (!this.immediateActions) errors.push('Immediate actions taken are required');
    if (!this.reportedBy) errors.push('Reporter information is required');

    const validTypes = ['injury', 'illness', 'behavior', 'other'];
    if (this.type && !validTypes.includes(this.type.toLowerCase())) {
      errors.push(`Type must be one of: ${validTypes.join(', ')}`);
    }

    const validSeverities = ['minor', 'moderate', 'serious'];
    if (this.severity && !validSeverities.includes(this.severity.toLowerCase())) {
      errors.push(`Severity must be one of: ${validSeverities.join(', ')}`);
    }

    return errors;
  }
}

module.exports = Incident;
