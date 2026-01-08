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
    
    console.log('🔍 Creating staff member for facility:', facilityId);
    console.log('📋 Staff data received:', {
      name: req.body.name,
      email: req.body.email,
      role: req.body.role,
      hireDate: req.body.hireDate
    });

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

    if (error) {
      console.error('❌ Supabase insert error:', error);
      throw error;
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

async function bulkImportStaff(req, res) {
  try {
    const { facilityId } = req.params;
    const { data: staffData } = req.body;

    if (!staffData || !Array.isArray(staffData)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Expected array of staff records.'
      });
    }

    console.log(`Bulk importing ${staffData.length} staff members for facility ${facilityId}`);

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Process each staff member
    for (let i = 0; i < staffData.length; i++) {
      const row = staffData[i];

      try {
        // Build certifications object from CSV columns
        const certifications = {};

        if (row['CPR Expiration']) {
          certifications.cpr = { expires: row['CPR Expiration'] };
        }
        if (row['First Aid Expiration']) {
          certifications.firstAid = { expires: row['First Aid Expiration'] };
        }
        if (row['CDA Expiration']) {
          certifications.cda = { expires: row['CDA Expiration'] };
        }
        if (row['Teaching Certificate Expiration']) {
          certifications.teachingCert = { expires: row['Teaching Certificate Expiration'] };
        }
        if (row['Food Handler Expiration']) {
          certifications.foodHandler = { expires: row['Food Handler Expiration'] };
        }
        if (row['Background Check Date']) {
          certifications.backgroundCheck = { date: row['Background Check Date'] };
        }
        if (row['TB Screening Date']) {
          certifications.tbScreening = { date: row['TB Screening Date'] };
        }

        // Insert staff member
        const { error } = await supabase
          .from('staff')
          .insert({
            facility_id: facilityId,
            name: row.Name,
            email: row.Email,
            role: row.Role,
            hire_date: row['Hire Date'],
            certifications: certifications,
            training_completion: 0
          });

        if (error) {
          throw error;
        }

        results.success++;
      } catch (error) {
        console.error(`Error importing row ${i + 1}:`, error.message);
        results.failed++;
        results.errors.push({
          row: row.Name || `Row ${i + 1}`,
          error: error.message
        });
      }
    }

    console.log('Bulk import complete:', results);

    res.json({
      success: true,
      message: `Imported ${results.success} staff members, ${results.failed} failed`,
      ...results
    });
  } catch (error) {
    console.error('Error in bulk import:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing staff members',
      error: error.message
    });
  }
}

module.exports = {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  updateCertifications,
  bulkImportStaff
};
