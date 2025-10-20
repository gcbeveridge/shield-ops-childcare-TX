const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');
const { getWeatherByZip } = require('../services/weatherService');
const supabase = require('../config/supabase');

router.get('/facilities/:facilityId/dashboard', authenticateToken, getDashboard);

router.get('/facilities/:facilityId/weather', authenticateToken, async (req, res) => {
  try {
    const { facilityId } = req.params;

    // Get facility from Supabase
    const { data: facility, error: facilityError } = await supabase
      .from('facilities')
      .select('*')
      .eq('id', facilityId)
      .single();

    if (facilityError || !facility) {
      console.error('Facility fetch error:', facilityError);
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
