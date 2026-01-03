-- Add 'movement' and 'fps' columns to 'videos' table if they don't exist

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'movement') THEN
        ALTER TABLE public.videos ADD COLUMN movement TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'fps') THEN
        ALTER TABLE public.videos ADD COLUMN fps NUMERIC;
    END IF;
END $$;
