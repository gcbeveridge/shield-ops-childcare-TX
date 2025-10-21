# HTML Modularization Plan

## Goal
Separate the monolithic `index.html` file into smaller, modular HTML files that can be loaded dynamically.

## File Structure

```
backend/public/
├── index.html (main shell)
├── partials/
│   ├── sidebar.html
│   ├── auth/
│   │   ├── login.html
│   │   └── signup.html
│   ├── screens/
│   │   ├── dashboard.html
│   │   ├── staff.html
│   │   ├── documents.html
│   │   ├── medication.html
│   │   ├── incidents.html
│   │   ├── training.html
│   │   ├── compliance.html
│   │   └── checklist.html
│   ├── modals/
│   │   ├── staff-modals.html
│   │   ├── document-modals.html
│   │   ├── medication-modals.html
│   │   ├── incident-modals.html
│   │   └── common-modals.html
│   └── ai-chat.html
```

## Implementation Strategy

1. **Create partials directory structure**
2. **Extract sidebar** → `partials/sidebar.html`
3. **Extract auth screens** → `partials/auth/login.html` & `partials/auth/signup.html`
4. **Extract main screens** → `partials/screens/*.html`
5. **Extract modals** → `partials/modals/*.html`
6. **Extract AI chat** → `partials/ai-chat.html`
7. **Create HTML loader utility** in `js/htmlLoader.js`
8. **Update index.html** to be a shell that loads partials
9. **Update router** to load screen partials dynamically

## Benefits

✅ **Maintainability** - Each section in its own file
✅ **Reusability** - Partials can be reused across different pages
✅ **Collaboration** - Multiple developers can work on different files
✅ **Performance** - Can implement lazy loading for unused sections
✅ **Debugging** - Easier to find and fix issues in specific sections
✅ **Version Control** - Cleaner git diffs

## Loading Strategy

- **Static load (on page load)**: Sidebar, auth screens
- **Dynamic load (on demand)**: Main screens, modals
- **Cached after first load**: Prevent re-fetching

## Next Steps

1. Create directory structure
2. Extract and create partial files
3. Build HTML loader utility
4. Update index.html
5. Test loading and routing
