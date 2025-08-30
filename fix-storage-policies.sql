-- Run this SQL in your Supabase SQL Editor to fix Storage RLS policies

-- First, drop any existing restrictive policies
DROP POLICY IF EXISTS "Users can upload their own reports" ON storage.objects;
DROP POLICY IF EXISTS "Users can read their own reports" ON storage.objects;
DROP POLICY IF EXISTS "Admins can read all reports" ON storage.objects;
DROP POLICY IF EXISTS "Enable upload for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable read for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON storage.objects;

-- Create simple, permissive policies for assessment-reports bucket
CREATE POLICY "Enable upload for authenticated users" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'assessment-reports');

CREATE POLICY "Enable read for authenticated users" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'assessment-reports');

CREATE POLICY "Enable update for authenticated users" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'assessment-reports')
WITH CHECK (bucket_id = 'assessment-reports');

CREATE POLICY "Enable delete for authenticated users" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'assessment-reports');

-- Optional: Create more specific policies if you want to restrict access later
-- This policy would only allow users to access files in folders named with their user ID
/*
CREATE POLICY "Users can only access their own files" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'assessment-reports' AND
  (storage.foldername(name))[3] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'assessment-reports' AND
  (storage.foldername(name))[3] = auth.uid()::text
);
*/
