-- Add missing classification columns
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS movement text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS duration_range text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS fps_range text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS resolution text;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_videos_movement ON public.videos(movement);
CREATE INDEX IF NOT EXISTS idx_videos_duration_range ON public.videos(duration_range);
CREATE INDEX IF NOT EXISTS idx_videos_fps_range ON public.videos(fps_range);
CREATE INDEX IF NOT EXISTS idx_videos_resolution ON public.videos(resolution);
