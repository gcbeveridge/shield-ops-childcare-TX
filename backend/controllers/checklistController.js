const db = require('../config/database');
const { DailyChecklist, DEFAULT_CHECKLIST_TEMPLATE } = require('../models/DailyChecklist');

async function getOrCreateTodayChecklist(req, res) {
  try {
    const { facilityId } = req.params;
    const today = new Date().toISOString().split('T')[0];
    
    let checklist = await db.getByPrefix(`checklist:${facilityId}:`, (key, value) => value.date === today);
    
    if (!checklist) {
      checklist = new DailyChecklist({
        facilityId,
        date: today,
        tasks: JSON.parse(JSON.stringify(DEFAULT_CHECKLIST_TEMPLATE))
      });
      
      await db.set(`checklist:${facilityId}:${checklist.id}`, checklist.toJSON());
    }
    
    res.json({
      success: true,
      data: checklist
    });
  } catch (error) {
    console.error('Error fetching/creating today checklist:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching checklist' 
    });
  }
}

async function completeTask(req, res) {
  try {
    const { facilityId, taskId } = req.params;
    const { completedBy } = req.body;
    
    if (!completedBy) {
      return res.status(400).json({ 
        success: false, 
        message: 'completedBy is required' 
      });
    }
    
    const today = new Date().toISOString().split('T')[0];
    const checklist = await db.getByPrefix(`checklist:${facilityId}:`, (key, value) => value.date === today);
    
    if (!checklist) {
      return res.status(404).json({ 
        success: false, 
        message: 'Today\'s checklist not found' 
      });
    }
    
    const taskIndex = checklist.tasks.findIndex(t => t.id === taskId);
    
    if (taskIndex === -1) {
      return res.status(404).json({ 
        success: false, 
        message: 'Task not found in checklist' 
      });
    }
    
    checklist.tasks[taskIndex].completed = true;
    checklist.tasks[taskIndex].completedBy = completedBy;
    checklist.tasks[taskIndex].completedAt = new Date().toISOString();
    checklist.updatedAt = new Date().toISOString();
    
    await db.set(`checklist:${facilityId}:${checklist.id}`, checklist);
    
    const completed = checklist.tasks.filter(t => t.completed).length;
    const total = checklist.tasks.length;
    const percentage = Math.round((completed / total) * 100);
    
    res.json({
      success: true,
      message: 'Task marked as complete',
      data: {
        ...checklist,
        summary: { total, completed, percentage }
      }
    });
  } catch (error) {
    console.error('Error completing task:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error updating task' 
    });
  }
}

async function getWeekStats(req, res) {
  try {
    const { facilityId } = req.params;
    
    const checklists = await db.list(`checklist:${facilityId}:`);
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    const weekChecklists = checklists.filter(c => {
      const checklistDate = new Date(c.date);
      return checklistDate >= weekAgo && checklistDate <= now;
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
    
    const stats = weekChecklists.map(c => {
      const completed = c.tasks.filter(t => t.completed).length;
      const total = c.tasks.length;
      const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      
      return {
        date: c.date,
        completed,
        total,
        percentage
      };
    });
    
    const avgCompletion = stats.length > 0 
      ? Math.round(stats.reduce((sum, s) => sum + s.percentage, 0) / stats.length)
      : 0;
    
    res.json({
      success: true,
      data: {
        dailyStats: stats,
        summary: {
          daysTracked: stats.length,
          averageCompletion: avgCompletion
        }
      }
    });
  } catch (error) {
    console.error('Error fetching week stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching statistics' 
    });
  }
}

module.exports = {
  getOrCreateTodayChecklist,
  completeTask,
  getWeekStats
};
