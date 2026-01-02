-- Create Creator Applications Table
CREATE TABLE IF NOT EXISTS creator_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    portfolio_url TEXT,
    bio TEXT,
    social_links JSONB,
    status TEXT DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE creator_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own applications" 
ON creator_applications FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own applications" 
ON creator_applications FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all applications" 
ON creator_applications FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Admins can update applications" 
ON creator_applications FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role IN ('admin', 'super_admin')
  )
);
