const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');
const { getWeatherByZip } = require('../services/weatherService');
const db = require('../config/database');

router.get('/facilities/:facilityId/dashboard', authenticateToken, getDashboard);

router.get('/facilities/:facilityId/weather', authenticateToken, async (req, res) => {
  try {
    const { facilityId } = req.params;
    
    const facility = await db.get(`facilities:${facilityId}`);
    
    if (!facility) {
      return res.status(404).json({ error: 'Facility not found' });
    }
    
    const zipCode = facility.address.zip;
    const weather = await getWeatherByZip(zipCode);
    
    res.json({
      success: true,
      weather
    });
    
  } catch (error) {
    console.error('Weather endpoint error:', error);
    res.status(500).json({
      error: true,
      message: 'Failed to fetch weather data'
    });
  }
});

module.exports = router;
