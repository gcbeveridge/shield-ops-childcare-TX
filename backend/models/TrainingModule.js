const { v4: uuidv4 } = require('uuid');

const MONTHLY_TRAINING_MODULES = [
  {
    id: 'training-jan',
    month: 'January',
    monthNumber: 1,
    title: 'Child Abuse Prevention & Reporting',
    description: 'Learn to recognize signs of abuse, understand mandatory reporting requirements, and follow proper protocols for protecting children.',
    duration: '45 minutes',
    requiredForAll: true
  },
  {
    id: 'training-feb',
    month: 'February',
    monthNumber: 2,
    title: 'Emergency Response Procedures',
    description: 'Review emergency protocols including fire, medical emergencies, severe weather, and lockdown procedures.',
    duration: '60 minutes',
    requiredForAll: true
  },
  {
    id: 'training-mar',
    month: 'March',
    monthNumber: 3,
    title: 'Health & Safety Standards',
    description: 'Understand Texas DFPS health and safety requirements, proper sanitation, and infection control practices.',
    duration: '50 minutes',
    requiredForAll: true
  },
  {
    id: 'training-apr',
    month: 'April',
    monthNumber: 4,
    title: 'Food Safety & Nutrition',
    description: 'Learn safe food handling, allergy management, proper meal service, and nutritional requirements for children.',
    duration: '40 minutes',
    requiredForAll: false
  },
  {
    id: 'training-may',
    month: 'May',
    monthNumber: 5,
    title: 'Behavior Management Techniques',
    description: 'Explore positive discipline strategies, de-escalation techniques, and developmentally appropriate guidance.',
    duration: '55 minutes',
    requiredForAll: true
  },
  {
    id: 'training-jun',
    month: 'June',
    monthNumber: 6,
    title: 'Outdoor Safety & Sun Protection',
    description: 'Review playground safety, sun protection protocols, heat safety, and outdoor activity supervision.',
    duration: '35 minutes',
    requiredForAll: true
  },
  {
    id: 'training-jul',
    month: 'July',
    monthNumber: 7,
    title: 'Water Safety & Summer Activities',
    description: 'Learn water safety protocols, swimming supervision requirements, and safe summer activity planning.',
    duration: '45 minutes',
    requiredForAll: true
  },
  {
    id: 'training-aug',
    month: 'August',
    monthNumber: 8,
    title: 'Back-to-School Preparation',
    description: 'Prepare for new enrollments, review classroom setup, and understand transition support for children.',
    duration: '40 minutes',
    requiredForAll: false
  },
  {
    id: 'training-sep',
    month: 'September',
    monthNumber: 9,
    title: 'Infection Control & Hand Hygiene',
    description: 'Master proper handwashing techniques, illness exclusion policies, and communicable disease prevention.',
    duration: '30 minutes',
    requiredForAll: true
  },
  {
    id: 'training-oct',
    month: 'October',
    monthNumber: 10,
    title: 'Fire Safety & Evacuation',
    description: 'Practice evacuation procedures, understand fire extinguisher use, and review fire drill requirements.',
    duration: '45 minutes',
    requiredForAll: true
  },
  {
    id: 'training-nov',
    month: 'November',
    monthNumber: 11,
    title: 'Severe Weather Preparedness',
    description: 'Prepare for tornado, flooding, and severe weather events. Review shelter-in-place procedures.',
    duration: '40 minutes',
    requiredForAll: true
  },
  {
    id: 'training-dec',
    month: 'December',
    monthNumber: 12,
    title: 'Holiday Safety & Year-End Review',
    description: 'Address holiday safety concerns, review annual training requirements, and plan for the new year.',
    duration: '35 minutes',
    requiredForAll: false
  }
];

class TrainingModule {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.month = data.month;
    this.monthNumber = data.monthNumber;
    this.title = data.title;
    this.description = data.description;
    this.duration = data.duration;
    this.requiredForAll = data.requiredForAll !== undefined ? data.requiredForAll : true;
    this.year = data.year || new Date().getFullYear();
  }

  toJSON() {
    return {
      id: this.id,
      month: this.month,
      monthNumber: this.monthNumber,
      title: this.title,
      description: this.description,
      duration: this.duration,
      requiredForAll: this.requiredForAll,
      year: this.year
    };
  }
}

class TrainingCompletion {
  constructor({
    id = uuidv4(),
    facilityId,
    staffId,
    staffName,
    moduleId,
    moduleTitle,
    completedAt = new Date().toISOString(),
    notes = ''
  }) {
    this.id = id;
    this.facilityId = facilityId;
    this.staffId = staffId;
    this.staffName = staffName;
    this.moduleId = moduleId;
    this.moduleTitle = moduleTitle;
    this.completedAt = completedAt;
    this.notes = notes;
  }

  toJSON() {
    return {
      id: this.id,
      facilityId: this.facilityId,
      staffId: this.staffId,
      staffName: this.staffName,
      moduleId: this.moduleId,
      moduleTitle: this.moduleTitle,
      completedAt: this.completedAt,
      notes: this.notes
    };
  }

  validate() {
    const errors = [];
    if (!this.facilityId) errors.push('Facility ID is required');
    if (!this.staffId) errors.push('Staff ID is required');
    if (!this.moduleId) errors.push('Module ID is required');
    return errors;
  }
}

module.exports = { TrainingModule, TrainingCompletion, MONTHLY_TRAINING_MODULES };
