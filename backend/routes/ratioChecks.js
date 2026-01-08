const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

function verifyFacilityAccess(req, res, next) {
    const requestedFacilityId = req.params.id;
    const userFacilityId = req.user?.facilityId;
    
    if (!userFacilityId || requestedFacilityId !== userFacilityId) {
        return res.status(403).json({ success: false, error: 'Access denied to this facility' });
    }
    next();
}

function parseRatio(ratioStr) {
    if (!ratioStr || typeof ratioStr !== 'string') return null;
    const parts = ratioStr.split(':');
    if (parts.length !== 2) return null;
    const staff = parseInt(parts[0], 10);
    const children = parseInt(parts[1], 10);
    if (!Number.isFinite(staff) || !Number.isFinite(children) || staff < 1 || children < 1) {
        return null;
    }
    return { staff, children };
}

router.get('/:id/rooms', authenticateToken, verifyFacilityAccess, async (req, res) => {
    try {
        const facilityId = req.params.id;
        
        const result = await pool.query(`
            SELECT * FROM rooms
            WHERE facility_id = $1 AND active = true
            ORDER BY name
        `, [facilityId]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch rooms' });
    }
});

router.post('/:id/rooms', authenticateToken, verifyFacilityAccess, async (req, res) => {
    try {
        const facilityId = req.params.id;
        const { name, age_group, required_ratio } = req.body;

        if (!name || typeof name !== 'string' || name.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Room name is required' });
        }
        if (!age_group || typeof age_group !== 'string') {
            return res.status(400).json({ success: false, error: 'Age group is required' });
        }
        
        const parsedRatio = parseRatio(required_ratio);
        if (!parsedRatio) {
            return res.status(400).json({ success: false, error: 'Invalid ratio format. Expected format: "1:4"' });
        }

        const validAgeGroups = ['infant', 'toddler', 'preschool', 'school-age', 'mixed'];
        if (!validAgeGroups.includes(age_group)) {
            return res.status(400).json({ success: false, error: 'Invalid age group' });
        }

        const existing = await pool.query(
            'SELECT id FROM rooms WHERE facility_id = $1 AND name = $2',
            [facilityId, name.trim()]
        );
        if (existing.rows.length > 0) {
            return res.status(409).json({ success: false, error: 'A room with this name already exists' });
        }

        const result = await pool.query(`
            INSERT INTO rooms (facility_id, name, age_group, required_ratio)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `, [facilityId, name.trim(), age_group, required_ratio]);

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error creating room:', error);
        res.status(500).json({ success: false, error: 'Failed to create room' });
    }
});

router.get('/:id/ratio-checks/today', authenticateToken, verifyFacilityAccess, async (req, res) => {
    try {
        const facilityId = req.params.id;
        const today = new Date().toISOString().split('T')[0];

        const result = await pool.query(`
            SELECT * FROM ratio_spot_checks
            WHERE facility_id = $1 AND check_date = $2
            ORDER BY check_time DESC
        `, [facilityId, today]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching today\'s checks:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch checks' });
    }
});

