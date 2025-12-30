-- 1. 将 YOUR_EMAIL_HERE 替换为你的邮箱地址
-- 2. 复制整段代码
-- 3. 在 Supabase Dashboard -> SQL Editor 中运行

UPDATE profiles
SET role = 'admin'
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'YOUR_EMAIL_HERE'
);

-- 验证是否修改成功
SELECT * FROM profiles 
WHERE id = (
  SELECT id 
  FROM auth.users 
  WHERE email = 'YOUR_EMAIL_HERE'
);