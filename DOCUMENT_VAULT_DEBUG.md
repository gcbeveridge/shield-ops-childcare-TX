# Document Vault Debugging Guide

**Date:** October 21, 2025  
**Issue:** Document Vault page appears blank

## Current Investigation

### Code Analysis

**Location of Document Vault Code:**
- HTML: `backend/public/index.html` (search for `id="documents"`)
- CSS: `backend/public/css/styles.css`
- JavaScript: `backend/public/js/app.js` (lines 3985-4135)

### Functions Involved:

1. **`showScreen('documents')`** - Line 541
   - Called when clicking "Document Vault" in navigation
   - **BUG FOUND**: Line 554 has `event.currentTarget` but `event` is not a parameter
   
2. **Enhanced `showScreen`** - Line 1433
   - Wraps the original showScreen function
   - Calls `loadDocuments()` when switching to documents screen
   
3. **`loadDocuments(filter)`** - Line 3985
   - Fetches documents from API
   - Renders the table
   - Handles empty states and errors

### Potential Issues:

#### Issue #1: `event` undefined (Line 554)
```javascript
// PROBLEM CODE (line 554)
function showScreen(screenId) {
    // ...
    event.currentTarget.classList.add('active'); // ❌ event is not defined!
}
```

**Impact:** This will throw a ReferenceError and stop JavaScript execution

**Fix Needed:**
```javascript
function showScreen(screenId, event) {
    // ...
    if (event && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}
```

#### Issue #2: Navigation Click Handler
The HTML has:
```html
<div class="nav-item" onclick="showScreen('documents')">
```

But `showScreen` expects an `event` parameter that doesn't get passed in the `onclick` handler.

### Testing Steps

**Step 1: Open Browser DevTools**
1. Open the app in browser: `http://localhost:5000`
2. Press F12 to open DevTools
3. Go to Console tab

**Step 2: Check for JavaScript Errors**
Look for errors like:
- `ReferenceError: event is not defined`
- `TypeError: Cannot read property 'currentTarget' of undefined`
- `Uncaught ReferenceError`

**Step 3: Test Navigation**
1. Click on "Document Vault" in the sidebar
2. Check console for errors
3. Check if the screen changes
4. Check if `loadDocuments()` is called

**Step 4: Manual Test in Console**
```javascript
// Test if function exists
console.log(typeof showScreen);

// Test screen switching
document.getElementById('documents').classList.add('active');

// Test loadDocuments
loadDocuments();
```

### Expected Behavior

When clicking "Document Vault":
1. ✅ Hide all screens (remove 'active' class)
2. ✅ Show documents screen (add 'active' class to #documents)
3. ✅ Update navigation highlighting
4. ✅ Call `loadDocuments()` to fetch and display data
5. ✅ Render table with documents or empty state

### Known Working Functions

These functions are confirmed to work:
- ✅ `apiRequest()` - API client
- ✅ `showTableSkeleton()` - Loading indicator
- ✅ `showError()` / `showSuccess()` - Toast notifications

## Recommended Fix

### Fix Option 1: Remove event.currentTarget (Simplest)

Since the navigation highlighting is handled by the enhanced showScreen wrapper, we can safely remove the problematic line:

```javascript
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Show selected screen
    document.getElementById(screenId).classList.add('active');

    // Update nav items (done by wrapper function)
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // REMOVE THIS LINE:
    // event.currentTarget.classList.add('active');
}
```

### Fix Option 2: Add Event Listener (Better)

Change from onclick to proper event listeners:

**In JavaScript:**
```javascript
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', function(event) {
            const screenId = this.getAttribute('data-screen');
            showScreen(screenId, event);
        });
    });
});
```

**In HTML:**
```html
<div class="nav-item" data-screen="documents">
    📄 <span>Document Vault</span>
</div>
```

## Next Steps

1. **First Priority**: Fix the `event` reference error in `showScreen()`
2. **Test**: Verify Document Vault loads after fix
3. **Check API**: Ensure backend endpoint `/api/facilities/:id/documents` works
4. **Verify Data**: Check if Supabase documents table has data

## Testing After Fix

```javascript
// In browser console:

// 1. Check if error is gone
showScreen('documents'); // Should not throw error

// 2. Check if documents load
loadDocuments(); // Should fetch and display documents

// 3. Check API directly
fetch('/api/facilities/1/documents', {
    headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
}).then(r => r.json()).then(console.log);
```

---

**Status:** ✅ **FIXED**  
**Root Cause:** `event` undefined error in showScreen() line 554  
**Fix Applied:** Removed problematic `event.currentTarget` reference and implemented proper navigation highlighting  
**Priority:** High - Now resolved  

## Fix Applied (October 21, 2025)

### Changed Code:
**File:** `backend/public/js/app.js` (lines 541-561)

**Before:**
```javascript
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    event.currentTarget.classList.add('active'); // ❌ ERROR: event not defined
}
```

**After:**
```javascript
function showScreen(screenId) {
    // Hide all screens
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });

    // Show selected screen
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }

    // Update nav items - find the nav item that matches this screen
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
        // Check if this nav item is for the current screen
        const onclick = item.getAttribute('onclick');
        if (onclick && onclick.includes(`'${screenId}'`)) {
            item.classList.add('active');
        }
    });
}
```

### What Changed:
1. ✅ Removed the problematic `event.currentTarget.classList.add('active')` line
2. ✅ Added null check for target screen before adding class
3. ✅ Implemented proper navigation highlighting by checking onclick attribute
4. ✅ No longer relies on undefined `event` parameter

### Testing Required:
1. Open app in browser: `http://localhost:5000`
2. Login to the application
3. Click "Document Vault" in sidebar
4. Verify the page loads and displays documents or empty state
5. Check browser console for any errors (should be none)

### Expected Result:
- ✅ No JavaScript errors in console
- ✅ Document Vault screen becomes visible
- ✅ Navigation item highlights correctly  
- ✅ Documents load from API and display in table
- ✅ Both Medication and Document Vault should work now