router.get('/:id/ratio-checks/history', authenticateToken, verifyFacilityAccess, async (req, res) => {
    try {
        const facilityId = req.params.id;
        const days = Math.min(Math.max(parseInt(req.query.days) || 30, 1), 365);
        
        const result = await pool.query(`
            SELECT 
                check_date,
                COUNT(*) as total_checks,
                SUM(CASE WHEN is_compliant THEN 1 ELSE 0 END) as compliant_checks,
                SUM(CASE WHEN NOT is_compliant THEN 1 ELSE 0 END) as violations
            FROM ratio_spot_checks
            WHERE facility_id = $1 
                AND check_date >= CURRENT_DATE - INTERVAL '1 day' * $2
            GROUP BY check_date
            ORDER BY check_date DESC
        `, [facilityId, days]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching check history:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch history' });
    }
});

router.post('/:id/ratio-checks', authenticateToken, verifyFacilityAccess, async (req, res) => {
    try {
        const facilityId = req.params.id;
        const {
            room_id,
            room_name,
            children_count,
            staff_count,
            required_ratio,
            check_method,
            check_method_other,
            checked_by_name,
            notes
        } = req.body;

        const childrenNum = parseInt(children_count, 10);
        const staffNum = parseInt(staff_count, 10);
        
        if (!Number.isFinite(childrenNum) || childrenNum < 0) {
            return res.status(400).json({ success: false, error: 'Invalid children count' });
        }
        if (!Number.isFinite(staffNum) || staffNum < 0) {
            return res.status(400).json({ success: false, error: 'Invalid staff count' });
        }
        if (!room_name || typeof room_name !== 'string' || room_name.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Room name is required' });
        }
        if (!checked_by_name || typeof checked_by_name !== 'string' || checked_by_name.trim().length === 0) {
            return res.status(400).json({ success: false, error: 'Checker name is required' });
        }
        
        const parsedRatio = parseRatio(required_ratio);
        if (!parsedRatio) {
            return res.status(400).json({ success: false, error: 'Invalid ratio format. Expected format: "1:4"' });
        }

        const maxChildren = staffNum * parsedRatio.children;
        const is_compliant = staffNum > 0 && childrenNum <= maxChildren;

        const validMethods = ['in_person', 'cctv', 'other'];
        const safeMethod = validMethods.includes(check_method) ? check_method : 'other';

        if (safeMethod === 'other' && (!check_method_other || check_method_other.trim().length === 0)) {
            return res.status(400).json({ success: false, error: 'Please specify how you checked when using "Other"' });
        }

        const now = new Date();
        const check_date = now.toISOString().split('T')[0];
        const check_time = now.toTimeString().split(' ')[0];

        const safeMethodOther = safeMethod === 'other' && check_method_other 
            ? check_method_other.trim().substring(0, 200) 
            : null;

        const result = await pool.query(`
            INSERT INTO ratio_spot_checks (
                facility_id, room_id, room_name, check_date, check_time,
                children_count, staff_count, required_ratio, is_compliant,
                check_method, check_method_other, checked_by_name, notes
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            RETURNING *
        `, [
            facilityId, room_id || null, room_name.trim(), check_date, check_time,
            childrenNum, staffNum, required_ratio, is_compliant,
            safeMethod, safeMethodOther, checked_by_name.trim(), notes || null
        ]);

        res.status(201).json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error logging spot-check:', error);
        res.status(500).json({ success: false, error: 'Failed to log spot-check' });
    }
});

router.get('/:id/ratio-checks/reminder-status', authenticateToken, verifyFacilityAccess, async (req, res) => {
    try {
        const facilityId = req.params.id;
        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toTimeString().split(' ')[0];

        const scheduleResult = await pool.query(`
            SELECT check_times FROM ratio_check_schedule
            WHERE facility_id = $1 AND enabled = true
        `, [facilityId]);

        if (scheduleResult.rows.length === 0) {
            return res.json({ 
                success: true,
                data: {
                    next_check_due: null,
                    checks_completed_today: 0,
                    checks_due_today: 2,
                    check_times: ['10:00:00', '15:00:00']
                }
            });
        }

        const checkTimes = scheduleResult.rows[0].check_times || [];

        const checksResult = await pool.query(`
            SELECT COUNT(*) as count FROM ratio_spot_checks
            WHERE facility_id = $1 AND check_date = $2
        `, [facilityId, today]);

        const checksCompletedToday = parseInt(checksResult.rows[0].count);

        const nextCheckDue = checkTimes.find(time => time > now) || checkTimes[0];

        res.json({
            success: true,
            data: {
                next_check_due: nextCheckDue,
                checks_completed_today: checksCompletedToday,
                checks_due_today: checkTimes.length,
                check_times: checkTimes
            }
        });

    } catch (error) {
        console.error('Error fetching reminder status:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch reminder status' });
    }
});

module.exports = router;
