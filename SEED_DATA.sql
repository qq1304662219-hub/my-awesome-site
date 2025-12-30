-- 自动获取第一个用户ID并插入数据
-- 如果报错 "请先在网站上注册至少一个用户"，请先去网站注册一个账号

DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- 1. 获取第一个用户的 ID (从 auth.users)
    SELECT id INTO target_user_id FROM auth.users LIMIT 1;

    -- 2. 检查是否存在用户
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION '未找到用户！请先在网站上注册至少一个账号 (Sign Up)，然后再运行此脚本。';
    END IF;

    -- 3. 确保该用户在 profiles 表中有记录 (防止外键错误)
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        target_user_id, 
        '演示用户', 
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'
    )
    ON CONFLICT (id) DO NOTHING;

    -- 4. 插入视频数据
    INSERT INTO public.videos (
        title, 
        description, 
        url, 
        thumbnail_url, 
        duration, 
        resolution, 
        format, 
        views, 
        likes, 
        price, 
        category,
        user_id,
        created_at
    ) VALUES 
    (
        '赛博朋克城市夜景', 
        '未来城市的霓虹灯光与飞行汽车，充满科技感的夜景素材。', 
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 
        'https://images.unsplash.com/photo-1533134486753-c833f0ed4866?q=80&w=2070&auto=format&fit=crop', 
        15, 
        '4k', 
        'mp4', 
        1205, 
        342, 
        80, 
        '科幻',
        target_user_id,
        NOW() - INTERVAL '1 day'
    ),
    (
        '宁静的森林清晨', 
        '阳光穿过树叶洒在地面上，鸟鸣声清脆悦耳，适合放松和冥想。', 
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4', 
        'https://images.unsplash.com/photo-1448375240586-dfd8d395ea6c?q=80&w=2070&auto=format&fit=crop', 
        30, 
        '1080p', 
        'mp4', 
        890, 
        156, 
        50, 
        '自然',
        target_user_id,
        NOW() - INTERVAL '2 days'
    ),
    (
        '抽象流体艺术', 
        '色彩斑斓的流体在水中扩散，形成独特的抽象图案，极具视觉冲击力。', 
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4', 
        'https://images.unsplash.com/photo-1541701494587-cb58502866ab?q=80&w=2070&auto=format&fit=crop', 
        10, 
        '4k', 
        'mov', 
        2300, 
        890, 
        120, 
        '抽象',
        target_user_id,
        NOW() - INTERVAL '3 days'
    ),
    (
        '繁华都市延时摄影', 
        '记录城市从白天到黑夜的变化，车水马龙，流光溢彩。', 
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4', 
        'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?q=80&w=2173&auto=format&fit=crop', 
        45, 
        '4k', 
        'mp4', 
        5600, 
        1200, 
        150, 
        '城市',
        target_user_id,
        NOW() - INTERVAL '4 days'
    ),
    (
        '深海奇观', 
        '探索神秘的深海世界，发光的生物和奇异的珊瑚礁。', 
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 
        'https://images.unsplash.com/photo-1682687220742-aba13b6e50ba?q=80&w=2070&auto=format&fit=crop', 
        60, 
        '1080p', 
        'mp4', 
        340, 
        89, 
        60, 
        '自然',
        target_user_id,
        NOW() - INTERVAL '5 days'
    ),
    (
        'AI 生成的人像', 
        '逼真的 AI 生成人像，微表情生动自然，适用于虚拟主播等场景。', 
        'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 
        'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1964&auto=format&fit=crop', 
        12, 
        '4k', 
        'mov', 
        4500, 
        900, 
        200, 
        '人物',
        target_user_id,
        NOW() - INTERVAL '6 days'
    );

    RAISE NOTICE '数据插入成功！已归属给用户 ID: %', target_user_id;
END $$;
