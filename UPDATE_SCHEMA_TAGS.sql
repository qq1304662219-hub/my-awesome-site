
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS style text DEFAULT 'Other';
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS ratio text DEFAULT '16:9';
