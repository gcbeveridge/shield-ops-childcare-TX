# Routing System Implementation Plan

**Date:** October 21, 2025  
**Goal:** Implement proper routing for Shield Ops with separate URLs for each page

## Current State

**Problem:** 
- All pages accessible at single URL: `http://localhost:5000/`
- No browser history navigation
- Can't bookmark specific pages
- No direct links to specific sections

## Proposed URL Structure

```
/ or /dashboard              → Dashboard (Home)
/staff                       → Staff Management
/staff/new                   → Add New Staff
/staff/:id                   → View/Edit Staff Member

/documents                   → Document Vault
/documents/upload            → Upload Document
/documents/:id               → View Document

/medications                 → Medication Tracking
/medications/new             → Add New Medication
/medications/:id/administer  → Administer Medication

/incidents                   → Incident Reports
/incidents/new               → New Incident Report
/incidents/:id               → View Incident

/training                    → Training Hub
/training/:moduleId          → Training Module Details

/compliance                  → Compliance Checklist
/checklist                   → Daily Checklist

/settings                    → Settings
/profile                     → User Profile
```

## Implementation Approach

### Option 1: Hash-Based Routing (Simplest)
```
http://localhost:5000/#/dashboard
http://localhost:5000/#/staff
http://localhost:5000/#/documents
```

**Pros:**
- No server configuration needed
- Works immediately
- Backward compatible
- Simple to implement

**Cons:**
- URLs have `#` symbol
- Less SEO friendly (not critical for internal app)

### Option 2: History API Routing (Modern)
```
http://localhost:5000/dashboard
http://localhost:5000/staff
http://localhost:5000/documents
```

**Pros:**
- Clean URLs
- Professional appearance
- Better UX

**Cons:**
- Requires server configuration (catch-all route)
- Need to handle page refreshes

## Recommended: Option 1 (Hash-Based) with Migration Path

Start with hash-based routing for immediate implementation, with option to upgrade to History API later.

## Implementation Steps

### 1. Create Router Module (`js/router.js`)
- URL parsing
- Route matching
- Navigation functions
- History management

### 2. Define Route Configuration
- Map routes to screens
- Define data loading functions
- Handle route parameters

### 3. Update Navigation
- Replace `onclick="showScreen()"` with proper links
- Add route change listeners
- Update active state based on route

### 4. Handle Browser Navigation
- Back button support
- Forward button support
- Refresh handling

### 5. Add Route Guards
- Authentication checks
- Redirect to login if not authenticated
- Preserve intended destination

## File Structure

```
backend/public/
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── app.js           (main application code)
    ├── router.js        (NEW - routing system)
    └── routes.js        (NEW - route definitions)
```

## Code Structure

### router.js
```javascript
class Router {
    constructor(routes) {
        this.routes = routes;
        this.currentRoute = null;
        this.init();
    }

    init() {
        // Listen for hash changes
        window.addEventListener('hashchange', () => this.handleRouteChange());
        // Handle initial load
        this.handleRouteChange();
    }

    handleRouteChange() {
        const hash = window.location.hash.slice(1) || '/dashboard';
        this.navigate(hash);
    }

    navigate(path) {
        const route = this.matchRoute(path);
        if (route) {
            this.currentRoute = route;
            route.handler(route.params);
            window.location.hash = path;
        }
    }

    matchRoute(path) {
        // Route matching logic
    }
}
```

### routes.js
```javascript
const routes = [
    {
        path: '/dashboard',
        screen: 'dashboard',
        handler: async () => {
            showScreen('dashboard');
            await loadDashboardData();
        }
    },
    {
        path: '/staff',
        screen: 'staff',
        handler: async () => {
            showScreen('staff');
            await loadStaffList();
        }
    },
    // ... more routes
];
```

## Benefits

### User Experience
- ✅ Bookmarkable pages
- ✅ Browser back/forward buttons work
- ✅ Share direct links to pages
- ✅ Professional URL structure
- ✅ Better navigation UX

### Developer Experience
- ✅ Organized code structure
- ✅ Easy to add new routes
- ✅ Centralized navigation logic
- ✅ Better debugging (see current route in URL)

### SEO & Analytics
- ✅ Track page views properly
- ✅ Better analytics data
- ✅ Clearer user flow tracking

## Migration Strategy

### Phase 1: Implement Hash Routing
1. Create router.js
2. Define routes
3. Update navigation to use router
4. Test all pages

### Phase 2: Add Route Parameters
1. Staff detail pages
2. Document viewer
3. Incident details

### Phase 3: (Optional) Upgrade to History API
1. Update router to use pushState
2. Configure server catch-all route
3. Test and deploy

## Server Configuration (For History API)

**In `backend/server.js`:**
```javascript
// Serve index.html for all non-API routes
app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
    }
});
```

## Testing Plan

1. **Navigation Tests**
   - Click each menu item
   - Verify URL updates
   - Verify correct screen shows

2. **Browser Navigation**
   - Click back button
   - Click forward button
   - Refresh page

3. **Direct URL Access**
   - Type URL directly
   - Share link and open
   - Bookmark and reopen

4. **Edge Cases**
   - Invalid routes (404)
   - Unauthorized access
   - Missing data

## Next Steps

1. Create router.js file
2. Create routes.js file
3. Update index.html to include new scripts
4. Update navigation HTML to use links
5. Test routing functionality
6. Update documentation

---

**Status:** Ready to implement  
**Estimated Time:** 1-2 hours  
**Complexity:** Medium  
**Priority:** High (Better UX)
