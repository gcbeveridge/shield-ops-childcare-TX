-- ============================================
-- COMPLETE FIX FOR DOCUMENT VAULT
-- Run this entire script in Supabase SQL Editor
-- ============================================

-- Step 1: Add missing columns to documents table
ALTER TABLE documents 
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS file_size BIGINT,
  ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100),
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS form_number VARCHAR(50);

-- Step 2: Add index for better performance
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING gin(tags);

-- Step 3: Insert 12 sample documents
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

-- Step 4: Verify the data was inserted
SELECT 
  name, 
  category, 
  DATE(expiration_date) as expires,
  form_number,
  uploaded_by
FROM documents 
ORDER BY created_at DESC 
LIMIT 12;

-- Step 5: Show summary by category
SELECT 
  category, 
  COUNT(*) as document_count 
FROM documents 
GROUP BY category 
ORDER BY document_count DESC;
