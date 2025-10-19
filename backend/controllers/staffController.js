const supabase = require('../config/supabase');

async function getAllStaff(req, res) {
  try {
    const { facilityId } = req.params;

    console.log('Fetching staff for facility:', facilityId);

    const { data: staffList, error } = await supabase
      .from('staff')
      .select('*')
      .eq('facility_id', facilityId);

    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }

    console.log('Staff fetched:', staffList?.length || 0);

    // Map database fields to frontend format
    const mappedStaff = (staffList || []).map(staff => ({
      id: staff.id,
      facilityId: staff.facility_id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      hireDate: staff.hire_date,
      certifications: staff.certifications || {},
      trainingHours: {
        completed: staff.training_completion || 0,
        required: 24,
        year: new Date().getFullYear()
      },
      createdAt: staff.created_at,
      updatedAt: staff.updated_at
    }));

    res.json({
      success: true,
      count: mappedStaff.length,
      data: mappedStaff
    });
  } catch (error) {
    console.error('Error fetching staff:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff members',
      error: error.message
    });
  }
}

async function getStaffById(req, res) {
  try {
    const { staffId } = req.params;

    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('id', staffId)
      .single();

    if (error) throw error;

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Map to frontend format
    const mappedStaff = {
      id: staff.id,
      facilityId: staff.facility_id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      hireDate: staff.hire_date,
      certifications: staff.certifications || {},
      trainingHours: {
        completed: staff.training_completion || 0,
        required: 24,
        year: new Date().getFullYear()
      },
      createdAt: staff.created_at,
      updatedAt: staff.updated_at
    };

    res.json({
      success: true,
      data: mappedStaff
    });
  } catch (error) {
    console.error('Error fetching staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching staff member',
      error: error.message
    });
  }
}

async function createStaff(req, res) {
  try {
    const { facilityId } = req.params;

    const { data: staff, error } = await supabase
      .from('staff')
      .insert({
        facility_id: facilityId,
        name: req.body.name,
        email: req.body.email,
        role: req.body.role,
        hire_date: req.body.hireDate,
        certifications: req.body.certifications || {},
        training_completion: req.body.trainingCompletion || 0
      })
      .select()
      .single();

    if (error) throw error;

    // Map to frontend format
    const mappedStaff = {
      id: staff.id,
      facilityId: staff.facility_id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      hireDate: staff.hire_date,
      certifications: staff.certifications || {},
      trainingHours: {
        completed: staff.training_completion || 0,
        required: 24,
        year: new Date().getFullYear()
      },
      createdAt: staff.created_at,
      updatedAt: staff.updated_at
    };

    res.status(201).json({
      success: true,
      message: 'Staff member created successfully',
      data: mappedStaff
    });
  } catch (error) {
    console.error('Error creating staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating staff member',
      error: error.message
    });
  }
}

async function updateStaff(req, res) {
  try {
    const { staffId } = req.params;

    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.email) updateData.email = req.body.email;
    if (req.body.role) updateData.role = req.body.role;
    if (req.body.hireDate) updateData.hire_date = req.body.hireDate;
    if (req.body.certifications) updateData.certifications = req.body.certifications;
    if (req.body.trainingCompletion !== undefined) updateData.training_completion = req.body.trainingCompletion;

    const { data: staff, error } = await supabase
      .from('staff')
      .update(updateData)
      .eq('id', staffId)
      .select()
      .single();

    if (error) throw error;

    if (!staff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Map to frontend format
    const mappedStaff = {
      id: staff.id,
      facilityId: staff.facility_id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      hireDate: staff.hire_date,
      certifications: staff.certifications || {},
      trainingHours: {
        completed: staff.training_completion || 0,
        required: 24,
        year: new Date().getFullYear()
      },
      createdAt: staff.created_at,
      updatedAt: staff.updated_at
    };

    res.json({
      success: true,
      message: 'Staff member updated successfully',
      data: mappedStaff
    });
  } catch (error) {
    console.error('Error updating staff member:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating staff member',
      error: error.message
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

    // Get existing staff
    const { data: existingStaff } = await supabase
      .from('staff')
      .select('certifications')
      .eq('id', staffId)
      .single();

    if (!existingStaff) {
      return res.status(404).json({
        success: false,
        message: 'Staff member not found'
      });
    }

    // Merge certifications
    const updatedCerts = {
      ...(existingStaff.certifications || {}),
      ...certifications
    };

    const { data: staff, error } = await supabase
      .from('staff')
      .update({ certifications: updatedCerts })
      .eq('id', staffId)
      .select()
      .single();

    if (error) throw error;

    // Map to frontend format
    const mappedStaff = {
      id: staff.id,
      facilityId: staff.facility_id,
      name: staff.name,
      email: staff.email,
      role: staff.role,
      hireDate: staff.hire_date,
      certifications: staff.certifications || {},
      trainingHours: {
        completed: staff.training_completion || 0,
        required: 24,
        year: new Date().getFullYear()
      },
      createdAt: staff.created_at,
      updatedAt: staff.updated_at
    };

    res.json({
      success: true,
      message: 'Certifications updated successfully',
      data: mappedStaff
    });
  } catch (error) {
    console.error('Error updating certifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating certifications',
      error: error.message
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
