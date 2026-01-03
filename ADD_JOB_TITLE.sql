-- Add job_title column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS job_title TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_job_title ON public.profiles(job_title);

-- Optional: Populate some data if needed (the JS script handles this randomly)
-- UPDATE public.profiles SET job_title = 'AI 艺术家' WHERE job_title IS NULL;
