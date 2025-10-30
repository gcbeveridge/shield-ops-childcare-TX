// =============================================
// SHIELD OPS ROUTE DEFINITIONS
// =============================================

const routes = [
    // Dashboard
    {
        path: '/dashboard',
        screen: 'dashboard',
        title: 'Dashboard',
        handler: async (params) => {
            await window.htmlLoader.loadScreen('dashboard');
            await loadDashboardData();
        }
    },
    {
        path: '/',
        screen: 'dashboard',
        title: 'Dashboard',
        handler: async (params) => {
            await window.htmlLoader.loadScreen('dashboard');
            await loadDashboardData();
        }
    },

    // Staff Management
    {
        path: '/staff',
        screen: 'staff',
        title: 'Staff Management',
        handler: async (params) => {
            await window.htmlLoader.loadScreen('staff');
            await loadStaffList();
        }
    },
    {
        path: '/staff/new',
        screen: 'staff',
        title: 'Add Staff Member',
        handler: async (params) => {
            await window.htmlLoader.loadScreen('staff');
            await loadStaffList();
            openModal('add-staff');
        }
    },
    {
        path: '/staff/:id',
        screen: 'staff',
        title: 'Staff Details',
        handler: async (params) => {
            await window.htmlLoader.loadScreen('staff');
            await loadStaffList();
            // TODO: Open staff detail modal with params.id
        }
    },

    // Document Vault
    {
        path: '/documents',
        screen: 'documents',
        title: 'Document Vault',
        handler: async (params) => {
            await window.htmlLoader.loadScreen('documents');
            await loadDocuments();
        }
    },
    {
        path: '/documents/upload',
        screen: 'documents',
        title: 'Upload Document',
        handler: async (params) => {
            await window.htmlLoader.loadScreen('documents');
            await loadDocuments();
            openModal('upload-document');
        }
    },
    {
        path: '/documents/:category',
        screen: 'documents',
        title: 'Document Vault',
        handler: async (params) => {
            await window.htmlLoader.loadScreen('documents');
            await loadDocuments(params.category);
        }
    },

    // Medication Tracking
    {
        path: '/medications',
        screen: 'medication',
        title: 'Medication Tracking',
        handler: async (params) => {
            await window.htmlLoader.loadScreen('medication');
            await loadMedicationList();
        }
    },
    {
        path: '/medication',
        screen: 'medication',
        title: 'Medication Tracking',
        handler: async (params) => {
            await window.htmlLoader.loadScreen('medication');
            await loadMedicationList();
        }
    },
    {
        path: '/medications/new',
        screen: 'medication',
        title: 'Add Medication',
        handler: async (params) => {
            await window.htmlLoader.loadScreen('medication');
            await loadMedicationList();
            openModal('add-medication');
        }
    },

    // Incident Reports
    {
        path: '/incidents',
        screen: 'incidents',
        title: 'Incident Reports',
        handler: async (params) => {
            await window.htmlLoader.loadScreen('incidents');
            await loadIncidentList();
        }
    },
    {
        path: '/incidents/new',
        screen: 'incidents',
        title: 'New Incident Report',
        handler: async (params) => {
            await window.htmlLoader.loadScreen('incidents');
            await loadIncidentList();
            openModal('add-incident');
        }
    },

    // Training Hub
    {
        path: '/training',
        screen: 'training',
        title: 'Training Hub',
        handler: async (params) => {
            await window.htmlLoader.loadScreen('training');
            await loadTrainingModules();
        }
    },

    // Compliance & Licensing
    {
        path: '/compliance',
        screen: 'licensing',
        title: 'Compliance',
        handler: async (params) => {
            await window.htmlLoader.loadScreen('compliance');
            await loadComplianceList();
        }
    },
    {
        path: '/licensing',
        screen: 'licensing',
        title: 'Licensing',
        handler: async (params) => {
            await window.htmlLoader.loadScreen('compliance');
            await loadComplianceList();
        }
    },

    // Daily Checklist
    {
        path: '/checklist',
        screen: 'checklist',
        title: 'Daily Checklist',
        handler: async (params) => {
            await window.htmlLoader.loadScreen('checklist');
            await loadTodayChecklist();
        }
    },

    // Onboarding Routes
    {
        path: '/onboarding',
        screen: 'onboarding-list',
        title: 'New Hire Onboarding',
        handler: async (params) => {
            await window.htmlLoader.loadScreen('onboarding-list');
            await loadOnboardingList();
        }
    },
    {
        path: '/onboarding/:id/dashboard',
        screen: 'onboarding-dashboard',
        title: 'Onboarding Dashboard',
        handler: async (params) => {
            await window.htmlLoader.loadScreen('onboarding-dashboard');
            await loadOnboardingDashboard(params.id);
        }
    },
    {
        path: '/onboarding/:id/day-one',
        screen: 'day-one-orientation',
        title: 'Day One Orientation',
        handler: async (params) => {
            await window.htmlLoader.loadScreen('day-one-orientation');
            await loadDayOneOrientation(params.id);
        }
    },
    {
        path: '/onboarding/:id/week-one',
        screen: 'week-one-checkins',
        title: 'Week One Check-ins',
        handler: async (params) => {
            await window.htmlLoader.loadScreen('week-one-checkins');
            await loadWeekOneCheckins(params.id);
        }
    }
];

// Export for use
window.appRoutes = routes;
