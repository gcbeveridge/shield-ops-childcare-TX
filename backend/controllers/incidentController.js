const db = require('../config/database');
const Incident = require('../models/Incident');

async function getAllIncidents(req, res) {
  try {
    const { facilityId } = req.params;
    const { type, severity, startDate, endDate } = req.query;
    
    let incidents = await db.list(`incident:${facilityId}:`);
    
    if (type) {
      incidents = incidents.filter(inc => inc.type.toLowerCase() === type.toLowerCase());
    }
    
    if (severity) {
      incidents = incidents.filter(inc => inc.severity.toLowerCase() === severity.toLowerCase());
    }
    
    if (startDate) {
      incidents = incidents.filter(inc => new Date(inc.dateTime) >= new Date(startDate));
    }
    
    if (endDate) {
      incidents = incidents.filter(inc => new Date(inc.dateTime) <= new Date(endDate));
    }
    
    incidents.sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
    
    res.json({
      success: true,
      count: incidents.length,
      filters: { type, severity, startDate, endDate },
      data: incidents
    });
  } catch (error) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching incidents' 
    });
  }
}

async function createIncident(req, res) {
  try {
    const { facilityId } = req.params;
    
    const incident = new Incident({
      ...req.body,
      facilityId
    });
    
    const errors = incident.validate();
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors 
      });
    }
    
    await db.set(`incident:${facilityId}:${incident.id}`, incident.toJSON());
    
    res.status(201).json({
      success: true,
      message: 'Incident report created successfully',
      data: incident.toJSON()
    });
  } catch (error) {
    console.error('Error creating incident:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error creating incident report' 
    });
  }
}

async function getIncidentById(req, res) {
  try {
    const { incidentId } = req.params;
    
    const incident = await db.getByPrefix(`incident:`, (key, value) => value.id === incidentId);
    
    if (!incident) {
      return res.status(404).json({ 
        success: false, 
        message: 'Incident not found' 
      });
    }
    
    res.json({
      success: true,
      data: incident
    });
  } catch (error) {
    console.error('Error fetching incident:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching incident' 
    });
  }
}

async function addParentSignature(req, res) {
  try {
    const { incidentId } = req.params;
    const { signature, signedBy } = req.body;
    
    if (!signature || !signedBy) {
      return res.status(400).json({ 
        success: false, 
        message: 'Signature and signedBy are required' 
      });
    }
    
    const existingIncident = await db.getByPrefix(`incident:`, (key, value) => value.id === incidentId);
    
    if (!existingIncident) {
      return res.status(404).json({ 
        success: false, 
        message: 'Incident not found' 
      });
    }
    
    const updatedIncident = new Incident({
      ...existingIncident,
      parentSignature: {
        signature,
        signedBy,
        signedAt: new Date().toISOString()
      },
      parentSignatureDate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    
    await db.set(`incident:${updatedIncident.facilityId}:${incidentId}`, updatedIncident.toJSON());
    
    res.json({
      success: true,
      message: 'Parent signature added successfully',
      data: updatedIncident.toJSON()
    });
  } catch (error) {
    console.error('Error adding parent signature:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error adding parent signature' 
    });
  }
}

module.exports = {
  getAllIncidents,
  createIncident,
  getIncidentById,
  addParentSignature
};
