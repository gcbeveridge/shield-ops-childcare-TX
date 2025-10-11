const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

router.get('/facilities/:facilityId/dashboard', authenticateToken, getDashboard);

module.exports = router;
