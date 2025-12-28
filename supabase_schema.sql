-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Create Profiles table (public user info)
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- Trigger to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 2. Update Videos table (add category and description if missing)
-- Assuming 'videos' table exists: id, title, url, user_id, created_at
alter table public.videos 
add column if not exists description text,
add column if not exists category text default 'Other',
add column if not exists thumbnail_url text;

-- 3. Create Likes table
create table public.likes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  video_id uuid references public.videos not null,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  unique(user_id, video_id)
);

alter table public.likes enable row level security;

create policy "Likes are viewable by everyone"
  on public.likes for select
  using ( true );

create policy "Authenticated users can insert likes"
  on public.likes for insert
  with check ( auth.role() = 'authenticated' );

create policy "Users can delete their own likes"
  on public.likes for delete
  using ( auth.uid() = user_id );

-- 4. Create Comments table
create table public.comments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  video_id uuid references public.videos not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

alter table public.comments enable row level security;

create policy "Comments are viewable by everyone"
  on public.comments for select
  using ( true );

create policy "Authenticated users can insert comments"
  on public.comments for insert
  with check ( auth.role() = 'authenticated' );

create policy "Users can delete their own comments"
  on public.comments for delete
  using ( auth.uid() = user_id );

-- 5. Helper function to get video stats (optional but helpful)
create or replace view public.video_stats as
  select
    v.id as video_id,
    count(distinct l.id) as likes_count,
    count(distinct c.id) as comments_count
  from public.videos v
  left join public.likes l on v.id = l.video_id
  left join public.comments c on v.id = c.video_id
  group by v.id;
