-- Fix increment_views and increment_downloads to accept UUID (since videos.id is UUID)
-- This fixes the error: function public.increment_views(uuid) does not exist
-- Also sets search_path = public to address security warnings for these functions

-- 1. Drop the incorrect BIGINT versions first to avoid ambiguity
DROP FUNCTION IF EXISTS public.increment_views(BIGINT);
DROP FUNCTION IF EXISTS public.increment_downloads(BIGINT);

-- 2. Re-create them with UUID parameter and secure search_path
CREATE OR REPLACE FUNCTION public.increment_views(video_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.videos
  SET views = COALESCE(views, 0) + 1
  WHERE id = video_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_downloads(video_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.videos
  SET downloads = COALESCE(downloads, 0) + 1
  WHERE id = video_id;
END;
$$;
