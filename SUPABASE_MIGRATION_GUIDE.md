# Shield Ops - Supabase Migration Guide

## 🎯 What This Migration Does

**This is a DATA MIGRATION ONLY** - It copies all your data from the current PostgreSQL (Neon) database to Supabase PostgreSQL. Your application will continue using the current database unless you explicitly switch it later.

### What Happens:
✅ All data copied to Supabase  
✅ Current app keeps working unchanged  
✅ No downtime or disruption  
✅ Safe to run - doesn't modify current database  

### What Doesn't Happen:
❌ App doesn't automatically switch to Supabase  
❌ Current database is NOT modified or deleted  
❌ No code changes to your application  

## ✅ Prerequisites Completed

The following migration components are ready:

- ✅ Supabase client installed (@supabase/supabase-js)
- ✅ Supabase configuration created (`backend/config/supabase.js`)
- ✅ Supabase-optimized schema created (`backend/config/schema-supabase.sql`)
- ✅ Migration script created (`backend/scripts/migrate-to-supabase.js`)
- ✅ Migration command added to package.json (`npm run migrate:supabase`)

## 📊 Schema Compatibility

The Supabase schema matches your current database EXACTLY:
- Same 11 tables with identical column names
- Same data types: TIMESTAMP (without timezone), VARCHAR, JSONB, etc.
- Same constraints and nullability rules
- Enhancement: Added UUID auto-generation with uuid_generate_v4() for new records
- All existing data will migrate without any modifications or transformations

## 📋 Migration Steps

### Step 1: Set Up Supabase Database Schema

⚠️ **IMPORTANT**: Run this schema ONLY on a fresh/empty Supabase database. The schema contains DROP TABLE statements that will destroy existing data!

1. **Verify Supabase Database is Empty**
   - Navigate to https://app.supabase.com
   - Select your project
   - Go to "Table Editor" in the left sidebar
   - **Confirm there are NO tables** (or only tables you're okay deleting)
   - ⛔ **STOP HERE if you have existing data you want to keep!**

2. **Open the SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Copy and Run the Schema**
   - Open the file: `backend/config/schema-supabase.sql`
   - Read the warnings at the top of the file
   - Copy the entire contents
   - Paste into the Supabase SQL Editor
   - **Double-check you're in the correct database/project**
   - Click "Run" or press Ctrl+Enter

4. **Verify Tables Were Created**
   - Go to "Table Editor" in the left sidebar
   - You should see all 11 tables (they will be empty):
     - facilities
     - users
     - staff
     - incidents
     - medications
     - medication_logs
     - compliance_items
     - daily_checklists
     - training_modules
     - training_completions
     - documents

### Step 2: Run the Data Migration

1. **In your Replit terminal, run:**
   ```bash
   cd backend
   npm run migrate:supabase
   ```

2. **Monitor the migration output:**
   - You'll see each table being migrated
   - Success count and any errors will be displayed
   - Migration summary shows total tables migrated

3. **Expected output:**
   ```
   🚀 Starting Shield Ops data migration to Supabase
   
   📦 Migrating table: facilities
     Found X rows
     ✅ Migrated X rows
   
   📦 Migrating table: users
     Found X rows
     ✅ Migrated X rows
   
   ... (continues for all tables)
   
   ============================================================
   📊 Migration Summary:
      Total Tables: 11
      ✅ Success: 11
      ❌ Failed: 0
   
   ✅ Migration complete!
   ```

### Step 3: Verify Migration in Supabase

1. **Check Data in Supabase Dashboard**
   - Go to "Table Editor"
   - Click on each table to view the migrated data
   - Verify row counts match your current database

2. **Test Critical Data:**
   - Check `facilities` table has your facility
   - Check `users` table has your login credentials
   - Check `staff` table has all staff members
   - Spot-check other tables for data integrity

### Step 4: Switch Application to Use Supabase (OPTIONAL)

⚠️ **Important:** This step is optional. Your app will continue using the current PostgreSQL (Neon) database unless you explicitly switch it.

To switch to Supabase:

1. **Update `backend/server.js`:**
   
   Find this line:
   ```javascript
   const pool = require('./config/db');
   ```
   
   Replace with:
   ```javascript
   const pool = require('./config/db');
   const supabase = require('./config/supabase');
   // Optional: Use supabase directly in routes
   ```

2. **Update Controllers (if needed):**
   - Controllers currently use `pool.query()` for PostgreSQL
   - You can keep using `pool` or switch to Supabase client methods
   - See `backend/config/database-supabase.js` for Supabase helper methods

3. **Test the Connection:**
   - Restart your server
   - Check logs for "✅ Supabase connected successfully!"
   - Test login and other features

## 🔄 Rollback Instructions

If you need to rollback to the original database:

1. **No code changes needed** - Your app is still using the original PostgreSQL
2. **Supabase data remains** - Your Supabase database has a copy of all data
3. **To switch back:** Simply don't modify the server.js file

## 📊 What Was Migrated

The following data is now in both databases:

| Table | Description | 
|-------|-------------|
| facilities | Your facility information |
| users | User accounts and authentication |
| staff | Staff members and certifications |
| incidents | Incident reports |
| medications | Medication authorizations |
| medication_logs | Medication administration logs |
| compliance_items | Compliance requirements |
| daily_checklists | Daily checklist tasks |
| training_modules | Training modules |
| training_completions | Staff training completion records |
| documents | Document vault records |

## 🎯 Next Steps

After migration:

1. ✅ **Verify all data** in Supabase Dashboard
2. ✅ **Test application** with current database
3. ✅ **Plan cutover** to Supabase (optional)
4. ✅ **Update deployment** settings if needed

## 🛠️ Troubleshooting

### Issue: Migration Script Fails

**Solution:**
1. Check Supabase credentials in Replit Secrets
2. Verify schema was created in Supabase
3. Check error messages for specific table issues

### Issue: Can't See Supabase Connection Message

**Solution:**
- The connection test only runs when `supabase.js` is imported
- Run `npm run migrate:supabase` to test connection

### Issue: Data Mismatch After Migration

**Solution:**
1. Re-run the migration script (uses upsert, safe to run multiple times)
2. Check foreign key relationships in Supabase
3. Verify UUID format matches

## 📝 Important Notes

1. **Current Database Still Active:** Your app continues using PostgreSQL (Neon) until you explicitly switch
2. **Supabase is Ready:** Your Supabase database now has a complete copy of all data
3. **No Downtime:** Migration doesn't affect running application
4. **Safe to Re-run:** The migration script uses upsert, so it's safe to run multiple times

## ✅ Success Criteria

Migration is successful when:
- [  ] All 11 tables created in Supabase
- [  ] Migration script runs without errors  
- [  ] Data visible in Supabase Table Editor
- [  ] Row counts match original database
- [  ] Test user can login (if switched to Supabase)

---

**Questions?** Check the Supabase dashboard or review migration logs.
