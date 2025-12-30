-- ⚠️ 请将下面的 'your_email@example.com' 替换为你的真实登录邮箱
-- 然后点击 Run

-- 1. 强制将该邮箱对应的用户设置为超级管理员
UPDATE public.profiles
SET role = 'super_admin'
FROM auth.users
WHERE profiles.id = auth.users.id
AND auth.users.email = 'your_email@example.com'; -- ⬅️ 在这里填入你的邮箱

-- 2. 验证是否成功 (查看 role 列是否变成了 super_admin)
SELECT auth.users.email, profiles.role 
FROM profiles 
JOIN auth.users ON profiles.id = auth.users.id
WHERE auth.users.email = 'your_email@example.com'; -- ⬅️ 在这里填入你的邮箱
