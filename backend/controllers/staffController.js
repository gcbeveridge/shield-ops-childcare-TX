const db = require('../config/database');
const Staff = require('../models/Staff');

async function getAllStaff(req, res) {
  try {
    const { facilityId } = req.params;
    
    const staffList = await db.list(`staff:${facilityId}:`);
    
    res.json({
      success: true,
      count: staffList.length,
      data: staffList
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching staff members' 
    });
  }
}

async function getStaffById(req, res) {
  try {
    const { staffId } = req.params;
    
    const staffData = await db.getByPrefix(`staff:`, (key, value) => value.id === staffId);
    
    if (!staffData) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff member not found' 
      });
    }
    
    res.json({
      success: true,
      data: staffData
    });
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching staff member' 
    });
  }
}

async function createStaff(req, res) {
  try {
    const { facilityId } = req.params;
    
    const staff = new Staff({
      ...req.body,
      facilityId
    });
    
    const errors = staff.validate();
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors 
      });
    }
    
    await db.set(`staff:${facilityId}:${staff.id}`, staff.toJSON());
    
    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: staff.toJSON()
    });
  } catch (error) {
    console.error('Error creating staff member:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating staff member' 
    });
  }
}

async function updateStaff(req, res) {
  try {
    const { staffId } = req.params;
    
    const existingStaff = await db.getByPrefix(`staff:`, (key, value) => value.id === staffId);
    
    if (!existingStaff) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff member not found' 
      });
    }
    
    const updatedStaff = new Staff({
      ...existingStaff,
      ...req.body,
      id: staffId,
      updatedAt: new Date().toISOString()
    });
    
    const errors = updatedStaff.validate();
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors 
      });
    }
    
    await db.set(`staff:${updatedStaff.facilityId}:${staffId}`, updatedStaff.toJSON());
    
    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: updatedStaff.toJSON()
    });
  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating staff member' 
    });
  }
}

async function updateCertifications(req, res) {
  try {
    const { staffId } = req.params;
    const { certifications } = req.body;
    
    if (!certifications) {
      return res.status(400).json({ 
        success: false, 
        message: 'Certifications data is required' 
      });
    }
    
    const existingStaff = await db.getByPrefix(`staff:`, (key, value) => value.id === staffId);
    
    if (!existingStaff) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff member not found' 
      });
    }
    
    const updatedStaff = new Staff({
      ...existingStaff,
      certifications: {
        ...existingStaff.certifications,
        ...certifications
      },
      updatedAt: new Date().toISOString()
    });
    
    await db.set(`staff:${updatedStaff.facilityId}:${staffId}`, updatedStaff.toJSON());
    
    res.json({
      success: true,
      message: 'Certifications updated successfully',
      data: updatedStaff.toJSON()
    });
  } catch (error) {
    console.error('Error updating certifications:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating certifications' 
    });
  }
}

module.exports = {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  updateCertifications
};
