const { v4: uuidv4 } = require('uuid');

class Facility {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.name = data.name;
    this.address = {
      street: data.address?.street || '',
      city: data.address?.city || '',
      state: 'TX',
      zip: data.address?.zip || ''
    };
    this.phone = data.phone || '';
    this.email = data.email || '';
    this.licenseNumber = data.licenseNumber || '';
    this.capacity = data.capacity || 60;
    this.ownerId = data.ownerId;
    this.settings = {
      timezone: 'America/Chicago',
      hoursOfOperation: data.settings?.hoursOfOperation || {
        monday: { open: '06:00', close: '18:00' },
        tuesday: { open: '06:00', close: '18:00' },
        wednesday: { open: '06:00', close: '18:00' },
        thursday: { open: '06:00', close: '18:00' },
        friday: { open: '06:00', close: '18:00' },
        saturday: { open: 'closed', close: 'closed' },
        sunday: { open: 'closed', close: 'closed' }
      }
    };
    this.createdAt = data.createdAt || new Date().toISOString();
    this.updatedAt = data.updatedAt || new Date().toISOString();
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      address: this.address,
      phone: this.phone,
      email: this.email,
      licenseNumber: this.licenseNumber,
      capacity: this.capacity,
      ownerId: this.ownerId,
      settings: this.settings,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}

module.exports = Facility;
