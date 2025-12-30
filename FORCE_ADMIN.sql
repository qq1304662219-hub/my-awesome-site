-- ⚠️ 重要：请将下面的 'your_email@example.com' 替换为你的登录邮箱！
-- 然后点击右下角的 "Run" 按钮运行

-- 1. 修复无限递归 bug (创建一个绕过 RLS 的函数)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER -- 关键：使用超级权限运行，绕过 RLS
SET search_path = public
AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$;

-- 2. 强制提权 (直接修改数据，不走 RLS 策略)
UPDATE public.profiles
SET role = 'super_admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'your_email@example.com' -- ⬅️ 请替换这里的邮箱
);

-- 3. 如果上面的 UPDATE 没生效（可能因为没找到用户），尝试针对所有用户（慎用，仅限单人开发环境）
-- UPDATE public.profiles SET role = 'super_admin'; 

-- 4. 验证结果
SELECT auth.users.email, profiles.role 
FROM profiles 
JOIN auth.users ON profiles.id = auth.users.id
WHERE auth.users.email = 'your_email@example.com'; -- ⬅️ 请替换这里的邮箱
