const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  updateCertifications,
  bulkImportStaff
} = require('../controllers/staffController');

router.get('/facilities/:facilityId/staff', authenticateToken, getAllStaff);
router.post('/facilities/:facilityId/staff', authenticateToken, createStaff);
router.post('/facilities/:facilityId/staff/bulk', authenticateToken, bulkImportStaff);
router.get('/staff/:staffId', authenticateToken, getStaffById);
router.put('/staff/:staffId', authenticateToken, updateStaff);
router.put('/staff/:staffId/certifications', authenticateToken, updateCertifications);

module.exports = router;
