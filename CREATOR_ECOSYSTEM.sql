-- 1. Enhance Profiles for Creator Ecosystem
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS verified_title TEXT, -- e.g. "Award Winner 2024", "Verified Creator"
ADD COLUMN IF NOT EXISTS badges TEXT[], -- Array of badges e.g. ['award_winner', 'top_creator', 'verified']
ADD COLUMN IF NOT EXISTS bio TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}'::jsonb, -- { "twitter": "...", "instagram": "..." }
ADD COLUMN IF NOT EXISTS location TEXT,
ADD COLUMN IF NOT EXISTS views_count BIGINT DEFAULT 0, -- Total profile views
ADD COLUMN IF NOT EXISTS works_count INTEGER DEFAULT 0; -- Total works

-- 2. Add indexes for creator search
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON profiles(is_verified);
CREATE INDEX IF NOT EXISTS idx_profiles_badges ON profiles USING GIN(badges);

-- 3. Mock Data Update for Creators (Optional: Make some existing users verified)
UPDATE profiles
SET 
  is_verified = TRUE,
  verified_title = 'AI 影像大赛金奖得主',
  badges = ARRAY['award_winner', 'verified', 'top_creator'],
  bio = '专注 AI 视频创作，擅长 Midjourney + Runway 流程。',
  location = 'Shanghai, China',
  works_count = floor(random() * 50) + 10,
  views_count = floor(random() * 10000) + 500
WHERE id IN (
  SELECT id FROM profiles ORDER BY created_at LIMIT 3
);

-- 4. Another batch of verified creators
UPDATE profiles
SET 
  is_verified = TRUE,
  verified_title = '资深 AI 创作者',
  badges = ARRAY['verified'],
  bio = '探索 AI 生成视频的无限可能。',
  location = 'Beijing, China',
  works_count = floor(random() * 30) + 5
WHERE id IN (
  SELECT id FROM profiles ORDER BY created_at DESC LIMIT 3
);
