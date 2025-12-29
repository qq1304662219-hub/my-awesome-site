-- Add bio column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS bio text;

-- Allow users to update their own bio
-- (Existing policy "Users can update own profile" should cover this if it allows all columns, 
--  but let's verify if we need to be specific. Usually 'using (auth.uid() = id)' covers all columns.)
