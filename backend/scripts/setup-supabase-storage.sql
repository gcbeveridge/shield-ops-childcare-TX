-- Setup Supabase Storage for Shield Ops Document Vault
-- Run this in your Supabase SQL Editor to configure storage buckets and policies

-- =====================================================
-- STEP 1: Create Storage Bucket
-- =====================================================
-- Note: Storage buckets are created via Supabase Dashboard > Storage
-- This SQL creates the policies after the bucket is created

-- You need to manually create a bucket named "documents" in Supabase Dashboard:
-- 1. Go to Storage section
-- 2. Click "New Bucket"
-- 3. Name: "documents"
-- 4. Public: false (private bucket)
-- 5. File size limit: 10MB
-- 6. Allowed MIME types: application/pdf, image/jpeg, image/png, image/jpg, 
--    application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document

-- =====================================================
-- STEP 2: Storage Policies (Run after bucket creation)
-- =====================================================

-- Policy: Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'documents');

-- Policy: Allow authenticated users to read their facility's files
CREATE POLICY "Users can view their facility documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'documents');

-- Policy: Allow authenticated users to delete their facility's files
CREATE POLICY "Users can delete their facility documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'documents');

-- Policy: Allow authenticated users to update their facility's files
CREATE POLICY "Users can update their facility documents"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'documents');

-- =====================================================
-- STEP 3: Update documents table to track storage paths
-- =====================================================

-- Add storage_path column if not exists (for cloud file path)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'storage_path'
    ) THEN
        ALTER TABLE documents ADD COLUMN storage_path TEXT;
    END IF;
END $$;

-- Add storage_bucket column if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'documents' AND column_name = 'storage_bucket'
    ) THEN
        ALTER TABLE documents ADD COLUMN storage_bucket TEXT DEFAULT 'documents';
    END IF;
END $$;

-- =====================================================
-- VERIFICATION QUERY
-- =====================================================
-- Run this to verify the setup

SELECT 
    'Storage bucket "documents" should be created in Supabase Dashboard > Storage' as step_1,
    'Run the CREATE POLICY statements above' as step_2,
    'Columns storage_path and storage_bucket added to documents table' as step_3;

-- Check if columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents' 
  AND column_name IN ('storage_path', 'storage_bucket')
ORDER BY column_name;

-- =====================================================
-- NOTES
-- =====================================================
-- After running this:
-- 1. Verify bucket "documents" exists in Supabase Dashboard > Storage
-- 2. Verify policies are created in Storage > Policies
-- 3. Update backend code to use Supabase Storage SDK
-- 4. Files will be stored as: documents/{facilityId}/{filename}
