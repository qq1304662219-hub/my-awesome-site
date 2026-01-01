# 修复指南 (Fix Guide)

## 1. 修复数据库权限 (Fix Database Permissions)

由于 Supabase 的 RLS (行级安全策略) 可能阻止了视频上传和管理员查看，请执行以下 SQL 脚本。

1. 打开 Supabase 后台。
2. 进入 **SQL Editor**。
3. 复制项目根目录下的 `SUPABASE_FIXES.sql` 文件内容。
4. 粘贴到 SQL Editor 中并运行。

> **注意**: 脚本末尾有一行注释掉的 SQL，用于将你的账号设置为管理员。请将 `YOUR_USER_ID_HERE` 替换为你的用户 ID (可以在 `auth.users` 表中找到) 并运行该行。

## 2. 检查管理员后台 (Check Admin Dashboard)

修复权限后，刷新页面：
1. 确保你的账号 `role` 字段已在 `profiles` 表中设置为 `admin` 或 `super_admin`。
2. 访问 `/admin/videos`，你应该能看到所有待审核的视频。

## 3. 检查视频上传 (Check Video Upload)

1. 登录账号。
2. 访问 `/dashboard/upload`。
3. 尝试上传视频。如果之前因为权限失败，现在应该可以成功。

## 4. 部署更新 (Deploy Updates)

代码已包含最新的修复和优化。请推送到 GitHub 并等待 Vercel 部署完成。

```bash
git add .
git commit -m "fix: supabase policies and admin visibility"
git push
```
