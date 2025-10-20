# Fix for Document Vault - PGRST204 Schema Cache Error

## The Problem
After adding columns to the `documents` table in Supabase SQL Editor, the PostgREST API cache hasn't refreshed yet. This causes the error: "Could not find the 'description' column of 'documents' in the schema cache"

## Solution: Force Supabase to Reload Schema Cache

### Option 1: Restart Supabase API (Recommended)

1. **Go to Supabase Dashboard**: https://app.supabase.com
2. **Select your project** (akrpcixefzdqlyjktyki)
3. **Click "Settings"** in the left sidebar
4. **Click "API"** under Settings
5. Scroll down and look for **"Restart PostgREST"** or **"Reload Schema"** button
6. Click it to force a schema cache refresh

### Option 2: Run the SQL Reload Command

1. Go to **SQL Editor** in Supabase
2. Run this command:
```sql
NOTIFY pgrst, 'reload schema';
```

### Option 3: Wait 10-15 Minutes
The schema cache automatically refreshes every 10-15 minutes.

### Option 4: Temporary Fix - Use SQL Direct Insert

Instead of using the Supabase JS client, we can insert directly via SQL:

1. Go to **SQL Editor** in Supabase
2. Copy and run this SQL:

```sql
-- Insert sample documents directly
INSERT INTO documents (
  facility_id, name, category, description, file_name, file_path,
  file_size, mime_type, uploaded_by, expiration_date, tags, form_number
) VALUES
-- Licensing & Permits
('00000000-0000-0000-0000-000000000001', 'Child Care License', 'Licensing & Permits', 
 'Current state childcare operating license', 'childcare-license-2025.pdf', 
 '/uploads/sample/childcare-license-2025.pdf', 245678, 'application/pdf', 
 'Jennifer Martinez', '2025-12-31', '["license", "required", "state"]'::jsonb, 'PRS-2002'),

('00000000-0000-0000-0000-000000000001', 'Fire Safety Inspection', 'Facility & Inspections',
 'Annual fire safety inspection report', 'fire-inspection-2025.pdf',
 '/uploads/sample/fire-inspection-2025.pdf', 156789, 'application/pdf',
 'Jennifer Martinez', '2025-11-15', '["fire-safety", "inspection", "required"]'::jsonb, NULL),

('00000000-0000-0000-0000-000000000001', 'Building Occupancy Permit', 'Licensing & Permits',
 'Certificate of occupancy for facility', 'occupancy-permit.pdf',
 '/uploads/sample/occupancy-permit.pdf', 123456, 'application/pdf',
 'Jennifer Martinez', '2026-06-30', '["permit", "building"]'::jsonb, NULL),

-- Staff Records
('00000000-0000-0000-0000-000000000001', 'Emily Rodriguez - CPR Certification', 'Staff Records',
 'CPR certification for Lead Teacher', 'emily-rodriguez-cpr-cert.pdf',
 '/uploads/sample/emily-cpr.pdf', 89234, 'application/pdf',
 'Jennifer Martinez', '2025-11-15', '["cpr", "certification", "staff"]'::jsonb, NULL),

('00000000-0000-0000-0000-000000000001', 'David Martinez - Background Check', 'Staff Records',
 'Criminal background check clearance', 'david-martinez-background.pdf',
 '/uploads/sample/david-background.pdf', 234567, 'application/pdf',
 'Jennifer Martinez', '2026-03-10', '["background-check", "staff", "required"]'::jsonb, NULL),

('00000000-0000-0000-0000-000000000001', 'Sarah Johnson - First Aid Certificate', 'Staff Records',
 'Current first aid certification', 'sarah-first-aid.pdf',
 '/uploads/sample/sarah-first-aid.pdf', 91234, 'application/pdf',
 'Jennifer Martinez', '2025-11-28', '["first-aid", "certification", "staff"]'::jsonb, NULL),

-- Health & Safety
('00000000-0000-0000-0000-000000000001', 'Health & Safety Plan', 'Health & Safety',
 'Facility health and safety procedures', 'health-safety-plan-2025.pdf',
 '/uploads/sample/health-safety-plan.pdf', 567890, 'application/pdf',
 'Jennifer Martinez', NULL, '["health", "safety", "procedures"]'::jsonb, 'PRS-3004'),

('00000000-0000-0000-0000-000000000001', 'Emergency Evacuation Plan', 'Health & Safety',
 'Emergency evacuation procedures and routes', 'evacuation-plan.pdf',
 '/uploads/sample/evacuation-plan.pdf', 445678, 'application/pdf',
 'Jennifer Martinez', NULL, '["emergency", "evacuation", "safety"]'::jsonb, 'PRS-3023'),

-- Insurance
('00000000-0000-0000-0000-000000000001', 'General Liability Insurance', 'Insurance',
 'Current general liability insurance policy', 'liability-insurance-2025.pdf',
 '/uploads/sample/liability-insurance.pdf', 334567, 'application/pdf',
 'Jennifer Martinez', '2025-12-31', '["insurance", "liability", "required"]'::jsonb, NULL),

('00000000-0000-0000-0000-000000000001', 'Property Insurance', 'Insurance',
 'Building and property insurance coverage', 'property-insurance-2025.pdf',
 '/uploads/sample/property-insurance.pdf', 298765, 'application/pdf',
 'Jennifer Martinez', '2026-01-15', '["insurance", "property"]'::jsonb, NULL),

-- Children
('00000000-0000-0000-0000-000000000001', 'Enrollment Agreement Template', 'Children',
 'Standard parent enrollment agreement form', 'enrollment-agreement-template.pdf',
 '/uploads/sample/enrollment-template.pdf', 189234, 'application/pdf',
 'Jennifer Martinez', NULL, '["enrollment", "template", "children"]'::jsonb, 'PRS-2105'),

('00000000-0000-0000-0000-000000000001', 'Immunization Policy', 'Children',
 'Required immunization policy and tracking procedures', 'immunization-policy.pdf',
 '/uploads/sample/immunization-policy.pdf', 145678, 'application/pdf',
 'Jennifer Martinez', NULL, '["immunization", "health", "policy"]'::jsonb, 'PRS-2301');

-- Verify the insert
SELECT name, category, expiration_date, form_number FROM documents ORDER BY created_at DESC LIMIT 12;
```

3. After running this, **refresh your Document Vault page** in the browser

## After Fixing

Once done, you should see:
- ✅ 12 sample documents in the Document Vault
- ✅ Documents organized by categories
- ✅ Expiration dates tracked properly
- ✅ No more blank page!

## If Nothing Works

The issue is that Supabase's PostgREST layer caches table schemas. Since we added columns after the service started, it doesn't know about them yet. The cache should auto-refresh within 10-15 minutes, or you can restart the PostgREST service from the Supabase dashboard.
