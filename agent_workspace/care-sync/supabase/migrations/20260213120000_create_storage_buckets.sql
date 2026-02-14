-- Create buckets for Vault and Medical Recordings
-- This ensures the buckets exist for file uploads

INSERT INTO storage.buckets (id, name, public)
VALUES ('vault', 'vault', false),
       ('medical-recordings', 'medical-recordings', false)
ON CONFLICT (id) DO NOTHING;

-- 1. Policies for medical-recordings
-- Allow authenticated users to upload recordings
CREATE POLICY "Users can upload medical recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'medical-recordings' );

-- Allow authenticated users to view/download recordings (needed for API processing)
CREATE POLICY "Users can view medical recordings"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'medical-recordings' );

-- Allow authenticated users to delete recordings (needed for cleanup after processing)
CREATE POLICY "Users can delete medical recordings"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'medical-recordings' );

-- 2. Policies for vault
-- Allow authenticated users to upload encrypted files to vault
CREATE POLICY "Users can upload vault files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'vault' );

-- Allow authenticated users to download encrypted files from vault
CREATE POLICY "Users can view vault files"
ON storage.objects FOR SELECT
TO authenticated
USING ( bucket_id = 'vault' );
