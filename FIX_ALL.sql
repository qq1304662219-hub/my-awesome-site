-- 1. 修复表结构 (Schema)
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS thumbnail_url text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS duration integer;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS resolution text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS format text;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS views integer DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS category text;

-- 2. 准备用户数据和修复关联
DO $$
DECLARE
    target_user_id uuid;
BEGIN
    -- 2.1 获取第一个用户的 ID (从 auth.users)
    SELECT id INTO target_user_id FROM auth.users LIMIT 1;

    -- 2.2 检查是否存在用户
    IF target_user_id IS NULL THEN
        RAISE EXCEPTION '未找到用户！请先在网站上注册至少一个账号 (Sign Up)，然后再运行此脚本。';
    END IF;

    -- 2.3 确保该用户在 profiles 表中有记录
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        target_user_id, 
        '演示用户', 
        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'
    )
    ON CONFLICT (id) DO NOTHING;

    -- 2.4 修复现有视频数据的 user_id (防止外键错误)
    -- 将所有 user_id 不在 profiles 表中的视频，归属给 target_user_id
    UPDATE public.videos 
    SET user_id = target_user_id 
    WHERE user_id NOT IN (SELECT id FROM public.profiles);

    -- 2.5 尝试添加外键关联到 profiles (用于前端关联查询)
    -- 如果已经存在引用 auth.users 的外键，这里再加一个引用 profiles 的外键也是可以的，
    -- 只要数据一致。Supabase PostgREST 需要这个外键来解析 profiles:user_id。
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'videos_profiles_fkey'
    ) THEN
        ALTER TABLE public.videos 
        ADD CONSTRAINT videos_profiles_fkey 
        FOREIGN KEY (user_id) 
        REFERENCES public.profiles (id);
    END IF;

    -- 3. 插入测试数据 (Seed Data)
    -- 只有当没有视频时才插入
    IF NOT EXISTS (SELECT 1 FROM public.videos LIMIT 1) THEN
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
            'Technology',
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
            'Nature',
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
            'Abstract',
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
            'Urban',
            target_user_id,
            NOW() - INTERVAL '4 days'
        ),
        (
            '山脉云海航拍', 
            '壮丽的山脉被云海环绕，日出时分的金光洒在山顶，美不胜收。', 
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4', 
            'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2070&auto=format&fit=crop', 
            25, 
            '4k', 
            'mp4', 
            3400, 
            670, 
            100, 
            'Nature',
            target_user_id,
            NOW() - INTERVAL '5 days'
        ),
        (
            '极简主义室内设计', 
            '现代极简风格的室内空间展示，线条流畅，光影柔和。', 
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4', 
            'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=2070&auto=format&fit=crop', 
            20, 
            '1080p', 
            'mp4', 
            1500, 
            230, 
            60, 
            'Other',
            target_user_id,
            NOW() - INTERVAL '6 days'
        ),
        (
            '科技感粒子特效', 
            '动态粒子组成的科技感背景，适合作为视频片头或背景素材。', 
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4', 
            'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop', 
            12, 
            '4k', 
            'mov', 
            4100, 
            980, 
            90, 
            'Technology',
            target_user_id,
            NOW() - INTERVAL '7 days'
        ),
        (
            '可爱宠物合集', 
            '猫咪和狗狗的有趣瞬间，治愈系视频素材。', 
            'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4', 
            'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1974&auto=format&fit=crop', 
            60, 
            '1080p', 
            'mp4', 
            8900, 
            2500, 
            40, 
            'Animals',
            target_user_id,
            NOW() - INTERVAL '8 days'
        );
    END IF;
    
    -- 4. 修复已有数据的分类 (从中文转为英文ID)
    UPDATE public.videos SET category = 'Technology' WHERE category = '科幻' OR category = '科技';
    UPDATE public.videos SET category = 'Nature' WHERE category = '自然';
    UPDATE public.videos SET category = 'Abstract' WHERE category = '抽象';
    UPDATE public.videos SET category = 'Urban' WHERE category = '城市';
    UPDATE public.videos SET category = 'Animals' WHERE category = '动物';
    UPDATE public.videos SET category = 'Other' WHERE category = '生活';
    
END $$;

-- 5. 修复权限 (RLS)
-- 确保 videos 表对所有人可见
alter table public.videos enable row level security;

drop policy if exists "Videos are viewable by everyone" on public.videos;
create policy "Videos are viewable by everyone"
  on public.videos for select
  using ( true );

-- 允许登录用户上传视频
drop policy if exists "Users can insert their own videos" on public.videos;
create policy "Users can insert their own videos"
  on public.videos for insert
  with check ( auth.uid() = user_id );

-- 允许用户更新自己的视频
drop policy if exists "Users can update their own videos" on public.videos;
create policy "Users can update their own videos"
  on public.videos for update
  using ( auth.uid() = user_id );

-- 确保 profiles 表对所有人可见 (用于关联查询作者信息)
alter table public.profiles enable row level security;

drop policy if exists "Profiles are viewable by everyone" on public.profiles;
create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using ( true );