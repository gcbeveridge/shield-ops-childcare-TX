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

// POST /api/facilities/:id/alerts/generate - Generate alerts from current data
router.post('/:id/alerts/generate', authenticateToken, verifyFacilityAccess, async (req, res) => {
    try {
        const facilityId = req.params.id;
        const newAlerts = [];
        const today = new Date();

        // Check for expired/expiring certifications
        const staffResult = await pool.query(
            'SELECT * FROM staff WHERE facility_id = $1',
            [facilityId]
        );

        for (const member of staffResult.rows) {
            if (!member.certifications) continue;

            const certs = member.certifications;
            
            // Map the actual database field names to display names
            const certTypes = [
                { key: 'cprFirstAid', dateField: 'expirationDate', name: 'CPR/First Aid' },
                { key: 'backgroundCheck', dateField: 'expirationDate', name: 'Background Check' },
                { key: 'foodHandler', dateField: 'expirationDate', name: 'Food Handler' },
                { key: 'tbTest', dateField: 'expirationDate', name: 'TB Test' },
                // Also check alternative format
                { key: 'cpr', dateField: 'expiration', name: 'CPR' },
                { key: 'first_aid', dateField: 'expiration', name: 'First Aid' },
                { key: 'background_check', dateField: 'expiration', name: 'Background Check' }
            ];

            for (const cert of certTypes) {
                if (!certs[cert.key]) continue;
                
                // Try both date field formats
                const expDateStr = certs[cert.key][cert.dateField] || certs[cert.key].expirationDate || certs[cert.key].expiration;
                if (!expDateStr) continue;

                const expDate = new Date(expDateStr);
                if (isNaN(expDate.getTime())) continue;
                
                const daysUntil = Math.floor((expDate - today) / (1000 * 60 * 60 * 24));
                const alertType = `cert_${daysUntil < 0 ? 'expired' : 'expiring'}_${cert.key}`;

                // Check if alert already exists
                const existingAlert = await pool.query(`
                    SELECT id FROM alerts 
                    WHERE facility_id = $1 
                        AND alert_type = $2
                        AND related_entity_id = $3
                        AND resolved = false
                `, [facilityId, alertType, member.id]);

                if (existingAlert.rows.length > 0) continue;

                let alertData = null;

                if (daysUntil < 0) {
                    alertData = {
                        alert_type: alertType,
                        severity: 'critical',
                        title: `${member.name}'s ${cert.name} expired`,
                        message: `Expired ${Math.abs(daysUntil)} days ago`,
                        action_url: '/staff',
                        related_entity_id: member.id,
                        related_entity_type: 'staff'
                    };
                } else if (daysUntil <= 30) {
                    alertData = {
                        alert_type: alertType,
                        severity: daysUntil <= 7 ? 'critical' : 'warning',
                        title: `${member.name}'s ${cert.name} expires in ${daysUntil} days`,
                        message: `Schedule renewal soon`,
                        action_url: '/staff',
                        related_entity_id: member.id,
                        related_entity_type: 'staff'
                    };
                } else if (daysUntil <= 60) {
                    alertData = {
                        alert_type: alertType,
                        severity: 'info',
                        title: `${member.name}'s ${cert.name} expires in ${daysUntil} days`,
                        message: `Monitor for upcoming renewal`,
                        action_url: '/staff',
                        related_entity_id: member.id,
                        related_entity_type: 'staff'
                    };
                }

                if (alertData) {
                    const result = await pool.query(`
                        INSERT INTO alerts (
                            facility_id, alert_type, severity, title, message,
                            action_url, related_entity_id, related_entity_type
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                        RETURNING *
                    `, [
                        facilityId, alertData.alert_type, alertData.severity,
                        alertData.title, alertData.message, alertData.action_url,
                        alertData.related_entity_id, alertData.related_entity_type
                    ]);

                    newAlerts.push(result.rows[0]);

                    await pool.query(`
                        INSERT INTO alert_history (alert_id, action)
                        VALUES ($1, 'created')
                    `, [result.rows[0].id]);
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
        if (checksCount < 2) {
            const existing = await pool.query(`
                SELECT id FROM alerts 
                WHERE facility_id = $1 
                    AND alert_type = 'missing_spot_check'
                    AND DATE(created_at) = CURRENT_DATE
                    AND resolved = false
            `, [facilityId]);

            if (existing.rows.length === 0) {
                const result = await pool.query(`
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
                    `${checksCount}/2 completed today`,
                    '/dashboard'
                ]);

                newAlerts.push(result.rows[0]);

                await pool.query(`
                    INSERT INTO alert_history (alert_id, action)
                    VALUES ($1, 'created')
                `, [result.rows[0].id]);
            }
        } else {
            // Auto-resolve spot-check alerts if completed
            await pool.query(`
                UPDATE alerts SET resolved = true, resolved_at = NOW()
                WHERE facility_id = $1 
                    AND alert_type = 'missing_spot_check'
                    AND DATE(created_at) = CURRENT_DATE
                    AND resolved = false
            `, [facilityId]);
        }

        // Check for missing documents
        const docsResult = await pool.query(`
            SELECT COUNT(*) as missing FROM documents
            WHERE facility_id = $1 AND status = 'missing'
        `, [facilityId]);
        
        const missingDocs = parseInt(docsResult.rows[0].missing);
        if (missingDocs > 0) {
            const existing = await pool.query(`
                SELECT id FROM alerts 
                WHERE facility_id = $1 
                    AND alert_type = 'missing_documents'
                    AND resolved = false
            `, [facilityId]);

            if (existing.rows.length === 0) {
                const result = await pool.query(`
                    INSERT INTO alerts (
                        facility_id, alert_type, severity, title, message, action_url
                    )
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                `, [
                    facilityId,
                    'missing_documents',
                    'critical',
                    `${missingDocs} required document${missingDocs > 1 ? 's' : ''} missing`,
                    'Upload missing documents before inspection',
                    '/documents'
                ]);

                newAlerts.push(result.rows[0]);
            }
        }

        // Check for expired documents
        const expiredDocsResult = await pool.query(`
            SELECT COUNT(*) as expired FROM documents
            WHERE facility_id = $1 AND status = 'expired'
        `, [facilityId]);
        
        const expiredDocs = parseInt(expiredDocsResult.rows[0].expired);
        if (expiredDocs > 0) {
            const existing = await pool.query(`
                SELECT id FROM alerts 
                WHERE facility_id = $1 
                    AND alert_type = 'expired_documents'
                    AND resolved = false
            `, [facilityId]);

            if (existing.rows.length === 0) {
                const result = await pool.query(`
                    INSERT INTO alerts (
                        facility_id, alert_type, severity, title, message, action_url
                    )
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                `, [
                    facilityId,
                    'expired_documents',
                    'critical',
                    `${expiredDocs} document${expiredDocs > 1 ? 's' : ''} expired`,
                    'Renew expired documents immediately',
                    '/documents'
                ]);

                newAlerts.push(result.rows[0]);
            }
        }

        res.json({ success: true, message: `Generated ${newAlerts.length} new alerts`, alerts: newAlerts });

    } catch (error) {
        console.error('Error generating alerts:', error);
        res.status(500).json({ success: false, error: 'Failed to generate alerts' });
    }
});

// GET /api/facilities/:id/alerts - Fetch active alerts
router.get('/:id/alerts', authenticateToken, verifyFacilityAccess, async (req, res) => {
    try {
        const facilityId = req.params.id;
        const result = await pool.query(`
            SELECT * FROM alerts
            WHERE facility_id = $1 AND resolved = false
            ORDER BY 
                CASE severity 
                    WHEN 'critical' THEN 1 
                    WHEN 'warning' THEN 2 
                    WHEN 'info' THEN 3 
                END,
                created_at DESC
        `, [facilityId]);

        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch alerts' });
    }
});

// PATCH /api/facilities/:id/alerts/:alertId/acknowledge
router.patch('/:id/alerts/:alertId/acknowledge', authenticateToken, verifyFacilityAccess, async (req, res) => {
    try {
        const alertId = req.params.alertId;
        const { acknowledged_by_name } = req.body;

        const result = await pool.query(`
            UPDATE alerts 
            SET acknowledged = true, acknowledged_at = NOW(), acknowledged_by_name = $1
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

        const result = await pool.query(`
            UPDATE alerts SET resolved = true, resolved_at = NOW()
            WHERE id = $1 RETURNING *
        `, [alertId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Alert not found' });
        }

        await pool.query(`
            INSERT INTO alert_history (alert_id, action)
            VALUES ($1, 'resolved')
        `, [alertId]);

        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error resolving alert:', error);
        res.status(500).json({ success: false, error: 'Failed to resolve alert' });
    }
});

// GET /api/facilities/:id/alerts/summary - Get counts by severity
router.get('/:id/alerts/summary', authenticateToken, verifyFacilityAccess, async (req, res) => {
    try {
        const facilityId = req.params.id;
        const result = await pool.query(`
            SELECT 
                severity,
                COUNT(*) as count,
                SUM(CASE WHEN acknowledged = false THEN 1 ELSE 0 END) as unacknowledged
            FROM alerts
            WHERE facility_id = $1 AND resolved = false
            GROUP BY severity
        `, [facilityId]);

        const summary = {
            critical: { count: 0, unacknowledged: 0 },
            warning: { count: 0, unacknowledged: 0 },
            info: { count: 0, unacknowledged: 0 }
        };

        result.rows.forEach(row => {
            summary[row.severity] = {
                count: parseInt(row.count),
                unacknowledged: parseInt(row.unacknowledged)
            };
        });

        res.json({ success: true, data: summary });
    } catch (error) {
        console.error('Error fetching alert summary:', error);
        res.status(500).json({ success: false, error: 'Failed to fetch summary' });
    }
});

module.exports = router;
