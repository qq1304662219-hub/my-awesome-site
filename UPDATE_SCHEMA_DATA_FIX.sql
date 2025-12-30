-- 修复视频数据完整性
-- 1. 将 status 为空的记录设置为 'published'
UPDATE public.videos
SET status = 'published'
WHERE status IS NULL OR status = '';

-- 2. 确保 created_at 有值
UPDATE public.videos
SET created_at = NOW()
WHERE created_at IS NULL;

-- 3. 确保 views 和 downloads 有默认值
UPDATE public.videos
SET views = 0
WHERE views IS NULL;

UPDATE public.videos
SET downloads = 0
WHERE downloads IS NULL;

-- 4. 确保 price 有默认值
UPDATE public.videos
SET price = 0
WHERE price IS NULL;

-- 5. 确保 user_id 存在 (如果可能的话，这通常比较难修复，除非有一个默认管理员账号)
-- 这里假设数据已经有了 user_id，如果没有，可能需要手动处理或分配给第一个用户
-- 仅作为示例：如果 user_id 为空，尝试分配给第一个找到的 admin 用户（如果有）
-- DO $$
-- DECLARE
--   admin_id uuid;
-- BEGIN
--   SELECT id INTO admin_id FROM auth.users LIMIT 1;
--   IF admin_id IS NOT NULL THEN
--     UPDATE public.videos SET user_id = admin_id WHERE user_id IS NULL;
--   END IF;
-- END $$;
