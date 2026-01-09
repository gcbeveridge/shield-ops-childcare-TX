const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/db');
const {
  getTrainingModules,
  completeTraining,
  getStaffTraining
} = require('../controllers/trainingController');

router.get('/facilities/:facilityId/training/modules', authenticateToken, getTrainingModules);
router.post('/training/:moduleId/complete', authenticateToken, completeTraining);
router.get('/staff/:staffId/training', authenticateToken, getStaffTraining);

router.get('/facilities/:facilityId/training/modules-new', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM training_modules_new ORDER BY month ASC'
        );
        res.json({ success: true, modules: result.rows });
    } catch (error) {
        console.error('Error fetching training modules:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch training modules' });
    }
});

router.get('/facilities/:facilityId/certification-types', authenticateToken, async (req, res) => {
    try {
        const facilityResult = await pool.query(
            'SELECT state_code FROM facilities WHERE id = $1',
            [req.params.facilityId]
        );
        const stateCode = facilityResult.rows[0]?.state_code || 'TX';
        
        const result = await pool.query(
            `SELECT * FROM certification_types 
             WHERE (state_code IS NULL OR state_code = $1) AND active = true
             ORDER BY is_common DESC, name ASC`,
            [stateCode]
        );
        res.json({ success: true, certificationTypes: result.rows });
    } catch (error) {
        console.error('Error fetching certification types:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch certification types' });
    }
});

router.get('/facilities/:facilityId/state-requirements', authenticateToken, async (req, res) => {
    try {
        const facilityResult = await pool.query(
            'SELECT state_code FROM facilities WHERE id = $1',
            [req.params.facilityId]
        );
        const stateCode = facilityResult.rows[0]?.state_code || 'TX';
        
        const result = await pool.query(
            'SELECT * FROM state_training_requirements WHERE state_code = $1',
            [stateCode]
        );
        
        if (result.rows.length === 0) {
            return res.json({ success: true, data: null });
        }
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching state requirements:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch state requirements' });
    }
});

module.exports = router;
