const axios = require('axios');

// Using Open-Meteo (free, no API key required)
async function getWeatherByZip(zipCode) {
  try {
    // First, geocode the zip code (US only for now)
    const geoResponse = await axios.get(
      `https://geocoding-api.open-meteo.com/v1/search?name=${zipCode}&count=1&language=en&format=json`
    );
    
    if (!geoResponse.data.results || geoResponse.data.results.length === 0) {
      throw new Error('Location not found');
    }
    
    const { latitude, longitude, name } = geoResponse.data.results[0];
    
    // Get weather data
    const weatherResponse = await axios.get(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America/Chicago`
    );
    
    const current = weatherResponse.data.current;
    
    // Weather codes: https://open-meteo.com/en/docs
    const weatherConditions = {
      0: 'Clear',
      1: 'Mostly Clear', 2: 'Partly Cloudy', 3: 'Overcast',
      45: 'Foggy', 48: 'Foggy',
      51: 'Light Drizzle', 53: 'Drizzle', 55: 'Heavy Drizzle',
      61: 'Light Rain', 63: 'Rain', 65: 'Heavy Rain',
      71: 'Light Snow', 73: 'Snow', 75: 'Heavy Snow',
      95: 'Thunderstorm', 96: 'Thunderstorm with Hail'
    };
    
    const condition = weatherConditions[current.weather_code] || 'Unknown';
    const temp = Math.round(current.temperature_2m);
    const humidity = current.relative_humidity_2m;
    const windSpeed = Math.round(current.wind_speed_10m);
    
    // Generate Shield AI recommendations
    let alert = null;
    let recommendation = null;
    
    if (temp >= 95) {
      alert = { type: 'heat', severity: 'high', icon: '🌡️', title: 'High Heat Advisory' };
      recommendation = 'Limit outdoor play to 15 minutes. Increase water breaks every 20 minutes. Ensure all play areas have shade. Monitor children for heat exhaustion signs.';
    } else if (temp <= 32) {
      alert = { type: 'cold', severity: 'high', icon: '❄️', title: 'Cold Weather Alert' };
      recommendation = 'Limit outdoor exposure. Ensure children have appropriate winter clothing. Check for signs of frostbite. Warm indoor activities recommended.';
    } else if (current.weather_code >= 61 && current.weather_code <= 65) {
      alert = { type: 'rain', severity: 'medium', icon: '🌧️', title: 'Heavy Rain - Check Protocol' };
      recommendation = 'Check entrance mats are in place. Verify wet floor signs are posted. Monitor for water accumulation. Indoor activities recommended.';
    } else if (windSpeed >= 25) {
      alert = { type: 'wind', severity: 'medium', icon: '💨', title: 'High Wind Advisory' };
      recommendation = 'Inspect playground equipment. Secure outdoor items. Limit outdoor play. Check for falling branches or debris.';
    } else if (current.weather_code >= 95) {
      alert = { type: 'storm', severity: 'high', icon: '⛈️', title: 'Severe Weather Alert' };
      recommendation = 'Keep all children indoors. Review emergency procedures. Ensure emergency supplies are accessible. Monitor weather updates.';
    }
    
    return {
      location: name,
      temperature: temp,
      condition,
      humidity,
      windSpeed,
      alert,
      recommendation,
      icon: getWeatherIcon(current.weather_code)
    };
    
  } catch (error) {
    console.error('Weather service error:', error);
    return null;
  }
}

function getWeatherIcon(code) {
  if (code === 0) return '☀️';
  if (code <= 3) return '🌤️';
  if (code >= 45 && code <= 48) return '🌫️';
  if (code >= 51 && code <= 65) return '🌧️';
  if (code >= 71 && code <= 75) return '🌨️';
  if (code >= 95) return '⛈️';
  return '☁️';
}

module.exports = { getWeatherByZip };
