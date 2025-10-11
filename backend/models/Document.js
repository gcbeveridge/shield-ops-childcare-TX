const { v4: uuidv4 } = require('uuid');

class Document {
  constructor({
    id = uuidv4(),
    facilityId,
    category,
    name,
    description = '',
    fileName,
    filePath,
    fileSize,
    mimeType,
    uploadedBy,
    expirationDate = null,
    tags = [],
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    this.id = id;
    this.facilityId = facilityId;
    this.category = category;
    this.name = name;
    this.description = description;
    this.fileName = fileName;
    this.filePath = filePath;
    this.fileSize = fileSize;
    this.mimeType = mimeType;
    this.uploadedBy = uploadedBy;
    this.expirationDate = expirationDate;
    this.tags = tags;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  getExpirationStatus() {
    if (!this.expirationDate) return 'none';
    
    const expDate = new Date(this.expirationDate);
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expDate - now) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiration < 0) return 'expired';
    if (daysUntilExpiration <= 30) return 'expiring_soon';
    return 'valid';
  }

  toJSON() {
    return {
      id: this.id,
      facilityId: this.facilityId,
      category: this.category,
      name: this.name,
      description: this.description,
      fileName: this.fileName,
      filePath: this.filePath,
      fileSize: this.fileSize,
      mimeType: this.mimeType,
      uploadedBy: this.uploadedBy,
      expirationDate: this.expirationDate,
      expirationStatus: this.getExpirationStatus(),
      tags: this.tags,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  validate() {
    const errors = [];
    
    if (!this.facilityId) errors.push('Facility ID is required');
    if (!this.category) errors.push('Category is required');
    if (!this.name || this.name.trim().length === 0) errors.push('Document name is required');
    if (!this.fileName) errors.push('File name is required');
    if (!this.filePath) errors.push('File path is required');
    
    const validCategories = ['licenses', 'policies', 'inspections', 'certifications', 'training'];
    if (this.category && !validCategories.includes(this.category.toLowerCase())) {
      errors.push(`Category must be one of: ${validCategories.join(', ')}`);
    }
    
    return errors;
  }
}

module.exports = Document;
