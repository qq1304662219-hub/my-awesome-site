-- Fix comments table parent_id column type mismatch
-- The id is UUID, so parent_id must be UUID
-- Previous migrations incorrectly tried to add it as BIGINT

DO $$
BEGIN
    -- 1. Check if parent_id column exists with BIGINT type (incorrect)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' 
        AND column_name = 'parent_id' 
        AND data_type = 'bigint'
    ) THEN
        -- Drop the incorrect column
        ALTER TABLE public.comments DROP COLUMN parent_id;
    END IF;

    -- 2. Add parent_id column as UUID if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'comments' 
        AND column_name = 'parent_id'
    ) THEN
        ALTER TABLE public.comments 
        ADD COLUMN parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE;
        
        CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
    END IF;
END $$;
