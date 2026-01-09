# Shield Ops - Child Care Safety Platform

## Overview
Shield Ops is a full-stack child care safety and compliance platform designed for daycare centers. It aims to streamline operations and ensure regulatory adherence by managing licensing, staff training, incident reporting, daily checklists, document management, medication tracking, and featuring an AI-powered compliance assistant. The platform's vision is to become an indispensable tool for childcare directors, ensuring a safe and compliant environment for children.

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
- **UI/UX:** Card-based UI, hover effects, animations, transitions, enhanced dashboard cards, sortable tables, comprehensive button system (loading/disabled states), improved form inputs. Core components include navigation, modals, toast notifications, loading states, and client-side filtering.

### Backend
- **Technology:** Node.js, Express.js
- **API:** RESTful API with 29 endpoints for various modules.
- **Authentication:** JWT-based authentication with token management.
- **File Uploads:** Multer configured for facility-specific folders, 10MB limit, supporting PDF, images, and Office documents.

### Database
- **Technology:** PostgreSQL (Neon) with Supabase migration support.
- **Schema:** 32+ tables covering core operations, onboarding, compliance, and training.
- **Data Persistence:** Data persists across sessions.
- **Auto-seeding:** Database auto-populates on server startup with fixed UUIDs and runs SQL migrations from `backend/config/migrations/`. Onboarding content (Texas-specific Day One orientation and Week One check-ins) can also be seeded.

### Key Features & Modules
- **Authentication:** Standard user login, sign-up, and profile management.
- **Dashboard:** Features a priority heat map (CRITICAL, ATTENTION NEEDED, MONITORING), real-time weather integration with safety recommendations, a safety performance card with a risk score, priority alerts for missing/expired documents, quick actions, and recent activity display.
- **Compliance Management:** Tracks state licensing requirements, displays compliance status, generates audit reports, and supports nationwide state regulations via a configurable settings page.
- **Training Hub (Redesigned):**
    - **2-Tab Navigation:** Monthly Curriculum and Required Certifications tabs with DOM-ready tab switching.
    - **Monthly Curriculum Calendar View (Stage 3A):** 12-month calendar grid with module cards, status badges (ACTIVE/PREVIEW/AVAILABLE), progress bars, current month highlight banner, and Training Progress Overview section.
    - **Module Detail Page (Stage 3B):** Click module card → detail page with back button, header (title/theme/status badge), progress tracker with percentage bar, 5 component tabs.
    - **Component 1 - Shield Champion Training (25%):** Educational content with 4 sections per month (January: New Year Safety Goals, SMART SAFETY Method, Facility Assessment Framework, Goal Implementation). Mark complete button updates progress.
    - **Component 2 - Team Communication (20%):** Message templates with copy-to-clipboard, emoji response tracking (👍❤️🎉💪✨), staff dropdown selection, auto-completes at 80% response rate.
    - **Component 3 - Staff Acknowledgment (25%):** Track which staff have reviewed training content, dropdown staff selection, auto-completes at 80% acknowledgment rate.
    - **Component 4 - Monthly Audit (15%):** 4 facility safety questions with Yes/No/Updates Needed/Maintenance Required/Other options, optional photo upload, auto-completes when all 4 answered.
    - **Component 5 - SafeGrowth Accelerator (15%):** 4-week social media content plan with visual ideas, sample captions, hashtags, copy buttons, mark as posted tracking. Auto-completes when all 4 weeks posted.
    - **Progress Calculation:** Weighted progress (0%→25%→45%→70%→85%→100%) with module completion celebration at 100%.
    - **Required Certifications:** List view of certification types with status indicators (Stage 4).
    - **API Endpoints:** 20+ endpoints for modules, component progress, staff responses, acknowledgments, audit questions/responses, social content/completions.
    - **Database Tables (14 new):** training_modules_new, training_champion_content, training_team_messages, training_staff_responses, training_acknowledgments, training_audit_questions, training_audit_responses, training_social_content, training_social_completions, training_component_progress, training_module_progress, certification_types, staff_certifications, staff_annual_hours, state_training_requirements.
    - **January 2026 Content Seeded:** 4 champion sections, team message, 4 audit questions, 4-week SafeGrowth content.
- **Staff Management:** Provides staff roster, tracks certifications, background checks, training completion, and expiration alerts.
- **Incident Reporting:** Allows logging of incidents (injury, illness, behavior), supports pattern detection, parent notification, digital signatures, and photo evidence.
- **Daily Checklist:** Manages morning safety and daily operations checklists, tracks completion, and provides an automated audit trail.
- **Document Vault:** Offers quick stats, category-based tabs for document organization, document table with violation weight indicators and status tracking, multi-step upload workflow, missing forms detection, inspection readiness reports, and automated expiration reminders.
- **New Hire Onboarding System:** A full-stack system with an onboarding list, dashboard, interactive Day One orientation (7 sections with champion scripts and verification), and Week One check-ins (6 daily activities). It includes backend APIs and dedicated database tables for content and progress tracking.
- **Shield AI - Compliance Assistant:** An AI-powered assistant utilizing a knowledge base of Texas DFPS compliance areas to answer questions, analyze incidents, and suggest training. Accessible via a floating chat button.
- **Smart Alerts System:** Generates critical, warning, and info-level alerts for expired/expiring certifications, missing spot-checks, and documents. Alerts have visual indicators and auto-acknowledgement.
- **Ratio Compliance Spot-Check Logger:** Facilitates documenting staff-to-child ratio compliance through quick spot-checks. Includes room management, configurable reminder system, quick logging modal with real-time compliance preview, and history tracking.

### Deployment
- **Type:** Autoscale deployment for a stateless web application.
- **Server:** Single Node.js/Express server serving static files and APIs.

## External Dependencies
- **Database:** PostgreSQL (Neon)
- **AI:** Anthropic Claude Sonnet 4 API
- **File Upload:** Multer
- **Weather:** Zippopotam API (geocoding), Open-Meteo API (weather data)