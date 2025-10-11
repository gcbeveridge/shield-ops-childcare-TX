const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllIncidents,
  createIncident,
  getIncidentById,
  addParentSignature
} = require('../controllers/incidentController');

router.get('/facilities/:facilityId/incidents', authenticateToken, getAllIncidents);
router.post('/facilities/:facilityId/incidents', authenticateToken, createIncident);
router.get('/incidents/:incidentId', authenticateToken, getIncidentById);
router.put('/incidents/:incidentId/parent-signature', authenticateToken, addParentSignature);

module.exports = router;
