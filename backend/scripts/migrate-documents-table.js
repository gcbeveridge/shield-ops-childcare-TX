require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateDocumentsTable() {
  console.log('🔧 Migrating documents table...\n');

  const migrations = [
    {
      name: 'Add description column',
      sql: `ALTER TABLE documents ADD COLUMN IF NOT EXISTS description TEXT;`
    },
    {
      name: 'Add file_size column',
      sql: `ALTER TABLE documents ADD COLUMN IF NOT EXISTS file_size BIGINT;`
    },
    {
      name: 'Add mime_type column',
      sql: `ALTER TABLE documents ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100);`
    },
    {
      name: 'Add tags column',
      sql: `ALTER TABLE documents ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb;`
    },
    {
      name: 'Add form_number column',
      sql: `ALTER TABLE documents ADD COLUMN IF NOT EXISTS form_number VARCHAR(50);`
    },
    {
      name: 'Add index for tags',
      sql: `CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING gin(tags);`
    }
  ];

  let successCount = 0;
  let failCount = 0;

  for (const migration of migrations) {
    try {
      console.log(`⏳ Running: ${migration.name}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql_query: migration.sql });
      
      if (error) {
        // Try direct SQL execution as fallback
        const { error: directError } = await supabase.from('_sql').select(migration.sql);
        
        if (directError) {
          console.log(`⚠️  ${migration.name}: May already exist or requires manual execution`);
          console.log(`   SQL: ${migration.sql}\n`);
          failCount++;
        } else {
          console.log(`✅ ${migration.name}: Success\n`);
          successCount++;
        }
      } else {
        console.log(`✅ ${migration.name}: Success\n`);
        successCount++;
      }
    } catch (err) {
      console.log(`⚠️  ${migration.name}: Needs manual execution`);
      failCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ⚠️  Manual required: ${failCount}`);
  console.log('='.repeat(60) + '\n');

  if (failCount > 0) {
    console.log('⚠️  Some migrations need to be run manually in Supabase SQL Editor.\n');
    console.log('📝 Copy and paste this SQL in Supabase SQL Editor:\n');
    console.log('-'.repeat(60));
    console.log(`
-- Add missing columns to documents table
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS form_number VARCHAR(50);

-- Add index for tags
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING gin(tags);

-- Verify the structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;
    `);
    console.log('-'.repeat(60) + '\n');
    
    console.log('📍 How to run this SQL:');
    console.log('   1. Go to https://app.supabase.com');
    console.log('   2. Select your project');
    console.log('   3. Click "SQL Editor" in the left sidebar');
    console.log('   4. Copy the SQL above');
    console.log('   5. Click "Run" (or Ctrl+Enter)\n');
    console.log('   6. Then run: node scripts/seed-documents.js\n');
  } else {
    console.log('✅ All migrations completed successfully!');
    console.log('🌱 Now run: node scripts/seed-documents.js\n');
  }
}

migrateDocumentsTable();
