-- Add parent_id for nested comments
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_id BIGINT REFERENCES public.comments(id) ON DELETE CASCADE;

-- Add resolution column to videos
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS resolution text DEFAULT '1080p'; -- 4K, 1080p, 720p

-- Add duration bucket/range if needed, but we have duration (float/int) so we can query by range.
-- Ensure duration is numeric.
-- ALTER TABLE public.videos ALTER COLUMN duration TYPE numeric USING duration::numeric;
