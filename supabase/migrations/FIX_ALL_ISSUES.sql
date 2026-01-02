-- FIX ALL ISSUES: RLS, Storage, and Tables
-- This migration ensures all critical tables and policies exist.

-- ==========================================
-- 1. Ensure Videos Table Columns & Policies
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
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'category') THEN
        ALTER TABLE public.videos ADD COLUMN category TEXT;
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
END $$;

ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Videos are viewable" ON public.videos;
DROP POLICY IF EXISTS "Users can upload videos" ON public.videos;
DROP POLICY IF EXISTS "Users can update own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can delete own videos" ON public.videos;

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

-- INSERT: Authenticated users
CREATE POLICY "Users can upload videos" 
ON public.videos FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' AND auth.uid() = user_id
);

-- UPDATE: Owner or Admin
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

-- DELETE: Owner or Admin
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
-- 2. Storage Policies (Unified)
-- ==========================================
INSERT INTO storage.buckets (id, name, public) VALUES ('videos', 'videos', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('covers', 'covers', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('uploads', 'uploads', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Access to Media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Media" ON storage.objects;
DROP POLICY IF EXISTS "Users Update Own Media" ON storage.objects;
DROP POLICY IF EXISTS "Users Delete Own Media" ON storage.objects;

-- SELECT: Public
CREATE POLICY "Public Access to Media"
ON storage.objects FOR SELECT
USING ( bucket_id IN ('videos', 'covers', 'uploads') );

-- INSERT: Authenticated users (enforce folder structure: userId/filename)
CREATE POLICY "Authenticated Upload Media"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id IN ('videos', 'covers', 'uploads') 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE: Owner
CREATE POLICY "Users Update Own Media"
ON storage.objects FOR UPDATE
USING (
  bucket_id IN ('videos', 'covers', 'uploads') 
  AND auth.uid() = owner
);

-- DELETE: Owner
CREATE POLICY "Users Delete Own Media"
ON storage.objects FOR DELETE
USING (
  bucket_id IN ('videos', 'covers', 'uploads') 
  AND auth.uid() = owner
);

-- ==========================================
-- 3. Likes, Follows, Collections RLS
-- ==========================================

-- Likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.likes;
DROP POLICY IF EXISTS "Users can insert their own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON public.likes;

CREATE POLICY "Likes are viewable by everyone" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can insert their own likes" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- Follows
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Follows are viewable by everyone" ON public.follows;
DROP POLICY IF EXISTS "Users can follow others" ON public.follows;
DROP POLICY IF EXISTS "Users can unfollow" ON public.follows;

CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- Collections
CREATE TABLE IF NOT EXISTS public.collections (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) NOT NULL,
  name TEXT NOT NULL,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Collections viewable" ON public.collections;
DROP POLICY IF EXISTS "Collections insert" ON public.collections;
DROP POLICY IF EXISTS "Collections update" ON public.collections;
DROP POLICY IF EXISTS "Collections delete" ON public.collections;

CREATE POLICY "Collections viewable" ON public.collections FOR SELECT USING (is_public = true OR auth.uid() = user_id);
CREATE POLICY "Collections insert" ON public.collections FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Collections update" ON public.collections FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Collections delete" ON public.collections FOR DELETE USING (auth.uid() = user_id);

-- Collection Items
CREATE TABLE IF NOT EXISTS public.collection_items (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  collection_id BIGINT REFERENCES public.collections(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(collection_id, video_id)
);

ALTER TABLE public.collection_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Items viewable" ON public.collection_items;
DROP POLICY IF EXISTS "Items insert" ON public.collection_items;
DROP POLICY IF EXISTS "Items delete" ON public.collection_items;

CREATE POLICY "Items viewable" ON public.collection_items FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.collections c 
    WHERE c.id = collection_items.collection_id 
    AND (c.is_public = true OR c.user_id = auth.uid())
  )
);
CREATE POLICY "Items insert" ON public.collection_items FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.collections c 
    WHERE c.id = collection_items.collection_id 
    AND c.user_id = auth.uid()
  )
);
CREATE POLICY "Items delete" ON public.collection_items FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.collections c 
    WHERE c.id = collection_items.collection_id 
    AND c.user_id = auth.uid()
  )
);
