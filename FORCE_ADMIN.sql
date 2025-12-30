-- 请将下面的 'your_email@example.com' 替换为你的实际邮箱地址
-- 然后在 Supabase 的 SQL Editor 中运行这段代码

UPDATE public.profiles
SET role = 'super_admin'
WHERE id IN (
  SELECT id FROM auth.users WHERE email = 'your_email@example.com'
);

-- 如果你想查看修改结果，可以运行：
-- SELECT * FROM public.profiles WHERE role = 'super_admin';
