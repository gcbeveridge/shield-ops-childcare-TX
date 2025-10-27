# CSV Import Templates & Smart Import Samples

This folder contains CSV templates for bulk importing data into Shield Ops, plus sample files for testing the AI-powered Smart Import feature.

## 📋 Available Templates

### 1. Staff Import (`staff-import-template.csv`)

**Required Columns:**
- Name (required)
- Email (required)
- Role (required)
- Hire Date (required, format: YYYY-MM-DD)

**Optional Columns:**
- CPR Expiration (format: YYYY-MM-DD)
- First Aid Expiration (format: YYYY-MM-DD)
- CDA Number
- CDA Expiration (format: YYYY-MM-DD)
- Teaching Cert Number
- Teaching Cert Expiration (format: YYYY-MM-DD)
- Food Handler Number
- Food Handler Expiration (format: YYYY-MM-DD)
- Background Check Status (Clear/Pending/Flagged)
- TB Screening Status (Complete/Pending)

**Example:**
```csv
Name,Email,Role,Hire Date,CPR Expiration,First Aid Expiration
Sarah Johnson,sarah@example.com,Lead Teacher,2024-01-15,2025-12-31,2025-12-31
```

---

### 2. Medications Import (`medications-import-template.csv`)

**Required Columns:**
- Child Name (required)
- Medication Name (required)
- Dosage (required)
- Frequency (required)
- Route (required: Oral/Injection/Topical/Inhalation)
- Start Date (required, format: YYYY-MM-DD)
- End Date (required, format: YYYY-MM-DD)
- Prescriber Name (required)
- Prescriber Phone (required)

**Optional Columns:**
- Special Instructions
- Allergies

**Texas Compliance:**
- End Date must not exceed 1 year from Start Date (§746.2653)

**Example:**
```csv
Child Name,Medication Name,Dosage,Frequency,Route,Start Date,End Date,Prescriber Name,Prescriber Phone
Emma Thompson,Amoxicillin,250mg,Three times daily,Oral,2025-01-15,2025-01-25,Dr. Sarah Smith,(512) 555-0123
```

---

### 3. Incidents Import (`incidents-import-sample.csv`)

**Sample file for testing Smart Import feature.**

**Columns:**
- Child Name (required)
- Age (optional)
- Type (injury/illness/behavior/other)
- Severity (minor/moderate/major/critical)
- Date (YYYY-MM-DD format)
- Time (HH:MM format)
- Location
- Description (required)
- Action Taken
- Witnesses (comma-separated)
- Staff Involved (comma-separated)

**Example:**
```csv
Child Name,Age,Type,Severity,Date,Time,Location,Description,Action Taken
Emma Rodriguez,4,injury,minor,2025-10-27,10:30,Playground,Child fell from slide...
```

---

## 🤖 Smart Import Sample Files

### Text Format Samples
- `incidents-import-sample.txt` - Incident reports in plain text format
- `medications-import-sample.txt` - Medication authorizations in plain text format

These files demonstrate how the AI-powered Smart Import can extract structured data from unstructured text, PDFs, or any format!

---

## 🚀 How to Use

### 1. Download Template
- Download the appropriate template from this folder
- Open in Excel, Google Sheets, or any spreadsheet application

### 2. Fill in Your Data
- Follow the column format exactly (case-sensitive)
- Use the date format YYYY-MM-DD (e.g., 2025-01-15)
- Leave optional columns blank if not applicable
- Do not add extra columns

### 3. Save as CSV
- File → Save As → CSV (Comma delimited) (*.csv)
- Make sure to save as `.csv`, not `.xlsx`

### 4. Import in Shield Ops
- Go to the appropriate section (Staff Management or Medication Tracking)
- Click the "Import CSV" button
- Drag and drop your CSV file or click to browse
- Review the preview
- Confirm the import

---

## ⚠️ Common Issues

### Invalid Date Format
❌ Wrong: `01/15/2025`, `Jan 15, 2025`  
✅ Correct: `2025-01-15`

### Missing Required Fields
- Every row must have all required fields filled
- Empty required fields will cause the import to fail

### Duplicate Emails (Staff)
- Staff email addresses must be unique
- Duplicate emails will be rejected

### Medication Authorization Period (Texas)
- Maximum 1 year authorization per Texas §746.2653
- End Date - Start Date must be ≤ 365 days

### Special Characters
- Avoid special characters in CSV files
- Use plain text for names and descriptions

---

## 📊 Validation Rules

### Staff Import
- **Email:** Must be valid email format
- **Hire Date:** Cannot be in the future
- **Certification Dates:** Must be valid dates or empty
- **Background Check:** Must be "Clear", "Pending", or "Flagged"
- **TB Screening:** Must be "Complete" or "Pending"

### Medications Import
- **Route:** Must be Oral, Injection, Topical, or Inhalation
- **Start Date:** Cannot be more than 30 days in the past
- **End Date:** Must be after Start Date
- **Duration:** Maximum 1 year (365 days)
- **Phone:** Must be valid phone format

---

## 💡 Tips

1. **Test with Small Files First**
   - Import 2-3 rows to verify format
   - Then import your full dataset

2. **Keep a Backup**
   - Save your original data before importing
   - You can always re-import if needed

3. **Review Before Confirming**
   - The preview screen shows any errors
   - Fix errors before confirming import

4. **Download Error Reports**
   - If some rows fail, download the error report
   - Fix the issues and re-import only failed rows

---

## 🔄 Updates

**Version 1.0** (Phase 2)
- Initial templates for Staff and Medications
- Texas compliance validation included

**Future Templates:**
- Training modules import
- Compliance items import
- Document metadata import

---

## 📞 Support

If you encounter issues with CSV imports:
1. Check the validation rules above
2. Review your CSV file format
3. Try importing with a smaller sample first
4. Contact support if the issue persists

---

**Shield Ops - Child Care Compliance Platform**  
**Phase 2: CSV Bulk Import System**
