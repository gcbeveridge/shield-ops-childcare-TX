const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

function verifyFacilityAccess(req, res, next) {
    const requestedFacilityId = req.params.id;
    const userFacilityId = req.user?.facilityId;
    
    if (!userFacilityId || String(requestedFacilityId) !== String(userFacilityId)) {
        return res.status(403).json({ success: false, error: 'Access denied to this facility' });
    }
    next();
}

// GET /api/facilities/:id/alerts (get active alerts)
router.get('/:id/alerts', authenticateToken, verifyFacilityAccess, async (req, res) => {
    try {
        const facilityId = req.params.id;
        const showResolved = req.query.showResolved === 'true';

        let query = `
            SELECT * FROM alerts
            WHERE facility_id = $1
        `;
        
        if (!showResolved) {
            query += ` AND resolved = false`;
        }

        query += ` ORDER BY 
            CASE severity 
                WHEN 'critical' THEN 1 
                WHEN 'warning' THEN 2 
                WHEN 'info' THEN 3 
            END,
            created_at DESC
        `;

        const result = await pool.query(query, [facilityId]);
        res.json({ success: true, data: result.rows });

    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch alerts' });
    }
});

// GET /api/facilities/:id/alerts/count (get unacknowledged count for badge)
router.get('/:id/alerts/count', authenticateToken, verifyFacilityAccess, async (req, res) => {
    try {
        const facilityId = req.params.id;

        const result = await pool.query(`
            SELECT COUNT(*) as count FROM alerts
            WHERE facility_id = $1 AND acknowledged = false AND resolved = false
        `, [facilityId]);

        res.json({ success: true, count: parseInt(result.rows[0].count) });

    } catch (error) {
        console.error('Error counting alerts:', error);
        res.status(500).json({ success: false, error: 'Failed to count alerts' });
    }
});

