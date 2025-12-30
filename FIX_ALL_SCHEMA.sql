-- COMPREHENSIVE FIX SCRIPT
-- This script consolidates all schema changes to ensure no missing columns or policies.

-- 1. ENSURE COLUMNS EXIST (Safe to run multiple times)
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS category text DEFAULT 'All';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS download_url text;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES public.profiles(id);

-- 2. ADD CONSTRAINTS & INDEXES
ALTER TABLE public.videos DROP CONSTRAINT IF EXISTS videos_status_check;
ALTER TABLE public.videos ADD CONSTRAINT videos_status_check CHECK (status IN ('pending', 'published', 'rejected'));
CREATE INDEX IF NOT EXISTS videos_status_idx ON public.videos (status);

-- 3. UPDATE EXISTING DATA
-- Set default values for existing rows if null
UPDATE public.videos SET status = 'published' WHERE status IS NULL;
UPDATE public.videos SET category = 'Other' WHERE category IS NULL;

-- 4. UPDATE USER TRIGGER (Enforce Admin Role)
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

-- 5. SET ADMIN ROLE FOR EXISTING USER
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'qq1304662219@gmail.com';

-- 6. RE-APPLY RLS POLICIES (Reset all video policies)

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing video policies to start fresh
DROP POLICY IF EXISTS "Videos are viewable by everyone" ON public.videos;
DROP POLICY IF EXISTS "Public can view published videos" ON public.videos;
DROP POLICY IF EXISTS "Users can insert their own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can update their own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can update their own pending videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can view all videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can update all videos" ON public.videos;

-- Policy: VIEW (Public sees published, Author sees own, Admin sees all)
CREATE POLICY "Public can view published videos" 
ON public.videos FOR SELECT 
USING (
  status = 'published' 
  OR 
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy: INSERT (Users can upload, default pending)
CREATE POLICY "Users can insert their own videos" 
ON public.videos FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND 
  status = 'pending'
);

-- Policy: UPDATE (Users can only update if pending, Admin can update anything)
CREATE POLICY "Admins can update all videos" 
ON public.videos FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

CREATE POLICY "Users can update their own pending videos" 
ON public.videos FOR UPDATE 
USING (
  auth.uid() = user_id
)
WITH CHECK (
  status = 'pending'
);

-- 7. ADMIN TICKET POLICIES (Ensure these exist too)
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
CREATE POLICY "Admins can view all tickets" 
ON public.tickets FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update tickets" ON public.tickets;
CREATE POLICY "Admins can update tickets" 
ON public.tickets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
