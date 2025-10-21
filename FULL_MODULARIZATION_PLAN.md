# Full Modularization Implementation Plan

## Goal
Extract all screens, modals, and components from index.html into separate files for individual testing and editing.

## Phase 1: Extract All Screens ✅ Starting Now

### Screens to Extract:
1. Dashboard (Modern CAC-Style)
2. Staff Management
3. Incident Reports
4. Training Hub
5. Compliance/Licensing
6. Daily Checklist
7. Document Vault
8. Medication Tracking

## Phase 2: Extract All Modals

### Modal Groups:
1. Staff Modals (add, edit, import CSV, view certifications)
2. Document Modals (upload, inspection readiness, missing forms)
3. Medication Modals (add, administer, import CSV)
4. Incident Modals (new, edit)
5. Training Modals
6. Compliance Modals

## Phase 3: Update Index.html to Shell

Create minimal shell that loads everything dynamically.

## Phase 4: Update Router

Make router load screen partials dynamically instead of just hiding/showing.

## Implementation Strategy

1. Extract each screen HTML to `partials/screens/[name].html`
2. Create a screen loader function
3. Update router to load screens dynamically
4. Update index.html to minimal shell
5. Test each screen individually
6. Extract modals (can be done incrementally)

Let's begin!
