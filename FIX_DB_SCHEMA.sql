-- ==============================================================================
-- 数据库修复与初始化脚本 (Fix & Init Database Script)
--
-- 说明：
-- 1. 此脚本会创建缺失的 'profiles' 表。
-- 2. 设置自动创建用户配置文件的触发器。
-- 3. 添加管理员字段 'role'。
-- 4. 修复 videos 表的关联外键。
-- ==============================================================================

-- 1. 创建 profiles 表 (如果不存在)
create table if not exists public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  avatar_url text,
  role text default 'user', -- 添加角色字段
  updated_at timestamp with time zone
);

-- 2. 开启 RLS
alter table public.profiles enable row level security;

-- 3. 创建访问策略 (防止策略已存在报错，先删除旧的)
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;
drop policy if exists "Users can insert their own profile." on public.profiles;
drop policy if exists "Users can update own profile." on public.profiles;

create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on public.profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- 4. 设置自动触发器 (当新用户注册时，自动在 profiles 表创建记录)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    'user'
  );
  return new;
end;
$$ language plpgsql security definer;

-- 重新创建触发器
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- 5. 补救措施：如果已有用户但没有 profile，手动插入
insert into public.profiles (id, email, role)
select id, email, 'user'
from auth.users
where id not in (select id from public.profiles);

-- 6. 设置管理员
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'qq1304662219@gmail.com';