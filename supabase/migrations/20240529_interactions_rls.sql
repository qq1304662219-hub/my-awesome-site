-- 1. Create tables if they don't exist (Idempotent)
-- We use IF NOT EXISTS to avoid "relation already exists" errors
create table if not exists public.likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, video_id)
);

create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable RLS (Safe to run multiple times)
alter table public.likes enable row level security;
alter table public.comments enable row level security;

-- 3. Drop existing policies to avoid "policy already exists" errors
drop policy if exists "Likes are viewable by everyone" on public.likes;
drop policy if exists "Users can insert their own likes" on public.likes;
drop policy if exists "Users can delete their own likes" on public.likes;

drop policy if exists "Comments are viewable by everyone" on public.comments;
drop policy if exists "Users can insert their own comments" on public.comments;
drop policy if exists "Users can delete their own comments" on public.comments;

-- 4. Re-create policies
-- Likes Policies
create policy "Likes are viewable by everyone"
  on public.likes for select
  using ( true );

create policy "Users can insert their own likes"
  on public.likes for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own likes"
  on public.likes for delete
  using ( auth.uid() = user_id );

-- Comments Policies
create policy "Comments are viewable by everyone"
  on public.comments for select
  using ( true );

create policy "Users can insert their own comments"
  on public.comments for insert
  with check ( auth.uid() = user_id );

create policy "Users can delete their own comments"
  on public.comments for delete
  using ( auth.uid() = user_id );
