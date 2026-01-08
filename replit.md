# Shield Ops - Child Care Safety Platform

## Overview
Shield Ops is a comprehensive full-stack child care safety and compliance platform for daycare centers. It manages licensing, staff training, incident reporting, daily checklists, document management, medication tracking, and features an AI-powered compliance assistant. The platform aims to streamline operations and ensure regulatory adherence for childcare facilities.

## User Preferences
- **Design System:** Guardian Warmth aesthetic (warm, welcoming, supportive)
- **Brand Colors:** Navy blue (#2c5f7c), Lime green (#b4d333), Gold accent (#f5c842)
- **Typography:** Outfit (headings), Plus Jakarta Sans (body), Space Grotesk (metrics)
- **Background:** Warm cream/beige (#faf8f5), not stark white
- **UI Style:** Soft pastels, rounded cards (16-24px radius), generous spacing
- **Target Audience:** Childcare directors who need to love logging in daily

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
- **Technology:** PostgreSQL (Neon) with Supabase migration support
- **Schema:** 18 tables (facilities, users, staff, incidents, medications, medication_logs, compliance_items, daily_checklists, training_modules, training_completions, documents, day_one_orientation_content, week_one_checkins_content, onboarding_records, state_regulations, rooms, ratio_spot_checks, ratio_check_schedule).
- **Data Persistence:** Data persists across server restarts and page refreshes.
- **Auto-seeding:** Database auto-populates on server startup with fixed UUIDs for consistent login.
- **Database Migrations:** Auto-running SQL migrations in `backend/config/migrations/` directory. Migrations run on server startup and track completion in `schema_migrations` table.
- **Onboarding Content Seeding:** Texas childcare onboarding content (Day One orientation + Week One check-ins).
  - Scripts: `backend/scripts/seedDayOne.js`, `backend/scripts/seedWeekOne.js`, `backend/scripts/seedOnboarding.js`
  - Run with: `npm run db:seed-onboarding` (or individually: `npm run db:seed-dayone`, `npm run db:seed-weekone`)
  - Content: 7 Day One orientation sections, 6 Week One check-in days (Days 2-7)
- **Supabase Migration:** Ready-to-use migration scripts and schema for moving to Supabase PostgreSQL.
  - Configuration: `backend/config/supabase.js`
  - Schema: `backend/config/schema-supabase.sql`
  - Migration script: `backend/scripts/migrate-to-supabase.js`
  - Run with: `npm run migrate:supabase`

### Key Features & Modules
- **Authentication:** Login, sign-up, user profile, logout.
- **Dashboard (Modern CAC-Style Redesign):**
    - **Priority Heat Map:** Visual priority command center with 3 color-coded zones:
      - CRITICAL (Red): Expired certifications requiring immediate action
      - ATTENTION NEEDED (Yellow): Items expiring within 30 days
      - MONITORING (Green): Items expiring within 60 days, routine monitoring
    - **Heat Map Features:** Real-time priority calculation from staff data, clickable items navigate to action pages, manual refresh button, auto-refresh every 2 minutes.
    - **Weather Integration:** Real-time weather with contextual safety recommendations using Open-Meteo API (free, no API key). Alerts for heat, cold, rain, wind, storms with specific action items.
    - **Safety Performance Card:** Combined risk score (0-100) + incident-free streak display with large visual numbers, gradients, and trend indicators.
    - **Priority Alerts:** Today's Priorities with 3 actionable cards - Missing Documents (red), Expired Documents (orange), Missing Signatures (yellow). Cards disable when count = 0.
    - **Risk Score Calculation:** Intelligent scoring based on missing docs (-5 each), expired docs (-10 each), missing signatures (-5 each), expiring certifications (-2 each).
    - **Quick Actions:** 4 gradient action buttons for common tasks (Log Incident, Log Medication, Upload Document, Manage Staff).
    - **Recent Activity:** Shows latest 3 incidents with child name, type, description, and date.
    - **Weather Safety Recommendations:** Context-specific guidance for outdoor play, water breaks, equipment checks based on current conditions.
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
- **New Hire Onboarding System (Complete Full-Stack Implementation):**
    - **Onboarding List:** Table view showing all new hires with status (completed, in progress, overdue), days since hire, Day One/Week One progress tracking.
    - **Onboarding Dashboard:** Progress overview with completion percentage, Day One status (pending/completed with champion and duration), Week One checklist (6 days), next steps recommendations, quick actions.
    - **Day One Orientation:** Interactive 7-section wizard (~110 minutes total) covering facility tour, emergency procedures, Texas DFPS regulations. Features: section navigation with progress dots, champion scripts, content delivery, verification questions, dual signature collection (new hire + champion), duration tracking.
    - **Week One Check-ins:** Tabbed interface for Days 2-7 daily activities. Each day includes: champion approach guidance, activity cards, quick verification questions, champion notes (optional), completion tracking. Days unlock sequentially and show completion badges.
    - **Backend API:** 8 RESTful endpoints for content retrieval (Day One/Week One), new hire management, progress tracking, completion workflows.
    - **Database:** 3 tables (onboarding_records, day_one_orientation_content, week_one_checkins_content) with JSONB progress tracking, Texas DFPS-compliant content seeding.
    - **Features:** Auto-status updates (in_progress → completed), overdue detection (>7 days), mobile-responsive design, CAC Design System integration, real-time progress calculations, champion-led training workflow.
    - **Routes:** /onboarding, /onboarding/:id/dashboard, /onboarding/:id/day-one, /onboarding/:id/week-one
- **Shield AI - Compliance Assistant:**
    - **Knowledge Base:** Covers 8 major Texas DFPS compliance areas (Staff, Medication, Incident, Daily H&S, Physical Environment, Nutrition, Documentation, Inspections).
    - **Features:** Ask Questions, Analyze Incidents, Training Suggestions.
    - **Interface:** Floating chat button accessible on all pages.
    - **Responses:** Professional, actionable guidance with regulation citations.
- **Settings Page (Nationwide State Support):**
    - **State Selector:** Dropdown to choose facility state from all 50 US states.
    - **Supported States:** TX, CA, FL, NY, PA, IL, OH, GA, NC, MI (10 states with 97 regulations).
    - **Coming Soon:** 41 additional states marked as "Coming Soon" with disabled options.
    - **Regulations Preview:** Interactive table showing state-specific compliance requirements.
    - **Category Filtering:** Filter regulations by category (Staff, Medication, Incident, etc.).
    - **Violation Weight Badges:** Color-coded badges (High, Medium-High, Medium, Low).
    - **Facility Information:** Display current facility name, license, capacity, and address.
    - **API Endpoints:** GET /api/states/list, GET /api/states/:code/regulations, GET/PUT /api/states/facility/:id.
- **Smart Alerts System (Phase 2D):**
    - **Purpose:** Power priority cards with real alerts data from the database.
    - **Alert Generation:** Scans for expired/expiring certifications, missing spot-checks, missing/expired documents.
    - **Severities:** Critical (expired items), Warning (expiring soon), Info (monitoring items).
    - **Visual Indicators:** Glow effect on cards with new unacknowledged alerts, "NEW" badge on items.
    - **Auto-acknowledge:** Clicking an alert item auto-acknowledges it and removes glow/badge.
    - **Compact Display:** Shows top 3 items per zone with "+ X more" indicator.
    - **Empty States:** Celebratory messages when zones are clear.
    - **Database Tables:** alert_rules, alerts, alert_history with proper indexes.
    - **API Endpoints:** POST /generate, GET /alerts, PATCH /acknowledge, PATCH /resolve, GET /summary.
- **Ratio Compliance Spot-Check Logger (Phase 2C):**
    - **Purpose:** Document staff-to-child ratio compliance through quick spot-checks (in-person or CCTV).
    - **Dashboard Widget:** Single consolidated widget with "🏫 Rooms (X)" button in header, reminder alerts, progress bar, and recent checks list.
    - **Room Management Modal:** Compact "Manage Rooms" modal with quick-add form (single row: name, age, ratio), grid display of existing rooms, delete functionality (soft delete preserves history).
    - **Reminder System:** Configurable check schedule (default: 10am and 3pm), shows "Spot-Check Reminder" alert when checks are due.
    - **Quick Logging Modal:** Select room, enter children/staff counts, choose check method (with custom "Other" text input), add notes.
    - **Real-time Compliance Preview:** Shows compliance status before submitting (green = compliant, red = out of ratio).
    - **Rooms:** Pre-seeded with 6 age-appropriate rooms (Infant 1:4, Toddler 1:8, Preschool 1:10/1:12, School-Age 1:15).
    - **History Tracking:** All spot-checks stored with date, time, counts, compliance status, checker name, custom method description.
    - **Security:** Facility access verification (string comparison fix), input validation, ratio format validation, method whitelist.
    - **Database Tables:** rooms, ratio_spot_checks (with check_method_other), ratio_check_schedule.
    - **API Endpoints:** GET/POST/DELETE /api/facilities/:id/rooms, GET/POST /api/facilities/:id/ratio-checks, GET /api/facilities/:id/ratio-checks/today, GET /api/facilities/:id/ratio-checks/history, GET /api/facilities/:id/ratio-checks/reminder-status.

### Deployment
- **Type:** Autoscale deployment (stateless web app).
- **Server:** Single Node.js/Express server on port 5000 serving static files and APIs.

## External Dependencies
- **Database:** PostgreSQL (Neon)
- **AI:** Anthropic Claude Sonnet 4 API
- **File Upload:** Multer (Node.js middleware)
- **Weather:** 
  - Zippopotam API (free zip code geocoding, no API key required)
  - Open-Meteo API (free weather data, no API key required)