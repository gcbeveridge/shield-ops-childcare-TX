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

async function recalculateModuleProgress(facilityId, moduleId) {
    try {
        const components = await pool.query(`
            SELECT component_type, completion_percentage
            FROM training_component_progress
            WHERE facility_id = $1 AND module_id = $2
        `, [facilityId, moduleId]);
        
        const weights = {
            champion: 25,
            communication: 20,
            acknowledgment: 25,
            audit: 15,
            social: 15
        };
        
        let totalProgress = 0;
        
        components.rows.forEach(comp => {
            const weight = weights[comp.component_type] || 0;
            totalProgress += (comp.completion_percentage * weight / 100);
        });
        
        const overallPercentage = Math.round(totalProgress);
        const started = components.rows.length > 0;
        const completed = overallPercentage === 100;
        
        await pool.query(`
            INSERT INTO training_module_progress 
            (facility_id, module_id, overall_percentage, started_at, completed_at)
            VALUES ($1, $2, $3, ${started ? 'NOW()' : 'NULL'}, ${completed ? 'NOW()' : 'NULL'})
            ON CONFLICT (facility_id, module_id)
            DO UPDATE SET 
                overall_percentage = $3,
                started_at = COALESCE(training_module_progress.started_at, NOW()),
                completed_at = ${completed ? 'NOW()' : 'NULL'},
                updated_at = NOW()
        `, [facilityId, moduleId, overallPercentage]);
        
        return overallPercentage;
        
    } catch (error) {
        console.error('Error recalculating module progress:', error);
        throw error;
    }
}

router.get('/facilities/:facilityId/training/modules/:moduleId/component-progress', authenticateToken, async (req, res) => {
    try {
        const facilityId = req.params.facilityId;
        const moduleId = req.params.moduleId;
        
        const components = await pool.query(`
            SELECT component_type, completed, completion_percentage, completed_at
            FROM training_component_progress
            WHERE facility_id = $1 AND module_id = $2
        `, [facilityId, moduleId]);
        
        const totalStaff = await pool.query(
            'SELECT COUNT(*) as count FROM staff WHERE facility_id = $1',
            [facilityId]
        );
        
        const responsesCount = await pool.query(`
            SELECT COUNT(*) as count FROM training_staff_responses
            WHERE facility_id = $1 AND module_id = $2
        `, [facilityId, moduleId]);
        
        const acknowledgementsCount = await pool.query(`
            SELECT COUNT(*) as count FROM training_acknowledgments
            WHERE facility_id = $1 AND module_id = $2
        `, [facilityId, moduleId]);
        
        const staffCount = parseInt(totalStaff.rows[0].count);
        const responsesNum = parseInt(responsesCount.rows[0].count);
        const acknowledgementsNum = parseInt(acknowledgementsCount.rows[0].count);
        
        res.json({
            components: components.rows,
            staff_responses: {
                completed: responsesNum,
                total: staffCount,
                percentage: staffCount > 0 ? Math.round((responsesNum / staffCount) * 100) : 0
            },
            staff_acknowledgments: {
                completed: acknowledgementsNum,
                total: staffCount,
                percentage: staffCount > 0 ? Math.round((acknowledgementsNum / staffCount) * 100) : 0
            }
        });
        
    } catch (error) {
        console.error('Error fetching component progress:', error);
        res.status(500).json({ error: 'Failed to fetch component progress' });
    }
});

router.post('/facilities/:facilityId/training/modules/:moduleId/components/:componentType/complete', authenticateToken, async (req, res) => {
    try {
        const facilityId = req.params.facilityId;
        const moduleId = req.params.moduleId;
        const componentType = req.params.componentType;
        
        await pool.query(`
            INSERT INTO training_component_progress 
            (facility_id, module_id, component_type, completed, completion_percentage, completed_at)
            VALUES ($1, $2, $3, true, 100, NOW())
            ON CONFLICT (facility_id, module_id, component_type)
            DO UPDATE SET 
                completed = true, 
                completion_percentage = 100, 
                completed_at = NOW(), 
                updated_at = NOW()
        `, [facilityId, moduleId, componentType]);
        
        const overallPercentage = await recalculateModuleProgress(facilityId, moduleId);
        
        res.json({ success: true, overall_percentage: overallPercentage });
        
    } catch (error) {
        console.error('Error marking component complete:', error);
        res.status(500).json({ error: 'Failed to mark component complete' });
    }
});

router.post('/facilities/:facilityId/training/modules/:moduleId/staff-responses', authenticateToken, async (req, res) => {
    try {
        const facilityId = req.params.facilityId;
        const moduleId = req.params.moduleId;
        const { staff_id, emoji_used } = req.body;
        
        await pool.query(`
            INSERT INTO training_staff_responses 
            (facility_id, module_id, staff_id, responded, emoji_used, responded_at)
            VALUES ($1, $2, $3, true, $4, NOW())
            ON CONFLICT (facility_id, module_id, staff_id)
            DO UPDATE SET responded = true, emoji_used = $4, responded_at = NOW()
        `, [facilityId, moduleId, staff_id, emoji_used || '👍']);
        
        const totalStaff = await pool.query(
            'SELECT COUNT(*) as count FROM staff WHERE facility_id = $1',
            [facilityId]
        );
        const responsesCount = await pool.query(`
            SELECT COUNT(*) as count FROM training_staff_responses
            WHERE facility_id = $1 AND module_id = $2
        `, [facilityId, moduleId]);
        
        const staffCount = parseInt(totalStaff.rows[0].count);
        const responsesNum = parseInt(responsesCount.rows[0].count);
        const percentage = staffCount > 0 ? Math.round((responsesNum / staffCount) * 100) : 0;
        
        if (percentage >= 80) {
            await pool.query(`
                INSERT INTO training_component_progress 
                (facility_id, module_id, component_type, completed, completion_percentage, completed_at)
                VALUES ($1, $2, 'communication', true, 100, NOW())
                ON CONFLICT (facility_id, module_id, component_type)
                DO UPDATE SET completed = true, completion_percentage = 100, completed_at = NOW()
            `, [facilityId, moduleId]);
            
            await recalculateModuleProgress(facilityId, moduleId);
        }
        
        res.json({ success: true, percentage });
        
    } catch (error) {
        console.error('Error logging staff response:', error);
        res.status(500).json({ error: 'Failed to log response' });
    }
});

