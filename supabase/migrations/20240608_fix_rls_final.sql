-- Fix Remaining 66 Warnings: Deep Clean & Optimization
-- 1. Drop ALL existing policies for key tables to resolve "Multiple Permissive Policies"
-- 2. Re-create policies using "(select auth.uid())" to resolve "Auth RLS Initialization"
-- 3. Ensure no duplicate policies remain

-- ==========================================
-- 1. Dynamic Cleanup of OLD Policies
-- ==========================================
DO $$
DECLARE
  r RECORD;
BEGIN
  -- Loop through all policies for our key tables and drop them
  FOR r IN 
    SELECT schemaname, tablename, policyname 
    FROM pg_policies 
    WHERE tablename IN ('profiles', 'videos', 'tickets', 'transactions', 'comments', 'likes', 'notifications', 'withdrawals')
    AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- ==========================================
-- 2. Re-create Policies for PROFILES
-- ==========================================
-- View: Everyone can see profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Update: Users can update own, Super Admins can update all
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (
  id = (select auth.uid()) 
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (select auth.uid()) 
    AND role = 'super_admin'
  )
);

-- ==========================================
-- 3. Re-create Policies for VIDEOS
-- ==========================================
-- View: Published (Public) OR Own (User) OR Admin/SuperAdmin
CREATE POLICY "Videos are viewable" 
ON public.videos FOR SELECT 
USING (
  status = 'published' 
  OR 
  user_id = (select auth.uid())
  OR 
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (select auth.uid()) 
    AND role IN ('admin', 'super_admin')
  )
);

-- Insert: Authenticated users can upload
CREATE POLICY "Users can upload videos" 
ON public.videos FOR INSERT 
WITH CHECK (
  auth.role() = 'authenticated' AND user_id = (select auth.uid())
);

-- Update: Own (Pending only) OR Admin (All)
CREATE POLICY "Users update own videos" 
ON public.videos FOR UPDATE 
USING (
  (user_id = (select auth.uid()) AND status = 'pending')
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (select auth.uid()) 
    AND role IN ('admin', 'super_admin')
  )
);

-- Delete: Own OR Admin
CREATE POLICY "Users delete own videos" 
ON public.videos FOR DELETE 
USING (
  user_id = (select auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (select auth.uid()) 
    AND role IN ('admin', 'super_admin')
  )
);

-- ==========================================
-- 4. Re-create Policies for TICKETS
-- ==========================================
CREATE POLICY "View tickets" 
ON public.tickets FOR SELECT 
USING (
  user_id = (select auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (select auth.uid()) 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Users create tickets" 
ON public.tickets FOR INSERT 
WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Admins update tickets" 
ON public.tickets FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (select auth.uid()) 
    AND role IN ('admin', 'super_admin')
  )
);

-- ==========================================
-- 5. Re-create Policies for TRANSACTIONS
-- ==========================================
CREATE POLICY "View transactions" 
ON public.transactions FOR SELECT 
USING (
  user_id = (select auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (select auth.uid()) 
    AND role IN ('admin', 'super_admin')
  )
);

-- ==========================================
-- 6. Re-create Policies for COMMENTS
-- ==========================================
CREATE POLICY "Comments are viewable by everyone" 
ON public.comments FOR SELECT 
USING (true);

CREATE POLICY "Users can insert comments" 
ON public.comments FOR INSERT 
WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own comments" 
ON public.comments FOR DELETE 
USING (
  user_id = (select auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (select auth.uid()) 
    AND role IN ('admin', 'super_admin')
  )
);

-- ==========================================
-- 7. Re-create Policies for LIKES
-- ==========================================
CREATE POLICY "Likes are viewable by everyone" 
ON public.likes FOR SELECT 
USING (true);

CREATE POLICY "Users can insert likes" 
ON public.likes FOR INSERT 
WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete own likes" 
ON public.likes FOR DELETE 
USING (user_id = (select auth.uid()));

-- ==========================================
-- 8. Re-create Policies for NOTIFICATIONS
-- ==========================================
CREATE POLICY "Users view own notifications" 
ON public.notifications FOR SELECT 
USING (user_id = (select auth.uid()));

CREATE POLICY "Users update own notifications" 
ON public.notifications FOR UPDATE 
USING (user_id = (select auth.uid()));

-- ==========================================
-- 9. Re-create Policies for WITHDRAWALS
-- ==========================================
CREATE POLICY "Users view own withdrawals" 
ON public.withdrawals FOR SELECT 
USING (
  user_id = (select auth.uid())
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = (select auth.uid()) 
    AND role IN ('admin', 'super_admin')
  )
);

CREATE POLICY "Users insert withdrawals" 
ON public.withdrawals FOR INSERT 
WITH CHECK (user_id = (select auth.uid()));
