require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...\n');

    // ============================================
    // 1. CREATE FACILITY & USER
    // ============================================
    console.log('📍 Creating facility and user...');
    
    const facilityId = '00000000-0000-0000-0000-000000000001';
    const userId = '00000000-0000-0000-0000-000000000002';

    // Check if facility exists
    const { data: existingFacility } = await supabase
      .from('facilities')
      .select('id')
      .eq('id', facilityId)
      .single();

    if (existingFacility) {
      console.log('✅ Facility already exists, skipping...');
    } else {
      // Create facility
      const { error: facilityError } = await supabase
        .from('facilities')
        .insert({
          id: facilityId,
          name: 'Bright Futures Learning Center',
          address: {
            street: '123 Main Street',
            city: 'Austin',
            state: 'TX',
            zipCode: '78701'
          },
          phone: '512-555-0100',
          email: 'contact@brightfutures.com',
          license_number: 'TX-DAY-12345',
          capacity: 60,
          owner_id: userId
        });

      if (facilityError) throw facilityError;
      console.log('✅ Facility created: Bright Futures Learning Center');
    }

    // Check if user exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'director@brightfutures.com')
      .single();

    if (existingUser) {
      console.log('✅ User already exists, skipping...');
    } else {
      // Create user
      const passwordHash = await bcrypt.hash('password123', 10);
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: 'director@brightfutures.com',
          password_hash: passwordHash,
          name: 'Maria Rodriguez',
          role: 'owner',
          facility_id: facilityId
        });

      if (userError) throw userError;
      console.log('✅ User created: director@brightfutures.com / password123');
    }

    // ============================================
    // 2. SEED STAFF MEMBERS (Essential Only)
    // ============================================
    console.log('\n👥 Seeding staff members...');
    
    const staffMembers = [
      {
        id: '00000000-0000-0000-0000-000000000003',
        facility_id: facilityId,
        name: 'Sarah Johnson',
        email: 'sarah.j@brightfutures.com',
        role: 'Lead Teacher',
        hire_date: '2023-01-15',
        certifications: {
          phone: '512-555-0101',
          emergencyContact: 'John Johnson (512-555-0102)',
          cpr: { valid: true, expiresAt: '2025-12-15' },
          firstAid: { valid: true, expiresAt: '2025-12-15' },
          backgroundCheck: { status: 'Clear', completedAt: '2023-01-10', expiresAt: '2028-01-10' }
        },
        training_completion: 18
      },
      {
        id: '00000000-0000-0000-0000-000000000004',
        facility_id: facilityId,
        name: 'Michael Chen',
        email: 'mike.c@brightfutures.com',
        role: 'Assistant Teacher',
        hire_date: '2024-03-01',
        certifications: {
          phone: '512-555-0103',
          emergencyContact: 'Lisa Chen (512-555-0104)',
          cpr: { valid: true, expiresAt: '2026-03-15' },
          firstAid: { valid: false, expiresAt: '2024-09-01' },
          backgroundCheck: { status: 'Clear', completedAt: '2024-02-20', expiresAt: '2029-02-20' }
        },
        training_completion: 12
      },
      {
        id: '00000000-0000-0000-0000-000000000005',
        facility_id: facilityId,
        name: 'Emma Williams',
        email: 'emma.w@brightfutures.com',
        role: 'Lead Teacher',
        hire_date: '2022-08-01',
        certifications: {
          phone: '512-555-0105',
          emergencyContact: 'David Williams (512-555-0106)',
          cpr: { valid: true, expiresAt: '2026-06-30' },
          firstAid: { valid: true, expiresAt: '2026-06-30' },
          backgroundCheck: { status: 'Clear', completedAt: '2022-07-20', expiresAt: '2027-07-20' }
        },
        training_completion: 20
      },
      {
        id: '00000000-0000-0000-0000-000000000006',
        facility_id: facilityId,
        name: 'David Martinez',
        email: 'david.m@brightfutures.com',
        role: 'Assistant Teacher',
        hire_date: '2024-06-15',
        certifications: {
          phone: '512-555-0107',
          emergencyContact: 'Maria Martinez (512-555-0108)',
          cpr: { valid: true, expiresAt: '2026-08-01' },
          firstAid: { valid: true, expiresAt: '2026-08-01' },
          backgroundCheck: { status: 'Clear', completedAt: '2024-06-10', expiresAt: '2029-06-10' }
        },
        training_completion: 8
      }
    ];

    for (const staff of staffMembers) {
      const { data: existing } = await supabase
        .from('staff')
        .select('id')
        .eq('id', staff.id)
        .single();

      if (!existing) {
        const { error } = await supabase.from('staff').insert(staff);
        if (error) throw error;
        console.log(`✅ Staff: ${staff.name} (${staff.role})`);
      } else {
        console.log(`⏭️  Staff exists: ${staff.name}`);
      }
    }

    // ============================================
    // 3. SEED INCIDENTS (Recent Only)
    // ============================================
    console.log('\n🚨 Seeding incidents...');
    
    const incidents = [
      {
        id: '00000000-0000-0000-0000-000000000010',
        facility_id: facilityId,
        type: 'injury',
        severity: 'minor',
        description: 'Child fell on playground and scraped knee',
        child_info: {
          name: 'Tommy Anderson',
          age: 4
        },
        location: 'Outdoor Playground',
        occurred_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        immediate_actions: 'Cleaned wound with soap and water, applied bandage, applied ice pack for 5 minutes',
        parent_notified: true,
        reported_by: 'Sarah Johnson',
        parent_signature: {
          signedBy: 'John Anderson',
          signedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          notificationMethod: 'Phone call at 10:45 AM'
        }
      },
      {
        id: '00000000-0000-0000-0000-000000000011',
        facility_id: facilityId,
        type: 'illness',
        severity: 'moderate',
        description: 'Child complained of stomach ache and vomited once',
        child_info: {
          name: 'Lily Chen',
          age: 3
        },
        location: 'Rainbow Room Classroom',
        occurred_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        immediate_actions: 'Moved child to quiet area, took temperature (99.2°F), contacted parent for pickup',
        parent_notified: true,
        reported_by: 'Michael Chen',
        parent_signature: {
          signedBy: 'Jennifer Chen',
          signedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          notificationMethod: 'Phone call at 2:15 PM - parent picked up at 2:45 PM'
        }
      },
      {
        id: '00000000-0000-0000-0000-000000000012',
        facility_id: facilityId,
        type: 'behavior',
        severity: 'minor',
        description: 'Child had difficulty sharing toys and pushed another child',
        child_info: {
          name: 'Max Rodriguez',
          age: 5
        },
        location: 'Sunshine Room Block Area',
        occurred_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        immediate_actions: 'Redirected child to different activity, discussed sharing and gentle hands, both children reconciled',
        parent_notified: true,
        reported_by: 'Emma Williams',
        parent_signature: {
          signedBy: 'Carmen Rodriguez',
          signedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          notificationMethod: 'In-person at pickup time'
        }
      }
    ];

    for (const incident of incidents) {
      const { data: existing } = await supabase
        .from('incidents')
        .select('id')
        .eq('id', incident.id)
        .single();

      if (!existing) {
        const { error } = await supabase.from('incidents').insert(incident);
        if (error) throw error;
        console.log(`✅ Incident: ${incident.type} - ${incident.child_name}`);
      } else {
        console.log(`⏭️  Incident exists: ${incident.child_name}`);
      }
    }

    // ============================================
    // 4. SEED MEDICATIONS (Active Only)
    // ============================================
    console.log('\n💊 Seeding medications...');
    
    const medications = [
      {
        id: '00000000-0000-0000-0000-000000000020',
        facility_id: facilityId,
        child_name: 'Sophie Martinez',
        medication_name: 'Amoxicillin',
        dosage: '250mg',
        route: 'oral',
        frequency: '3 times daily with meals (8:00 AM, 12:00 PM, 4:00 PM)',
        start_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        prescriber_info: {
          name: 'Dr. Sarah Williams',
          clinic: 'Austin Pediatrics',
          phone: '512-555-9000'
        },
        parent_authorization: {
          signedBy: 'Maria Martinez',
          signedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          relationship: 'Mother'
        },
        special_instructions: 'Refrigerate, shake well before use. Give with food to reduce stomach upset. Possible side effects: mild stomach upset, diarrhea.',
        active: true
      },
      {
        id: '00000000-0000-0000-0000-000000000021',
        facility_id: facilityId,
        child_name: 'Oliver Smith',
        medication_name: 'Albuterol Inhaler',
        dosage: '2 puffs',
        route: 'inhaled',
        frequency: 'As needed for wheezing or difficulty breathing',
        start_date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end_date: new Date(Date.now() + 335 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        prescriber_info: {
          name: 'Dr. Michael Chen',
          clinic: 'Children\'s Health Clinic',
          phone: '512-555-9001'
        },
        parent_authorization: {
          signedBy: 'Rachel Smith',
          signedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          relationship: 'Mother'
        },
        special_instructions: 'Store at room temperature, keep away from heat. Use spacer device. Wait 1 minute between puffs. Notify parent immediately after use. Possible side effects: rapid heartbeat, shakiness, nervousness.',
        active: true
      }
    ];

    for (const medication of medications) {
      const { data: existing } = await supabase
        .from('medications')
        .select('id')
        .eq('id', medication.id)
        .single();

      if (!existing) {
        const { error } = await supabase.from('medications').insert(medication);
        if (error) throw error;
        console.log(`✅ Medication: ${medication.medication_name} for ${medication.child_name}`);
      } else {
        console.log(`⏭️  Medication exists: ${medication.medication_name}`);
      }
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n✅ Database seeding complete!\n');
    console.log('📊 Summary:');
    console.log(`   - Facility: Bright Futures Learning Center`);
    console.log(`   - User: director@brightfutures.com / password123`);
    console.log(`   - Staff: ${staffMembers.length} members`);
    console.log(`   - Incidents: ${incidents.length} reports`);
    console.log(`   - Medications: ${medications.length} authorizations`);
    console.log('\n🎯 Ready to test!');
    console.log('   Login at: http://localhost:5000/index-modular.html');
    console.log('   Email: director@brightfutures.com');
    console.log('   Password: password123\n');

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();
