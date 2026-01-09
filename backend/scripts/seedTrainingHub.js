const pool = require('../config/db');

async function seed12MonthModules() {
    const modules = [
        { month: 1, year: 2026, title: 'New Year Safety Goals & Facility Assessment', theme: 'Goal-Setting & Assessment', description: 'Professional goal-setting and comprehensive safety evaluation' },
        { month: 2, year: 2026, title: 'Health & Hygiene Excellence', theme: 'Cleanliness & Illness Prevention', description: 'Cleanliness protocols and illness prevention' },
        { month: 3, year: 2026, title: 'Emergency Preparedness', theme: 'Fire Safety & Evacuation', description: 'Fire safety, evacuation plans, emergency protocols' },
        { month: 4, year: 2026, title: 'Equipment Safety & Maintenance', theme: 'Maintenance & Safety Protocols', description: 'Systematic Equipment Management & Safety Protocols' },
        { month: 5, year: 2026, title: 'Summer Safety & Heat Protection', theme: 'Summer Safety Excellence', description: 'Comprehensive Summer Safety & Heat Prevention Excellence' },
        { month: 6, year: 2026, title: 'Access Control & Transportation Safety', theme: 'Security & Vehicle Safety', description: 'Professional Security & Vehicle Safety Excellence' },
        { month: 7, year: 2026, title: 'Staff Safety Training Spotlight', theme: 'Emergency Response', description: 'Professional Competency & Emergency Response Excellence' },
        { month: 8, year: 2026, title: 'Back-to-School Safety Preparation', theme: 'Enrollment Safety', description: 'Enrollment safety and orientation protocols' },
        { month: 9, year: 2026, title: 'Mental Health & Wellness', theme: 'Emotional Safety', description: 'Creating Emotionally Safe Environments' },
        { month: 10, year: 2026, title: 'Stranger Danger & Security Awareness', theme: 'Vigilance & Awareness', description: 'Professional Vigilance & Situational Awareness' },
        { month: 11, year: 2026, title: 'Staff & Child Protection Policies', theme: 'Boundaries & Protection', description: 'Professional Boundaries & Child Protection Excellence' },
        { month: 12, year: 2026, title: 'Winter Weather & Holiday Safety', theme: 'Seasonal Safety', description: 'Seasonal Safety & Environmental Risk Management' }
    ];

    for (const module of modules) {
        await pool.query(`
            INSERT INTO training_modules_new (month, year, title, theme, description, estimated_duration_minutes)
            VALUES ($1, $2, $3, $4, $5, 45)
            ON CONFLICT (month, year) DO NOTHING
        `, [module.month, module.year, module.title, module.theme, module.description]);
    }

    console.log('✅ 12 monthly training modules seeded (structure only, content to be added later)');
}

