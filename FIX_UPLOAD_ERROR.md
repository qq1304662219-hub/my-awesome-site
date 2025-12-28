# 修复上传失败和权限问题 (Fix Upload Error)

你在上传视频时遇到的 `new row violates row-level security policy` 错误是因为 Supabase 数据库开启了安全策略（RLS），但没有配置允许写入的规则。

请按照以下步骤修复：

1. 登录 [Supabase Dashboard](https://supabase.com/dashboard)。
2. 进入你的项目。
3. 点击左侧菜单的 **SQL Editor**。
4. 点击 **New Query**。
5. 复制并粘贴以下所有 SQL 代码：

```sql
-- ==========================================
-- 1. 修复 videos 表的权限
-- ==========================================

-- 确保表存在
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

-- 开启 RLS
alter table public.videos enable row level security;

-- 删除旧策略（防止冲突）
drop policy if exists "Videos are viewable by everyone" on public.videos;
drop policy if exists "Users can insert their own videos" on public.videos;
drop policy if exists "Users can update their own videos" on public.videos;
drop policy if exists "Users can delete their own videos" on public.videos;

-- 允许所有人查看视频
create policy "Videos are viewable by everyone"
on public.videos for select
using ( true );

-- 允许登录用户上传视频
create policy "Users can insert their own videos"
on public.videos for insert
with check ( auth.uid() = user_id );

-- 允许用户修改自己的视频
create policy "Users can update their own videos"
on public.videos for update
using ( auth.uid() = user_id );

-- 允许用户删除自己的视频
create policy "Users can delete their own videos"
on public.videos for delete
using ( auth.uid() = user_id );

-- ==========================================
-- 2. 修复 Storage (存储桶) 的权限
-- ==========================================

-- 确保 videos 存储桶存在
insert into storage.buckets (id, name, public)
values ('videos', 'videos', true)
on conflict (id) do nothing;

-- 删除旧策略（防止冲突）
drop policy if exists "Public Videos Access" on storage.objects;
drop policy if exists "Authenticated Users Upload" on storage.objects;
drop policy if exists "Users Update Own Files" on storage.objects;
drop policy if exists "Users Delete Own Files" on storage.objects;

-- 允许所有人查看文件
create policy "Public Videos Access"
on storage.objects for select
using ( bucket_id = 'videos' );

-- 允许登录用户上传文件
create policy "Authenticated Users Upload"
on storage.objects for insert
with check ( bucket_id = 'videos' and auth.role() = 'authenticated' );

-- 允许用户修改/删除自己的文件 (假设路径结构为 user_id/filename)
create policy "Users Update Own Files"
on storage.objects for update
using ( bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1] );

create policy "Users Delete Own Files"
on storage.objects for delete
using ( bucket_id = 'videos' and auth.uid()::text = (storage.foldername(name))[1] );
```

6. 点击 **Run** 按钮执行。
7. 执行成功后，回到网站刷新页面，再次尝试上传。
