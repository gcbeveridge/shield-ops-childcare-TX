# Smart Bulk Import - AI-Powered Data Extraction

**Status:** ✅ Complete  
**Date:** October 27, 2025

## Overview
Revolutionary bulk import feature that uses Claude AI to parse ANY file format and extract structured data. No templates required - just upload your existing files!

---

## Features

### 🤖 AI-Powered Parsing
- **Supported Formats:**
  - CSV files (.csv)
  - Excel spreadsheets (.xlsx, .xls)
  - PDF documents (.pdf)
  - Plain text files (.txt)
  - Future: Images with OCR

- **What It Does:**
  - Extracts staff or medication data from unstructured files
  - Handles messy formats, inconsistent columns, and varied layouts
  - Intelligently maps data to correct fields
  - Returns clean, structured JSON

### 📊 Smart Data Extraction

**For Staff:**
- Name (required)
- Role/Job Title
- Email address
- Phone number
- Certifications
- Hire date
- Status (active/inactive)

**For Medications:**
- Child name (required)
- Medication name (required)
- Dosage (required)
- Route of administration
- Frequency/Schedule
- Start/End dates
- Prescriber information
- Special instructions

### ✅ Verification Screen
- Editable table showing all parsed records
- Review and correct any errors before import
- Remove incorrect rows
- Add missing information
- Real-time field updates

---

## User Flow

### 1. Initiate Import
```
Staff Page → "Import Staff" button
  or
Medications Page → "Import Medications" button
```

### 2. Upload File
- File picker appears
- Select ANY supported file format
- No need to match a template!

### 3. AI Processing
- File uploads to server
- Claude API analyzes content
- Extracts structured data
- Processing modal shows progress

### 4. Verification
- Review parsed data in editable table
- Edit any fields inline
- Remove incorrect rows
- All changes update in real-time

### 5. Import
- Click "Import All"
- Bulk insert to Supabase
- Success message shows count
- Data appears immediately in list

---

## Technical Implementation

### Backend

**Controller:** `backend/controllers/smartImportController.js`

**Functions:**
- `parseFileWithAI()` - Main parsing endpoint
- `bulkImportStaff()` - Bulk insert staff records
- `bulkImportMedications()` - Bulk insert medication records

**Routes:** `backend/routes/smartImport.js`
```javascript
POST /api/facilities/:facilityId/smart-import/:importType
POST /api/facilities/:facilityId/bulk-import/staff
POST /api/facilities/:facilityId/bulk-import/medications
```

**Dependencies:**
- `@anthropic-ai/sdk` - Claude API client
- `xlsx` - Excel parsing
- `papaparse` - CSV parsing
- `pdf-parse` - PDF text extraction

### Frontend

**JavaScript:** `backend/public/js/smartImport.js`

**Functions:**
- `initSmartStaffImport()` - Start staff import
- `initSmartMedicationImport()` - Start medication import
- `handleSmartImportFile()` - Process file upload
- `showVerificationScreen()` - Display parsed data
- `confirmSmartImport()` - Execute bulk import

**Modals:** `backend/public/partials/modals/smartImportModals.html`
- Processing modal with spinner
- Verification modal with editable table

---

## AI Prompts

### Staff Parsing Prompt
```
You are an expert data extraction AI for childcare facilities. 
Extract staff information from the provided data and return a JSON array.

Each staff member object should have these fields:
- name (string, required): Full name
- role (string, required): Job title
- email (string, optional): Email address
- phone (string, optional): Phone number
- certifications (array, optional): Certifications
- hireDate (string, optional): YYYY-MM-DD
- status (string): "active" or "inactive"

Return ONLY valid JSON array. No markdown, no explanation.
```

### Medication Parsing Prompt
```
You are an expert data extraction AI for childcare medication tracking.
Extract medication authorization information and return a JSON array.

Each medication object should have these fields:
- childName (string, required): Child's full name
- medicationName (string, required): Medication name
- dosage (string, required): Dosage amount
- route (string, required): Administration route
- frequency (string, required): Frequency
- startDate, endDate (optional): YYYY-MM-DD
- prescribedBy (optional): Prescriber name
- specialInstructions (optional): Instructions

Return ONLY valid JSON array. No markdown, no explanation.
```

---

## Error Handling

