-- Create Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  content text NOT NULL,
  link text,
  is_active boolean DEFAULT true,
  priority integer DEFAULT 0,
  start_time timestamptz,
  end_time timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id)
);

-- Enable RLS
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Public can view active announcements
DROP POLICY IF EXISTS "Public can view active announcements" ON public.announcements;
CREATE POLICY "Public can view active announcements"
ON public.announcements FOR SELECT
USING (
  is_active = true 
  AND (start_time IS NULL OR start_time <= now()) 
  AND (end_time IS NULL OR end_time >= now())
);

-- 2. Admins can view all announcements
DROP POLICY IF EXISTS "Admins can view all announcements" ON public.announcements;
CREATE POLICY "Admins can view all announcements"
ON public.announcements FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- 3. Admins can insert announcements
DROP POLICY IF EXISTS "Admins can insert announcements" ON public.announcements;
CREATE POLICY "Admins can insert announcements"
ON public.announcements FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- 4. Admins can update announcements
DROP POLICY IF EXISTS "Admins can update announcements" ON public.announcements;
CREATE POLICY "Admins can update announcements"
ON public.announcements FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- 5. Admins can delete announcements
DROP POLICY IF EXISTS "Admins can delete announcements" ON public.announcements;
CREATE POLICY "Admins can delete announcements"
ON public.announcements FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_announcements_active_time ON public.announcements (is_active, start_time, end_time);
