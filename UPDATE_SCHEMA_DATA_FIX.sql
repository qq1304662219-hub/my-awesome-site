-- 1. 确保 downloads 列存在 (如果不存在则添加)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'downloads') THEN
        ALTER TABLE public.videos ADD COLUMN downloads integer DEFAULT 0;
    END IF;
END $$;

-- 2. 将 status 为空的记录设置为 'published'
UPDATE public.videos
SET status = 'published'
WHERE status IS NULL OR status = '';

-- 3. 确保 created_at 有值
UPDATE public.videos
SET created_at = NOW()
WHERE created_at IS NULL;

-- 4. 确保 views 和 downloads 有默认值
UPDATE public.videos
SET views = 0
WHERE views IS NULL;

UPDATE public.videos
SET downloads = 0
WHERE downloads IS NULL;

-- 5. 确保 price 有默认值
UPDATE public.videos
SET price = 0
WHERE price IS NULL;

-- 6. 确保 likes 有默认值 (虽然前端暂时没用，但数据库有这个字段)
UPDATE public.videos
SET likes = 0
WHERE likes IS NULL;
