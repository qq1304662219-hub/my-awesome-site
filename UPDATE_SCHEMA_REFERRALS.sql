-- 1. Add username to profiles if not exists
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text UNIQUE;

-- 2. Populate username for existing users (using email prefix + random suffix to ensure uniqueness)
UPDATE public.profiles 
SET username = split_part(email, '@', 1) || '_' || substr(md5(id::text), 1, 4)
WHERE username IS NULL AND email IS NOT NULL;

-- 3. Update handle_new_user to handle referrals and username generation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_username text;
  v_referrer_id uuid;
  v_referrer_username text;
BEGIN
  -- Generate username from email if not provided in metadata
  v_username := new.raw_user_meta_data->>'username';
  IF v_username IS NULL THEN
    v_username := split_part(new.email, '@', 1);
    -- Append random suffix to ensure uniqueness
    v_username := v_username || '_' || substr(md5(new.id::text), 1, 4);
  END IF;

  -- Check for referrer
  v_referrer_username := new.raw_user_meta_data->>'invited_by_username';
  
  -- Prevent self-referral (though unlikely as new user id is generated)
  
  IF v_referrer_username IS NOT NULL THEN
    SELECT id INTO v_referrer_id FROM public.profiles WHERE username = v_referrer_username;
  END IF;

  -- Insert profile
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role, username, invited_by, balance)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    CASE 
      WHEN new.email = 'qq1304662219@gmail.com' THEN 'admin' 
      ELSE 'user' 
    END,
    v_username,
    v_referrer_id,
    CASE WHEN v_referrer_id IS NOT NULL THEN 20 ELSE 0 END -- Bonus for new user (20) or 0
  );

  -- Handle Referral Rewards
  IF v_referrer_id IS NOT NULL THEN
    -- 1. Reward Referrer (+50)
    UPDATE public.profiles 
    SET balance = COALESCE(balance, 0) + 50 
    WHERE id = v_referrer_id;

    -- 2. Record Transaction for Referrer
    INSERT INTO public.transactions (user_id, amount, type, description)
    VALUES (v_referrer_id, 50, 'income', '邀请奖励: ' || v_username);

    -- 3. Record Transaction for New User (+20)
    INSERT INTO public.transactions (user_id, amount, type, description)
    VALUES (new.id, 20, 'income', '新人注册奖励 (邀请人: ' || v_referrer_username || ')');
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
