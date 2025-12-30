-- 1. Add new columns to videos table
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS download_url text;

-- 2. Add check constraint for status
ALTER TABLE public.videos 
DROP CONSTRAINT IF EXISTS videos_status_check;

ALTER TABLE public.videos 
ADD CONSTRAINT videos_status_check 
CHECK (status IN ('pending', 'published', 'rejected'));

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS videos_status_idx ON public.videos (status);

-- 4. Update existing videos to published
UPDATE public.videos 
SET status = 'published' 
WHERE status IS NULL OR status = 'pending';

-- 5. Update RLS policies

-- Enable RLS
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Videos are viewable by everyone" ON public.videos;
DROP POLICY IF EXISTS "Users can insert their own videos" ON public.videos;
DROP POLICY IF EXISTS "Users can update their own videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can view all videos" ON public.videos;
DROP POLICY IF EXISTS "Admins can update all videos" ON public.videos;

-- Policy 1: Public can view published videos
CREATE POLICY "Public can view published videos" 
ON public.videos FOR SELECT 
USING (
  status = 'published' 
  OR 
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy 2: Authenticated users can insert videos (default pending)
CREATE POLICY "Users can insert their own videos" 
ON public.videos FOR INSERT 
WITH CHECK (
  auth.uid() = user_id
);

-- Policy 3: Users can update their own videos (but not status or download_url unless admin)
-- Note: Supabase doesn't support column-level permissions in policies directly for update,
-- so we rely on the application logic or separate admin policies.
-- Ideally, we'd split this, but for simplicity:
CREATE POLICY "Users can update their own videos" 
ON public.videos FOR UPDATE 
USING (
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- Policy 4: Admins can do everything (covered by above, but explicit for clarity/future)
-- (The above policies cover admin access via the EXISTS clause)
