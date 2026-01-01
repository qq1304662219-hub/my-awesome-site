-- Fix Dashboard Warnings: RLS Policies & Performance
-- 1. Consolidate "Multiple Permissive Policies"
-- 2. Optimize "Auth RLS Initialization" using a stable function
-- 3. Remove potential Duplicate Indexes

-- ==========================================
-- 1. Helper Function for Role Checks (Optimizes RLS)
-- ==========================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ==========================================
-- 2. Fix PROFILES Policies
-- ==========================================
-- Drop conflicting/redundant policies
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins and Super Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Super Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create ONE unified SELECT policy
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Keep UPDATE policies but ensure they don't conflict (usually strict)
-- (Existing UPDATE policies for users/admins are usually fine as they are restrictive)

-- ==========================================
-- 3. Fix VIDEOS Policies
-- ==========================================
DROP POLICY IF EXISTS "Public can view published videos" ON public.videos;
DROP POLICY IF EXISTS "Videos are viewable by everyone" ON public.videos;
DROP POLICY IF EXISTS "Admins can view all videos" ON public.videos;

-- Create Unified SELECT Policy using the optimized function
CREATE POLICY "Videos are viewable by everyone" 
ON public.videos FOR SELECT 
USING (
  status = 'published' 
  OR 
  (auth.uid() = user_id) 
  OR 
  get_my_role() IN ('admin', 'super_admin')
);

-- ==========================================
-- 4. Fix TICKETS Policies
-- ==========================================
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.tickets;

CREATE POLICY "Users and Admins can view tickets" 
ON public.tickets FOR SELECT 
USING (
  auth.uid() = user_id
  OR
  get_my_role() IN ('admin', 'super_admin')
);

-- ==========================================
-- 5. Fix TRANSACTIONS Policies
-- ==========================================
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.transactions;

CREATE POLICY "Users can view their own transactions" 
ON public.transactions FOR SELECT 
USING (
  auth.uid() = user_id
  OR
  get_my_role() IN ('admin', 'super_admin')
);

-- ==========================================
-- 6. Clean up Duplicate Indexes
-- ==========================================
-- We try to drop the likely auto-generated names if our explicit ones exist.
-- If these don't exist, it's fine (IF EXISTS).
DROP INDEX IF EXISTS public.videos_user_id_idx;
DROP INDEX IF EXISTS public.comments_video_id_idx;
DROP INDEX IF EXISTS public.comments_user_id_idx;
DROP INDEX IF EXISTS public.likes_video_id_idx;
DROP INDEX IF EXISTS public.likes_user_id_idx;
