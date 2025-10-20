require('dotenv').config();
const { Client } = require('pg');

async function migrateDocumentsTable() {
  console.log('🔧 Adding missing columns to documents table...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check current columns
    console.log('📋 Checking existing columns...');
    const checkColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'documents'
      ORDER BY ordinal_position;
    `);
    
    console.log('Current columns:');
    checkColumns.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });
    console.log('');

    // Add missing columns
    const migrations = [
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size BIGINT',
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100)',
      "ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb",
      'ALTER TABLE documents ADD COLUMN IF NOT EXISTS form_number VARCHAR(50)',
      'CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING gin(tags)'
    ];

    console.log('⏳ Running migrations...\n');
    for (const sql of migrations) {
      try {
        await client.query(sql);
        console.log(`✅ ${sql.substring(0, 60)}...`);
      } catch (err) {
        console.log(`⚠️  ${err.message}`);
      }
    }

    // Verify new columns
    console.log('\n📋 Verifying updated columns...');
    const verifyColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'documents'
      ORDER BY ordinal_position;
    `);
    
    console.log('Updated columns:');
    verifyColumns.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });

    console.log('\n✅ Migration complete!\n');
    console.log('🔄 Now reloading Supabase schema cache...');
    
    // Force Supabase to reload its schema cache
    await client.query('NOTIFY pgrst, \'reload schema\'');
    
    console.log('✅ Schema cache reload signal sent!\n');
    console.log('⏳ Waiting 3 seconds for cache to refresh...\n');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ Ready to seed documents!');
    console.log('🌱 Run: node scripts/seed-documents.js\n');

  } catch (error) {
    console.error('❌ Migration error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrateDocumentsTable();
