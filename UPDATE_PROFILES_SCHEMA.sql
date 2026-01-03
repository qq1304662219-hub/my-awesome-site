-- Add missing columns for creator filters
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS badges text[] DEFAULT '{}';

-- Create index for faster filtering
CREATE INDEX IF NOT EXISTS idx_profiles_badges ON public.profiles USING GIN (badges);
CREATE INDEX IF NOT EXISTS idx_profiles_job_title ON public.profiles (job_title);
CREATE INDEX IF NOT EXISTS idx_profiles_location ON public.profiles (location);
CREATE INDEX IF NOT EXISTS idx_profiles_is_verified ON public.profiles (is_verified);
