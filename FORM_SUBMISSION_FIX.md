# Form Submission Database Persistence Fix

## Issue Identified
Forms (Staff, Medications) appeared to work in the UI but data wasn't persisting to Supabase.

**Error:** `null value in column "id" of relation "staff" violates not-null constraint`

## Root Cause
The database schema was using `uuid_generate_v4()` which requires the `uuid-ossp` extension, but the extension may not have been properly enabled or the default values weren't set correctly on the table columns.

## Solution Applied

### 1. Updated Schema File
Updated `backend/config/schema-supabase.sql` to use `gen_random_uuid()` instead of `uuid_generate_v4()`:
- `gen_random_uuid()` is native to PostgreSQL 13+ (which Supabase uses)
- Does not require any extensions
- More reliable and performant

### 2. Created Fix Script
Created `backend/scripts/fix-uuid-generation.sql` to update existing tables with the correct UUID defaults.

## How to Apply the Fix

### Option 1: Run SQL Fix Script in Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `backend/scripts/fix-uuid-generation.sql`
4. Paste and run the script
5. Verify the changes in the output

### Option 2: Recreate Tables with Updated Schema (Clean Slate)
⚠️ **WARNING: This will delete all existing data!**

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy the contents of `backend/config/schema-supabase.sql`
4. Paste and run the script
5. Run the seed script if needed: `POST http://localhost:5000/api/seed`

## Testing the Fix

After applying the fix, test the following:

### Test Staff Form:
1. Navigate to Staff Management
2. Click "Add Staff Member"
3. Fill in all required fields:
   - Name
   - Role
   - Email
   - Hire Date
4. Submit the form
5. Verify staff appears in the list
6. **Check Supabase dashboard** - staff table should have the new record
7. Refresh the browser - staff member should still be visible

### Test Medication Form:
1. Navigate to Medication Tracking
2. Click "New Authorization"
3. Fill in all required fields
4. Submit the form
5. Verify medication appears in the list
6. **Check Supabase dashboard** - medications table should have the new record
7. Refresh the browser - medication should still be visible

## Changes Made

### Files Updated:
1. ✅ `backend/config/schema-supabase.sql` - Changed all `uuid_generate_v4()` to `gen_random_uuid()`
2. ✅ `backend/scripts/fix-uuid-generation.sql` - Created fix script for existing databases

### Tables Fixed:
- ✅ facilities
- ✅ users
- ✅ staff
- ✅ incidents
- ✅ medications
- ✅ medication_logs
- ✅ compliance_items
- ✅ daily_checklists
- ✅ training_modules
- ✅ training_completions
- ✅ documents

## Expected Behavior After Fix
- Forms submit successfully
- Data persists to Supabase tables
- Records remain after page refresh
- No "null value in column id" errors
- UUID values are automatically generated for all new records

## Verification Query
Run this in Supabase SQL Editor to verify the fix:

```sql
SELECT 
  table_name, 
  column_name, 
  column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND column_name = 'id'
  AND table_name IN (
    'staff', 'facilities', 'users', 'incidents', 'medications', 
    'medication_logs', 'compliance_items', 'daily_checklists', 
    'training_modules', 'training_completions', 'documents'
  )
ORDER BY table_name;
```

Expected output should show `gen_random_uuid()` as the default for all `id` columns.
