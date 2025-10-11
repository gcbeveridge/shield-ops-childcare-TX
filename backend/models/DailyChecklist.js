const { v4: uuidv4 } = require('uuid');

const DEFAULT_CHECKLIST_TEMPLATE = [
  {
    id: 'morning-facility-inspection',
    category: 'Morning (6:00-7:00)',
    task: 'Facility Inspection',
    description: 'Walk through all rooms, check for safety hazards, ensure proper lighting and temperature',
    completed: false,
    completedBy: null,
    completedAt: null
  },
  {
    id: 'morning-playground-check',
    category: 'Morning (6:00-7:00)',
    task: 'Playground Check',
    description: 'Inspect equipment for damage, check ground surface, remove hazards',
    completed: false,
    completedBy: null,
    completedAt: null
  },
  {
    id: 'morning-temperature-logs',
    category: 'Morning (6:00-7:00)',
    task: 'Temperature Logs',
    description: 'Record refrigerator/freezer temperatures, check HVAC settings',
    completed: false,
    completedBy: null,
    completedAt: null
  },
  {
    id: 'morning-hand-sanitizer',
    category: 'Morning (6:00-7:00)',
    task: 'Hand Sanitizer Refill',
    description: 'Check and refill hand sanitizer stations throughout facility',
    completed: false,
    completedBy: null,
    completedAt: null
  },
  {
    id: 'daily-child-attendance',
    category: 'Throughout Day',
    task: 'Child Attendance Tracking',
    description: 'Maintain accurate attendance records, note arrivals and departures',
    completed: false,
    completedBy: null,
    completedAt: null
  },
  {
    id: 'daily-meal-service',
    category: 'Throughout Day',
    task: 'Meal Service Documentation',
    description: 'Document meals served, note any allergies or special requirements',
    completed: false,
    completedBy: null,
    completedAt: null
  },
  {
    id: 'daily-medication',
    category: 'Throughout Day',
    task: 'Medication Administration',
    description: 'Administer and log all medications per authorization forms',
    completed: false,
    completedBy: null,
    completedAt: null
  },
  {
    id: 'daily-activity-docs',
    category: 'Throughout Day',
    task: 'Activity Documentation',
    description: 'Record daily activities, developmental observations, and special events',
    completed: false,
    completedBy: null,
    completedAt: null
  },
  {
    id: 'evening-headcount',
    category: 'Evening (5:30-6:00)',
    task: 'Final Headcount & Sign-Out',
    description: 'Verify all children signed out, ensure proper authorization',
    completed: false,
    completedBy: null,
    completedAt: null
  },
  {
    id: 'evening-security',
    category: 'Evening (5:30-6:00)',
    task: 'Security Check & Lock-Up',
    description: 'Lock all doors and windows, arm security system, check cameras',
    completed: false,
    completedBy: null,
    completedAt: null
  },
  {
    id: 'evening-prep',
    category: 'Evening (5:30-6:00)',
    task: "Tomorrow's Prep Notes",
    description: 'Leave notes for morning staff, prepare materials for next day',
    completed: false,
    completedBy: null,
    completedAt: null
  }
];

class DailyChecklist {
  constructor({
    id = uuidv4(),
    facilityId,
    date,
    tasks = DEFAULT_CHECKLIST_TEMPLATE,
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    this.id = id;
    this.facilityId = facilityId;
    this.date = date || new Date().toISOString().split('T')[0];
    this.tasks = tasks;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }

  toJSON() {
    const completed = this.tasks.filter(t => t.completed).length;
    const total = this.tasks.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      id: this.id,
      facilityId: this.facilityId,
      date: this.date,
      tasks: this.tasks,
      summary: {
        total,
        completed,
        percentage
      },
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  validate() {
    const errors = [];
    if (!this.facilityId) errors.push('Facility ID is required');
    if (!this.date) errors.push('Date is required');
    return errors;
  }
}

module.exports = { DailyChecklist, DEFAULT_CHECKLIST_TEMPLATE };
