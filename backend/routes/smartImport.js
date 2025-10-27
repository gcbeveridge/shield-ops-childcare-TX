const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const upload = require('../config/multerConfig');
const {
  parseFileWithAI,
  bulkImportStaff,
  bulkImportMedications,
  bulkImportIncidents
} = require('../controllers/smartImportController');

// Smart Import - AI-powered file parsing
router.post('/facilities/:facilityId/smart-import/:importType', 
  authenticateToken, 
  upload.single('file'), 
  parseFileWithAI
);

// Bulk import after verification
router.post('/facilities/:facilityId/bulk-import/staff', 
  authenticateToken, 
  bulkImportStaff
);

router.post('/facilities/:facilityId/bulk-import/medications', 
  authenticateToken, 
  bulkImportMedications
);

router.post('/facilities/:facilityId/bulk-import/incidents', 
  authenticateToken, 
  bulkImportIncidents
);

module.exports = router;
