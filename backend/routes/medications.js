const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getActiveMedications,
  createMedication,
  administerDose,
  getMedicationDetails
} = require('../controllers/medicationController');

router.get('/facilities/:facilityId/medications', authenticateToken, getActiveMedications);
router.post('/facilities/:facilityId/medications', authenticateToken, createMedication);
router.post('/medications/:medicationId/administer', authenticateToken, administerDose);
router.get('/medications/:medicationId', authenticateToken, getMedicationDetails);

module.exports = router;
