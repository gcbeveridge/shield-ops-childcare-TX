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
            showScreen('dashboard');
            await loadDashboardData();
        }
    },
    {
        path: '/',
        screen: 'dashboard',
        title: 'Dashboard',
        handler: async (params) => {
            showScreen('dashboard');
            await loadDashboardData();
        }
    },

    // Staff Management
    {
        path: '/staff',
        screen: 'staff',
        title: 'Staff Management',
        handler: async (params) => {
            showScreen('staff');
            await loadStaffList();
        }
    },
    {
        path: '/staff/new',
        screen: 'staff',
        title: 'Add Staff Member',
        handler: async (params) => {
            showScreen('staff');
            await loadStaffList();
            openModal('add-staff');
        }
    },
    {
        path: '/staff/:id',
        screen: 'staff',
        title: 'Staff Details',
        handler: async (params) => {
            showScreen('staff');
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
            showScreen('documents');
            await loadDocuments();
        }
    },
    {
        path: '/documents/upload',
        screen: 'documents',
        title: 'Upload Document',
        handler: async (params) => {
            showScreen('documents');
            await loadDocuments();
            openModal('upload-document');
        }
    },
    {
        path: '/documents/:category',
        screen: 'documents',
        title: 'Document Vault',
        handler: async (params) => {
            showScreen('documents');
            await loadDocuments(params.category);
        }
    },

    // Medication Tracking
    {
        path: '/medications',
        screen: 'medication',
        title: 'Medication Tracking',
        handler: async (params) => {
            showScreen('medication');
            await loadMedicationList();
        }
    },
    {
        path: '/medication',
        screen: 'medication',
        title: 'Medication Tracking',
        handler: async (params) => {
            showScreen('medication');
            await loadMedicationList();
        }
    },
    {
        path: '/medications/new',
        screen: 'medication',
        title: 'Add Medication',
        handler: async (params) => {
            showScreen('medication');
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
            showScreen('incidents');
            await loadIncidentList();
        }
    },
    {
        path: '/incidents/new',
        screen: 'incidents',
        title: 'New Incident Report',
        handler: async (params) => {
            showScreen('incidents');
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
            showScreen('training');
            await loadTrainingModules();
        }
    },

    // Compliance & Licensing
    {
        path: '/compliance',
        screen: 'licensing',
        title: 'Compliance',
        handler: async (params) => {
            showScreen('licensing');
            await loadComplianceList();
        }
    },
    {
        path: '/licensing',
        screen: 'licensing',
        title: 'Licensing',
        handler: async (params) => {
            showScreen('licensing');
            await loadComplianceList();
        }
    },

    // Daily Checklist
    {
        path: '/checklist',
        screen: 'checklist',
        title: 'Daily Checklist',
        handler: async (params) => {
            showScreen('checklist');
            await loadTodayChecklist();
        }
    }
];

// Export for use
window.appRoutes = routes;
