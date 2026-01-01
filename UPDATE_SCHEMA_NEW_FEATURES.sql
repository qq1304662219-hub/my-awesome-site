-- Add new columns to videos table for AI metadata and stats
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS downloads INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS prompt TEXT,
ADD COLUMN IF NOT EXISTS ai_model TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[];

-- RPC to increment downloads count
CREATE OR REPLACE FUNCTION increment_downloads(video_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE videos
  SET downloads = downloads + 1
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add index for tags to speed up search (optional but recommended)
CREATE INDEX IF NOT EXISTS videos_tags_idx ON videos USING GIN (tags);

-- Create a view for public profile stats (optional, but good for performance)
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  user_id,
  COUNT(*) as total_videos,
  SUM(views) as total_views,
  SUM(likes) as total_likes,
  SUM(downloads) as total_downloads
FROM videos
GROUP BY user_id;
