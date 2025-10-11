const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getComplianceStatus,
  markRequirementComplete
} = require('../controllers/complianceController');

router.get('/facilities/:facilityId/compliance', authenticateToken, getComplianceStatus);
router.post('/facilities/:facilityId/compliance/:requirementId/complete', authenticateToken, markRequirementComplete);

module.exports = router;
