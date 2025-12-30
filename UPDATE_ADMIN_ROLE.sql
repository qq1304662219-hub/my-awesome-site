-- 1. Update handle_new_user to enforce admin role for specific email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, invited_by)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    CASE 
      WHEN new.email = 'qq1304662219@gmail.com' THEN 'admin' 
      ELSE 'user' 
    END,
    (new.raw_user_meta_data->>'invited_by')::uuid
  );
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Fallback if invited_by is invalid
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    CASE 
      WHEN new.email = 'qq1304662219@gmail.com' THEN 'admin' 
      ELSE 'user' 
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Update existing user if exists
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'qq1304662219@gmail.com';

-- 3. Secure Video Publishing Logic via RLS

-- Drop loose update policies
DROP POLICY IF EXISTS "Users can update their own videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can update all videos" ON public.videos;

-- Policy A: Admins can update any video
CREATE POLICY "Admins can update all videos" 
ON public.videos FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy B: Users can update their own videos ONLY if status remains pending
-- This prevents users from:
-- 1. Publishing their own videos (setting status to 'published')
-- 2. Editing videos that are already published (since new row status would be 'published')
CREATE POLICY "Users can update their own pending videos" 
ON public.videos FOR UPDATE 
USING (
  auth.uid() = user_id
)
WITH CHECK (
  status = 'pending'
);

-- Ensure Insert policy sets default status (already handled by default value, but good to enforce)
DROP POLICY IF EXISTS "Users can insert their own videos" ON public.videos;
CREATE POLICY "Users can insert their own videos" 
ON public.videos FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND 
  status = 'pending'
);
