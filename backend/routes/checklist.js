const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getOrCreateTodayChecklist,
  completeTask,
  getWeekStats
} = require('../controllers/checklistController');

router.get('/facilities/:facilityId/checklist/today', authenticateToken, getOrCreateTodayChecklist);
router.post('/facilities/:facilityId/checklist/today/tasks/:taskId/complete', authenticateToken, completeTask);
router.get('/facilities/:facilityId/checklist/week', authenticateToken, getWeekStats);

module.exports = router;
