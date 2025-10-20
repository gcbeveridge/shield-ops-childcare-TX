-- Migration: Add missing columns to documents table
-- Run this in your Supabase SQL Editor

ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS file_size BIGINT,
ADD COLUMN IF NOT EXISTS mime_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS form_number VARCHAR(50);

-- Update the created_at column name if needed (schema uses 'created_at' but table might have 'uploaded_at')
-- No need to modify if uploaded_at already exists

-- Add index for tags if using frequently
CREATE INDEX IF NOT EXISTS idx_documents_tags ON documents USING gin(tags);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'documents'
ORDER BY ordinal_position;
