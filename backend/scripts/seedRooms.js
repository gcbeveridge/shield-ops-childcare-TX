const pool = require('../config/db');

async function seedSampleRooms() {
    const facilityId = '00000000-0000-0000-0000-000000000001';
    
    const rooms = [
        { name: 'Infant Room A', age_group: 'infant', required_ratio: '1:4' },
        { name: 'Infant Room B', age_group: 'infant', required_ratio: '1:4' },
        { name: 'Toddler Room', age_group: 'toddler', required_ratio: '1:8' },
        { name: 'Preschool Room A', age_group: 'preschool', required_ratio: '1:10' },
        { name: 'Preschool Room B', age_group: 'preschool', required_ratio: '1:12' },
        { name: 'School-Age Room', age_group: 'school-age', required_ratio: '1:15' }
    ];

    try {
        console.log('🏠 Seeding sample rooms...');
        
        for (const room of rooms) {
            const existingRoom = await pool.query(
                'SELECT id FROM rooms WHERE facility_id = $1 AND name = $2',
                [facilityId, room.name]
            );
            
            if (existingRoom.rows.length === 0) {
                await pool.query(`
                    INSERT INTO rooms (facility_id, name, age_group, required_ratio)
                    VALUES ($1, $2, $3, $4)
                `, [facilityId, room.name, room.age_group, room.required_ratio]);
                console.log(`  ✅ Created room: ${room.name}`);
            } else {
                console.log(`  ℹ️  Room already exists: ${room.name}`);
            }
        }

        const existingSchedule = await pool.query(
            'SELECT id FROM ratio_check_schedule WHERE facility_id = $1',
            [facilityId]
        );
        
        if (existingSchedule.rows.length === 0) {
            await pool.query(`
                INSERT INTO ratio_check_schedule (facility_id, check_times)
                VALUES ($1, ARRAY['10:00', '15:00']::TIME[])
            `, [facilityId]);
            console.log('  ✅ Created default check schedule (10am, 3pm)');
        } else {
            console.log('  ℹ️  Check schedule already exists');
        }

        console.log('✅ Sample rooms and check schedule seeding complete!');
    } catch (error) {
        console.error('Error seeding rooms:', error);
        throw error;
    }
}

module.exports = { seedSampleRooms };

if (require.main === module) {
    seedSampleRooms()
        .then(() => process.exit(0))
        .catch(err => {
            console.error(err);
            process.exit(1);
        });
}
