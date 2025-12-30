-- Add new columns for faceted search
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS style text,
ADD COLUMN IF NOT EXISTS ratio text;

-- Create an index for performance
CREATE INDEX IF NOT EXISTS videos_style_idx ON public.videos (style);
CREATE INDEX IF NOT EXISTS videos_ratio_idx ON public.videos (ratio);

-- Update existing videos with random values for demonstration
UPDATE public.videos 
SET 
  style = (ARRAY['Sci-Fi', 'Chinese', 'Anime', 'Realistic', 'Abstract'])[floor(random() * 5 + 1)],
  ratio = (ARRAY['16:9', '9:16'])[floor(random() * 2 + 1)]
WHERE style IS NULL OR ratio IS NULL;
