-- Migration to add license column to videos table

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'license') THEN
        ALTER TABLE videos ADD COLUMN license TEXT DEFAULT 'Standard'; -- 'Standard', 'Extended', 'Exclusive'
    END IF;
END $$;
