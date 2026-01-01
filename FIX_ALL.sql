-- ==========================================
-- 1. Storage Fixes (修复存储桶权限)
-- ==========================================

-- Create the 'uploads' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Allow public access to files (READ)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'uploads' );

-- Allow authenticated users to upload files (INSERT)
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'uploads' );

-- Allow users to update/delete their own files
DROP POLICY IF EXISTS "Users can update own files" ON storage.objects;
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'uploads' AND auth.uid() = owner );

DROP POLICY IF EXISTS "Users can delete own files" ON storage.objects;
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'uploads' AND auth.uid() = owner );


-- ==========================================
-- 2. Database Schema Fixes (修复数据库结构)
-- ==========================================

-- Ensure all required columns exist in 'videos' table
ALTER TABLE videos ADD COLUMN IF NOT EXISTS style text;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS ratio text;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS duration text;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE videos ADD COLUMN IF NOT EXISTS download_url text;


-- ==========================================
-- 3. RLS Policy Fixes (修复访问权限)
-- ==========================================

-- Helper function to get role safely
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Videos Policies
DROP POLICY IF EXISTS "Videos are viewable by everyone" ON videos;
DROP POLICY IF EXISTS "Anyone can view published videos" ON videos;
CREATE POLICY "Anyone can view published videos" ON videos
  FOR SELECT USING (status = 'published');

DROP POLICY IF EXISTS "Users can insert their own videos" ON videos;
CREATE POLICY "Users can insert their own videos" ON videos
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own videos" ON videos;
CREATE POLICY "Users can update their own videos" ON videos
  FOR UPDATE USING (auth.uid() = user_id OR get_my_role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "Users can delete their own videos" ON videos;
CREATE POLICY "Users can delete their own videos" ON videos
  FOR DELETE USING (auth.uid() = user_id OR get_my_role() IN ('admin', 'super_admin'));

DROP POLICY IF EXISTS "Admins can view all videos" ON videos;
CREATE POLICY "Admins can view all videos" ON videos
    FOR SELECT USING (get_my_role() IN ('admin', 'super_admin'));


-- ==========================================
-- 4. Admin Permission Fix (修复管理员权限)
-- ==========================================

-- ⚠️ Replace 'your_email@example.com' with the actual admin email if needed
-- This part is optional but helpful to ensure there is at least one admin
-- UPDATE profiles SET role = 'super_admin' WHERE id IN (SELECT id FROM auth.users WHERE email = 'admin@example.com');
