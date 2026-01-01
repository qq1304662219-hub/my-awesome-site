-- Fix increment_downloads RPC to accept UUID
CREATE OR REPLACE FUNCTION increment_downloads(video_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE videos
  SET downloads = COALESCE(downloads, 0) + 1
  WHERE id = video_id;
END;
$$;

-- Fix increment_views RPC to accept UUID (if it exists or create it)
CREATE OR REPLACE FUNCTION increment_views(video_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE videos
  SET views = COALESCE(views, 0) + 1
  WHERE id = video_id;
END;
$$;
