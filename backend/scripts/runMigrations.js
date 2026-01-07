const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

async function runMigrations() {
    try {
        console.log('🔄 Running database migrations...');
        
        const migrationsDir = path.join(__dirname, '..', 'config', 'migrations');
        
        if (!fs.existsSync(migrationsDir)) {
            console.log('No migrations directory found');
            return;
        }
        
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();
        
        for (const file of migrationFiles) {
            console.log(`  📦 Running migration: ${file}`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            await pool.query(sql);
            console.log(`  ✅ Completed: ${file}`);
        }
        
        console.log('✅ All migrations completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        throw error;
    }
}

if (require.main === module) {
    runMigrations()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = runMigrations;
