-- Fix Remaining 13 Auth RLS Initialization Warnings
-- Tables: cart_items, orders, order_items, messages, requests, submissions, reports, videos

-- ==========================================
-- 1. Dynamic Cleanup of OLD Policies
-- ==========================================
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop policies for target tables to ensure a clean slate
  FOR r IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE tablename IN ('cart_items', 'orders', 'order_items', 'messages', 'requests', 'submissions', 'reports')
    AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
  
  -- Drop specific video policy if it exists (to fix the auth.role() warning)
  EXECUTE 'DROP POLICY IF EXISTS "Users can upload videos" ON public.videos';
END $$;

-- ==========================================
-- 2. Cart Items
-- ==========================================
-- Fix: Wrapped auth.uid() in select
CREATE POLICY "Users can manage own cart" 
ON public.cart_items FOR ALL 
USING ((select auth.uid()) = user_id);

-- ==========================================
-- 3. Orders
-- ==========================================
-- Fix: Wrapped auth.uid() in select
CREATE POLICY "Users can view own orders" 
ON public.orders FOR SELECT 
USING ((select auth.uid()) = user_id);

-- ==========================================
-- 4. Order Items
-- ==========================================
-- Fix: Wrapped auth.uid() in select
CREATE POLICY "Users can view own order items" 
ON public.order_items FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.orders 
    WHERE orders.id = order_items.order_id 
    AND orders.user_id = (select auth.uid())
  )
);

-- ==========================================
-- 5. Messages
-- ==========================================
-- Fix: Wrapped auth.uid() in select
CREATE POLICY "Users can view their own messages" 
ON public.messages FOR SELECT 
USING ((select auth.uid()) = sender_id OR (select auth.uid()) = receiver_id);

CREATE POLICY "Users can send messages" 
ON public.messages FOR INSERT 
WITH CHECK ((select auth.uid()) = sender_id);

-- ==========================================
-- 6. Requests
-- ==========================================
CREATE POLICY "Requests are viewable by everyone" 
ON public.requests FOR SELECT 
USING (true);

-- Fix: Wrapped auth.uid() in select
CREATE POLICY "Users can insert their own requests" 
ON public.requests FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

CREATE POLICY "Users can update their own requests" 
ON public.requests FOR UPDATE 
USING ((select auth.uid()) = user_id);

-- ==========================================
-- 7. Submissions
-- ==========================================
CREATE POLICY "Submissions are viewable by everyone" 
ON public.submissions FOR SELECT 
USING (true);

-- Fix: Wrapped auth.uid() in select
CREATE POLICY "Users can insert their own submissions" 
ON public.submissions FOR INSERT 
WITH CHECK ((select auth.uid()) = user_id);

-- ==========================================
-- 8. Reports
-- ==========================================
-- Fix: Wrapped auth.uid() in select
CREATE POLICY "Users can insert reports" 
ON public.reports FOR INSERT 
WITH CHECK ((select auth.uid()) = reporter_id);

-- Fix: Wrapped auth.uid() in select
CREATE POLICY "Admins can view all reports" 
ON public.reports FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (select auth.uid()) 
    AND (role IN ('admin', 'super_admin') OR is_admin IS TRUE)
  )
);

CREATE POLICY "Admins can update reports" 
ON public.reports FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (select auth.uid()) 
    AND (role IN ('admin', 'super_admin') OR is_admin IS TRUE)
  )
);

-- ==========================================
-- 9. Videos (Fix Upload Policy)
-- ==========================================
-- Fix: Wrapped auth.role() and auth.uid() in select
CREATE POLICY "Users can upload videos" 
ON public.videos FOR INSERT 
WITH CHECK (
  (select auth.role()) = 'authenticated' 
  AND 
  user_id = (select auth.uid())
);
