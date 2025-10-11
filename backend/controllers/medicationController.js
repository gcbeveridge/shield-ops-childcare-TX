const db = require('../config/database');
const Medication = require('../models/Medication');
const MedicationLog = require('../models/MedicationLog');

async function getActiveMedications(req, res) {
  try {
    const { facilityId } = req.params;
    
    let medications = await db.list(`medication:${facilityId}:`);
    
    medications = medications.filter(med => med.status === 'active');
    
    medications.sort((a, b) => new Date(a.startDate) - new Date(b.startDate));
    
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
    
    const medication = new Medication({
      ...req.body,
      facilityId
    });
    
    const errors = medication.validate();
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors 
      });
    }
    
    await db.set(`medication:${facilityId}:${medication.id}`, medication.toJSON());
    
    res.status(201).json({
      success: true,
      message: 'Medication authorization created successfully',
      data: medication.toJSON()
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
    
    const medication = await db.getByPrefix(`medication:`, (key, value) => value.id === medicationId);
    
    if (!medication) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medication not found' 
      });
    }
    
    if (medication.status !== 'active') {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot administer dose for inactive medication' 
      });
    }
    
    const log = new MedicationLog({
      ...req.body,
      medicationId,
      facilityId: medication.facilityId
    });
    
    const errors = log.validate();
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors 
      });
    }
    
    await db.set(`medication-log:${medication.facilityId}:${log.id}`, log.toJSON());
    
    res.status(201).json({
      success: true,
      message: 'Medication dose logged successfully (Texas §744.2655 compliant)',
      data: log.toJSON()
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
    
    const medication = await db.getByPrefix(`medication:`, (key, value) => value.id === medicationId);
    
    if (!medication) {
      return res.status(404).json({ 
        success: false, 
        message: 'Medication not found' 
      });
    }
    
    const logs = await db.getByPrefix(`medication-log:${medication.facilityId}:`, (key, value) => 
      value.medicationId === medicationId
    );
    
    const logsArray = Array.isArray(logs) ? logs : (logs ? [logs] : []);
    logsArray.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    
    res.json({
      success: true,
      data: {
        medication,
        administrationLogs: logsArray,
        totalDosesGiven: logsArray.length
      }
    });
  } catch (error) {
    console.error('Error fetching medication details:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching medication details' 
    });
  }
}

module.exports = {
  getActiveMedications,
  createMedication,
  administerDose,
  getMedicationDetails
};
