-- Fix UUID Generation Issue in Supabase
-- This script ensures the uuid-ossp extension is enabled and tables use proper UUID defaults

-- Enable UUID extension (required for uuid_generate_v4())
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix staff table to use gen_random_uuid() (Supabase native) instead of uuid_generate_v4()
ALTER TABLE staff ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Fix all other tables to ensure they use gen_random_uuid()
ALTER TABLE facilities ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE users ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE incidents ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE medications ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE medication_logs ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE compliance_items ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE daily_checklists ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE training_modules ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE training_completions ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE documents ALTER COLUMN id SET DEFAULT gen_random_uuid();

-- Verify the changes
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
