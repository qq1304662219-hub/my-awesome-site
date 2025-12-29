-- ==============================================================================
-- 管理员权限设置脚本 (Admin Setup Script)
--
-- 说明：
-- 1. 为 public.profiles 表添加 'role' 字段，用于区分普通用户和管理员。
-- 2. 将指定用户设置为管理员。
-- ==============================================================================

-- 1. 添加 role 字段 (默认为 'user')
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- 2. (可选) 更新 RLS 策略，确保只有管理员能修改 role 字段
-- 注意：这里为了简单起见，暂时不添加复杂的 RLS 策略来限制 role 的修改，
-- 但建议在生产环境中限制只有 service_role 能修改 role。

-- 3. 设置管理员
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'qq1304662219@gmail.com';

-- 示例：将所有当前用户设为 admin (仅用于开发测试！)
-- UPDATE public.profiles SET role = 'admin';
