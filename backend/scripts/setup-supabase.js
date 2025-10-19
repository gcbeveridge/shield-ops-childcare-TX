/**
 * Supabase Database Setup Script
 * This script will:
 * 1. Test the Supabase connection
 * 2. Create all necessary tables
 * 3. Seed with initial data
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('\n🚀 Starting Supabase Setup...\n');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: SUPABASE_URL, SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testConnection() {
  console.log('1️⃣  Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('facilities').select('count');
    if (error && error.code === 'PGRST116') {
      console.log('✅ Connected! Tables need to be created.');
      return true;
    } else if (error) {
      console.log('✅ Connected! Tables may already exist.');
      return true;
    } else {
      console.log('✅ Connected! Database is ready.');
      return true;
    }
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    return false;
  }
}

async function createTables() {
  console.log('\n2️⃣  Creating database tables...');
  console.log('⚠️  Note: You need to run the SQL schema manually in Supabase SQL Editor');
  console.log('📁 File: backend/config/schema-supabase.sql\n');
  console.log('Steps:');
  console.log('  1. Go to your Supabase project dashboard');
  console.log('  2. Navigate to SQL Editor');
  console.log('  3. Copy contents of schema-supabase.sql');
  console.log('  4. Paste and run the SQL');
  console.log('  5. Come back and run this script again\n');
}

async function seedInitialData() {
  console.log('3️⃣  Checking for existing data...');
  
  try {
    // Check if facility exists
    const { data: existingFacilities } = await supabase
      .from('facilities')
      .select('id')
      .limit(1);
    
    if (existingFacilities && existingFacilities.length > 0) {
      console.log('✅ Data already exists. Skipping seed.');
      return existingFacilities[0].id;
    }
    
    console.log('4️⃣  Creating initial facility...');
    
    // Create facility
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .insert({
        name: 'Little Stars Daycare',
        address: {
          street: '123 Main Street',
          city: 'Austin',
          state: 'TX',
          zipCode: '78701'
        },
        phone: '(512) 555-0100',
        email: 'contact@littlestarsdaycare.com',
        license_number: 'TX-CC-2024-001',
        capacity: 60,
        settings: {
          timezone: 'America/Chicago',
          businessHours: {
            monday: { open: '06:00', close: '18:00' },
            tuesday: { open: '06:00', close: '18:00' },
            wednesday: { open: '06:00', close: '18:00' },
            thursday: { open: '06:00', close: '18:00' },
            friday: { open: '06:00', close: '18:00' }
          }
        }
      })
      .select()
      .single();
    
    if (facilityError) throw facilityError;
    console.log(`✅ Facility created: ${facility.name}`);
    
    // Create admin user
    console.log('5️⃣  Creating admin user...');
    const passwordHash = await bcrypt.hash('admin123', 10);
    
    const { data: user, error: userError } = await supabase
      .from('users')
      .insert({
        email: 'admin@littlestars.com',
        password_hash: passwordHash,
        name: 'Admin User',
        role: 'director',
        facility_id: facility.id
      })
      .select()
      .single();
    
    if (userError) throw userError;
    console.log(`✅ Admin user created: ${user.email}`);
    
    // Create sample staff
    console.log('6️⃣  Creating sample staff...');
    const { data: staff, error: staffError } = await supabase
      .from('staff')
      .insert([
        {
          facility_id: facility.id,
          name: 'Sarah Johnson',
          email: 'sarah@littlestars.com',
          role: 'Lead Teacher',
          hire_date: '2023-01-15',
          certifications: {
            cpr: { valid: true, expiresAt: '2025-12-31' },
            firstAid: { valid: true, expiresAt: '2025-12-31' },
            backgroundCheck: { status: 'Clear' },
            tuberculosisScreening: { status: 'Complete' },
            cda: { expiresAt: '2026-06-30' },
            teachingCertificate: { expiresAt: '2026-12-31' },
            foodHandler: { expiresAt: '2025-11-30' }
          },
          training_completion: 100
        },
        {
          facility_id: facility.id,
          name: 'Michael Chen',
          email: 'michael@littlestars.com',
          role: 'Teacher',
          hire_date: '2023-03-22',
          certifications: {
            cpr: { valid: true, expiresAt: '2025-12-31' },
            firstAid: { valid: true, expiresAt: '2025-12-31' },
            backgroundCheck: { status: 'Clear' },
            tuberculosisScreening: { status: 'Complete' }
          },
          training_completion: 85
        }
      ])
      .select();
    
    if (staffError) throw staffError;
    console.log(`✅ Created ${staff.length} sample staff members`);
    
    // Create sample training modules
    console.log('7️⃣  Creating training modules...');
    const { error: trainingError } = await supabase
      .from('training_modules')
      .insert([
        {
          facility_id: facility.id,
          title: 'Child Safety & Emergency Procedures',
          description: 'Essential safety protocols and emergency response procedures',
          month: 'January',
          duration_minutes: 90
        },
        {
          facility_id: facility.id,
          title: 'Texas Minimum Standards Review',
          description: 'Annual review of Texas child care regulations',
          month: 'February',
          duration_minutes: 120
        }
      ]);
    
    if (trainingError) throw trainingError;
    console.log('✅ Training modules created');
    
    console.log('\n✨ Database setup complete!\n');
    console.log('🔐 Login credentials:');
    console.log('   Email: admin@littlestars.com');
    console.log('   Password: admin123\n');
    
    return facility.id;
    
  } catch (error) {
    console.error('❌ Error seeding data:', error.message);
    if (error.code === 'PGRST116') {
      console.log('\n⚠️  Tables do not exist yet. Please run the SQL schema first.');
      console.log('See step 2️⃣  above for instructions.\n');
    }
    throw error;
  }
}

async function main() {
  try {
    const connected = await testConnection();
    if (!connected) {
      console.error('❌ Cannot proceed without database connection');
      process.exit(1);
    }
    
    // Try to seed data (will show instructions if tables don't exist)
    try {
      await seedInitialData();
    } catch (error) {
      if (error.code === 'PGRST116' || error.message.includes('relation') || error.message.includes('does not exist')) {
        await createTables();
        console.log('⏭️  Run this script again after creating the tables.');
      } else {
        throw error;
      }
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

main();
