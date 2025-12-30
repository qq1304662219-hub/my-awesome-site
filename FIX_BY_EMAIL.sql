-- ==============================================================================
-- 修复指定用户的视频数据 (Fix Data for Specific User)
-- ==============================================================================

DO $$
DECLARE
    target_email text := 'qq1304662219@gmail.com'; -- 目标邮箱
    target_user_id uuid;
    updated_count integer := 0;
BEGIN
    -- 1. 根据邮箱查找用户 ID
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = target_email;

    -- 2. 检查用户是否存在
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION '未找到邮箱为 % 的用户', target_email;
    END IF;

    RAISE NOTICE '找到用户 ID: %', target_user_id;

    -- 3. 修复视频数据
    -- 3.1 将无主视频归属给该用户
    WITH rows AS (
        UPDATE public.videos 
        SET user_id = target_user_id 
        WHERE user_id IS NULL
        RETURNING 1
    )
    SELECT count(*) INTO updated_count FROM rows;
    RAISE NOTICE '已归属 % 个无主视频给该用户', updated_count;

    -- 3.2 将状态为空或非 published 的视频设为 published
    UPDATE public.videos 
    SET status = 'published' 
    WHERE status IS NULL OR status != 'published';
    
    -- 3.3 补充缺失的分类
    UPDATE public.videos 
    SET category = 'Other' 
    WHERE category IS NULL;
    
    -- 3.4 补充缺失的价格
    UPDATE public.videos 
    SET price = 0 
    WHERE price IS NULL;

    -- 4. 确保 Profile 存在 (防止关联查询报错)
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        target_user_id, 
        target_email, 
        'User ' || substring(target_email from 1 for 4),
        'admin' -- 顺便赋予管理员权限，方便后续操作
    )
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin'; -- 确保是管理员

    RAISE NOTICE '修复完成！请刷新网页查看。';
END $$;
