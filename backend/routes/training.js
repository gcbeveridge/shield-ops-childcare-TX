const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getTrainingModules,
  completeTraining,
  getStaffTraining
} = require('../controllers/trainingController');

router.get('/facilities/:facilityId/training/modules', authenticateToken, getTrainingModules);
router.post('/training/:moduleId/complete', authenticateToken, completeTraining);
router.get('/staff/:staffId/training', authenticateToken, getStaffTraining);

module.exports = router;
