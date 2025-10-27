const supabase = require('../config/supabase');

async function getActiveMedications(req, res) {
  try {
    const { facilityId } = req.params;

    // Fetch all medications for the facility (not just active ones, to allow filtering in frontend)
    const { data: medications, error } = await supabase
      .from('medications')
      .select('*')
      .eq('facility_id', facilityId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching medications:', error);
      return res.status(500).json({
        success: false,
        message: 'Error fetching medications',
        error: error.message
      });
    }

    console.log(`Fetched ${medications.length} medications for facility ${facilityId}`);

    // If no medications found, log it
    if (medications.length === 0) {
      console.log('No medications found - database may be empty');
    } else {
      console.log('Sample medication:', medications[0]);
    }

    res.json({
      success: true,
      count: medications.length,
      data: medications
    });
  } catch (error) {
    console.error('Error fetching medications:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching medications'
    });
  }
}

async function createMedication(req, res) {
  try {
    const { facilityId } = req.params;

    // Transform data to match Supabase schema
    const medicationData = {
      facility_id: facilityId,
      child_name: req.body.childName,
      medication_name: req.body.medicationName,
      dosage: req.body.dosage,
      route: req.body.route,
      frequency: req.body.frequency || req.body.schedule, // Support both field names
      start_date: req.body.startDate,
      end_date: req.body.endDate,
      parent_authorization: req.body.parentAuthorization,
      prescriber_info: req.body.prescriberInfo || {
        name: req.body.prescribedBy || 'Not specified',
        clinic: '',
        phone: ''
      },
      special_instructions: req.body.specialInstructions,
      active: true
    };

    const { data: medication, error } = await supabase
      .from('medications')
      .insert(medicationData)
      .select()
      .single();

    if (error) {
      console.error('Error creating medication:', error);
      return res.status(500).json({
        success: false,
        message: 'Error creating medication authorization',
        error: error.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Medication authorization created successfully',
      data: medication
    });
  } catch (error) {
    console.error('Error creating medication:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating medication authorization'
    });
  }
}

async function administerDose(req, res) {
  try {
    const { medicationId } = req.params;

    // Check if medication exists and is active
    const { data: medication, error: medError } = await supabase
      .from('medications')
      .select('*')
      .eq('id', medicationId)
      .single();

    if (medError || !medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    if (!medication.active) {
      return res.status(400).json({
        success: false,
        message: 'Cannot administer dose for inactive medication'
      });
    }

    // Create medication log
    const logData = {
      medication_id: medicationId,
      administered_at: req.body.administeredAt || new Date().toISOString(),
      administered_by: req.body.administeredBy,
      verified_by: req.body.verifiedBy,
      notes: req.body.notes || ''
    };

    const { data: log, error: logError } = await supabase
      .from('medication_logs')
      .insert(logData)
      .select()
      .single();

    if (logError) {
      console.error('Error logging medication:', logError);
      return res.status(500).json({
        success: false,
        message: 'Error logging medication administration',
        error: logError.message
      });
    }

    res.status(201).json({
      success: true,
      message: 'Medication dose logged successfully (Texas §744.2655 compliant)',
      data: log
    });
  } catch (error) {
    console.error('Error administering medication:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging medication administration'
    });
  }
}

async function getMedicationDetails(req, res) {
  try {
    const { medicationId } = req.params;

    const { data: medication, error: medError } = await supabase
      .from('medications')
      .select('*')
      .eq('id', medicationId)
      .single();

    if (medError || !medication) {
      console.error('Medication not found:', medError);
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    const { data: logs, error: logsError } = await supabase
      .from('medication_logs')
      .select('*')
      .eq('medication_id', medicationId)
      .order('administered_at', { ascending: false });

    if (logsError) {
      console.error('Error fetching medication logs:', logsError);
    }

    // Return flat medication data with logs attached
    const responseData = {
      ...medication,
      administrationLog: logs || [],
      totalDosesGiven: (logs || []).length
    };

    res.json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error('Error fetching medication details:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching medication details'
    });
  }
}

async function bulkImportMedications(req, res) {
  try {
    const { facilityId } = req.params;
    const { data: medicationData } = req.body;

    if (!medicationData || !Array.isArray(medicationData)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid data format. Expected array of medication records.'
      });
    }

    console.log(`Bulk importing ${medicationData.length} medications for facility ${facilityId}`);

    const results = {
      success: 0,
      failed: 0,
      errors: []
    };

    // Process each medication
    for (let i = 0; i < medicationData.length; i++) {
      const row = medicationData[i];

      try {
        const medication = new Medication({
          facilityId,
          childName: row['Child Name'],
          medicationName: row['Medication Name'],
          dosage: row.Dosage,
          frequency: row.Frequency,
          route: row.Route,
          startDate: row['Start Date'],
          endDate: row['End Date'],
          prescriber: {
            name: row['Prescriber Name'],
            phone: row['Prescriber Phone']
          },
          instructions: row.Instructions || '',
          allergies: row.Allergies || '',
          status: 'active'
        });

        // Validate medication
        const errors = medication.validate();
        if (errors.length > 0) {
          throw new Error(errors.join(', '));
        }

        // Save to database
        await db.set(`medication:${facilityId}:${medication.id}`, medication.toJSON());

        results.success++;
      } catch (error) {
        console.error(`Error importing row ${i + 1}:`, error.message);
        results.failed++;
        results.errors.push({
          row: row['Child Name'] || `Row ${i + 1}`,
          error: error.message
        });
      }
    }

    console.log('Bulk medication import complete:', results);

    res.json({
      success: true,
      message: `Imported ${results.success} medications, ${results.failed} failed`,
      ...results
    });
  } catch (error) {
    console.error('Error in bulk medication import:', error);
    res.status(500).json({
      success: false,
      message: 'Error importing medications',
      error: error.message
    });
  }
}

async function deleteMedication(req, res) {
  try {
    const { medicationId } = req.params;

    // First check if medication exists
    const { data: medication, error: fetchError } = await supabase
      .from('medications')
      .select('*')
      .eq('id', medicationId)
      .single();

    if (fetchError || !medication) {
      return res.status(404).json({
        success: false,
        message: 'Medication not found'
      });
    }

    // Delete the medication
    const { error: deleteError } = await supabase
      .from('medications')
      .delete()
      .eq('id', medicationId);

    if (deleteError) {
      console.error('Error deleting medication:', deleteError);
      return res.status(500).json({
        success: false,
        message: 'Error deleting medication',
        error: deleteError.message
      });
    }

    res.json({
      success: true,
      message: 'Medication deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting medication:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting medication'
    });
  }
}

async function getMedicationLogs(req, res) {
  try {
    const { facilityId } = req.params;
    const { date } = req.query;

    console.log(`Fetching medication logs for facility ${facilityId}, date: ${date || 'all'}`);

    // TODO: Medication administration logs table not yet implemented
    // For now, return empty array
    console.log('⚠️  Medication logs table not yet created - returning empty array');

    res.json({
      success: true,
      count: 0,
      data: [],
      message: 'Medication administration logging feature coming soon'
    });
  } catch (error) {
    console.error('Error fetching medication logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching medication logs'
    });
  }
}

module.exports = {
  getActiveMedications,
  createMedication,
  administerDose,
  getMedicationDetails,
  bulkImportMedications,
  deleteMedication,
  getMedicationLogs
};
