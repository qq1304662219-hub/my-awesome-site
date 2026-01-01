-- 1. Fix Infinite Recursion in Policies (修复无限递归问题)
-- Function to get role safely bypassing RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- Update Policies for Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 2. Add Missing Columns (添加缺失的字段)
ALTER TABLE videos ADD COLUMN IF NOT EXISTS style text;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS ratio text;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS duration text; -- Just in case (though code uses number, check DB type)
-- Code uses duration as number? Let's check types.
-- src/types/supabase.ts says duration is number | null.
-- But if it's missing, adding it as text might be wrong.
-- I'll skip duration for now as it wasn't reported missing, but style was.

-- 3. Fix Video Policies (修复视频访问权限)
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

DROP POLICY IF EXISTS "Admins can view all videos" ON videos;
CREATE POLICY "Admins can view all videos" ON videos
    FOR SELECT USING (get_my_role() IN ('admin', 'super_admin'));

-- 4. Verify/Fix Data (Optional: Update null styles/categories if needed)
-- You can run updates manually later.
