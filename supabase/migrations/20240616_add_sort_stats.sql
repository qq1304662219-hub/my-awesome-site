-- 1. Ensure 'likes' column exists in 'videos'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'likes') THEN
        ALTER TABLE public.videos ADD COLUMN likes INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Ensure 'downloads' column exists in 'videos'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'downloads') THEN
        ALTER TABLE public.videos ADD COLUMN downloads INTEGER DEFAULT 0;
    END IF;
END $$;

-- 3. Ensure 'collections_count' column exists in 'videos'
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'videos' AND column_name = 'collections_count') THEN
        ALTER TABLE public.videos ADD COLUMN collections_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- 4. Backfill data
-- Update likes count
UPDATE public.videos v
SET likes = (
    SELECT COUNT(*)
    FROM public.likes l
    WHERE l.video_id = v.id
);

-- Update downloads count (assuming user_downloads table exists, if not, this part is skipped or errors handled if run in block, but simpler to just run it)
-- We check if table exists first to avoid error in migration script if table is missing
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_downloads') THEN
        UPDATE public.videos v
        SET downloads = (
            SELECT COUNT(*)
            FROM public.user_downloads ud
            WHERE ud.video_id = v.id
        );
    END IF;
END $$;

-- Update collections count
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'collection_items') THEN
        UPDATE public.videos v
        SET collections_count = (
            SELECT COUNT(*)
            FROM public.collection_items ci
            WHERE ci.video_id = v.id
        );
    END IF;
END $$;


-- 5. Create Triggers for auto-update

-- Function to update likes count
CREATE OR REPLACE FUNCTION public.handle_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.videos
        SET likes = likes + 1
        WHERE id = NEW.video_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.videos
        SET likes = likes - 1
        WHERE id = OLD.video_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for likes
DROP TRIGGER IF EXISTS on_like_change ON public.likes;
CREATE TRIGGER on_like_change
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE PROCEDURE public.handle_likes_count();


-- Function to update collections count
CREATE OR REPLACE FUNCTION public.handle_collections_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.videos
        SET collections_count = collections_count + 1
        WHERE id = NEW.video_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.videos
        SET collections_count = collections_count - 1
        WHERE id = OLD.video_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for collection items
DROP TRIGGER IF EXISTS on_collection_item_change ON public.collection_items;
CREATE TRIGGER on_collection_item_change
AFTER INSERT OR DELETE ON public.collection_items
FOR EACH ROW EXECUTE PROCEDURE public.handle_collections_count();


-- Function to update downloads count
CREATE OR REPLACE FUNCTION public.handle_downloads_count()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        UPDATE public.videos
        SET downloads = downloads + 1
        WHERE id = NEW.video_id;
        RETURN NEW;
    ELSIF (TG_OP = 'DELETE') THEN
        UPDATE public.videos
        SET downloads = downloads - 1
        WHERE id = OLD.video_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user_downloads (check if table exists first? Triggers are created on existing tables. If table doesn't exist, this fails. I'll assume it exists based on search results)
DROP TRIGGER IF EXISTS on_download_change ON public.user_downloads;
CREATE TRIGGER on_download_change
AFTER INSERT OR DELETE ON public.user_downloads
FOR EACH ROW EXECUTE PROCEDURE public.handle_downloads_count();
