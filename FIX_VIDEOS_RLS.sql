-- 确保 videos 表对所有人可见
alter table public.videos enable row level security;

drop policy if exists "Videos are viewable by everyone" on public.videos;

create policy "Videos are viewable by everyone"
  on public.videos for select
  using ( true );

-- 允许登录用户上传视频 (如果还没设置)
drop policy if exists "Users can insert their own videos" on public.videos;

create policy "Users can insert their own videos"
  on public.videos for insert
  with check ( auth.uid() = user_id );

-- 允许用户更新自己的视频
drop policy if exists "Users can update their own videos" on public.videos;

create policy "Users can update their own videos"
  on public.videos for update
  using ( auth.uid() = user_id );
