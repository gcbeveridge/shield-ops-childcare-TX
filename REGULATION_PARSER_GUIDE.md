# Texas Regulations Parser & Shield AI Enhancement Guide

## 🎯 What This Does

This system parses the Texas DFPS Minimum Standards PDF and uploads individual regulation sections to Supabase, enabling Shield AI to provide answers backed by real Texas regulations instead of hardcoded knowledge.

## ✅ Prerequisites Completed

- ✅ PDF parser installed (pdf-parse)
- ✅ Parser script created (`backend/scripts/parse-texas-manual.js`)
- ✅ Enhanced Shield AI service created (`backend/services/aiService-supabase.js`)
- ✅ Supabase schema for regulations created (`backend/config/schema-regulations-supabase.sql`)
- ✅ NPM script added (`npm run parse:manual`)

## 📋 Setup Steps

### Step 1: Create Regulation Tables in Supabase

1. **Go to your Supabase Dashboard**
   - Navigate to https://app.supabase.com
   - Select your Shield Ops project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Run the Regulation Schema**
   - Open the file: `backend/config/schema-regulations-supabase.sql`
   - Copy the entire contents
   - Paste into the Supabase SQL Editor
   - Click "Run" or press Ctrl+Enter

4. **Verify Tables Were Created**
   - Go to "Table Editor" in the left sidebar
   - You should see 3 new tables:
     - **regulation_sections** - Individual regulation sections from PDF
     - **state_regulations** - Quick reference for common topics
     - **regulation_quick_refs** - Common questions mapped to regulations

### Step 2: Parse the Texas Manual PDF

The PDF file is already in place at: `backend/data/texas-minimum-standards.pdf`

**Run the parser:**

```bash
cd backend
npm run parse:manual
```

**Expected Output:**

```
📖 Reading Texas Minimum Standards PDF...

📄 Pages: XX
📝 Total text length: XXXXX characters

🔍 Found XX regulation sections

✅ §746.1201: Director Qualifications (Staff Requirements)
✅ §746.1301: Background Checks (Staff Requirements)
✅ §746.2655: Medication Administration (Medication Administration)
... (continues for all sections)

📦 Uploading XX sections to Supabase...

✅ Uploaded batch 1 (50 sections)
✅ Uploaded batch 2 (50 sections)
... (continues until all uploaded)

📊 Upload Summary:
   ✅ Success: XX
   ❌ Errors: 0

✅ Parse complete!
```

### Step 3: Verify Regulations in Supabase

1. **Check Data in Supabase Dashboard**
   - Go to "Table Editor"
   - Click on `regulation_sections` table
   - You should see rows with:
     - `code_section` (e.g., "§746.2655")
     - `title` (e.g., "Medication Administration")
     - `category` (e.g., "Medication Administration")
     - `full_text` (complete regulation text)
     - `summary` (first 200 characters)

2. **Sample Query to Test**
   - Go to SQL Editor
   - Run: `SELECT code_section, title, category FROM regulation_sections LIMIT 10;`
   - Verify data looks correct

### Step 4: Switch Shield AI to Use Supabase (OPTIONAL)

⚠️ **Note:** This step is optional. Your current Shield AI will continue working with the hardcoded knowledge base unless you make this change.

**To enable Supabase-powered Shield AI:**

1. **Update the AI route to use the enhanced service:**

   Edit `backend/routes/ai.js`:

   Find this line:
   ```javascript
   const aiService = require('../services/aiService');
   ```

   Replace with:
   ```javascript
   const aiService = require('../services/aiService-supabase');
   ```

2. **Restart your server**
   - The server will automatically restart if you're using workflows
   - Or manually restart with your run command

3. **Test Shield AI**
   - Open Shield Ops
   - Click the Shield AI chat button
   - Ask a question like: "What are the medication administration requirements?"
   - The response should now include specific regulation codes from the database

## 📊 What Gets Parsed

The parser extracts:

| Data Field | Description | Example |
|------------|-------------|---------|
| code_section | Regulation code | §746.2655 |
| title | Section title | Medication Administration |
| category | Auto-categorized topic | Medication Administration |
| full_text | Complete regulation text | Full text from PDF (up to 10,000 chars) |
| summary | First paragraph/200 chars | Brief excerpt for quick reference |

## 🗂️ Categories Auto-Assigned

Based on regulation code ranges:

- **§746.1201-1400**: Staff Requirements
- **§746.1401-1700**: Staff Training
- **§746.1701-2100**: Child/Staff Ratios
- **§746.2101-2400**: Health & Safety
- **§746.2401-2700**: Daily Operations
- **§746.2651-2700**: Medication Administration
- **§746.2701-3000**: Nutrition
- **§746.3001-3500**: Physical Environment
- **§746.3701-4000**: Incident Reporting
- **§744.xxxx**: Additional child care regulations

## 🔄 Re-running the Parser

Safe to run multiple times! The parser uses `upsert`, so:
- ✅ Updates existing regulations
- ✅ Adds new ones
- ✅ Won't create duplicates

To re-run:
```bash
cd backend
npm run parse:manual
```

## 🤖 Enhanced Shield AI Features

Once you switch to `aiService-supabase.js`, Shield AI will:

1. **Search Database for Relevant Regulations**
   - Queries Supabase based on user's question
   - Finds up to 10 most relevant regulation sections
   - Uses full-text search on titles, categories, and regulation text

2. **Provide Source Citations**
   - Responses include `sources` array with regulation codes
   - Frontend can display these as references
   - Example: `{ code: "§746.2655", title: "Medication Administration", category: "..." }`

3. **Dynamic Knowledge Base**
   - No more hardcoded regulations
   - Easy to update - just re-run the parser
   - Supports future PDF updates

4. **Fallback Gracefully**
   - If Supabase query fails, uses basic knowledge
   - Never crashes - always provides an answer

## 🎨 Frontend Integration (Future Enhancement)

To display sources in the UI, update the Shield AI chat widget to show:

```javascript
// In the AI response handler:
if (response.sources && response.sources.length > 0) {
  // Display sources
  response.sources.forEach(source => {
    console.log(`📖 ${source.code}: ${source.title}`);
  });
}
```

## 🛠️ Troubleshooting

### Issue: Parser finds 0 sections

**Solution:**
- The PDF may use a different format
- Check the first 500 characters of the PDF (shown in error output)
- Adjust the regex pattern in `parse-texas-manual.js` if needed

### Issue: Supabase upload errors

**Solution:**
1. Verify Supabase credentials in Replit Secrets
2. Check that regulation tables exist in Supabase
3. Review error messages for specific table/column issues

### Issue: Shield AI not using regulations

**Solution:**
1. Verify you switched to `aiService-supabase.js` in `routes/ai.js`
2. Check that regulations exist in Supabase (`SELECT COUNT(*) FROM regulation_sections`)
3. Test the search query manually in Supabase SQL Editor

## 📝 Files Created

| File | Purpose |
|------|---------|
| `backend/config/schema-regulations-supabase.sql` | Supabase table definitions |
| `backend/scripts/parse-texas-manual.js` | PDF parser script |
| `backend/services/aiService-supabase.js` | Enhanced AI service with Supabase |
| `REGULATION_PARSER_GUIDE.md` | This guide |

## ✅ Success Criteria

Migration is successful when:
- [  ] Regulation tables created in Supabase
- [  ] Parser runs without errors
- [  ] Regulations visible in Supabase Table Editor
- [  ] Shield AI responds with regulation citations (if switched)

---

**Questions?** Check Supabase dashboard or review parser logs for details.
