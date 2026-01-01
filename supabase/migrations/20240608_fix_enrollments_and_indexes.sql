-- Fix Remaining Warnings: Course Enrollments & Duplicate Indexes
-- 1. Ensure course_enrollments table exists (if missing) or update policies
-- 2. Drop duplicate indexes on videos table

-- ==========================================
-- 1. Course Enrollments RLS Fix
-- ==========================================
-- Check if table exists first to avoid errors
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'course_enrollments' AND table_schema = 'public') THEN
        -- Drop old permissive policies
        DROP POLICY IF EXISTS "Users can view own enrollments" ON public.course_enrollments;
        
        -- Create optimized policy
        CREATE POLICY "Users can view own enrollments" 
        ON public.course_enrollments FOR SELECT 
        USING ((select auth.uid()) = user_id);
    END IF;
END $$;

-- ==========================================
-- 2. Duplicate Index Cleanup (Videos)
-- ==========================================
-- Issue: {idx_videos_status, videos_status_idx} are identical.
-- We keep our explicit one (idx_videos_status) and drop the other.

DROP INDEX IF EXISTS public.videos_status_idx;

-- Also check for other potential duplicates mentioned in previous warnings
DROP INDEX IF EXISTS public.videos_user_id_idx;
DROP INDEX IF EXISTS public.comments_video_id_idx;
DROP INDEX IF EXISTS public.comments_user_id_idx;
DROP INDEX IF EXISTS public.likes_video_id_idx;
DROP INDEX IF EXISTS public.likes_user_id_idx;
