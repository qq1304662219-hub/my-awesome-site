-- Fix Security Warnings: Function '...' has a role mutable search_path
-- This ensures that the function executes with a fixed search_path, preventing privilege escalation attacks.

ALTER FUNCTION public.handle_purchase SET search_path = public;
ALTER FUNCTION public.tip_author SET search_path = public;
ALTER FUNCTION public.increment_views SET search_path = public;
ALTER FUNCTION public.increment_downloads SET search_path = public;
ALTER FUNCTION public.reject_withdrawal SET search_path = public;
ALTER FUNCTION public.get_user_daily_stats SET search_path = public;
ALTER FUNCTION public.create_withdrawal SET search_path = public;
