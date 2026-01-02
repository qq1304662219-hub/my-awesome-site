-- Fix Video Upload & RLS Issues
-- 1. Reset RLS policies for videos table
-- 2. Ensure storage buckets exist and have correct policies
-- 3. Fix any potential column issues

-- ==========================================
-- 0. Ensure Columns Exist (Safe Update)
-- ==========================================
DO $$
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'cover_url') THEN
        ALTER TABLE public.videos ADD COLUMN cover_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'price') THEN
        ALTER TABLE public.videos ADD COLUMN price NUMERIC DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'tags') THEN
        ALTER TABLE public.videos ADD COLUMN tags TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'style') THEN
        ALTER TABLE public.videos ADD COLUMN style TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'ratio') THEN
        ALTER TABLE public.videos ADD COLUMN ratio TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'duration') THEN
        ALTER TABLE public.videos ADD COLUMN duration NUMERIC;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'ai_model') THEN
        ALTER TABLE public.videos ADD COLUMN ai_model TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'prompt') THEN
        ALTER TABLE public.videos ADD COLUMN prompt TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'width') THEN
        ALTER TABLE public.videos ADD COLUMN width INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'height') THEN
        ALTER TABLE public.videos ADD COLUMN height INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'size') THEN
        ALTER TABLE public.videos ADD COLUMN size BIGINT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'format') THEN
        ALTER TABLE public.videos ADD COLUMN format TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'download_url') THEN
        ALTER TABLE public.videos ADD COLUMN download_url TEXT;
    END IF;
    
    -- Sync thumbnail_url and cover_url if needed (optional logic)
    -- UPDATE public.videos SET thumbnail_url = cover_url WHERE thumbnail_url IS NULL AND cover_url IS NOT NULL;
END $$;


-- ==========================================
-- 1. Videos Table RLS
-- ==========================================
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to avoid conflicts
DROP POLICY IF EXISTS "Videos are viewable by everyone" ON public.videos;
DROP POLICY IF EXISTS "Public can view published videos" ON public.videos;
DROP POLICY IF EXISTS "Users can insert their own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can upload videos" ON public.videos;
DROP POLICY IF EXISTS "Users can update their own videos" ON public.videos;
DROP POLICY IF EXISTS "Users update own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can delete their own videos" ON public.videos;
DROP POLICY IF EXISTS "Users delete own videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can delete any video" ON public.videos;
DROP POLICY IF EXISTS "Videos are viewable" ON public.videos;

-- Create Clean Policies

-- SELECT: Public (published), Owner (any), Admin (any)
CREATE POLICY "Videos are viewable" 
ON public.videos FOR SELECT 
USING (
  status = 'published' 
  OR 
  auth.uid() = user_id
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- INSERT: Authenticated users can upload
CREATE POLICY "Users can upload videos" 
ON public.videos FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' AND auth.uid() = user_id
);

-- UPDATE: Owner (pending only or all?), Admin (all)
CREATE POLICY "Users can update own videos" 
ON public.videos FOR UPDATE 
USING (
  auth.uid() = user_id
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- DELETE: Owner, Admin
CREATE POLICY "Users can delete own videos" 
ON public.videos FOR DELETE 
USING (
  auth.uid() = user_id
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- ==========================================
-- 2. Storage Buckets & Policies
-- ==========================================

-- Ensure buckets exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('covers', 'covers', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('uploads', 'uploads', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies to clean up
DROP POLICY IF EXISTS "Public Videos Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users Upload" ON storage.objects;
DROP POLICY IF EXISTS "Users Update Own Files" ON storage.objects;
DROP POLICY IF EXISTS "Users Delete Own Files" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to covers" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to videos" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to uploads" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to Media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Media" ON storage.objects;
DROP POLICY IF EXISTS "Users Update Own Media" ON storage.objects;
DROP POLICY IF EXISTS "Users Delete Own Media" ON storage.objects;

-- Create Unified Storage Policies

-- SELECT: Public for all these buckets
CREATE POLICY "Public Access to Media"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('videos', 'covers', 'uploads') );

-- INSERT: Authenticated users can upload to these buckets
CREATE POLICY "Authenticated Upload Media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id IN ('videos', 'covers', 'uploads') 
  AND auth.role() = 'authenticated'
);

-- UPDATE: Owners can update their files
CREATE POLICY "Users Update Own Media"
ON storage.objects FOR UPDATE
USING (
  bucket_id IN ('videos', 'covers', 'uploads') 
  AND auth.uid() = owner
);

-- DELETE: Owners can delete their files
CREATE POLICY "Users Delete Own Media"
ON storage.objects FOR DELETE
USING (
  bucket_id IN ('videos', 'covers', 'uploads') 
  AND auth.uid() = owner
);

-- ==========================================
-- 3. Notifications RLS
-- ==========================================
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can insert notifications" ON public.notifications;

CREATE POLICY "Authenticated users can insert notifications"
ON public.notifications FOR INSERT
WITH CHECK (
  auth.role() = 'authenticated'
);
