const pool = require('../config/db'); // Current PostgreSQL
const supabase = require('../config/supabase'); // Supabase

const tables = [
  'facilities',
  'users',
  'staff',
  'incidents',
  'medications',
  'medication_logs',
  'compliance_items',
  'daily_checklists',
  'training_modules',
  'training_completions',
  'documents'
];

async function migrateTable(tableName) {
  try {
    console.log(`\n📦 Migrating table: ${tableName}`);
    
    const result = await pool.query(`SELECT * FROM ${tableName}`);
    const rows = result.rows;
    
    if (rows.length === 0) {
      console.log(`  ⏭️  No data to migrate`);
      return { success: true, count: 0 };
    }
    
    console.log(`  Found ${rows.length} rows`);
    
    const { data, error } = await supabase
      .from(tableName)
      .upsert(rows);
    
    if (error) {
      console.error(`  ❌ Error:`, error.message);
      return { success: false, count: 0, error };
    }
    
    console.log(`  ✅ Migrated ${rows.length} rows`);
    return { success: true, count: rows.length };
    
  } catch (error) {
    console.error(`  ❌ Failed:`, error.message);
    return { success: false, count: 0, error };
  }
}

async function runMigration() {
  console.log('🚀 Starting Shield Ops data migration to Supabase\n');
  console.log('📊 Source: Current PostgreSQL (Neon)');
  console.log('📊 Target: Supabase PostgreSQL\n');
  console.log('='.repeat(60));
  
  const results = {
    total: 0,
    success: 0,
    failed: 0,
    errors: []
  };
  
  for (const tableName of tables) {
    const result = await migrateTable(tableName);
    results.total++;
    
    if (result.success) {
      results.success++;
    } else {
      results.failed++;
      results.errors.push({ table: tableName, error: result.error });
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('\n📊 Migration Summary:');
  console.log(`   Total Tables: ${results.total}`);
  console.log(`   ✅ Success: ${results.success}`);
  console.log(`   ❌ Failed: ${results.failed}`);
  
  if (results.errors.length > 0) {
    console.log('\n❌ Errors:');
    results.errors.forEach(err => {
      console.log(`   - ${err.table}: ${err.error.message}`);
    });
  }
  
  console.log('\n✅ Migration complete!\n');
  
  await pool.end();
  process.exit(0);
}

runMigration().catch(error => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
});