async function seedCertificationTypes() {
    const certTypes = [
        // COMMON - All States
        { name: 'CPR Certification', state_code: null, typical_duration_years: 2, category: 'health_safety', is_common: true },
        { name: 'First Aid Certification', state_code: null, typical_duration_years: 2, category: 'health_safety', is_common: true },
        { name: 'Child Abuse Recognition & Reporting', state_code: null, typical_duration_years: 2, category: 'child_protection', is_common: true },
        { name: 'SIDS Prevention', state_code: null, typical_duration_years: 2, category: 'health_safety', is_common: true },
        { name: 'Food Handler Certification', state_code: null, typical_duration_years: 2, category: 'food_safety', is_common: true },
        { name: 'Bloodborne Pathogens Training', state_code: null, typical_duration_years: 1, category: 'health_safety', is_common: true },
        { name: 'Shaken Baby Syndrome Prevention', state_code: null, typical_duration_years: 2, category: 'child_protection', is_common: true },
        
        // TEXAS-SPECIFIC
        { name: 'Texas Minimum Standards Training', state_code: 'TX', typical_duration_years: 1, required_hours: 24, category: 'state_specific', is_common: true },
        { name: 'Texas Director Certification', state_code: 'TX', typical_duration_years: 2, category: 'state_specific', is_common: true },
        { name: 'Texas Annual Director Training', state_code: 'TX', typical_duration_years: 1, required_hours: 30, category: 'state_specific', is_common: true },
        
        // CALIFORNIA-SPECIFIC
        { name: 'California Health & Safety Training', state_code: 'CA', typical_duration_years: 2, required_hours: 15, category: 'state_specific', is_common: true },
        { name: 'California Preventive Health Practices', state_code: 'CA', typical_duration_years: 2, category: 'state_specific', is_common: true },
        
        // FLORIDA-SPECIFIC
        { name: 'Florida 40-Hour Introductory Training', state_code: 'FL', typical_duration_years: 1, required_hours: 40, category: 'state_specific', is_common: true },
        { name: 'Florida Director Credential', state_code: 'FL', typical_duration_years: 2, category: 'state_specific', is_common: true },
        
        // NEW YORK-SPECIFIC
        { name: 'New York MAT (Medication Administration)', state_code: 'NY', typical_duration_years: 2, category: 'state_specific', is_common: true },
        { name: 'New York Health & Safety Training', state_code: 'NY', typical_duration_years: 2, required_hours: 15, category: 'state_specific', is_common: true }
    ];

    for (const cert of certTypes) {
        await pool.query(`
            INSERT INTO certification_types (name, state_code, typical_duration_years, required_hours, category, is_common)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT DO NOTHING
        `, [cert.name, cert.state_code, cert.typical_duration_years, cert.required_hours || null, cert.category, cert.is_common]);
    }

    console.log('✅ Certification types seeded (common + state-specific)');
}

async function seedStateTrainingRequirements() {
    const stateReqs = [
        { state_code: 'TX', state_name: 'Texas', annual_hours_required: 24, director_hours_required: 30 },
        { state_code: 'CA', state_name: 'California', annual_hours_required: 15, director_hours_required: 15 },
        { state_code: 'FL', state_name: 'Florida', annual_hours_required: 10, director_hours_required: 10 },
        { state_code: 'NY', state_name: 'New York', annual_hours_required: 15, director_hours_required: 15 },
        { state_code: 'IL', state_name: 'Illinois', annual_hours_required: 15, director_hours_required: 15 },
        { state_code: 'OH', state_name: 'Ohio', annual_hours_required: 6, director_hours_required: 6 },
        { state_code: 'GA', state_name: 'Georgia', annual_hours_required: 10, director_hours_required: 10 },
        { state_code: 'NC', state_name: 'North Carolina', annual_hours_required: 20, director_hours_required: 20 },
        { state_code: 'PA', state_name: 'Pennsylvania', annual_hours_required: 6, director_hours_required: 6 },
        { state_code: 'AZ', state_name: 'Arizona', annual_hours_required: 12, director_hours_required: 24 }
    ];

    for (const state of stateReqs) {
        await pool.query(`
            INSERT INTO state_training_requirements (state_code, state_name, annual_hours_required, director_hours_required)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (state_code) DO NOTHING
        `, [state.state_code, state.state_name, state.annual_hours_required, state.director_hours_required]);
    }

    console.log('✅ State training requirements seeded');
}

async function seedTrainingHub() {
    try {
        console.log('🎓 Seeding Training Hub data...');
        
        await seed12MonthModules();
        await seedCertificationTypes();
        await seedStateTrainingRequirements();
        
        console.log('✅ Training Hub database foundation complete!');
        console.log('📝 Structure ready for content insertion in future stages');
        
    } catch (error) {
        console.error('❌ Error seeding training hub:', error);
        throw error;
    }
}

module.exports = { seedTrainingHub, seed12MonthModules, seedCertificationTypes, seedStateTrainingRequirements };

if (require.main === module) {
    seedTrainingHub()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}
