-- ==============================================================================
-- 关注功能表结构 (Follows Table Schema)
--
-- 说明：
-- 1. 创建 follows 表用于存储用户关注关系。
-- 2. 设置 RLS 策略。
-- ==============================================================================

-- 1. 创建 follows 表
create table if not exists public.follows (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references public.profiles(id) not null,
  following_id uuid references public.profiles(id) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(follower_id, following_id)
);

-- 2. 开启 RLS
alter table public.follows enable row level security;

-- 3. 创建访问策略
-- 所有人可见 (用于显示粉丝数/关注数)
create policy "Follows are viewable by everyone"
  on public.follows for select
  using ( true );

-- 登录用户可以关注别人
create policy "Users can follow others"
  on public.follows for insert
  with check ( auth.uid() = follower_id );

-- 登录用户可以取消关注
create policy "Users can unfollow"
  on public.follows for delete
  using ( auth.uid() = follower_id );

-- 4. (可选) 添加粉丝数计数器到 profiles 表 (需要创建触发器，暂时省略，使用实时查询)
