
-- Add quota columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS storage_used BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS storage_limit BIGINT DEFAULT 1073741824; -- 1GB default

-- Initialize storage_used from existing videos
UPDATE profiles p
SET storage_used = (
  SELECT COALESCE(SUM(size), 0)
  FROM videos v
  WHERE v.user_id = p.id
);

-- Function to calculate and update storage used
CREATE OR REPLACE FUNCTION update_storage_used()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE profiles 
    SET storage_used = storage_used + COALESCE(NEW.size, 0)
    WHERE id = NEW.user_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE profiles 
    SET storage_used = GREATEST(0, storage_used - COALESCE(OLD.size, 0))
    WHERE id = OLD.user_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on videos table
DROP TRIGGER IF EXISTS on_video_change_update_storage ON videos;
CREATE TRIGGER on_video_change_update_storage
AFTER INSERT OR DELETE ON videos
FOR EACH ROW
EXECUTE FUNCTION update_storage_used();

-- Function to check quota (can be called from client)
CREATE OR REPLACE FUNCTION check_storage_quota(p_new_file_size BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_used BIGINT;
  v_limit BIGINT;
BEGIN
  -- Get current user ID
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT storage_used, storage_limit INTO v_used, v_limit
  FROM profiles
  WHERE id = v_user_id;
  
  -- Handle nulls
  v_used := COALESCE(v_used, 0);
  v_limit := COALESCE(v_limit, 1073741824); -- Default 1GB
  
  IF (v_used + p_new_file_size) > v_limit THEN
    RETURN FALSE;
  ELSE
    RETURN TRUE;
  END IF;
END;
$$;
