-- 1. 修复旧视频数据 (将所有无 status 的视频设为 published)
UPDATE public.videos
SET status = 'published'
WHERE status IS NULL OR status = '';

-- 2. 强制指定超级管理员 (修复权限问题)
UPDATE public.profiles
SET role = 'super_admin'
WHERE email = 'qq1304662219@gmail.com';

-- 3. 确保 RLS 策略正确 (允许读取 published 视频)
DROP POLICY IF EXISTS "Anyone can view published videos" ON public.videos;
CREATE POLICY "Anyone can view published videos"
ON public.videos FOR SELECT
USING (status = 'published');

-- 4. 确保管理员可以管理所有视频
DROP POLICY IF EXISTS "Admins can update any video" ON public.videos;
CREATE POLICY "Admins can update any video"
ON public.videos FOR UPDATE
USING (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and (profiles.role = 'admin' or profiles.role = 'super_admin')
  )
);
