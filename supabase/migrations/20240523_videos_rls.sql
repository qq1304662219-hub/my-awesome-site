-- Enable RLS
alter table public.videos enable row level security;

-- Drop existing policies if any
drop policy if exists "Videos are viewable by everyone" on public.videos;
drop policy if exists "Users can insert their own videos" on public.videos;
drop policy if exists "Users can update their own videos" on public.videos;
drop policy if exists "Users can delete their own videos" on public.videos;

-- Create policies
create policy "Videos are viewable by everyone"
on public.videos for select
using ( true );

create policy "Users can insert their own videos"
on public.videos for insert
with check ( auth.uid() = user_id );

create policy "Users can update their own videos"
on public.videos for update
using ( auth.uid() = user_id );

create policy "Users can delete their own videos"
on public.videos for delete
using ( auth.uid() = user_id );
