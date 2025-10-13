const supabase = require('../config/supabase');
const pool = require('../config/db');

async function test() {
  try {
    // Get one facility from PostgreSQL
    const pgResult = await pool.query('SELECT * FROM facilities LIMIT 1');
    const facility = pgResult.rows[0];
    
    console.log('📦 Facility data from PostgreSQL:');
    console.log(JSON.stringify(facility, null, 2));
    
    console.log('\n🔄 Attempting to insert into Supabase...');
    
    // Try inserting into Supabase
    const { data, error } = await supabase
      .from('facilities')
      .insert(facility)
      .select();
    
    if (error) {
      console.log('\n❌ Supabase error:');
      console.log('Code:', error.code);
      console.log('Message:', error.message);
      console.log('Details:', error.details);
      console.log('Hint:', error.hint);
    } else {
      console.log('\n✅ Success!');
      console.log(data);
    }
    
    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err.message);
    console.error(err);
    process.exit(1);
  }
}

test();
