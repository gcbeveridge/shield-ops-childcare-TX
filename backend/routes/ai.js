const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { askComplianceQuestion, analyzeIncidentCompliance, suggestTrainingTopics } = require('../services/aiService');
const FacilityDB = require('../models/FacilityDB');

// POST /api/ai/ask - Ask a compliance question
router.post('/ai/ask', authenticateToken, async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || question.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Question is required'
      });
    }

    // Get facility context for better responses
    const user = req.user;
    let facility = null;

    try {
      facility = await FacilityDB.findById(user.facilityId);
    } catch (dbError) {
      console.warn('Could not fetch facility context:', dbError.message);
      // Continue without facility context
    }

    const result = await askComplianceQuestion(question, {
      facilityName: facility?.name || 'Unknown Facility'
    });

    res.json({
      success: true,
      data: {
        question,
        answer: result.answer,
        timestamp: new Date().toISOString(),
        usage: result.usage
      }
    });
  } catch (error) {
    console.error('AI Ask Error:', error);

    // Check if it's a network/connection error
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return res.status(503).json({
        success: false,
        message: 'Database connection unavailable. Please check your internet connection and try again.',
        error: 'SERVICE_UNAVAILABLE'
      });
    }

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process question',
      error: 'AI_SERVICE_ERROR'
    });
  }
});

// POST /api/ai/analyze-incident - Analyze incident for compliance
router.post('/ai/analyze-incident', authenticateToken, async (req, res) => {
  try {
    const { incident } = req.body;

    if (!incident) {
      return res.status(400).json({
        success: false,
        message: 'Incident data is required'
      });
    }

    const result = await analyzeIncidentCompliance(incident);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Incident Analysis Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to analyze incident'
    });
  }
});

// POST /api/ai/training-suggestions - Get training suggestions
router.post('/ai/training-suggestions', authenticateToken, async (req, res) => {
  try {
    const { staffRole, completedModules } = req.body;

    if (!staffRole) {
      return res.status(400).json({
        success: false,
        message: 'Staff role is required'
      });
    }

    const result = await suggestTrainingTopics(staffRole, completedModules || []);

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Training Suggestions Error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to get training suggestions'
    });
  }
});

module.exports = router;
