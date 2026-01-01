-- Add bio and website to profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'bio') THEN
        ALTER TABLE profiles ADD COLUMN bio TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'website') THEN
        ALTER TABLE profiles ADD COLUMN website TEXT;
    END IF;
END $$;
