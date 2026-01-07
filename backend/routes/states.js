const express = require('express');
const router = express.Router();
const pool = require('../config/db');

const SUPPORTED_STATES = [
    { code: 'TX', name: 'Texas', supported: true },
    { code: 'CA', name: 'California', supported: true },
    { code: 'FL', name: 'Florida', supported: true },
    { code: 'NY', name: 'New York', supported: true },
    { code: 'PA', name: 'Pennsylvania', supported: true },
    { code: 'IL', name: 'Illinois', supported: true },
    { code: 'OH', name: 'Ohio', supported: true },
    { code: 'GA', name: 'Georgia', supported: true },
    { code: 'NC', name: 'North Carolina', supported: true },
    { code: 'MI', name: 'Michigan', supported: true },
    { code: 'AZ', name: 'Arizona', supported: false },
    { code: 'WA', name: 'Washington', supported: false },
    { code: 'MA', name: 'Massachusetts', supported: false },
    { code: 'TN', name: 'Tennessee', supported: false },
    { code: 'IN', name: 'Indiana', supported: false },
    { code: 'MO', name: 'Missouri', supported: false },
    { code: 'MD', name: 'Maryland', supported: false },
    { code: 'WI', name: 'Wisconsin', supported: false },
    { code: 'CO', name: 'Colorado', supported: false },
    { code: 'MN', name: 'Minnesota', supported: false },
    { code: 'SC', name: 'South Carolina', supported: false },
    { code: 'AL', name: 'Alabama', supported: false },
    { code: 'LA', name: 'Louisiana', supported: false },
    { code: 'KY', name: 'Kentucky', supported: false },
    { code: 'OR', name: 'Oregon', supported: false },
    { code: 'OK', name: 'Oklahoma', supported: false },
    { code: 'CT', name: 'Connecticut', supported: false },
    { code: 'UT', name: 'Utah', supported: false },
    { code: 'IA', name: 'Iowa', supported: false },
    { code: 'NV', name: 'Nevada', supported: false },
    { code: 'AR', name: 'Arkansas', supported: false },
    { code: 'MS', name: 'Mississippi', supported: false },
    { code: 'KS', name: 'Kansas', supported: false },
    { code: 'NM', name: 'New Mexico', supported: false },
    { code: 'NE', name: 'Nebraska', supported: false },
    { code: 'ID', name: 'Idaho', supported: false },
    { code: 'WV', name: 'West Virginia', supported: false },
    { code: 'HI', name: 'Hawaii', supported: false },
    { code: 'NH', name: 'New Hampshire', supported: false },
    { code: 'ME', name: 'Maine', supported: false },
    { code: 'RI', name: 'Rhode Island', supported: false },
    { code: 'MT', name: 'Montana', supported: false },
    { code: 'DE', name: 'Delaware', supported: false },
    { code: 'SD', name: 'South Dakota', supported: false },
    { code: 'ND', name: 'North Dakota', supported: false },
    { code: 'AK', name: 'Alaska', supported: false },
    { code: 'VT', name: 'Vermont', supported: false },
    { code: 'WY', name: 'Wyoming', supported: false },
    { code: 'NJ', name: 'New Jersey', supported: false },
    { code: 'VA', name: 'Virginia', supported: false }
];

router.get('/list', (req, res) => {
    res.json({
        success: true,
        data: SUPPORTED_STATES.sort((a, b) => a.name.localeCompare(b.name))
    });
});

router.get('/:stateCode/regulations', async (req, res) => {
    try {
        const { stateCode } = req.params;
        const { category } = req.query;
        
        let query = 'SELECT * FROM state_regulations WHERE state_code = $1';
        const values = [stateCode.toUpperCase()];
        
        if (category) {
            query += ' AND regulation_category = $2';
            values.push(category);
        }
        
        query += ' ORDER BY regulation_category, created_at';
        
        const result = await pool.query(query, values);
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching state regulations:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch state regulations' });
    }
});

router.get('/:stateCode/categories', async (req, res) => {
    try {
        const { stateCode } = req.params;
        
        const query = `
            SELECT DISTINCT regulation_category, COUNT(*) as count
            FROM state_regulations 
            WHERE state_code = $1
            GROUP BY regulation_category
            ORDER BY regulation_category
        `;
        
        const result = await pool.query(query, [stateCode.toUpperCase()]);
        
        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching regulation categories:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch regulation categories' });
    }
});

router.put('/facility/:facilityId', async (req, res) => {
    try {
        const { facilityId } = req.params;
        const { state_code, state_name } = req.body;
        
        if (!state_code) {
            return res.status(400).json({ success: false, message: 'state_code is required' });
        }
        
        const stateInfo = SUPPORTED_STATES.find(s => s.code === state_code.toUpperCase());
        const finalStateName = state_name || (stateInfo ? stateInfo.name : state_code);
        
        const query = `
            UPDATE facilities 
            SET state_code = $1, state_name = $2, updated_at = NOW()
            WHERE id = $3
            RETURNING *
        `;
        
        const result = await pool.query(query, [state_code.toUpperCase(), finalStateName, facilityId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Facility not found' });
        }
        
        res.json({
            success: true,
            data: {
                state_code: result.rows[0].state_code,
                state_name: result.rows[0].state_name
            }
        });
    } catch (error) {
        console.error('Error updating facility state:', error);
        res.status(500).json({ success: false, message: 'Failed to update facility state' });
    }
});

router.get('/facility/:facilityId', async (req, res) => {
    try {
        const { facilityId } = req.params;
        
        const query = 'SELECT state_code, state_name FROM facilities WHERE id = $1';
        const result = await pool.query(query, [facilityId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Facility not found' });
        }
        
        res.json({
            success: true,
            data: {
                state_code: result.rows[0].state_code || 'TX',
                state_name: result.rows[0].state_name || 'Texas'
            }
        });
    } catch (error) {
        console.error('Error fetching facility state:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch facility state' });
    }
});

module.exports = router;
