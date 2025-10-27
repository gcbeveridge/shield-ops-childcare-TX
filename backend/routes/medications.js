const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getActiveMedications,
  createMedication,
  administerDose,
  getMedicationDetails,
  bulkImportMedications,
  deleteMedication,
  getMedicationLogs
} = require('../controllers/medicationController');

router.get('/facilities/:facilityId/medications', authenticateToken, getActiveMedications);
router.get('/facilities/:facilityId/medication-logs', authenticateToken, getMedicationLogs);
router.post('/facilities/:facilityId/medications', authenticateToken, createMedication);
router.post('/facilities/:facilityId/medications/bulk', authenticateToken, bulkImportMedications);
router.post('/medications/:medicationId/administer', authenticateToken, administerDose);
router.get('/medications/:medicationId', authenticateToken, getMedicationDetails);
router.delete('/medications/:medicationId', authenticateToken, deleteMedication);

module.exports = router;
