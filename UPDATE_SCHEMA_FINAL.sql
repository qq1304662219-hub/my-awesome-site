-- 1. Add category column to videos
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS category text DEFAULT 'All';

-- Update existing videos with random categories for demo
UPDATE public.videos 
SET category = (ARRAY['Nature', 'City', 'Technology', 'People', 'Abstract'])[floor(random() * 5 + 1)]
WHERE category = 'All' OR category IS NULL;

-- 2. Add role column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';

-- Set specific user as admin (optional - replace with actual admin ID if known, otherwise manually update in dashboard)
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@example.com';

-- 3. Update Tickets RLS for Admin
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.tickets;
CREATE POLICY "Admins can view all tickets" 
ON public.tickets FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

DROP POLICY IF EXISTS "Admins can update tickets" ON public.tickets;
CREATE POLICY "Admins can update tickets" 
ON public.tickets FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);

-- 4. Add invited_by to profiles (for invite system)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES public.profiles(id);

-- Update handle_new_user to store invited_by
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, invited_by)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    'user',
    (new.raw_user_meta_data->>'invited_by')::uuid
  );
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- Fallback if invited_by is invalid
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
