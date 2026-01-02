-- Add job_title to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Add followers_count to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS followers_count INTEGER DEFAULT 0;

-- Add badges column (text array) if not exists
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS badges TEXT[] DEFAULT '{}';

-- Index for filtering
CREATE INDEX IF NOT EXISTS idx_profiles_job_title ON profiles(job_title);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON profiles(location);
CREATE INDEX IF NOT EXISTS idx_profiles_followers_count ON profiles(followers_count);
CREATE INDEX IF NOT EXISTS idx_profiles_badges ON profiles USING GIN (badges);

-- Mock data for job_title
UPDATE profiles 
SET job_title = CASE floor(random() * 5)
  WHEN 0 THEN 'AI 艺术家'
  WHEN 1 THEN '导演'
  WHEN 2 THEN '剪辑师'
  WHEN 3 THEN '制片人'
  ELSE '视觉设计师'
END
WHERE job_title IS NULL;

-- Mock data for location if null
UPDATE profiles
SET location = CASE floor(random() * 4)
  WHEN 0 THEN '北京'
  WHEN 1 THEN '上海'
  WHEN 2 THEN '深圳'
  ELSE '杭州'
END
WHERE location IS NULL;

-- Mock data for award winners (randomly assign badges to 20% of users)
UPDATE profiles
SET badges = array_append(COALESCE(badges, '{}'), 'award_winner')
WHERE random() < 0.2 AND NOT (badges @> '{award_winner}');

-- Mock data for recommended (randomly assign to 10%)
UPDATE profiles
SET badges = array_append(COALESCE(badges, '{}'), 'recommended')
WHERE random() < 0.1 AND NOT (badges @> '{recommended}');
