-- Ensure video classification columns exist
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS style text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS ratio text;

-- Add indexes for better filtering performance
CREATE INDEX IF NOT EXISTS idx_videos_category ON public.videos(category);
CREATE INDEX IF NOT EXISTS idx_videos_style ON public.videos(style);
CREATE INDEX IF NOT EXISTS idx_videos_ratio ON public.videos(ratio);
