const express = require('express');
const router = express.Router();
const db = require('../config/database');
const User = require('../models/User');
const Facility = require('../models/Facility');
const Staff = require('../models/Staff');
const { TEXAS_COMPLIANCE_REQUIREMENTS } = require('../config/constants');

router.post('/seed', async (req, res) => {
  try {
    await db.clear();

    const facility = new Facility({
      name: 'Bright Futures Learning Center',
      address: {
        street: '123 Main Street',
        city: 'Austin',
        state: 'TX',
        zip: '78701'
      },
      phone: '512-555-0100',
      email: 'contact@brightfutures.com',
      licenseNumber: 'TX-DAY-12345',
      capacity: 60
    });

    const user = new User({
      email: 'director@brightfutures.com',
      name: 'Maria Rodriguez',
      role: 'owner',
      facilityId: facility.id
    });

    await user.setPassword('password123');
    facility.ownerId = user.id;

    await db.set(`facilities:${facility.id}`, facility.toJSON());
    await db.set(`users:${user.id}`, {
      ...user.toJSON(),
      passwordHash: user.passwordHash
    });

    const staffMembers = [
      {
        name: 'Sarah Johnson',
        email: 'sarah.j@brightfutures.com',
        role: 'Lead Teacher',
        hireDate: '2023-01-15',
        certifications: {
          cpr: { valid: true, expiresAt: '2025-12-15', certificateUrl: '' },
          firstAid: { valid: true, expiresAt: '2025-12-15', certificateUrl: '' },
          backgroundCheck: { status: 'Clear', completedAt: '2023-01-10', expiresAt: '2028-01-10' },
          tuberculosisScreening: { status: 'Complete', completedAt: '2023-01-12' }
        },
        trainingHours: { required: 15, completed: 18, year: 2025 }
      },
      {
        name: 'Mike Chen',
        email: 'mike.c@brightfutures.com',
        role: 'Assistant Teacher',
        hireDate: '2024-03-01',
        certifications: {
          cpr: { valid: true, expiresAt: '2026-03-15', certificateUrl: '' },
          firstAid: { valid: false, expiresAt: '2024-09-01', certificateUrl: '' },
          backgroundCheck: { status: 'Clear', completedAt: '2024-02-20', expiresAt: '2029-02-20' },
          tuberculosisScreening: { status: 'Complete', completedAt: '2024-02-25' }
        },
        trainingHours: { required: 15, completed: 12, year: 2025 }
      },
      {
        name: 'Emma Williams',
        email: 'emma.w@brightfutures.com',
        role: 'Lead Teacher',
        hireDate: '2022-08-01',
        certifications: {
          cpr: { valid: true, expiresAt: '2026-06-30', certificateUrl: '' },
          firstAid: { valid: true, expiresAt: '2026-06-30', certificateUrl: '' },
          backgroundCheck: { status: 'Clear', completedAt: '2022-07-20', expiresAt: '2027-07-20' },
          tuberculosisScreening: { status: 'Complete', completedAt: '2022-07-25' }
        },
        trainingHours: { required: 15, completed: 20, year: 2025 }
      }
    ];

    for (const staffData of staffMembers) {
      const staff = new Staff({
        ...staffData,
        facilityId: facility.id
      });
      await db.set(`staff:${facility.id}:${staff.id}`, staff.toJSON());
    }

    for (let index = 0; index < TEXAS_COMPLIANCE_REQUIREMENTS.length; index++) {
      const req = TEXAS_COMPLIANCE_REQUIREMENTS[index];
      const complianceItem = {
        ...req,
        status: index < 11 ? 'complete' : 'pending',
        completedAt: index < 11 ? new Date().toISOString() : null,
        completedBy: index < 11 ? user.name : null
      };
      await db.set(`compliance:${facility.id}:${req.id}`, complianceItem);
    }

    res.json({
      message: 'Database seeded successfully!',
      credentials: {
        email: 'director@brightfutures.com',
        password: 'password123'
      },
      facility: facility.toJSON(),
      staffCount: staffMembers.length
    });
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: 'Failed to seed database' });
  }
});

module.exports = router;
