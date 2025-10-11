const db = require('../config/database');
const { TrainingModule, TrainingCompletion, MONTHLY_TRAINING_MODULES } = require('../models/TrainingModule');

async function getTrainingModules(req, res) {
  try {
    const { facilityId } = req.params;
    const currentYear = new Date().getFullYear();
    
    const modules = MONTHLY_TRAINING_MODULES.map(m => new TrainingModule({ ...m, year: currentYear }).toJSON());
    
    const completions = await db.list(`training-completion:${facilityId}:`);
    const staff = await db.list(`staff:${facilityId}:`);
    const staffCount = staff.length;
    
    const modulesWithProgress = modules.map(module => {
      const moduleCompletions = completions.filter(c => c.moduleId === module.id);
      
      return {
        ...module,
        completionStats: {
          completed: moduleCompletions.length,
          total: staffCount,
          percentage: staffCount > 0 ? Math.round((moduleCompletions.length / staffCount) * 100) : 0
        }
      };
    });
    
    res.json({
      success: true,
      data: modulesWithProgress,
      year: currentYear
    });
  } catch (error) {
    console.error('Error fetching training modules:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching training modules' 
    });
  }
}

async function completeTraining(req, res) {
  try {
    const { moduleId } = req.params;
    const { facilityId, staffId, staffName, notes } = req.body;
    
    if (!facilityId || !staffId) {
      return res.status(400).json({ 
        success: false, 
        message: 'facilityId and staffId are required' 
      });
    }
    
    const module = MONTHLY_TRAINING_MODULES.find(m => m.id === moduleId);
    
    if (!module) {
      return res.status(404).json({ 
        success: false, 
        message: 'Training module not found' 
      });
    }
    
    const existing = await db.getByPrefix(
      `training-completion:${facilityId}:`, 
      (key, value) => value.staffId === staffId && value.moduleId === moduleId
    );
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Training already completed by this staff member' 
      });
    }
    
    const completion = new TrainingCompletion({
      facilityId,
      staffId,
      staffName,
      moduleId,
      moduleTitle: module.title,
      notes
    });
    
    const errors = completion.validate();
    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Validation failed', 
        errors 
      });
    }
    
    await db.set(`training-completion:${facilityId}:${completion.id}`, completion.toJSON());
    
    res.status(201).json({
      success: true,
      message: `Training "${module.title}" marked as complete`,
      data: completion.toJSON()
    });
  } catch (error) {
    console.error('Error completing training:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error recording training completion' 
    });
  }
}

async function getStaffTraining(req, res) {
  try {
    const { staffId } = req.params;
    
    const completions = await db.getByPrefix(
      `training-completion:`, 
      (key, value) => value.staffId === staffId
    );
    
    const completionsArray = Array.isArray(completions) ? completions : (completions ? [completions] : []);
    completionsArray.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
    
    const totalRequired = MONTHLY_TRAINING_MODULES.filter(m => m.requiredForAll).length;
    const completedRequired = completionsArray.filter(c => {
      const module = MONTHLY_TRAINING_MODULES.find(m => m.id === c.moduleId);
      return module && module.requiredForAll;
    }).length;
    
    res.json({
      success: true,
      data: {
        trainings: completionsArray,
        summary: {
          totalCompleted: completionsArray.length,
          requiredCompleted: completedRequired,
          requiredTotal: totalRequired,
          percentage: totalRequired > 0 ? Math.round((completedRequired / totalRequired) * 100) : 0
        }
      }
    });
  } catch (error) {
    console.error('Error fetching staff training:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching training history' 
    });
  }
}

module.exports = {
  getTrainingModules,
  completeTraining,
  getStaffTraining
};
