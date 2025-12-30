-- 1. Allow Admins and Super Admins to view all profiles (User Management List)
DROP POLICY IF EXISTS "Admins and Super Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins and Super Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and (profiles.role = 'admin' or profiles.role = 'super_admin')
  )
);

-- 2. Allow Super Admins to update any profile (To change roles)
DROP POLICY IF EXISTS "Super Admins can update any profile" ON public.profiles;
CREATE POLICY "Super Admins can update any profile"
ON public.profiles FOR UPDATE
USING (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'super_admin'
  )
);

-- 3. Allow Super Admins to delete any profile (Optional, for future use)
DROP POLICY IF EXISTS "Super Admins can delete any profile" ON public.profiles;
CREATE POLICY "Super Admins can delete any profile"
ON public.profiles FOR DELETE
USING (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and profiles.role = 'super_admin'
  )
);

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
