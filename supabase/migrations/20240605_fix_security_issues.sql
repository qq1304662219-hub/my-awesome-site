-- Fix security issues identified by Supabase
-- 1. Set search_path = public for all SECURITY DEFINER functions to prevent search_path hijacking
-- 2. Set security_invoker = true for views to ensure RLS is applied

-- Use a DO block to safely check if functions exist before altering them
DO $$
BEGIN
    -- 1. handle_new_user()
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'handle_new_user') THEN
        ALTER FUNCTION public.handle_new_user() SET search_path = public;
    END IF;

    -- 2. accept_submission(p_submission_id uuid)
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'accept_submission') THEN
        ALTER FUNCTION public.accept_submission(uuid) SET search_path = public;
    END IF;

    -- 3. tip_author(p_video_id uuid, p_amount numeric)
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'tip_author') THEN
        ALTER FUNCTION public.tip_author(uuid, numeric) SET search_path = public;
    END IF;

    -- 4. handle_recharge(p_amount numeric)
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'handle_recharge') THEN
        ALTER FUNCTION public.handle_recharge(numeric) SET search_path = public;
    END IF;

    -- 5. create_withdrawal(p_amount numeric, p_alipay_account text)
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'create_withdrawal') THEN
        ALTER FUNCTION public.create_withdrawal(numeric, text) SET search_path = public;
    END IF;

    -- 6. create_request(p_title text, p_description text, p_budget numeric)
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'create_request') THEN
        ALTER FUNCTION public.create_request(text, text, numeric) SET search_path = public;
    END IF;

    -- 7. enroll_course(p_course_id bigint)
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'enroll_course') THEN
        ALTER FUNCTION public.enroll_course(bigint) SET search_path = public;
    END IF;

    -- 8. get_my_role()
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'get_my_role') THEN
        ALTER FUNCTION public.get_my_role() SET search_path = public;
    END IF;

    -- 9. increment_downloads(video_id uuid)
    -- Note: We check for UUID version specifically
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'increment_downloads' AND p.proargtypes[0] = 'uuid'::regtype) THEN
        ALTER FUNCTION public.increment_downloads(uuid) SET search_path = public;
    END IF;

    -- 10. increment_views(video_id uuid)
    -- Note: We check for UUID version specifically
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'increment_views' AND p.proargtypes[0] = 'uuid'::regtype) THEN
        ALTER FUNCTION public.increment_views(uuid) SET search_path = public;
    END IF;

    -- 11. ban_user(p_user_id uuid, p_reason text)
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'ban_user') THEN
        ALTER FUNCTION public.ban_user(uuid, text) SET search_path = public;
    END IF;

    -- 12. unban_user(p_user_id uuid)
    IF EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname = 'unban_user') THEN
        ALTER FUNCTION public.unban_user(uuid) SET search_path = public;
    END IF;

    -- Fix View security
    IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'user_stats' AND schemaname = 'public') THEN
        ALTER VIEW public.user_stats SET (security_invoker = true);
    END IF;
END $$;
