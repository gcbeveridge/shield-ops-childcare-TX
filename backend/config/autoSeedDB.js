const UserDB = require('../models/UserDB');
const FacilityDB = require('../models/FacilityDB');
const StaffDB = require('../models/StaffDB');
const runMigrations = require('../scripts/runMigrations');
const seedStateRegulations = require('../scripts/seedStateRegulations');

async function autoSeedDB() {
  try {
    // Run database migrations first (adds new columns/tables safely)
    await runMigrations();
    
    // Seed state regulations
    await seedStateRegulations();
    
    const fixedFacilityId = '00000000-0000-0000-0000-000000000001';
    const fixedUserId = '00000000-0000-0000-0000-000000000002';

    const existingUser = await UserDB.findById(fixedUserId);
    if (existingUser) {
      console.log('✅ Database already seeded');
      return;
    }

    console.log('🌱 Auto-seeding PostgreSQL database...');

    const facility = await FacilityDB.create({
      id: fixedFacilityId,
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
      capacity: 60,
      ownerId: fixedUserId
    });

    const user = await UserDB.create({
      id: fixedUserId,
      email: 'director@brightfutures.com',
      password: 'password123',
      name: 'Maria Rodriguez',
      role: 'owner',
      facilityId: facility.id
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
        trainingCompletion: 100
      },
      {
        name: 'Michael Chen',
        email: 'mike.c@brightfutures.com',
        role: 'Teacher',
        hireDate: '2023-03-22',
        certifications: {
          cpr: { valid: true, expiresAt: '2026-03-15', certificateUrl: '' },
          firstAid: { valid: true, expiresAt: '2026-03-15', certificateUrl: '' },
          backgroundCheck: { status: 'Clear', completedAt: '2023-03-20', expiresAt: '2028-03-20' },
          tuberculosisScreening: { status: 'Complete', completedAt: '2023-03-21' }
        },
        trainingCompletion: 100
      },
      {
        name: 'Emily Rodriguez',
        email: 'emily.r@brightfutures.com',
        role: 'Assistant Teacher',
        hireDate: '2024-06-10',
        certifications: {
          cpr: { valid: false, expiresAt: '2024-11-15', certificateUrl: '' },
          firstAid: { valid: true, expiresAt: '2025-12-10', certificateUrl: '' },
          backgroundCheck: { status: 'Clear', completedAt: '2024-06-05', expiresAt: '2029-06-05' },
          tuberculosisScreening: { status: 'Complete', completedAt: '2024-06-08' }
        },
        trainingCompletion: 95
      }
    ];

    for (const staffData of staffMembers) {
      await StaffDB.create({
        ...staffData,
        facilityId: facility.id
      });
    }

    console.log('✅ Auto-seed complete!');
    console.log(`📧 Login: ${user.email} / password123`);
  } catch (error) {
    console.error('❌ Auto-seed failed:', error);
    throw error;
  }
}

module.exports = autoSeedDB;
