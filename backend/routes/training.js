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
        const facilityId = req.params.facilityId;
        const modulesResult = await pool.query(
            'SELECT * FROM training_modules_new ORDER BY month ASC'
        );
        
        const modules = [];
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        for (const module of modulesResult.rows) {
            const progressResult = await pool.query(`
                SELECT overall_percentage, started_at, completed_at
                FROM training_module_progress
                WHERE facility_id = $1 AND module_id = $2
            `, [facilityId, module.id]);
            
            const progress = progressResult.rows[0] || {
                overall_percentage: 0,
                started_at: null,
                completed_at: null
            };
            
            let status = 'available';
            if (module.year === currentYear) {
                if (module.month === currentMonth) {
                    status = 'active';
                } else if (module.month === currentMonth + 1) {
                    status = 'preview';
                }
            }
            
            const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
            const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
            
            if (module.year === nextYear && module.month === nextMonth) {
                status = 'preview';
            }
            
            modules.push({
                id: module.id,
                month: module.month,
                year: module.year,
                title: module.title,
                theme: module.theme,
                description: module.description,
                status: status,
                progress: parseInt(progress.overall_percentage) || 0,
                started_at: progress.started_at,
                completed_at: progress.completed_at,
                estimated_duration_minutes: module.estimated_duration_minutes
            });
        }
        
        res.json({ success: true, modules: modules });
    } catch (error) {
        console.error('Error fetching training modules:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch training modules' });
    }
});

router.get('/facilities/:facilityId/training/progress-summary', authenticateToken, async (req, res) => {
    try {
        const facilityId = req.params.facilityId;
        const currentMonth = new Date().getMonth() + 1;
        const currentYear = new Date().getFullYear();
        
        const currentModuleResult = await pool.query(`
            SELECT tm.id, tm.title, tmp.overall_percentage
            FROM training_modules_new tm
            LEFT JOIN training_module_progress tmp ON tm.id = tmp.module_id AND tmp.facility_id = $1
            WHERE tm.month = $2 AND tm.year = $3
        `, [facilityId, currentMonth, currentYear]);
        
        const currentModule = currentModuleResult.rows[0] || null;
        
        const statsResult = await pool.query(`
            SELECT 
                COUNT(*) FILTER (WHERE started_at IS NOT NULL) as modules_started,
                COUNT(*) FILTER (WHERE completed_at IS NOT NULL) as modules_completed,
                COALESCE(AVG(overall_percentage), 0) as avg_progress
            FROM training_module_progress
            WHERE facility_id = $1
        `, [facilityId]);
        
        const stats = statsResult.rows[0];
        
        res.json({
            success: true,
            current_month: currentModule ? {
                title: currentModule.title,
                progress: currentModule.overall_percentage || 0
            } : null,
            modules_started: parseInt(stats.modules_started) || 0,
            modules_completed: parseInt(stats.modules_completed) || 0,
            annual_progress: Math.round(parseFloat(stats.avg_progress)) || 0
        });
        
    } catch (error) {
        console.error('Error fetching progress summary:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch progress summary' });
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
