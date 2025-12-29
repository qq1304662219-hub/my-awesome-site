
-- Create likes table if not exists
create table if not exists public.likes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, video_id)
);

-- Create comments table if not exists
create table if not exists public.comments (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  video_id uuid references public.videos(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.likes enable row level security;
alter table public.comments enable row level security;

-- Likes Policies
drop policy if exists "Likes are viewable by everyone" on public.likes;
create policy "Likes are viewable by everyone"
  on public.likes for select
  using ( true );

drop policy if exists "Users can insert their own likes" on public.likes;
create policy "Users can insert their own likes"
  on public.likes for insert
  with check ( auth.uid() = user_id );

drop policy if exists "Users can delete their own likes" on public.likes;
create policy "Users can delete their own likes"
  on public.likes for delete
  using ( auth.uid() = user_id );

-- Comments Policies
drop policy if exists "Comments are viewable by everyone" on public.comments;
create policy "Comments are viewable by everyone"
  on public.comments for select
  using ( true );

drop policy if exists "Users can insert their own comments" on public.comments;
create policy "Users can insert their own comments"
  on public.comments for insert
  with check ( auth.uid() = user_id );

drop policy if exists "Users can delete their own comments" on public.comments;
create policy "Users can delete their own comments"
  on public.comments for delete
  using ( auth.uid() = user_id );
