-- Secure functions by setting explicit search_path
-- This prevents malicious users from hijacking the function execution context

ALTER FUNCTION public.handle_new_user() SET search_path = public;
ALTER FUNCTION public.create_request(title text, description text, budget integer, deadline timestamp with time zone) SET search_path = public;
ALTER FUNCTION public.enroll_course(p_course_id uuid) SET search_path = public;
ALTER FUNCTION public.get_my_role() SET search_path = public;
ALTER FUNCTION public.increment_downloads(video_id uuid) SET search_path = public;
ALTER FUNCTION public.accept_submission(p_submission_id uuid) SET search_path = public;
ALTER FUNCTION public.tip_author(p_author_id uuid, p_video_id uuid, p_amount integer) SET search_path = public;
ALTER FUNCTION public.handle_recharge(p_amount integer, p_payment_method text) SET search_path = public;
ALTER FUNCTION public.create_withdrawal(p_amount integer, p_payment_method text, p_account_info jsonb) SET search_path = public;