**File Upload Errors:**
- Unsupported format → Clear message with supported formats
- File too large → Size limit message
- Network error → Retry suggestion

**AI Parsing Errors:**
- Invalid JSON → Show raw response for debugging
- Empty results → "No data found" message
- API error → Fallback to manual entry

**Bulk Import Errors:**
- Individual row failures tracked
- Success/fail count reported
- Error details for each failure
- Successful rows still imported

---

## Configuration

### Environment Variables Required
```bash
ANTHROPIC_API_KEY=sk-ant-...
```

### File Upload Limits
- Max file size: 10MB (configurable in multer)
- Supported MIME types in controller

---

## UI Integration

### Staff Page Integration
```javascript
// Add button to staff page
<button class="cac-btn cac-btn-primary" onclick="initSmartStaffImport()">
  🤖 Smart Import
</button>
```

### Medications Page Integration
```javascript
// Add button to medications page
<button class="cac-btn cac-btn-primary" onclick="initSmartMedicationImport()">
  🤖 Smart Import
</button>
```

### Include Scripts in index.html
```html
<script src="/js/smartImport.js"></script>
```

### Load Modals
```javascript
// Load smart import modals
loadPartial('partials/modals/smartImportModals.html', 'modals-container');
```

---

## Benefits

### For Users
✅ No template required - use existing files  
✅ Handles messy, inconsistent data  
✅ Saves hours of manual data entry  
✅ Review before import (no surprises)  
✅ Works with PDFs, Excel, CSV, text  

### For Business
✅ Major competitive advantage  
✅ Unique selling point  
✅ Aligns with "AI-powered" branding  
✅ Reduces onboarding friction  
✅ Professional, modern UX  

---

## Usage Examples

### Example 1: Excel Staff Roster
```
Input: Random Excel file with columns:
- Employee Name
- Position
- Contact Info
- Hire Date (various formats)

Output: Clean JSON with:
- name: "Sarah Johnson"
- role: "Lead Teacher"
- email: "sarah@example.com"
- phone: "(555) 123-4567"
- hireDate: "2023-05-15"
```

### Example 2: PDF Medication List
```
Input: PDF with text like:
"Emma needs Tylenol 5mg twice daily for fever..."

Output: Structured JSON:
- childName: "Emma"
- medicationName: "Tylenol"
- dosage: "5mg"
- frequency: "twice daily"
- specialInstructions: "for fever"
```

### Example 3: CSV with Mixed Formats
```
Input: CSV with various column names:
- "Full Name", "Name", "Employee"
- "Job", "Role", "Position"
- Inconsistent data formats

Output: Normalized to standard schema
```

---

## Testing

### Test Files Needed
1. ✅ Clean CSV with proper headers
2. ✅ Messy Excel with random column names
3. ✅ PDF roster from existing facility
4. ✅ Text file with staff list
5. ✅ File with incomplete data

### Test Scenarios
- ✅ Upload supported format → Success
- ✅ Upload unsupported format → Clear error
- ✅ Parse clean data → All fields correct
- ✅ Parse messy data → AI handles well
- ✅ Edit in verification → Changes persist
- ✅ Remove rows → Not imported
- ✅ Bulk import → All succeed
- ✅ Partial failure → Error details shown

## Cost Considerations

### Claude API Pricing
- Model: claude-4-1-sonnet-20251022
- ~$3 per million input tokens
- ~$15 per million output tokens

### Typical Usage
- Small file (100 rows): ~$0.01
- Medium file (500 rows): ~$0.05
- Large file (1000+ rows): ~$0.10

Very cost-effective for the value provided!

---

## Maintenance

### Regular Updates
- Monitor Claude API changes
- Update prompts based on user feedback
- Add new file format support
- Improve error messages
- Optimize token usage

### Monitoring
- Track parsing success rate
- Log failed extractions
- Monitor API costs
- Collect user feedback

---

## Status: ✅ Ready for Production

**What's Working:**
- ✅ AI parsing for CSV, Excel, PDF, TXT
- ✅ Verification screen with edit capability
- ✅ Bulk import to Supabase
- ✅ Error handling and user feedback
- ✅ Clean, modern UI

## Support

For questions or issues:
- Check logs for detailed error messages
- Review AI response in console
- Test with simpler file first
- Contact: Support team