router.get('/facilities/:facilityId/training/modules/:moduleId/staff-responses', authenticateToken, async (req, res) => {
    try {
        const facilityId = req.params.facilityId;
        const moduleId = req.params.moduleId;
        
        const result = await pool.query(`
            SELECT sr.*, s.name as staff_name
            FROM training_staff_responses sr
            JOIN staff s ON sr.staff_id = s.id
            WHERE sr.facility_id = $1 AND sr.module_id = $2
            ORDER BY sr.responded_at DESC
        `, [facilityId, moduleId]);
        
        res.json(result.rows);
        
    } catch (error) {
        console.error('Error fetching staff responses:', error);
        res.status(500).json({ error: 'Failed to fetch responses' });
    }
});

router.post('/facilities/:facilityId/training/modules/:moduleId/acknowledgments', authenticateToken, async (req, res) => {
    try {
        const facilityId = req.params.facilityId;
        const moduleId = req.params.moduleId;
        const { staff_id } = req.body;
        
        await pool.query(`
            INSERT INTO training_acknowledgments 
            (facility_id, module_id, staff_id, acknowledged, acknowledged_at)
            VALUES ($1, $2, $3, true, NOW())
            ON CONFLICT (facility_id, module_id, staff_id)
            DO UPDATE SET acknowledged = true, acknowledged_at = NOW()
        `, [facilityId, moduleId, staff_id]);
        
        const totalStaff = await pool.query(
            'SELECT COUNT(*) as count FROM staff WHERE facility_id = $1',
            [facilityId]
        );
        const acknowledgementsCount = await pool.query(`
            SELECT COUNT(*) as count FROM training_acknowledgments
            WHERE facility_id = $1 AND module_id = $2
        `, [facilityId, moduleId]);
        
        const staffCount = parseInt(totalStaff.rows[0].count);
        const acknowledgementsNum = parseInt(acknowledgementsCount.rows[0].count);
        const percentage = staffCount > 0 ? Math.round((acknowledgementsNum / staffCount) * 100) : 0;
        
        if (percentage >= 80) {
            await pool.query(`
                INSERT INTO training_component_progress 
                (facility_id, module_id, component_type, completed, completion_percentage, completed_at)
                VALUES ($1, $2, 'acknowledgment', true, 100, NOW())
                ON CONFLICT (facility_id, module_id, component_type)
                DO UPDATE SET completed = true, completion_percentage = 100, completed_at = NOW()
            `, [facilityId, moduleId]);
            
            await recalculateModuleProgress(facilityId, moduleId);
        }
        
        res.json({ success: true, percentage });
        
    } catch (error) {
        console.error('Error logging acknowledgment:', error);
        res.status(500).json({ error: 'Failed to log acknowledgment' });
    }
});

router.get('/facilities/:facilityId/training/modules/:moduleId/acknowledgments', authenticateToken, async (req, res) => {
    try {
        const facilityId = req.params.facilityId;
        const moduleId = req.params.moduleId;
        
        const result = await pool.query(`
            SELECT ta.*, s.name as staff_name
            FROM training_acknowledgments ta
            JOIN staff s ON ta.staff_id = s.id
            WHERE ta.facility_id = $1 AND ta.module_id = $2
            ORDER BY ta.acknowledged_at DESC
        `, [facilityId, moduleId]);
        
        res.json(result.rows);
        
    } catch (error) {
        console.error('Error fetching acknowledgments:', error);
        res.status(500).json({ error: 'Failed to fetch acknowledgments' });
    }
});

router.get('/facilities/:facilityId/training/modules/:moduleId/champion-content', authenticateToken, async (req, res) => {
    try {
        const moduleId = req.params.moduleId;
        
        const result = await pool.query(`
            SELECT section_number, section_title, section_content
            FROM training_champion_content
            WHERE module_id = $1
            ORDER BY section_number ASC
        `, [moduleId]);
        
        res.json(result.rows);
        
    } catch (error) {
        console.error('Error fetching champion content:', error);
        res.status(500).json({ error: 'Failed to fetch content' });
    }
});

router.get('/facilities/:facilityId/training/modules/:moduleId/team-message', authenticateToken, async (req, res) => {
    try {
        const moduleId = req.params.moduleId;
        
        const result = await pool.query(`
            SELECT message_title, message_content, customization_tips
            FROM training_team_messages
            WHERE module_id = $1
            LIMIT 1
        `, [moduleId]);
        
        res.json(result.rows[0] || {});
        
    } catch (error) {
        console.error('Error fetching team message:', error);
        res.status(500).json({ error: 'Failed to fetch message' });
    }
});

module.exports = router;
