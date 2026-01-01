-- Add status and banned_at to profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'status') THEN
        ALTER TABLE profiles ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'banned', 'suspended'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'banned_at') THEN
        ALTER TABLE profiles ADD COLUMN banned_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Policy: Banned users cannot insert/update anything (Optional, but good for enforcement)
-- Note: This requires updating ALL policies to check status != 'banned'. 
-- For now, we rely on the frontend and maybe a trigger or middleware. 
-- Or we can add a simple RLS policy that denies everything if status is banned, but RLS is additive (allow).
-- So we would need to add "AND status != 'banned'" to existing policies.
-- Given the complexity, we will handle enforcement in the application logic for now (e.g., middleware or specific actions).

-- RPC: Ban User (Only for admins)
CREATE OR REPLACE FUNCTION ban_user(p_user_id UUID, p_reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if executor is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE profiles
  SET status = 'banned', banned_at = NOW()
  WHERE id = p_user_id;

  -- Optional: Log admin action
END;
$$;

-- RPC: Unban User
CREATE OR REPLACE FUNCTION unban_user(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if executor is admin
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE profiles
  SET status = 'active', banned_at = NULL
  WHERE id = p_user_id;
END;
$$;
