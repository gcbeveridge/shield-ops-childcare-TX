const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { askComplianceQuestion, analyzeIncidentCompliance, suggestTrainingTopics } = require('../services/aiService');
const FacilityDB = require('../models/FacilityDB');

// POST /api/ai/ask - Ask a compliance question
router.post('/ai/ask', authenticate, async (req, res) => {
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
    const facility = await FacilityDB.findById(user.facilityId);

    const result = await askComplianceQuestion(question, {
      facilityName: facility?.name
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
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to process question'
    });
  }
});

// POST /api/ai/analyze-incident - Analyze incident for compliance
router.post('/ai/analyze-incident', authenticate, async (req, res) => {
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
router.post('/ai/training-suggestions', authenticate, async (req, res) => {
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
