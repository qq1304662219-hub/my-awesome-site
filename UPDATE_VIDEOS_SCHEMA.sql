-- 为 videos 表添加缺失的字段

ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS duration integer;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS resolution text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS format text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS views integer DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS category text;
