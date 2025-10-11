const db = require('./database');
const User = require('../models/User');
const Facility = require('../models/Facility');
const Staff = require('../models/Staff');
const Incident = require('../models/Incident');
const Medication = require('../models/Medication');
const MedicationLog = require('../models/MedicationLog');
const { TEXAS_COMPLIANCE_REQUIREMENTS } = require('./constants');

async function autoSeed() {
  try {
    // Check if already seeded
    const existingUser = await db.get('users:director@brightfutures.com');
    if (existingUser) {
      console.log('✅ Database already seeded');
      return;
    }

    console.log('🌱 Auto-seeding database...');
    
    // Use fixed IDs for consistent auto-login across restarts
    const fixedFacilityId = '00000000-0000-0000-0000-000000000001';
    const fixedUserId = '00000000-0000-0000-0000-000000000002';
    
    const facility = new Facility({
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
      capacity: 60
    });

    const user = new User({
      id: fixedUserId,
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
    await db.set(`users:director@brightfutures.com`, { userId: user.id }); // Lookup by email

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

    const incidents = [
      new Incident({
        facilityId: facility.id,
        type: 'injury',
        severity: 'minor',
        description: 'Child fell on playground and scraped knee',
        childInfo: { name: 'Tommy Anderson', age: 4, classroom: 'Sunshine Room' },
        injuries: ['Scraped knee - right side', 'Minor bruising'],
        location: 'Outdoor Playground',
        dateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        witnesses: ['Sarah Johnson', 'Emma Williams'],
        immediateActions: 'Cleaned wound with soap and water, applied bandage, applied ice pack for 5 minutes',
        parentNotified: true,
        parentNotificationMethod: 'Phone call at 10:45 AM',
        reportedBy: 'Sarah Johnson'
      }),
      new Incident({
        facilityId: facility.id,
        type: 'illness',
        severity: 'moderate',
        description: 'Child complained of stomach ache and vomited once',
        childInfo: { name: 'Lily Chen', age: 3, classroom: 'Rainbow Room' },
        injuries: [],
        location: 'Rainbow Room Classroom',
        dateTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        witnesses: ['Mike Chen'],
        immediateActions: 'Moved child to quiet area, took temperature (99.2°F), contacted parent for pickup',
        parentNotified: true,
        parentNotificationMethod: 'Phone call at 2:15 PM - parent picked up at 2:45 PM',
        reportedBy: 'Mike Chen',
        parentSignature: {
          signature: 'Jennifer Chen',
          signedBy: 'Jennifer Chen',
          signedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        parentSignatureDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }),
      new Incident({
        facilityId: facility.id,
        type: 'behavior',
        severity: 'minor',
        description: 'Child had difficulty sharing toys and pushed another child',
        childInfo: { name: 'Max Rodriguez', age: 5, classroom: 'Sunshine Room' },
        injuries: [],
        location: 'Sunshine Room Block Area',
        dateTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        witnesses: ['Emma Williams'],
        immediateActions: 'Redirected child to different activity, discussed sharing and gentle hands, both children reconciled',
        parentNotified: true,
        parentNotificationMethod: 'In-person at pickup time',
        reportedBy: 'Emma Williams'
      })
    ];

    for (const incident of incidents) {
      await db.set(`incident:${facility.id}:${incident.id}`, incident.toJSON());
    }

    const medications = [
      new Medication({
        facilityId: facility.id,
        childInfo: { name: 'Sophie Martinez', age: 4, classroom: 'Rainbow Room' },
        medicationName: 'Amoxicillin',
        dosage: '250mg',
        route: 'oral',
        schedule: '3 times daily with meals (8:00 AM, 12:00 PM, 4:00 PM)',
        startDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        prescribedBy: 'Dr. Sarah Williams, Austin Pediatrics',
        parentAuthorization: {
          signedBy: 'Maria Martinez',
          signedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          relationship: 'Mother'
        },
        storageInstructions: 'Refrigerate, shake well before use',
        sideEffects: ['Possible mild stomach upset', 'Diarrhea'],
        specialInstructions: 'Give with food to reduce stomach upset',
        status: 'active'
      }),
      new Medication({
        facilityId: facility.id,
        childInfo: { name: 'Oliver Smith', age: 5, classroom: 'Sunshine Room' },
        medicationName: 'Albuterol Inhaler',
        dosage: '2 puffs',
        route: 'inhaled',
        schedule: 'As needed for wheezing or difficulty breathing',
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString(),
        prescribedBy: 'Dr. Michael Chen, Children\'s Health Clinic',
        parentAuthorization: {
          signedBy: 'Rachel Smith',
          signedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          relationship: 'Mother'
        },
        storageInstructions: 'Store at room temperature, keep away from heat',
        sideEffects: ['Rapid heartbeat', 'Shakiness', 'Nervousness'],
        specialInstructions: 'Use spacer device. Wait 1 minute between puffs. Notify parent immediately after use.',
        status: 'active'
      })
    ];

    for (const medication of medications) {
      await db.set(`medication:${facility.id}:${medication.id}`, medication.toJSON());
    }

    const medicationLogs = [
      new MedicationLog({
        medicationId: medications[0].id,
        facilityId: facility.id,
        administeredBy: { id: staffMembers[0].id, name: 'Sarah Johnson' },
        witnessedBy: { id: staffMembers[1].id, name: 'Mike Chen' },
        dateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        dosageGiven: '250mg',
        notes: 'Given with lunch',
        childResponse: 'No adverse reactions observed'
      }),
      new MedicationLog({
        medicationId: medications[0].id,
        facilityId: facility.id,
        administeredBy: { id: staffMembers[2].id, name: 'Emma Williams' },
        witnessedBy: { id: staffMembers[0].id, name: 'Sarah Johnson' },
        dateTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        dosageGiven: '250mg',
        notes: 'Given with lunch',
        childResponse: 'Child tolerated well'
      })
    ];

    for (const log of medicationLogs) {
      await db.set(`medication-log:${facility.id}:${log.id}`, log.toJSON());
    }

    console.log('✅ Auto-seed complete!');
    console.log('📧 Login: director@brightfutures.com / password123');
  } catch (error) {
    console.error('❌ Auto-seed error:', error);
  }
}

module.exports = autoSeed;
