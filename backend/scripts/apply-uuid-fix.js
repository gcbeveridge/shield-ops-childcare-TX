#!/usr/bin/env node
/**
 * Apply UUID Generation Fix to Supabase Database
 * 
 * This script fixes the "null value in column 'id'" error by ensuring
 * all tables use gen_random_uuid() for automatic UUID generation.
 * 
 * Usage: node backend/scripts/apply-uuid-fix.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Error: Supabase credentials not found in environment variables');
  console.error('   Please set SUPABASE_URL and SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function applyFix() {
  console.log('🔧 Applying UUID Generation Fix...\n');

  try {
    // Read the SQL fix file
    const sqlFile = path.join(__dirname, 'fix-uuid-generation.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📝 SQL Script loaded from:', sqlFile);
    console.log('🚀 Executing SQL commands...\n');

    // Note: Supabase JS client doesn't support raw SQL execution
    // User needs to run this in SQL Editor
    console.log('⚠️  IMPORTANT: Supabase JS client cannot execute raw SQL.');
    console.log('   Please follow these steps:\n');
    console.log('   1. Go to your Supabase dashboard');
    console.log('   2. Navigate to: SQL Editor');
    console.log('   3. Copy the SQL from: backend/scripts/fix-uuid-generation.sql');
    console.log('   4. Paste and run the script');
    console.log('   5. Verify the output shows updated defaults\n');

    console.log('📋 SQL Script Contents:');
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
    console.log('\n✅ Instructions provided. Please execute the SQL in Supabase dashboard.');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

// Test connection first
async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .select('count');
    
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    
    console.log('✅ Connected to Supabase successfully\n');
    return true;
  } catch (error) {
    console.error('❌ Failed to connect to Supabase:', error.message);
    return false;
  }
}

// Run the script
(async () => {
  const connected = await testConnection();
  if (connected) {
    await applyFix();
  }
})();
