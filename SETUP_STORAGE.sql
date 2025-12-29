-- Create uploads bucket if not exists
insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;

-- Note: storage.objects usually has RLS enabled by default in Supabase.
-- We do not need to enable it manually, and doing so might cause permission errors.

-- Policies
-- 1. Public Access for downloads/viewing
drop policy if exists "Public Access" on storage.objects;
create policy "Public Access"
  on storage.objects for select
  using ( bucket_id = 'uploads' );

-- 2. Authenticated users can upload
drop policy if exists "Authenticated Upload" on storage.objects;
create policy "Authenticated Upload"
  on storage.objects for insert
  with check ( bucket_id = 'uploads' and auth.role() = 'authenticated' );

-- 3. Users can update/delete their own objects
drop policy if exists "Users can update own objects" on storage.objects;
create policy "Users can update own objects"
  on storage.objects for update
  using ( bucket_id = 'uploads' and auth.uid() = owner );

drop policy if exists "Users can delete own objects" on storage.objects;
create policy "Users can delete own objects"
  on storage.objects for delete
  using ( bucket_id = 'uploads' and auth.uid() = owner );
