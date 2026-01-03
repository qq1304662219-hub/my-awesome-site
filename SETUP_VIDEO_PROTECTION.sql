-- 1. Create Storage Buckets
-- Note: Supabase SQL cannot directly create storage buckets via standard SQL easily without the storage schema extensions, 
-- but we can try to insert into storage.buckets.
-- If this fails, the user might need to create them manually, but I'll try the standard way.

INSERT INTO storage.buckets (id, name, public)
VALUES ('raw_videos', 'raw_videos', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('public_videos', 'public_videos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage Policies
-- raw_videos: Only authenticated users can upload, only owner can select (initially), service role can do everything.
-- For processing, the user uploads to it.
CREATE POLICY "Users can upload to raw_videos" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'raw_videos' AND auth.uid() = owner);

-- public_videos: Public can view. Service role writes.
CREATE POLICY "Public Videos are viewable by everyone" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'public_videos');

-- 3. Update Videos Table
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS original_url text; -- Stores path to raw_videos
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS is_processed boolean DEFAULT false;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS processing_error text;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_videos_is_processed ON public.videos(is_processed);