// POST /api/facilities/:id/alerts/generate (generate alerts from current data)
router.post('/:id/alerts/generate', authenticateToken, verifyFacilityAccess, async (req, res) => {
    try {
        const facilityId = req.params.id;
        const newAlerts = [];

        // Check for expired/expiring certifications
        const staffResult = await pool.query(
            'SELECT * FROM staff WHERE facility_id = $1',
            [facilityId]
        );

        const today = new Date();

        for (const member of staffResult.rows) {
            if (!member.certifications) continue;

            const certs = member.certifications;
            const certTypes = [
                { key: 'cpr', name: 'CPR' },
                { key: 'first_aid', name: 'First Aid' },
                { key: 'background_check', name: 'Background Check' },
                { key: 'food_handler', name: 'Food Handler' },
                { key: 'tb_test', name: 'TB Test' }
            ];

            for (const cert of certTypes) {
                if (!certs[cert.key] || !certs[cert.key].expiration) continue;

                const expDate = new Date(certs[cert.key].expiration);
                const daysUntil = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));

                // Check if alert already exists for this
                const existingAlert = await pool.query(`
                    SELECT id FROM alerts 
                    WHERE facility_id = $1 
                        AND alert_type LIKE $2
                        AND related_entity_id = $3
                        AND resolved = false
                `, [facilityId, `cert_%_${cert.key}`, member.id]);

                if (existingAlert.rows.length > 0) continue;

                let alertData = null;

                if (daysUntil < 0) {
                    alertData = {
                        alert_type: `cert_expired_${cert.key}`,
                        severity: 'critical',
                        title: `${member.name}'s ${cert.name} has EXPIRED`,
                        message: `Expired ${Math.abs(daysUntil)} days ago. Immediate renewal required.`,
                        action_url: '/staff',
                        related_entity_id: member.id,
                        related_entity_type: 'staff'
                    };
                } else if (daysUntil <= 30) {
                    alertData = {
                        alert_type: `cert_expiring_${cert.key}`,
                        severity: 'warning',
                        title: `${member.name}'s ${cert.name} expiring soon`,
                        message: `Expires in ${daysUntil} days. Schedule renewal now.`,
                        action_url: '/staff',
                        related_entity_id: member.id,
                        related_entity_type: 'staff'
                    };
                }

                if (alertData) {
                    const insertResult = await pool.query(`
                        INSERT INTO alerts (
                            facility_id, alert_type, severity, title, message,
                            action_url, related_entity_id, related_entity_type
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        RETURNING *
                    `, [
                        facilityId,
                        alertData.alert_type,
                        alertData.severity,
                        alertData.title,
                        alertData.message,
                        alertData.action_url,
                        alertData.related_entity_id,
                        alertData.related_entity_type
                    ]);

                    newAlerts.push(insertResult.rows[0]);

                    await pool.query(`
                        INSERT INTO alert_history (alert_id, action)
                        VALUES ($1, 'created')
                    `, [insertResult.rows[0].id]);
                }
            }
        }

        // Check for missing spot-checks
        const today_date = new Date().toISOString().split('T')[0];
        const checksToday = await pool.query(`
            SELECT COUNT(*) as count FROM ratio_spot_checks
            WHERE facility_id = $1 AND check_date = $2
        `, [facilityId, today_date]);

        const checksCount = parseInt(checksToday.rows[0].count);
        const checksExpected = 2;

        if (checksCount < checksExpected) {
            const existingSpotCheckAlert = await pool.query(`
                SELECT id FROM alerts 
                WHERE facility_id = $1 
                    AND alert_type = 'missing_spot_check'
                    AND DATE(created_at) = CURRENT_DATE
                    AND resolved = false
            `, [facilityId]);

            if (existingSpotCheckAlert.rows.length === 0) {
                const alertResult = await pool.query(`
                    INSERT INTO alerts (
                        facility_id, alert_type, severity, title, message, action_url
                    )
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                `, [
                    facilityId,
                    'missing_spot_check',
                    'warning',
                    'Ratio spot-checks incomplete',
                    `${checksCount}/${checksExpected} completed today. Log your checks to maintain compliance.`,
                    '/dashboard'
                ]);

                newAlerts.push(alertResult.rows[0]);

                await pool.query(`
                    INSERT INTO alert_history (alert_id, action)
                    VALUES ($1, 'created')
                `, [alertResult.rows[0].id]);
            }
        } else {
            // Auto-resolve spot-check alert if now complete
            await pool.query(`
                UPDATE alerts 
                SET resolved = true, resolved_at = NOW()
                WHERE facility_id = $1 
                    AND alert_type = 'missing_spot_check'
                    AND DATE(created_at) = CURRENT_DATE
                    AND resolved = false
            `, [facilityId]);
        }

        // Check for missing documents
        const docsResult = await pool.query(`
            SELECT COUNT(*) as count FROM documents 
            WHERE facility_id = $1 AND status = 'missing'
        `, [facilityId]);
        
        const missingDocs = parseInt(docsResult.rows[0]?.count || 0);
        if (missingDocs > 0) {
            const existingDocAlert = await pool.query(`
                SELECT id FROM alerts 
                WHERE facility_id = $1 
                    AND alert_type = 'missing_documents'
                    AND resolved = false
            `, [facilityId]);

            if (existingDocAlert.rows.length === 0) {
                const alertResult = await pool.query(`
                    INSERT INTO alerts (
                        facility_id, alert_type, severity, title, message, action_url
                    )
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                `, [
                    facilityId,
                    'missing_documents',
                    'warning',
                    `${missingDocs} Missing Document${missingDocs > 1 ? 's' : ''}`,
                    `You have ${missingDocs} required document${missingDocs > 1 ? 's' : ''} missing. Upload them to maintain compliance.`,
                    '/documents'
                ]);

                newAlerts.push(alertResult.rows[0]);

                await pool.query(`
                    INSERT INTO alert_history (alert_id, action)
                    VALUES ($1, 'created')
                `, [alertResult.rows[0].id]);
            }
        }

        res.json({
            success: true,
            message: `Generated ${newAlerts.length} new alerts`,
            data: newAlerts
        });

    } catch (error) {
        console.error('Error generating alerts:', error);
        res.status(500).json({ success: false, error: 'Failed to generate alerts' });
    }
});

// PATCH /api/facilities/:id/alerts/:alertId/acknowledge
router.patch('/:id/alerts/:alertId/acknowledge', authenticateToken, verifyFacilityAccess, async (req, res) => {
    try {
        const alertId = req.params.alertId;
        const { acknowledged_by_name } = req.body;

        const result = await pool.query(`
            UPDATE alerts 
            SET acknowledged = true,
                acknowledged_at = NOW(),
                acknowledged_by_name = $1
            WHERE id = $2
            RETURNING *
        `, [acknowledged_by_name || 'User', alertId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Alert not found' });
        }

        await pool.query(`
            INSERT INTO alert_history (alert_id, action, action_by_name)
            VALUES ($1, 'acknowledged', $2)
        `, [alertId, acknowledged_by_name || 'User']);

        res.json({ success: true, data: result.rows[0] });

    } catch (error) {
        console.error('Error acknowledging alert:', error);
        res.status(500).json({ success: false, error: 'Failed to acknowledge alert' });
    }
});

// PATCH /api/facilities/:id/alerts/:alertId/resolve
router.patch('/:id/alerts/:alertId/resolve', authenticateToken, verifyFacilityAccess, async (req, res) => {
    try {
        const alertId = req.params.alertId;
        const { notes } = req.body;

        const result = await pool.query(`
            UPDATE alerts 
            SET resolved = true,
                resolved_at = NOW()
            WHERE id = $1
            RETURNING *
        `, [alertId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Alert not found' });
        }

        await pool.query(`
            INSERT INTO alert_history (alert_id, action, notes)
            VALUES ($1, 'resolved', $2)
        `, [alertId, notes]);

        res.json({ success: true, data: result.rows[0] });

    } catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).json({ success: false, error: 'Failed to resolve alert' });
    }
});

module.exports = router;
