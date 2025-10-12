const StaffDB = require('../models/StaffDB');

async function getAllStaff(req, res) {
  try {
    const { facilityId } = req.params;
    
    const staffList = await StaffDB.findByFacilityId(facilityId);
    
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
    
    const staff = await StaffDB.findById(staffId);
    
    if (!staff) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff member not found' 
      });
    }
    
    res.json({
      success: true,
      data: staff
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
    
    const staff = await StaffDB.create({
      ...req.body,
      facilityId
    });
    
    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: staff
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
    
    const staff = await StaffDB.update(staffId, req.body);
    
    if (!staff) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff member not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: staff
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
    
    const existingStaff = await StaffDB.findById(staffId);
    
    if (!existingStaff) {
      return res.status(404).json({ 
        success: false, 
        message: 'Staff member not found' 
      });
    }
    
    const updatedCerts = {
      ...existingStaff.certifications,
      ...certifications
    };
    
    const staff = await StaffDB.updateCertifications(staffId, updatedCerts);
    
    res.json({
      success: true,
      message: 'Certifications updated successfully',
      data: staff
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
