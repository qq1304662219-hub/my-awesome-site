-- Enable pg_trgm extension for similarity search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable pgroonga or just use standard FTS?
-- Standard FTS is safer.

-- ==========================================
-- 1. Full Text Search (FTS) Upgrade
-- ==========================================

-- 1.1 Add FTS column to videos table
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS fts tsvector;

-- 1.2 Create index for FTS
CREATE INDEX IF NOT EXISTS idx_videos_fts ON public.videos USING GIN (fts);

-- 1.3 Create a function to update the FTS column
CREATE OR REPLACE FUNCTION videos_update_fts()
RETURNS TRIGGER AS $$
BEGIN
  NEW.fts := 
    setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(NEW.ai_model, '')), 'C') ||
    setweight(to_tsvector('english', array_to_string(COALESCE(NEW.tags, ARRAY[]::text[]), ' ')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 1.4 Create Trigger to automatically update FTS
DROP TRIGGER IF EXISTS tr_videos_update_fts ON public.videos;
CREATE TRIGGER tr_videos_update_fts
BEFORE INSERT OR UPDATE ON public.videos
FOR EACH ROW
EXECUTE FUNCTION videos_update_fts();

-- 1.5 Backfill existing data
UPDATE public.videos SET id = id; -- Triggers the update for all rows

-- 1.6 Update search_videos RPC to use FTS
CREATE OR REPLACE FUNCTION search_videos(query_text text)
RETURNS SETOF videos
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM videos
  WHERE
    fts @@ websearch_to_tsquery('english', query_text)
    OR title ILIKE '%' || query_text || '%' -- Fallback for partial matches
  ORDER BY 
    ts_rank(fts, websearch_to_tsquery('english', query_text)) DESC,
    created_at DESC;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION search_videos(text) TO public;
GRANT EXECUTE ON FUNCTION search_videos(text) TO anon;
GRANT EXECUTE ON FUNCTION search_videos(text) TO authenticated;

-- ==========================================
-- 2. Storage Security Hardening
-- ==========================================
-- Ensure uploads bucket is private and only accessible via Signed URLs
-- Note: This requires the bucket to be set to 'private' in Supabase Dashboard.
-- We can enforce RLS policies here.

-- Allow public access to 'public' folder only? 
-- No, we want everything private except specific assets.
-- For now, let's assume 'uploads' bucket.

-- Policy: Authenticated users can upload to their own folder
CREATE POLICY "Users can upload to own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Users can view their own files
CREATE POLICY "Users can view own files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Admins can view all files
CREATE POLICY "Admins can view all files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'uploads' AND
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);
