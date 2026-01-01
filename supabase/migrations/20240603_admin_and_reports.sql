-- Add is_admin column to profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'is_admin') THEN
        ALTER TABLE profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  reporter_id UUID REFERENCES auth.users(id) NOT NULL,
  video_id BIGINT REFERENCES videos(id), -- Optional, report video
  comment_id BIGINT REFERENCES comments(id), -- Optional, report comment
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- Policies for Reports
DROP POLICY IF EXISTS "Users can insert reports" ON reports;
CREATE POLICY "Users can insert reports" ON reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
CREATE POLICY "Admins can view all reports" ON reports FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

DROP POLICY IF EXISTS "Admins can update reports" ON reports;
CREATE POLICY "Admins can update reports" ON reports FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Admin Policies for Videos (Allow admins to delete any video)
DROP POLICY IF EXISTS "Admins can delete any video" ON videos;
CREATE POLICY "Admins can delete any video" ON videos FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Admin Policies for Comments (Allow admins to delete any comment)
DROP POLICY IF EXISTS "Admins can delete any comment" ON comments;
CREATE POLICY "Admins can delete any comment" ON comments FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
