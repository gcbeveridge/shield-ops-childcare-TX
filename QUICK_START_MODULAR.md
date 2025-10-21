# 🚀 Quick Start - Modular Shield Ops

## Access the Modular Version
```
http://localhost:5000/index-modular.html
```

## Test Individual Screens (Browser Console)

```javascript
// Dashboard
await window.htmlLoader.loadScreen('dashboard');
await loadDashboardData();

// Staff
await window.htmlLoader.loadScreen('staff');
await loadStaffList();

// Documents
await window.htmlLoader.loadScreen('documents');
await loadDocuments();

// Medication
await window.htmlLoader.loadScreen('medication');
await loadMedicationList();

// Incidents
await window.htmlLoader.loadScreen('incidents');
await loadIncidentList();

// Training
await window.htmlLoader.loadScreen('training');
await loadTrainingModules();

// Compliance
await window.htmlLoader.loadScreen('compliance');
await loadComplianceList();

// Checklist
await window.htmlLoader.loadScreen('checklist');
await loadTodayChecklist();
```

## Edit & Test Workflow

1. **Edit a screen:**
   ```bash
   code backend/public/partials/screens/staff.html
   ```

2. **Clear cache & reload:**
   ```javascript
   window.htmlLoader.clearCache('screens/staff.html');
   window.appRouter.go('/staff');
   ```

## Cache Management

```javascript
// View cache
window.htmlLoader.getCacheStats();

// Clear specific screen
window.htmlLoader.clearCache('screens/dashboard.html');

// Clear all
window.htmlLoader.clearCache();
```

## File Locations

```
backend/public/
├── index-modular.html  ← Use this!
└── partials/
    ├── sidebar.html
    ├── auth/
    │   ├── login.html
    │   └── signup.html
    └── screens/
        ├── dashboard.html
        ├── staff.html
        ├── documents.html
        ├── medication.html
        ├── incidents.html
        ├── training.html
        ├── compliance.html
        └── checklist.html
```

## Switch to Modular (Optional)

```bash
cd backend/public
mv index.html index.html.old
mv index-modular.html index.html
# Restart server
```

## Troubleshooting

**Screens not loading?**
```javascript
console.log(window.htmlLoader);
console.log(window.appRouter);
```

**Clear everything:**
```javascript
window.htmlLoader.clearCache();
location.reload();
```

---

**Documentation:** See `MODULARIZATION_SUCCESS.md` for complete guide
