-- 1. Create a secure function to get the current user's role
-- This avoids infinite recursion when policies query the profiles table
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Fix Videos Table Policies
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Remove existing policies to start fresh
DROP POLICY IF EXISTS "Public can view published videos" ON videos;
DROP POLICY IF EXISTS "Users can view own videos" ON videos;
DROP POLICY IF EXISTS "Admins can view all videos" ON videos;
DROP POLICY IF EXISTS "Users can insert own videos" ON videos;
DROP POLICY IF EXISTS "Users can update own videos" ON videos;
DROP POLICY IF EXISTS "Admins can update all videos" ON videos;

-- Policy: Public can view published videos
CREATE POLICY "Public can view published videos"
ON videos FOR SELECT
USING (status = 'published');

-- Policy: Users can view their own videos
CREATE POLICY "Users can view own videos"
ON videos FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Admins can view all videos
CREATE POLICY "Admins can view all videos"
ON videos FOR SELECT
TO authenticated
USING (get_my_role() IN ('admin', 'super_admin'));

-- Policy: Users can upload (insert) videos
CREATE POLICY "Users can insert videos"
ON videos FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own videos
CREATE POLICY "Users can update own videos"
ON videos FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Admins can update all videos (for approval/rejection)
CREATE POLICY "Admins can update all videos"
ON videos FOR UPDATE
TO authenticated
USING (get_my_role() IN ('admin', 'super_admin'));

-- 3. Fix Storage Policies (Uploads Bucket)
-- Ensure the bucket exists (this usually needs to be done in UI, but policies can be set)
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Allow authenticated users to upload to 'uploads' bucket
CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'uploads' AND auth.uid() = owner);

-- Allow authenticated users to update their files
CREATE POLICY "Users can update own files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'uploads' AND auth.uid() = owner);

-- Allow public to view files in 'uploads' bucket
CREATE POLICY "Public can view files"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'uploads');

-- 4. Fix Profiles Policies (if needed)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view profiles"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- 5. Helper to set yourself as admin (RUN THIS MANUALLY REPLACING THE ID)
-- UPDATE profiles SET role = 'super_admin' WHERE id = 'YOUR_USER_ID_HERE';
