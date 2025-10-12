# Shield Ops - Child Care Safety Platform

## Overview
Shield Ops is a comprehensive full-stack child care safety and compliance platform for daycare centers. It manages licensing, staff training, incident reporting, daily checklists, document management, medication tracking, and features an AI-powered compliance assistant. The platform aims to streamline operations and ensure regulatory adherence for childcare facilities.

## User Preferences
None specified yet.

## System Architecture
The application is a single-page web application with a RESTful API.

### Frontend
- **Technology:** HTML5, CSS3, Vanilla JavaScript
- **Styling:** Modern indigo/purple color palette with gradients, Inter font, CSS custom properties, responsive grid layouts.
- **UI/UX:** Card-based UI, hover effects, animations, transitions, enhanced dashboard cards, sortable tables, comprehensive button system (loading/disabled states), improved form inputs.
- **Core Components:** Navigation, modals, toast notification system (showSuccess/showError), loading states for forms, client-side filtering.

### Backend
- **Technology:** Node.js, Express.js
- **API:** RESTful API with 29 endpoints. All modules integrated and working with persistent data storage.
- **Authentication:** JWT-based authentication with signup, login, and `/me` endpoints. Real authentication with token management in localStorage.
- **File Uploads:** Multer configured for facility-specific folders, 10MB limit, supports PDF/images/Office docs.

### Database
- **Technology:** PostgreSQL (Neon)
- **Schema:** 11 tables (facilities, users, staff, incidents, medications, medication_logs, compliance_items, daily_checklists, training_modules, training_completions, documents).
- **Data Persistence:** Data persists across server restarts and page refreshes.
- **Auto-seeding:** Database auto-populates on server startup with fixed UUIDs for consistent login.

### Key Features & Modules
- **Authentication:** Login, sign-up, user profile, logout.
- **Dashboard:** Risk score, licensing compliance, staff certification, training overview, quick module access.
- **Compliance Management:** State licensing requirements tracker, compliance status indicators, priority badges, audit report generation.
- **Training Hub:** Monthly training modules, staff completion tracking, progress visualization, training history.
- **Staff Management:** Staff roster, certifications (CPR/First Aid), background check status, training completion, expiration alerts.
- **Incident Reporting:** Logging, pattern detection, parent notification, digital signatures, photo evidence. Categories: Injury, Illness, Behavior.
- **Daily Checklist:** Morning safety, daily operations, weekly trends, automated audit trail, task completion percentages.
- **Document Vault:**
    - Quick Stats Dashboard (Total, Required, Missing, Compliance percentage).
    - 6 Category Tabs: Licensing & Permits, Staff Records, Health & Safety, Facility & Inspections, Children, Insurance.
    - Document Table Features: Texas DFPS form numbers, 5-tier violation weight indicator badges, status (Current, Expiring Soon, Expired), expiration date monitoring.
    - Multi-Step Upload Workflow: Basic Info, Dates & Association, File Upload, Review & Confirm.
    - Missing Forms Detection: Alerts for missing required documents with quick-add functionality.
    - Inspection Readiness Report: Comprehensive compliance report with overall readiness score and category breakdowns.
    - Expiration Alerts: Color-coded cards for expired and expiring documents.
    - Automated Reminders for 30/60 day expiration warnings.
- **Medication Tracking:** Authorization management, dual-staff verification, administration logging, parent authorization, Texas §744.2655 compliance.
- **Shield AI - Compliance Assistant:**
    - **Knowledge Base:** Covers 8 major Texas DFPS compliance areas (Staff, Medication, Incident, Daily H&S, Physical Environment, Nutrition, Documentation, Inspections).
    - **Features:** Ask Questions, Analyze Incidents, Training Suggestions.
    - **Interface:** Floating chat button accessible on all pages.
    - **Responses:** Professional, actionable guidance with regulation citations.

### Deployment
- **Type:** Autoscale deployment (stateless web app).
- **Server:** Single Node.js/Express server on port 5000 serving static files and APIs.

## External Dependencies
- **Database:** PostgreSQL (Neon)
- **AI:** Anthropic Claude Sonnet 4 API
- **File Upload:** Multer (Node.js middleware)