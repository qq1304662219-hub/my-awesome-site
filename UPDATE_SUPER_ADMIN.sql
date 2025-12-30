-- 1. UPDATE HANDLE_NEW_USER TRIGGER (Super Admin Logic)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, invited_by)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    CASE 
      WHEN new.email = 'qq1304662219@gmail.com' THEN 'super_admin' 
      ELSE 'user' 
    END,
    (new.raw_user_meta_data->>'invited_by')::uuid
  );
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Fallback
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    CASE 
      WHEN new.email = 'qq1304662219@gmail.com' THEN 'super_admin' 
      ELSE 'user' 
    END
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. UPDATE EXISTING OWNER TO SUPER_ADMIN
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE email = 'qq1304662219@gmail.com';

-- 3. RLS POLICIES FOR ADMINS (Super Admin & Admin)

-- A. VIDEO MANAGEMENT (Both can manage)
DROP POLICY IF EXISTS "Admins can update all videos" ON public.videos;
CREATE POLICY "Admins can update all videos" 
ON public.videos FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
  )
);

DROP POLICY IF EXISTS "Public can view published videos" ON public.videos;
CREATE POLICY "Public can view published videos" 
ON public.videos FOR SELECT 
USING (
  status = 'published' 
  OR 
  auth.uid() = user_id
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
  )
);

-- B. USER MANAGEMENT (Only Super Admin can view all profiles & update roles)

-- Allow Super Admin to view all profiles (for User Management list)
DROP POLICY IF EXISTS "Super Admin can view all profiles" ON public.profiles;
CREATE POLICY "Super Admin can view all profiles" 
ON public.profiles FOR SELECT 
USING (
  auth.uid() = id -- User can see themselves
  OR
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- Allow Super Admin to update roles (and other profile fields if needed)
DROP POLICY IF EXISTS "Super Admin can update profiles" ON public.profiles;
CREATE POLICY "Super Admin can update profiles" 
ON public.profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'super_admin'
  )
);

-- C. TICKET MANAGEMENT (Both can manage)
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
CREATE POLICY "Admins can view all tickets" 
ON public.tickets FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
  )
);

DROP POLICY IF EXISTS "Admins can update tickets" ON public.tickets;
CREATE POLICY "Admins can update tickets" 
ON public.tickets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.role = 'admin' OR profiles.role = 'super_admin')
  )
);
