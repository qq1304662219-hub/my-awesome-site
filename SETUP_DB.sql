-- ==============================================================================
-- 数据库和存储桶设置脚本 (Setup Database & Storage)
--
-- 说明：
-- 1. 该脚本用于创建 videos 表（存储元数据）和 videos 存储桶（存储文件）。
-- 2. 包含完整的 RLS (行级安全) 策略，确保用户只能管理自己的数据。
-- 3. 兼容性说明：虽然请求中提到 'images' 表和 'uploads' 桶，但为了保持
--    现有项目结构（AI Video）的一致性，我们继续使用 'videos' 命名。
-- ==============================================================================

-- 1. 创建 videos 表 (如果不存在)
create table if not exists public.videos (
  id uuid default uuid_generate_v4() primary key,
  title text not null,
  url text not null,
  user_id uuid references auth.users not null,
  category text default 'Other',
  description text,
  thumbnail_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. 开启 RLS (行级安全)
alter table public.videos enable row level security;

-- 3. 清理旧策略 (防止冲突)
drop policy if exists "Videos are viewable by everyone" on public.videos;
drop policy if exists "Users can insert their own videos" on public.videos;
drop policy if exists "Users can update their own videos" on public.videos;
drop policy if exists "Users can delete their own videos" on public.videos;

-- 4. 创建新策略
-- 所有人可见 (用于展示社区佳作)
create policy "Videos are viewable by everyone" 
on public.videos for select using ( true );

-- 仅登录用户可上传
create policy "Users can insert their own videos" 
on public.videos for insert with check ( auth.uid() = user_id );

-- 仅作者可修改
create policy "Users can update their own videos" 
on public.videos for update using ( auth.uid() = user_id );

-- 仅作者可删除
create policy "Users can delete their own videos" 
on public.videos for delete using ( auth.uid() = user_id );


-- ==============================================================================
-- 存储桶设置 (Storage Bucket Setup)
-- ==============================================================================

-- 1. 创建存储桶 'videos'
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;

-- 2. 清理存储桶旧策略
drop policy if exists "Public Videos Access" on storage.objects;
drop policy if exists "Authenticated Users Upload" on storage.objects;
drop policy if exists "Users Update Own Files" on storage.objects;
drop policy if exists "Users Delete Own Files" on storage.objects;

-- 3. 创建存储桶新策略
-- 允许所有人查看文件
create policy "Public Videos Access" 
on storage.objects for select using ( bucket_id = 'videos' );

-- 允许登录用户上传 (路径必须符合 user_id/...)
create policy "Authenticated Users Upload" 
on storage.objects for insert 
with check ( bucket_id = 'videos' and auth.role() = 'authenticated' );

-- 允许用户修改/删除自己的文件
create policy "Users Update Own Files" 
on storage.objects for update 
using ( bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users Delete Own Files" 
on storage.objects for delete 
using ( bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1] );
