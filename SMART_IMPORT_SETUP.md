# Smart Import - Quick Setup Guide

## Installation Steps

### 1. Install Dependencies
```bash
cd backend
npm install
```

This will install:
- `xlsx` - Excel file parsing
- `express` - Web server (if not already installed)
- `multer` - File upload handling
- `cors`, `bcryptjs`, `jsonwebtoken` - Backend utilities

### 2. Set Environment Variable
Add to your `.env` file or Replit Secrets:
```bash
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

Get your API key from: https://console.anthropic.com/

### 3. Add Frontend Scripts
In `backend/public/index.html`, add before closing `</body>`:
```html
<script src="/js/smartImport.js"></script>
```

### 4. Load Modals
In your modal loading section of `app.js`, add:
```javascript
loadPartial('partials/modals/smartImportModals.html', 'modals-container');
```

### 5. Add Import Buttons

**Staff Page** (`backend/public/partials/screens/staff.html`):
```html
<button class="cac-btn cac-btn-primary" onclick="initSmartStaffImport()">
  🤖 Smart Import
</button>
```

**Medications Page** (`backend/public/partials/screens/medications.html`):
```html
<button class="cac-btn cac-btn-primary" onclick="initSmartMedicationImport()">
  🤖 Smart Import
</button>
```

### 6. Restart Server
```bash
node server.js
```

---

## Usage

### For Staff Import
1. Go to Staff page
2. Click "🤖 Smart Import" button
3. Upload ANY file (CSV, Excel, PDF, TXT)
4. Wait for AI parsing (5-15 seconds)
5. Review parsed data in verification screen
6. Edit any fields if needed
7. Remove incorrect rows
8. Click "✓ Import All"
9. Done! Staff appear in list

### For Medication Import
1. Go to Medications page
2. Click "🤖 Smart Import" button  
3. Upload medication roster/list
4. Review parsed medications
5. Edit/remove as needed
6. Click "✓ Import All"
7. Done! Medications appear in list

---

## Testing

### Test with Sample Data

**Create test-staff.csv:**
```csv
Name,Role,Email,Phone
Sarah Johnson,Lead Teacher,sarah@test.com,555-1234
Michael Chen,Assistant Teacher,mike@test.com,555-5678
```

**Create test-meds.csv:**
```csv
Child Name,Medication,Dosage,Frequency
Emma Rodriguez,Tylenol,5mg,twice daily
Marcus Thompson,Albuterol,2 puffs,as needed
```

Upload these files and verify the parsing works correctly!

---

## Troubleshooting

### "ANTHROPIC_API_KEY not found"
- Check your .env file or Replit Secrets
- Make sure it starts with `sk-ant-`
- Restart the server after adding

### "Module not found: xlsx"
- Run `npm install` in backend folder
- Check package.json has all dependencies

### "Parsing failed"
- Try a simpler file format (CSV)
- Check file isn't corrupted
- Try with smaller file first

### Buttons don't appear
- Check smartImport.js is loaded
- Look for errors in browser console
- Verify onclick handlers are defined

---

## Files Created

✅ `backend/controllers/smartImportController.js` - AI parsing logic  
✅ `backend/routes/smartImport.js` - API routes  
✅ `backend/public/js/smartImport.js` - Frontend JavaScript  
✅ `backend/public/partials/modals/smartImportModals.html` - UI modals  
✅ `backend/server.js` - Updated with new routes  
✅ `backend/package.json` - Updated dependencies  

---

## Next Steps

1. Install dependencies: `npm install`
2. Set ANTHROPIC_API_KEY
3. Add buttons to pages
4. Load scripts and modals
5. Restart server
6. Test with sample files
7. 🎉 You're ready!

---

## Support

The feature is fully functional and ready to use. If you encounter any issues:
1. Check console for errors
2. Verify API key is set
3. Test with simple CSV first
4. Check network tab for API responses
