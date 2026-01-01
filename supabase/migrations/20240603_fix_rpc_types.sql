-- Fix increment_downloads RPC to accept BIGINT (since videos.id is BIGINT)
CREATE OR REPLACE FUNCTION increment_downloads(video_id BIGINT)
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

-- Fix increment_views RPC to accept BIGINT
CREATE OR REPLACE FUNCTION increment_views(video_id BIGINT)
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
