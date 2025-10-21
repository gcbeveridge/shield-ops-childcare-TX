const supabase = require('../config/supabase');

async function getAllIncidents(req, res) {
  try {
    const { facilityId } = req.params;
    const { type, severity, startDate, endDate } = req.query;
    
    let query = supabase
      .from('incidents')
      .select('*')
      .eq('facility_id', facilityId)
      .order('occurred_at', { ascending: false });
    
    if (type) {
      query = query.eq('type', type.toLowerCase());
    }
    
    if (severity) {
      query = query.eq('severity', severity.toLowerCase());
    }
    
    if (startDate) {
      query = query.gte('occurred_at', startDate);
    }
    
    if (endDate) {
      query = query.lte('occurred_at', endDate);
    }
    
    const { data: incidents, error } = await query;
    
    if (error) {
      console.error('Error fetching incidents:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error fetching incidents',
        error: error.message
      });
    }
    
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
    
    // Transform data to match Supabase schema
    const incidentData = {
      facility_id: facilityId,
      type: req.body.type,
      severity: req.body.severity,
      child_info: {
        name: req.body.childName,
        age: req.body.childAge
      },
      location: req.body.location,
      description: req.body.description,
      immediate_actions: req.body.immediateActions,
      occurred_at: req.body.dateTime || new Date().toISOString(),
      reported_by: req.body.reportedBy,
      parent_notified: req.body.parentNotified || false,
      parent_signature: req.body.parentSignature || null
    };
    
    const { data: incident, error } = await supabase
      .from('incidents')
      .insert(incidentData)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating incident:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Error creating incident report',
        error: error.message
      });
    }
    
    res.status(201).json({
      success: true,
      message: 'Incident report created successfully',
      data: incident
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
    
    const { data: incident, error } = await supabase
      .from('incidents')
      .select('*')
      .eq('id', incidentId)
      .single();
    
    if (error || !incident) {
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
    
    const { data: incident, error } = await supabase
      .from('incidents')
      .update({
        parent_signature: {
          signature,
          signedBy,
          signedAt: new Date().toISOString()
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', incidentId)
      .select()
      .single();
    
    if (error || !incident) {
      return res.status(404).json({ 
        success: false, 
        message: 'Incident not found or error updating',
        error: error?.message
      });
    }
    
    res.json({
      success: true,
      message: 'Parent signature added successfully',
      data: incident
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
