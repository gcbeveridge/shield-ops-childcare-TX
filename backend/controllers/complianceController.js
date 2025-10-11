const db = require('../config/database');
const { TEXAS_COMPLIANCE_REQUIREMENTS } = require('../config/constants');

async function getComplianceStatus(req, res) {
  try {
    const { facilityId } = req.params;
    
    const complianceItems = await db.list(`compliance:${facilityId}:`);
    
    const total = complianceItems.length;
    const completed = complianceItems.filter(item => item.status === 'complete').length;
    const pending = complianceItems.filter(item => item.status === 'pending').length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    const itemsByCategory = complianceItems.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    }, {});
    
    res.json({
      success: true,
      summary: {
        total,
        completed,
        pending,
        percentage
      },
      byCategory: itemsByCategory,
      data: complianceItems
    });
  } catch (error) {
    console.error('Error fetching compliance status:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching compliance status' 
    });
  }
}

async function markRequirementComplete(req, res) {
  try {
    const { facilityId, requirementId } = req.params;
    const { completedBy, notes } = req.body;
    
    if (!completedBy) {
      return res.status(400).json({ 
        success: false, 
        message: 'completedBy is required' 
      });
    }
    
    const key = `compliance:${facilityId}:${requirementId}`;
    const existingItem = await db.get(key);
    
    if (!existingItem) {
      return res.status(404).json({ 
        success: false, 
        message: 'Compliance requirement not found' 
      });
    }
    
    const updatedItem = {
      ...existingItem,
      status: 'complete',
      completedAt: new Date().toISOString(),
      completedBy,
      notes: notes || existingItem.notes
    };
    
    await db.set(key, updatedItem);
    
    res.json({
      success: true,
      message: 'Compliance requirement marked as complete',
      data: updatedItem
    });
  } catch (error) {
    console.error('Error marking requirement complete:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating compliance requirement' 
    });
  }
}

module.exports = {
  getComplianceStatus,
  markRequirementComplete
};
