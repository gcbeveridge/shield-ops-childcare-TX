const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// ============================================
// GET /api/onboarding/day-one
// Returns all 7 Day One sections ordered by section_order
// ============================================
router.get('/onboarding/day-one', async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        section_order,
        section_title,
        section_duration_minutes,
        champion_script,
        texas_statute_reference,
        content_json,
        verification_questions
      FROM day_one_orientation_content
      ORDER BY section_order ASC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching Day One content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Day One orientation content'
    });
  }
});

// ============================================
// GET /api/onboarding/week-one
// Returns all 6 Week One days ordered by day_number
// ============================================
router.get('/onboarding/week-one', async (req, res) => {
  try {
    const query = `
      SELECT 
        id,
        day_number,
        title,
        duration_minutes,
        champion_approach,
        activities_json,
        signoff_criteria,
        champion_signoff_criteria
      FROM week_one_checkins_content
      ORDER BY day_number ASC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching Week One content:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Week One check-in content'
    });
  }
});

// ============================================
// GET /api/onboarding/week-one/:dayNumber
// Returns specific day content (dayNumber 2-7)
// ============================================
router.get('/onboarding/week-one/:dayNumber', async (req, res) => {
  try {
    const { dayNumber } = req.params;
    const dayNum = parseInt(dayNumber);
    
    // Validate day number
    if (isNaN(dayNum) || dayNum < 2 || dayNum > 7) {
      return res.status(400).json({
        success: false,
        error: 'Invalid day number. Must be between 2 and 7.'
      });
    }
    
    const query = `
      SELECT 
        id,
        day_number,
        title,
        duration_minutes,
        champion_approach,
        activities_json,
        signoff_criteria,
        champion_signoff_criteria
      FROM week_one_checkins_content
      WHERE day_number = $1
    `;
    
    const result = await pool.query(query, [dayNum]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: `Week One Day ${dayNum} content not found`
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching Week One day:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch Week One day content'
    });
  }
});

// ============================================
// GET /api/onboarding/new-hires
// Returns all new hire onboarding records for a facility
// Joins with staff table to get employee names
// ============================================
router.get('/onboarding/new-hires', async (req, res) => {
  try {
    const { facility_id } = req.query;
    
    if (!facility_id) {
      return res.status(400).json({
        success: false,
        error: 'facility_id is required'
      });
    }
    
    const query = `
      SELECT 
        o.id,
        o.facility_id,
        o.staff_id,
        o.hire_date,
        o.day_one_completed,
        o.day_one_completed_at,
        o.day_one_duration_minutes,
        o.week_one_progress,
        o.status,
        o.created_at,
        s.name as staff_name,
        s.email as staff_email,
        s.role as staff_role,
        champion.name as champion_name
      FROM onboarding_records o
      INNER JOIN staff s ON o.staff_id = s.id
      LEFT JOIN staff champion ON o.day_one_champion_id = champion.id
      WHERE o.facility_id = $1
      ORDER BY o.created_at DESC
    `;
    
    const result = await pool.query(query, [facility_id]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching new hire records:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch new hire onboarding records'
    });
  }
});

// ============================================
// GET /api/onboarding/new-hires/:id
// Returns single new hire onboarding record with progress
// ============================================
router.get('/onboarding/new-hires/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT 
        o.id,
        o.facility_id,
        o.staff_id,
        o.hire_date,
        o.day_one_completed,
        o.day_one_completed_at,
        o.day_one_champion_id,
        o.day_one_duration_minutes,
        o.day_one_signatures,
        o.week_one_progress,
        o.status,
        o.created_at,
        o.updated_at,
        s.name as staff_name,
        s.email as staff_email,
        s.role as staff_role,
        champion.name as champion_name
      FROM onboarding_records o
      INNER JOIN staff s ON o.staff_id = s.id
      LEFT JOIN staff champion ON o.day_one_champion_id = champion.id
      WHERE o.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Onboarding record not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching onboarding record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch onboarding record'
    });
  }
});

// ============================================
// POST /api/onboarding/new-hires
// Creates new onboarding record
// Body: { facility_id, staff_id, hire_date }
// ============================================
router.post('/onboarding/new-hires', async (req, res) => {
  try {
    const { facility_id, staff_id, hire_date } = req.body;
    
    // Validation
    if (!facility_id || !staff_id || !hire_date) {
      return res.status(400).json({
        success: false,
        error: 'facility_id, staff_id, and hire_date are required'
      });
    }
    
    // Check if onboarding record already exists
    const checkQuery = `
      SELECT id FROM onboarding_records 
      WHERE facility_id = $1 AND staff_id = $2
    `;
    const checkResult = await pool.query(checkQuery, [facility_id, staff_id]);
    
    if (checkResult.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Onboarding record already exists for this staff member'
      });
    }
    
    // Create new record
    const insertQuery = `
      INSERT INTO onboarding_records (
        facility_id,
        staff_id,
        hire_date,
        week_one_progress,
        status
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING 
        id,
        facility_id,
        staff_id,
        hire_date,
        day_one_completed,
        week_one_progress,
        status,
        created_at
    `;
    
    const weekOneProgress = {
      day_2: false,
      day_3: false,
      day_4: false,
      day_5: false,
      day_6: false,
      day_7: false
    };
    
    const result = await pool.query(insertQuery, [
      facility_id,
      staff_id,
      hire_date,
      JSON.stringify(weekOneProgress),
      'in_progress'
    ]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating onboarding record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create onboarding record'
    });
  }
});

// ============================================
// POST /api/onboarding/day-one/complete
// Marks Day One as complete
// Body: { onboarding_id, champion_id, duration_minutes, signatures }
// ============================================
router.post('/onboarding/day-one/complete', async (req, res) => {
  try {
    const { onboarding_id, champion_id, duration_minutes, signatures } = req.body;
    
    // Validation
    if (!onboarding_id) {
      return res.status(400).json({
        success: false,
        error: 'onboarding_id is required'
      });
    }
    
    const updateQuery = `
      UPDATE onboarding_records
      SET 
        day_one_completed = true,
        day_one_completed_at = CURRENT_TIMESTAMP,
        day_one_champion_id = $2,
        day_one_duration_minutes = $3,
        day_one_signatures = $4,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING 
        id,
        facility_id,
        staff_id,
        day_one_completed,
        day_one_completed_at,
        day_one_champion_id,
        day_one_duration_minutes,
        status
    `;
    
    const result = await pool.query(updateQuery, [
      onboarding_id,
      champion_id || null,
      duration_minutes || null,
      signatures ? JSON.stringify(signatures) : null
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Onboarding record not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error completing Day One:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark Day One as complete'
    });
  }
});

// ============================================
// POST /api/onboarding/week-one/complete-day
// Marks a Week One day as complete
// Body: { onboarding_id, day_number, notes }
// ============================================
router.post('/onboarding/week-one/complete-day', async (req, res) => {
  try {
    const { onboarding_id, day_number, notes } = req.body;
    
    // Validation
    if (!onboarding_id || !day_number) {
      return res.status(400).json({
        success: false,
        error: 'onboarding_id and day_number are required'
      });
    }
    
    const dayNum = parseInt(day_number);
    if (isNaN(dayNum) || dayNum < 2 || dayNum > 7) {
      return res.status(400).json({
        success: false,
        error: 'day_number must be between 2 and 7'
      });
    }
    
    // Get current record
    const getQuery = `SELECT week_one_progress FROM onboarding_records WHERE id = $1`;
    const getResult = await pool.query(getQuery, [onboarding_id]);
    
    if (getResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Onboarding record not found'
      });
    }
    
    // Update week one progress
    const currentProgress = getResult.rows[0].week_one_progress || {};
    const dayKey = `day_${dayNum}`;
    currentProgress[dayKey] = {
      completed: true,
      completed_at: new Date().toISOString(),
      notes: notes || null
    };
    
    // Check if all days are complete
    const allDaysComplete = [2, 3, 4, 5, 6, 7].every(d => {
      const key = `day_${d}`;
      return currentProgress[key] && currentProgress[key].completed;
    });
    
    const newStatus = allDaysComplete ? 'completed' : 'in_progress';
    
    // Update record
    const updateQuery = `
      UPDATE onboarding_records
      SET 
        week_one_progress = $2,
        status = $3,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING 
        id,
        week_one_progress,
        status,
        updated_at
    `;
    
    const result = await pool.query(updateQuery, [
      onboarding_id,
      JSON.stringify(currentProgress),
      newStatus
    ]);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error completing Week One day:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark Week One day as complete'
    });
  }
});

module.exports = router;
