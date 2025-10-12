const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL must be set. Did you forget to provision a database?');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (err) => {
  console.error('❌ Unexpected database error:', err);
});

pool.on('connect', () => {
  console.log('✅ PostgreSQL connection established');
});

module.exports = pool;
