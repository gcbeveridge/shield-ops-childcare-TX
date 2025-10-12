# Shield Ops - Texas Child Care Compliance Platform

## 📋 Table of Contents
1. [Vision & Overview](#vision--overview)
2. [Architecture](#architecture)
3. [Module Documentation](#module-documentation)
4. [Data Flow & Dependencies](#data-flow--dependencies)
5. [API Endpoints Reference](#api-endpoints-reference)
6. [Database Schema](#database-schema)
7. [Setup Instructions](#setup-instructions)
8. [Roadmap](#roadmap)

---

## 🎯 Vision & Overview

### Product Vision
Shield Ops is a comprehensive compliance management SaaS platform designed specifically for Texas child care facilities. The platform helps directors and owners maintain compliance with Texas Department of Family and Protective Services (DFPS) minimum standards (Texas Administrative Code, Title 40, Chapter 744) while streamlining daily operations.

### Target Market
- Texas child care facilities (daycare centers, before/after school programs)
- Facility capacity: 20-200 children
- Staff size: 5-50 employees
- Initial target: Austin/Dallas/Houston metro areas

### Core Value Proposition
1. **Automated Compliance Tracking** - Never miss a certification expiration or required training
2. **Audit-Ready Documentation** - Generate comprehensive compliance reports in seconds
3. **AI-Powered Guidance** - "Shield AI" answers complex Texas regulation questions
4. **Incident Management** - Digital parent signatures, automatic notifications
5. **Medication Safety** - Dual-staff verification system per Texas requirements

### Business Model
- **Starter**: $49/month (1 facility, up to 30 children)
- **Professional**: $129/month (1 facility, up to 100 children, includes Shield AI)
- **Enterprise**: $299/month (multiple facilities, unlimited children, custom integrations)

---

## 🏗️ Architecture

### Tech Stack
```
Frontend:
- Vanilla JavaScript (ES6+)
- HTML5 / CSS3
- No framework dependencies (intentionally lightweight)

Backend:
- Node.js + Express.js
- Replit Database (key-value store) [Production: PostgreSQL]
- JWT authentication
- RESTful API design

Future Integrations:
- Anthropic Claude API (Shield AI)
- Stripe (payments)
- AWS S3/Cloudflare R2 (file storage)
- SendGrid (email notifications)
- Twilio (SMS notifications)
```

### Project Structure
```
/
├── backend/
│   ├── server.js                 # Express app entry point
│   ├── config/
│   │   ├── database.js          # Replit DB connection
│   │   └── constants.js         # Texas compliance constants
│   ├── middleware/
│   │   ├── auth.js              # JWT authentication
│   │   └── validation.js        # Request validation
│   ├── models/                  # Data structures
│   ├── controllers/             # Business logic
│   └── routes/                  # API endpoints
├── public/
│   └── index.html               # Single-page application
├── uploads/                     # Document storage
└── README.md                    # This file
```

### Data Storage Strategy
**Current (Replit DB):**
- Key-value store with prefix-based organization
- Example keys: `facilities:abc123`, `staff:abc123:xyz789`

**Production Migration Plan:**
- PostgreSQL with proper relational schema
- Foreign keys and constraints
- Indexed queries for performance

---

## 📱 Module Documentation

### Navigation Structure
```
Shield Ops
├── Overview
│   └── Dashboard
├── Compliance
│   └── State Licensing
├── Operations
│   ├── Training Hub
│   ├── Staff Management
│   ├── Incident Reports
│   ├── Daily Checklist
│   ├── Document Vault
│   └── Medication Tracking
└── [Future: Shield AI Chat]
```

---

## 1. 📊 Dashboard

### Purpose
Provides at-a-glance overview of facility health, compliance status, and immediate action items.

### Key Metrics Displayed
1. **Risk Score** (0-100) - Composite score based on:
   - Compliance percentage (40% weight)
   - Overdue certifications (30% weight)
   - Recent incident patterns (20% weight)
   - Missing required documents (10% weight)

2. **Licensing Compliant** (percentage) - Texas DFPS requirements completion
   - 12 total requirements tracked
   - Color coding: Green (90-100%), Yellow (70-89%), Red (<70%)

3. **Staff Certified** (X/Y format) - Staff with current certifications
   - CPR valid
   - First Aid valid
   - Background check clear
   - Shows expiring soon (< 30 days)

4. **Oct Training Complete** (percentage) - Monthly training module completion

### Data Sources
```javascript
GET /api/facilities/:facilityId/dashboard

Response structure:
{
  facilityInfo: {
    name: string,
    location: string,
    currentEnrollment: number,
    capacity: number,
    staffCount: number
  },
  complianceStatus: {
    overallPercentage: number,
    completeRequirements: number,
    totalRequirements: 12,
    pendingRequirements: number,
    overdueRequirements: number
  },
  todayStats: {
    childrenPresent: number,
    staffOnDuty: number,
    incidentsToday: number,
    medicationsGiven: number,
    checklistCompletion: number
  },
  recentIncidents: [
    { id, childName, type, description, occurredAt, parentNotified }
  ],
  upcomingExpirations: [
    { type, item, expiresAt, daysUntilExpiration, priority }
  ],
  actionItems: [
    { priority, title, dueDate, overdue }
  ]
}
```

### Data Dependencies
- **FROM**: Compliance, Staff, Incidents, Medications, Checklist modules
- **TO**: Provides high-level metrics that link to detail pages

### User Actions
- Click "Generate Audit Report" → Opens audit report modal
- Click "Daily Checklist" → Navigate to Daily Checklist module
- Click "View Documents" → Navigate to Document Vault
- Click "Log Incident" → Opens incident creation modal
- Click action items → Navigate to relevant module

### Business Logic
```javascript
// Risk Score Calculation
riskScore = 100 - (
  (pendingRequirements * 5) +
  (overdueRequirements * 10) +
  (expiringCertifications * 3) +
  (recentIncidents * 2) +
  (missingDocuments * 4)
)
```

---

## 2. 📋 State Licensing

### Purpose
Track compliance with all 12 Texas DFPS minimum standards requirements (Chapter 744).

### The 12 Texas Requirements
1. **Orientation Training** - Emergency procedures, abuse reporting (§744.1301)
   - Due: Within 7 days of hire
   - Priority: Medium-High
   
2. **Pre-Service Training** - 8 clock hours on child development (§744.1305)
   - Due: Within 90 days of hire
   - Priority: Medium-High

3. **Pediatric First Aid** - All staff current certification (§744.1315)
   - Due: Within 90 days of hire
   - Priority: Medium-High

4. **Pediatric CPR** - AHA guidelines, must stay current (§744.1315)
   - Due: Within 90 days of hire
   - Priority: Medium-High

5. **Annual Training - Caregivers** - 15 clock hours covering 8 topics (§744.1309)
   - Due: Annually
   - Priority: Medium-High

6. **Annual Training - Directors** - 20 clock hours including management (§744.1309)
   - Due: Annually (Dec 15, 2025)
   - Priority: Medium-High
   - **Note**: Currently the ONLY pending requirement

7. **Transportation Safety Training** - 2 hours for drivers (§744.1317)
   - Due: Annually (if applicable)
   - Priority: Medium-High

8. **Background Checks** - Criminal history & sex offender registry (§745.601)
   - Due: Before hire
   - Priority: High

9. **Tuberculosis Screening** - Risk assessment for all employees (§744.625)
   - Due: At hire
   - Priority: Medium

10. **Child Health Records** - Immunizations, health statements (§744.613)
    - Due: At enrollment
    - Priority: Medium

11. **Attendance Records** - Daily sign-in/out & timesheets (§744.701)
    - Due: Daily
    - Priority: Medium-Low

12. **Minimum Caregiver Qualifications** - High school diploma, 18+ (§744.1025)
    - Due: At hire
    - Priority: Medium

### Data Sources
```javascript
GET /api/facilities/:facilityId/compliance

Response: Array of 12 requirements with:
{
  id: string,
  name: string,
  description: string,
  category: "Staff Training" | "Facility" | "Operational",
  priority: "High" | "Medium-High" | "Medium" | "Medium-Low" | "Low",
  dueDate: string,
  frequency: "one-time" | "annually" | "daily",
  texasCode: string (e.g., "§744.1301"),
  status: "complete" | "pending" | "overdue",
  completedAt?: date,
  completedBy?: string
}
```

### User Actions
```javascript
// Mark requirement as complete
PUT /api/facilities/:facilityId/compliance/:requirementId/complete
Body: {
  completedBy: staffId,
  notes?: string
}

// Generate audit report
GET /api/facilities/:facilityId/compliance/audit-report
Returns: Comprehensive PDF-ready data package
```

### Data Dependencies
- **FROM**: Staff certifications, Training Hub completion, Document Vault
- **TO**: Dashboard compliance percentage, Audit reports

### Audit Report Contents
When "Generate Audit Report" is clicked, includes:
- All 12 requirements with completion status
- Staff roster with certifications
- Medication administration records
- Incident reports (last 90 days)
- Daily checklists (last 30 days)
- Required postings verification
- Emergency preparedness plan
- Fire drill documentation

---

## 3. 📚 Training Hub

### Purpose
Manage the 12-month safety and compliance training curriculum required by Texas DFPS.

### Monthly Training Modules
```javascript
[
  { month: "January", title: "Child Abuse Prevention & Reporting" },
  { month: "February", title: "Emergency Response Procedures" },
  { month: "March", title: "Health & Safety Standards" },
  { month: "April", title: "Food Safety & Nutrition" },
  { month: "May", title: "Behavior Management Techniques" },
  { month: "June", title: "Outdoor Safety & Sun Protection" },
  { month: "July", title: "Water Safety & Summer Activities" },
  { month: "August", title: "Back-to-School Preparation" },
  { month: "September", title: "Infection Control & Hand Hygiene" },
  { month: "October", title: "OSHA Compliance Review" },
  { month: "November", title: "Severe Weather Preparedness" },
  { month: "December", title: "Holiday Safety & Year-End Review" }
]
```

### Data Sources
```javascript
GET /api/facilities/:facilityId/training/modules

Response:
{
  currentMonth: "October",
  currentModule: {
    title: "OSHA Compliance Review",
    completionRate: 100,
    staffCompleted: 15,
    totalStaff: 15
  },
  modules: [
    {
      id: string,
      month: string,
      title: string,
      status: "complete" | "in-progress" | "upcoming",
      completionRate: number,
      staffCompleted: number,
      dueDate?: date
    }
  ]
}
```

### User Actions
```javascript
// Mark training complete for staff member
POST /api/training/:moduleId/complete
Body: {
  staffId: string,
  completedAt: date,
  certificateUrl?: string
}

// Get staff training history
GET /api/staff/:staffId/training
```

### Data Dependencies
- **FROM**: Staff Management (who needs training)
- **TO**: 
  - State Licensing (Annual Training requirements)
  - Staff Management (training hours tracking)
  - Dashboard (monthly completion percentage)

### Business Logic
- Each module auto-opens on the 1st of the month
- Staff have until end of month to complete
- Directors get 20 hours/year requirement
- Regular staff get 15 hours/year requirement
- Hours tracked automatically upon completion

---

## 4. 👥 Staff Management

### Purpose
Track all staff members, their certifications, and training compliance.

### Staff Record Structure
```javascript
{
  id: string,
  facilityId: string,
  name: string,
  email: string,
  role: "Lead Teacher" | "Assistant Teacher" | "Director" | "Teacher",
  hireDate: date,
  active: boolean,
  certifications: {
    cpr: {
      valid: boolean,
      expiresAt: date,
      certificateUrl?: string
    },
    firstAid: {
      valid: boolean,
      expiresAt: date,
      certificateUrl?: string
    },
    backgroundCheck: {
      status: "Clear" | "Pending" | "Expired",
      completedAt: date,
      expiresAt: date
    },
    tuberculosisScreening: {
      status: "Complete" | "Pending",
      completedAt: date
    }
  },
  trainingHours: {
    required: 15 or 20 (based on role),
    completed: number,
    year: number
  }
}
```

### Data Sources
```javascript
// Get all staff
GET /api/facilities/:facilityId/staff

// Get single staff member
GET /api/staff/:staffId

// Create staff
POST /api/facilities/:facilityId/staff
Body: { name, email, role, hireDate }

// Update staff
PUT /api/staff/:staffId
Body: { name?, email?, role? }

// Update certifications
PUT /api/staff/:staffId/certifications
Body: {
  type: "cpr" | "firstAid" | "backgroundCheck" | "tuberculosisScreening",
  valid: boolean,
  expiresAt?: date,
  certificateUrl?: string
}
```

### Display Logic
**Certification Status Colors:**
- **Green (Valid)**: Expiration > 30 days away
- **Yellow (Exp Nov 15)**: Expiration 15-30 days away
- **Orange (Exp Nov 28)**: Expiration 1-14 days away
- **Red (Expired)**: Past expiration date

**Training Hours:**
- Shows percentage: `15/15 = 100%`
- Resets annually on hire anniversary

### Data Dependencies
- **FROM**: Training Hub (hours completed)
- **TO**:
  - Dashboard (certified count, expiration alerts)
  - State Licensing (background checks, CPR/First Aid compliance)
  - Incident Reports (who can report)
  - Medication Tracking (who can administer)

### Alerts Generated
- 30 days before certification expiration → Email to director
- 14 days before → Email + dashboard alert
- On expiration day → Red alert + block from working until renewed

---

## 5. 🚨 Incident Reports

### Purpose
Document and track all injuries, illnesses, and behavioral incidents. Ensure parent notification and signature per Texas requirements.

### Incident Record Structure
```javascript
{
  id: string,
  facilityId: string,
  childName: string,
  childId?: string,
  incidentType: "injury" | "illness" | "behavior",
  description: string (required),
  occurredAt: timestamp (required),
  reportedBy: string (staff name),
  reportedById: string (staff id),
  location: string ("playground", "classroom", etc.),
  witnessedBy: [string] (staff names),
  actionTaken: string,
  firstAidProvided: boolean,
  parentNotified: boolean,
  parentNotifiedAt: timestamp,
  parentNotificationMethod: "phone" | "email" | "in-person",
  parentSignature: {
    signed: boolean,
    signedBy: string (parent name),
    signedAt: timestamp,
    digitalSignature: string
  },
  photoUrls: [string],
  requiresFollowup: boolean,
  status: "open" | "parent-signed" | "closed"
}
```

### Data Sources
```javascript
// Get all incidents (with filters)
GET /api/facilities/:facilityId/incidents?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&type=injury&status=open

// Create incident
POST /api/facilities/:facilityId/incidents
Body: {
  childName,
  incidentType,
  description,
  occurredAt,
  reportedBy,
  location,
  actionTaken,
  parentNotified
}

// Get single incident
GET /api/incidents/:incidentId

// Add parent signature
PUT /api/incidents/:incidentId/parent-signature
Body: {
  parentSignature: string,
  signedBy: string,
  signedAt: timestamp
}

// Upload incident photo
POST /api/incidents/:incidentId/photos
Body: FormData with file
```

### Texas Requirements
**Per §744.2801 - Incident Reporting:**
- Must document within 24 hours
- Parent must be notified immediately (phone call)
- Written report required with parent signature
- Copy given to parent
- Original kept in child's file

### Pattern Detection
**Alert triggers:**
- 3+ injuries to same child in 30 days
- 3+ incidents same location in 30 days
- 3+ playground falls in 30 days

Shows: "Pattern Alert: X incidents this month - above average"

### Data Dependencies
- **FROM**: Staff Management (who reported)
- **TO**:
  - Dashboard (recent incidents, risk score)
  - State Licensing (incident logs for audit)

### User Workflow
1. Staff clicks "+ Log New Incident"
2. Fills out form with required fields
3. Clicks "Save & Notify Parent"
4. System:
   - Creates incident record
   - Sends notification to parent (email/SMS)
   - Generates signature request link
5. Parent clicks link → signs digitally
6. Status changes to "parent-signed"

---

## 6. ✓ Daily Checklist

### Purpose
Ensure all required daily tasks are completed and maintain audit trail per Texas inspection requirements.

### Checklist Structure
Tasks organized by time of day:

**Morning Safety Walk (6:00-7:00):**
1. Facility Inspection - Check all rooms for hazards
2. Playground Equipment Check - Inspect for damage, check surfaces
3. Temperature Logs - Record refrigerator/freezer temps
4. Hand Sanitizer Refill - Check and refill stations

**Throughout Day:**
1. Child Attendance Tracking - Maintain accurate records
2. Meal Service Documentation - Document meals served
3. Medication Administration - Administer and log medications
4. Activity Documentation - Record activities and observations

**Evening Closing (5:30-6:00):**
1. Final Headcount & Sign-Out - Verify all children signed out
2. Security Check & Lock-Up - Lock doors, set alarm
3. Tomorrow's Prep Notes - Leave notes for morning staff

### Data Sources
```javascript
// Get or create today's checklist
GET /api/facilities/:facilityId/checklist/today

Response:
{
  id: string,
  facilityId: string,
  date: "YYYY-MM-DD",
  tasks: [
    {
      id: string,
      category: "Morning (6:00-7:00)" | "Throughout Day" | "Evening (5:30-6:00)",
      task: string,
      description: string,
      completed: boolean,
      completedBy: string?,
      completedAt: timestamp?,
      notes: string?
    }
  ],
  summary: {
    total: 11,
    completed: number,
    percentage: number
  }
}

// Mark task complete
POST /api/facilities/:facilityId/checklist/today/tasks/:taskId/complete
Body: {
  completedBy: staffName,
  notes?: string
}

// Get week stats
GET /api/facilities/:facilityId/checklist/week
Returns: [
  { date, completionPercentage, completedTasks, totalTasks }
]
```

### Auto-Generation Logic
- Checklist auto-creates at midnight (12:00 AM Central)
- All tasks start as uncompleted
- Previous day's checklist archived
- 90-day retention for inspection purposes

### Data Dependencies
- **FROM**: Staff Management (who completed tasks)
- **TO**: Dashboard (completion percentage for today)

### Business Logic
- Tasks can be marked complete out of order
- Once complete, checkbox is locked (can't uncheck)
- Staff name auto-populated from logged-in user
- Timestamp auto-recorded
- Weekly trend shows 7-day completion rates
- Color coding: Green (90-100%), Yellow (70-89%), Orange (50-69%), Red (<50%)

---

## 7. 📁 Document Vault

### Purpose
Centralized storage for all facility documents with automatic expiration tracking and compliance verification.

### Document Categories
1. **Licensing & Permits** - State licenses, permits, registrations
2. **Staff Records** - Certifications, background checks, I-9 forms
3. **Facility & Inspections** - Fire inspections, health inspections, building permits
4. **Children** - Enrollment forms, health records, immunizations
5. **Health & Safety** - Emergency plans, policies, procedures
6. **Insurance** - Liability, property, vehicle insurance

### Document Record Structure
```javascript
{
  id: string,
  facilityId: string,
  name: string,
  category: "licenses" | "staff" | "inspections" | "certifications" | "training" | "insurance" | "children",
  fileUrl: string,
  fileSize: number,
  fileType: string (.pdf, .jpg, .docx),
  uploadedBy: string (staff name),
  uploadedAt: timestamp,
  expiresAt: date?,
  issueDate: date?,
  owner: string? (e.g., "Emily Rodriguez" for staff cert),
  formNumber: string? (e.g., "2971" for official forms),
  status: "current" | "expiring-soon" | "expired" | "missing",
  tags: [string]
}
```

### Data Sources
```javascript
// Get all documents
GET /api/facilities/:facilityId/documents

// Get by category
GET /api/facilities/:facilityId/documents?category=licenses

// Upload document
POST /api/facilities/:facilityId/documents/upload
Body: FormData {
  file: File,
  name: string,
  category: string,
  expiresAt?: date,
  owner?: string,
  formNumber?: string
}

// Get document metadata
GET /api/documents/:documentId

// Download document
GET /api/documents/:documentId/download
Returns: File stream

// Update document (renew)
PUT /api/documents/:documentId
Body: {
  expiresAt?: date,
  status?: string
}
```

### Expiration Tracking
**Status Logic:**
- **Current** (Green): Expiration > 90 days away OR no expiration
- **Expiring in 30 Days** (Yellow): 30-90 days until expiration
- **Expired 2 days ago** (Red): Past expiration OR 0-30 days away

**Alerts:**
- 90 days before: Email reminder to director
- 30 days before: Email + dashboard notification
- 14 days before: Daily email reminders
- On expiration: Red alert + marked as expired

### Data Dependencies
- **FROM**: Staff Management (certifications), State Licensing (required docs)
- **TO**: 
  - Dashboard (missing documents count, expiration alerts)
  - State Licensing (audit report documentation)

### File Storage
**Current:** Replit filesystem at `/uploads/{facilityId}/{documentId}`

**Production:** AWS S3 or Cloudflare R2 buckets
- Organized: `s3://shield-ops-docs/{facilityId}/{category}/{documentId}`
- Encryption: Server-side encryption enabled
- Retention: 7 years per Texas requirements

### User Actions
- **"Upload Document"**: Opens modal, drag-drop or browse
- **"View"**: Opens document in new tab (inline PDF viewer)
- **"Renew" / "Renew Now"**: Upload new version, extends expiration
- **"Set Reminder"**: Custom reminder X days before expiration

---

## 8. 💊 Medication Tracking

### Purpose
Track medication administration with dual-staff verification per Texas §744.2651-2661 requirements.

### Medication Authorization Structure
```javascript
{
  id: string,
  facilityId: string,
  childName: string,
  childId: string,
  medicationName: string (required),
  dosage: string (required, e.g., "5 mL", "2 puffs"),
  instructions: string,
  frequency: string ("once daily", "twice daily", "as needed"),
  administrationTimes: [string] (["08:00", "14:00"]),
  startDate: date (required),
  endDate: date (required, max 1 year per §744.2653),
  parentAuthorization: {
    authorized: boolean (required),
    authorizedBy: string (parent name),
    signedAt: timestamp,
    digitalSignature: string
  },
  originalContainerPhoto: string (url, required per §744.2655),
  administrationLog: [
    {
      administeredAt: timestamp,
      administeredBy: string (staff name),
      verifiedBy: string (second staff name),
      dosageGiven: string,
      notes: string?
    }
  ],
  active: boolean,
  createdAt: timestamp
}
```

### Texas Requirements (Critical!)
**Per §744.2651-2661:**
1. Written parent authorization required (electronic OK)
2. Authorization expires after 1 year max
3. Must not exceed label instructions or doctor's orders
4. Original container required with child's name and date
5. Photo of container must be stored
6. Cannot be expired medication
7. Two staff members required for verification
8. Administration log must be maintained
9. Medication must be stored securely (locked)

### Data Sources
```javascript
// Get all medications
GET /api/facilities/:facilityId/medications

// Get active medications for child
GET /api/facilities/:facilityId/medications?childId=xyz&active=true

// Create medication authorization
POST /api/facilities/:facilityId/medications
Body: {
  childName,
  medicationName,
  dosage,
  instructions,
  frequency,
  startDate,
  endDate (max 1 year from startDate),
  administrationTimes,
  parentAuthorization: {
    authorizedBy,
    signedAt,
    digitalSignature
  },
  originalContainerPhoto (uploaded file URL)
}

// Log medication administration (DUAL VERIFICATION)
POST /api/medications/:medicationId/administer
Body: {
  administeredBy: string (first staff),
  verifiedBy: string (second staff - REQUIRED),
  dosageGiven: string,
  administeredAt: timestamp,
  notes?: string
}

// Get medication details with full log
GET /api/medications/:medicationId
```

### Dual-Staff Verification Process
**Critical Safety Feature:**
1. Staff A retrieves medication from locked storage
2. Staff B verifies:
   - Correct child
   - Correct medication
   - Correct dosage
   - Correct time
3. Staff A administers
4. Both staff sign in system
5. System records both names + timestamp

**If only one staff present:**
- System blocks administration
- Medication marked as "missed dose"
- Alert sent to director

### Food Allergy Management
Special subsection tracks severe allergies with emergency plans:

```javascript
{
  childName: string,
  allergyType: "Peanut" | "Dairy" | "Shellfish" | etc.,
  severity: "ANAPHYLAXIS RISK" | "Moderate" | "Mild",
  symptoms: [string],
  emergencyAction: string,
  epiPenLocation: string,
  parentEmergency: phone,
  postedLocations: [string] (where allergy plan is posted)
}
```

### Data Dependencies
- **FROM**: 
  - Staff Management (who administered, who verified)
  - Children records (which child)
- **TO**:
  - Dashboard (doses given today)
  - Daily Checklist (medication log review task)
  - State Licensing (medication records for audit)

### User Interface Elements
**Status Indicators:**
- **"Valid until Mar 2026"** (Green) - Authorization current
- **"Valid until Oct 2025"** (Yellow) - Expiring within 90 days
- **"Expires Dec 15, 2025"** (Orange) - Expiring within 30 days
- **"Due in 15 min"** (Red) - Scheduled dose coming up

**Action Buttons:**
- **"Log Dose"**: Opens modal for dual verification
- **"View Plan"**: Shows full medication details + administration schedule
- **"Due in 15min"**: Pre-fills administration form with current time

### Today's Administration Log
Real-time table showing:
- Time medication was given
- Child name
- Medication + dosage
- Administered by (staff name)
- Witnessed by (second staff name)
- Photo verification (shows container photo + verification photo)

---

## 9. 🤖 Shield AI (Planned Feature)

### Purpose
AI-powered compliance assistant that answers complex Texas regulation questions using Claude API.

### Functionality
**User asks questions like:**
- "Can we administer CBD oil for anxiety per parent request?"
- "What are the child/caregiver ratios for 3-year-olds?"
- "Do we need a lifeguard if we have a splash pad?"
- "What training is required within 90 days of hire?"

**Shield AI responds with:**
- Exact Texas code references (§744.xxxx)
- Plain English explanation
- Facility-specific guidance based on current status
- Recommended actions
- Related requirements

### Implementation Plan
```javascript
// API endpoint
POST /api/ai/ask
Body: {
  question: string,
  facilityId: string (for context)
}

// Backend logic
1. Retrieve facility context:
   - Current compliance status
   - Staff certifications
   - Recent incidents
   - Policy documents

2. Build prompt with context:
   - Full text of Texas Chapter 744
   - Facility-specific data
   - User question

3. Call Claude API:
   Model: claude-sonnet-4-5-20250929
   Max tokens: 2000
   Temperature: 0 (deterministic)

4. Return response:
   {
     answer: string (formatted with markdown),
     texasCodeReferences: [string],
     relatedRequirements: [string],
     recommendedActions: [string]
   }
```

### Data Sources
**Context Provided to Claude:**
- Texas Minimum Standards full text (embedded in prompt)
- Facility compliance status
- Staff roster + certifications
- Current policies from Document Vault
- Recent incidents (if relevant to question)

### UI Design
**Chat Interface:**
- Fixed chat bubble in bottom-right corner
- Click to expand full-screen chat
- Message history saved per facility
- Quick action buttons: "Generate compliance report", "Check certification status"

**Example Conversation:**
```
User: "What's our position on CBD oil for anxiety?"

Shield AI: 
📋 Texas Licensing Requirements:
Texas Minimum Standards (§746.3701) require written physician 
authorization for ANY medication or medical treatment. CBD products, 
while legal in Texas with <0.3% THC, are:
• Not FDA-approved for pediatric anxiety
• Considered a supplement, not a medication
• Not authorized without doctor's orders

✅ Your Facility's Medication Policy (Page 47):
"All medications require written authorization from a licensed 
physician, including dosage, time, and method of administration."

💬 Recommended Response:
"I understand your concern for [child's name]'s wellbeing. Our Texas 
licensing requires written physician authorization for any substance 
we administer. If [child's] doctor prescribes CBD oil with specific 
dosing instructions, we'd be happy to follow that medical guidance."

🔄 Next Steps:
1. Document this conversation in parent communication log
2. If parent provides prescription, consult with licensing specialist
3. Consider adding CBD policy to parent handbook
```

### Cost Estimates
- Average question: ~2,000 tokens = $0.006
- Expected usage: 50 queries/facility/month = $0.30/facility/month
- Revenue: Included in Professional tier ($129/month)

### Future Enhancements
- Voice input (speech-to-text)
- Proactive suggestions ("You have 3 certifications expiring next month")
- Integration with document vault (auto-suggest policies)
- Multi-language support (Spanish)

---

## 📊 Data Flow & Dependencies

### Global Data Flows

```
┌─────────────────┐
│  Authentication │
│   (JWT Token)   │
└────────┬────────┘
         │
         ├──────────> All API Requests
         │
┌────────▼────────┐
│    Facility     │  (User's facility context)
│   (facilityId)  │
└────────┬────────┘
         │
         ├──────────> Dashboard
         ├──────────> Staff Management
         ├──────────> Compliance Tracking
         ├──────────> Incidents
         ├──────────> Medications
         ├──────────> Checklists
         ├──────────> Training
         └──────────> Documents
```

### Cross-Module Dependencies

**Staff Management** feeds data to:
- Dashboard (staff count, certification status)
- Compliance (background checks, CPR/First Aid)
- Incidents (who reported)
- Medications (who administered, who verified)
- Training (who completed modules)
- Checklists (who completed tasks)

**Compliance** feeds data to:
- Dashboard (overall percentage)
- Staff Management (certification requirements)
- Training (required training hours)

**Incidents** feeds data to:
- Dashboard (recent incidents, risk score, pattern detection)
- Compliance (incident logs for audit)

**Medications** feeds data to:
- Dashboard (doses given today)
- Checklists (medication log review task)
- Compliance (medication records for audit)

**Checklists** feeds data to:
- Dashboard (completion percentage)

**Training** feeds data to:
- Dashboard (monthly completion)
- Staff Management (training hours)
- Compliance (annual training requirements)

**Documents** feeds data to:
- Dashboard (missing documents, expiring documents)
- Compliance (required documentation)
- Staff Management (certification files)

### Calculated Fields

**Risk Score** (Dashboard):
```javascript
baseScore = 100
score -= pendingRequirements * 5
score -= overdueRequirements * 10
score -= expiringCertifications * 3
score -= incidentsThisMonth * 2
score -= missingDocuments * 4
riskScore = Math.max(0, score)
```

**Compliance Percentage** (Dashboard):
```javascript
percentage = (completedRequirements / totalRequirements) * 100
// totalRequirements = 12 (fixed)
```

**Staff Certification Status** (Staff Management):
```javascript
function getCertificationStatus(expiresAt) {
  daysUntil = daysBetween(today, expiresAt)
  if (daysUntil > 30) return { status: "Valid", color: "green" }
  if (daysUntil > 14) return { status: `Exp ${formatDate(expiresAt)}`, color: "yellow" }
  if (daysUntil > 0) return { status: `Exp ${formatDate(expiresAt)}`, color: "orange" }
  return { status: "Expired", color: "red" }
}
```

---

## 🔗 API Endpoints Reference

### Authentication
```
POST   /api/auth/signup          Create facility + owner account
POST   /api/auth/login           Authenticate user
GET    /api/auth/me              Get current user info
```

### Dashboard
```
GET    /api/facilities/:id/dashboard    Get all dashboard metrics
```

### Facilities
```
GET    /api/facilities/:id               Get facility details
PUT    /api/facilities/:id               Update facility info
```

### Compliance
```
GET    /api/facilities/:id/compliance                          Get all requirements
POST   /api/facilities/:id/compliance/:reqId/complete          Mark requirement complete
GET    /api/facilities/:id/compliance/audit-report             Generate audit report
```

### Staff
```
GET    /api/facilities/:id/staff          List all staff
POST   /api/facilities/:id/staff          Create staff member
GET    /api/staff/:id                     Get staff details
PUT    /api/staff/:id                     Update staff info
PUT    /api/staff/:id/certifications      Update certification
```

### Incidents
```
GET    /api/facilities/:id/incidents           List incidents (with filters)
POST   /api/facilities/:id/incidents           Create incident
GET    /api/incidents/:id                      Get incident details
PUT    /api/incidents/:id/parent-signature     Add parent signature
POST   /api/incidents/:id/photos               Upload photo
```

### Medications
```
GET    /api/facilities/:id/medications         List medications
POST   /api/facilities/:id/medications         Create authorization
POST   /api/medications/:id/administer         Log dose (dual verification)
GET    /api/medications/:id                    Get medication details + log
```

### Checklists
```
GET    /api/facilities/:id/checklist/today                      Get/create today's checklist
POST   /api/facilities/:id/checklist/today/tasks/:id/complete   Mark task complete
GET    /api/facilities/:id/checklist/week                       Get week stats
```

### Training
```
GET    /api/facilities/:id/training/modules    List all modules
POST   /api/training/:id/complete              Mark training complete
GET    /api/staff/:id/training                 Get staff training history
```

### Documents
```
GET    /api/facilities/:id/documents           List documents (with filters)
POST   /api/facilities/:id/documents/upload    Upload document
GET    /api/documents/:id                      Get document metadata
GET    /api/documents/:id/download             Download file
PUT    /api/documents/:id                      Update document (renew)
```

### Shield AI (Planned)
```
POST   /api/ai/ask                             Ask compliance question
GET    /api/ai/history                         Get conversation history
```

---

## 💾 Database Schema

### Current Structure (Replit DB - Key-Value)

```
facilities:{facilityId} = {
  id, name, address, phone, email, licenseNumber, 
  capacity, ownerId, settings, createdAt, updatedAt
}

users:{userId} = {
  id, email, name, role, facilityId, createdAt, updatedAt
}

staff:{facilityId}:{staffId} = {
  id, facilityId, name, email, role, hireDate, 
  certifications, trainingHours, active, createdAt
}

children:{facilityId}:{childId} = {
  id, facilityId, firstName, lastName, birthDate, 
  parentName, parentPhone, parentEmail, enrollmentDate, active
}

incidents:{facilityId}:{incidentId} = {
  id, facilityId, childName, childId, incidentType, 
  description, occurredAt, reportedBy, reportedById, 
  parentSignature, status, createdAt
}

medications:{facilityId}:{medicationId} = {
  id, facilityId, childName, medicationName, dosage,
  startDate, endDate, parentAuthorization, 
  administrationLog, active, createdAt
}

checklists:{facilityId}:{YYYY-MM-DD} = {
  id, facilityId, date, tasks[], summary, createdAt
}

training:{facilityId}:{moduleId} = {
  id, facilityId, month, title, completions[staffId, completedAt]
}

documents:{facilityId}:{documentId} = {
  id, facilityId, name, category, fileUrl, expiresAt,
  uploadedBy, uploadedAt, status
}

compliance:{facilityId}:{requirementId} = {
  id, facilityId, requirementId, status, completedAt, completedBy
}
```

### Production Schema (PostgreSQL)

**When migrating to production, implement proper relational schema:**

```sql
-- Core tables
facilities
users (with foreign key to facilities)
staff (with foreign key to facilities)
children (with foreign key to facilities)

-- Operational tables
incidents (with foreign keys to facilities, children, staff)
medications (with foreign keys to facilities, children)
medication_doses (with foreign keys to medications, staff)
checklists (with foreign key to facilities)
checklist_tasks (with foreign key to checklists)
training_modules
training_completions (with foreign keys to training_modules, staff)
documents (with foreign keys to facilities, staff)
compliance_requirements (static reference table)
compliance_status (with foreign keys to facilities, requirements)

-- Indexes for performance
CREATE INDEX idx_staff_facility ON staff(facility_id);
CREATE INDEX idx_incidents_facility_date ON incidents(facility_id, occurred_at);
CREATE INDEX idx_medications_active ON medications(facility_id, active);
CREATE INDEX idx_documents_expiration ON documents(expires_at) WHERE expires_at IS NOT NULL;
```

---

## 🚀 Setup Instructions

### Prerequisites
- Node.js 18+
- Replit account (for current hosting)
- Git

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/yourusername/shield-ops.git
cd shield-ops

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your values:
# JWT_SECRET=your-secret-key
# NODE_ENV=development

# Start backend server
npm start

# Server runs on http://localhost:3000
# Frontend served at http://localhost:3000/
```

### Replit Deployment (Current)
1. Fork the Replit project
2. Set environment variables in Replit Secrets:
   - `JWT_SECRET`
   - `NODE_ENV=production`
3. Run the server
4. Access via Replit webview URL

### Production Deployment (Future)

**Backend (Railway/Render/Fly.io):**
```bash
# Deploy to Railway
railway up

# Set environment variables
railway variables set JWT_SECRET=xxx
railway variables set DATABASE_URL=postgresql://...
railway variables set ANTHROPIC_API_KEY=xxx
railway variables set STRIPE_SECRET_KEY=xxx
```

**Database (Supabase/Railway):**
- Create PostgreSQL instance
- Run migration scripts
- Set up automated backups

**File Storage (AWS S3/Cloudflare R2):**
- Create bucket
- Set CORS policy
- Generate access keys
- Update environment variables

---

## 📈 Roadmap

### Phase 1: Core MVP ✅ (Current)
- [x] Authentication & user management
- [x] Dashboard with compliance metrics
- [x] Staff management & certification tracking
- [x] Incident reporting with parent signatures
- [x] Medication tracking with dual verification
- [x] Daily checklist system
- [x] Training hub (12-month curriculum)
- [x] Document vault with expiration tracking
- [x] State licensing compliance (12 requirements)

### Phase 2: Enhanced Features 🚧 (In Progress)
- [ ] Fix form submission bugs (all modules)
- [ ] Add Shield AI (Claude API integration)
- [ ] Implement Stripe payments
- [ ] Beta test with 2-3 facilities
- [ ] Mobile responsive improvements

### Phase 3: Production Ready 📅 (Next 4-8 weeks)
- [ ] Migrate to PostgreSQL
- [ ] Deploy to production infrastructure
- [ ] AWS S3 file storage
- [ ] Email notifications (SendGrid)
- [ ] SMS notifications (Twilio)
- [ ] Security audit & penetration testing
- [ ] HIPAA compliance review
- [ ] Legal documents (Terms, Privacy Policy)

### Phase 4: Growth Features 📅 (Post-Launch)
- [ ] Parent portal (view incidents, sign forms)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] QuickBooks integration
- [ ] Multi-facility management
- [ ] White-label options
- [ ] Spanish language support
- [ ] Procare/Brightwheel integrations
- [ ] Advanced reporting & exports

### Phase 5: Scale 📅 (6-12 months post-launch)
- [ ] API for third-party integrations
- [ ] Franchise management features
- [ ] Custom training content creation
- [ ] AI-powered compliance predictions
- [ ] Automated inspection preparation
- [ ] Industry benchmarking
- [ ] State expansion (beyond Texas)

---

## 🐛 Known Issues & Bugs

### Critical (Must Fix Before Launch)
1. **Form submissions not saving** - All create/update operations across modules
2. **Filtering/sorting tabs not working** - Incidents, Documents, Medications
3. **Action buttons not functional** - View, Renew, Log Dose, Set Reminder

### Medium Priority
1. **No loading indicators** - User doesn't know when API calls are in progress
2. **No error messages** - Failed API calls silently fail
3. **No success confirmations** - User unsure if actions completed
4. **Token expiration handling** - No auto-refresh, user kicked out after 7 days

### Low Priority (Nice to Have)
1. **Empty states** - No friendly message when tables are empty
2. **Search functionality** - No search across staff, incidents, documents
3. **Bulk operations** - Can't select multiple items for batch actions
4. **Keyboard shortcuts** - No quick navigation
5. **Dark mode** - Only light theme available

---

## 📞 Contact & Support

**Product Owner:** [Guy Beveridge]
**Email:** [guy@guybeveridge.com]
**GitHub:** [https://github.com/gcbeveridge/shield-ops-childcare-TX)]

**For Developers:**
- Report bugs: GitHub Issues
- Submit PRs: Follow contribution guidelines
- Questions: Open Discussion thread

**For Users:**
- Support: support@shieldops.com
- Documentation: docs.shieldops.com
- Feature requests: feature-requests@shieldops.com

---

## 📄 License

[Specify your license - e.g., MIT, Proprietary, etc.]

---

## 🙏 Acknowledgments

- Texas Department of Family and Protective Services for minimum standards documentation
- Anthropic for Claude AI API
- Replit for development platform
- Open source community for libraries used

---

**Last Updated:** October 11, 2025
**Version:** 1.0 MVP
**Status:** In Development - Phase 2
