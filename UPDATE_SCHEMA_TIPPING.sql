-- 1. Create tip_author function
CREATE OR REPLACE FUNCTION public.tip_author(
  p_video_id uuid,
  p_amount numeric
) RETURNS void AS $$
DECLARE
  v_sender_id uuid;
  v_author_id uuid;
  v_sender_balance numeric;
BEGIN
  -- Get sender ID
  v_sender_id := auth.uid();
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get author ID from video
  SELECT user_id INTO v_author_id
  FROM public.videos
  WHERE id = p_video_id;

  IF v_author_id IS NULL THEN
    RAISE EXCEPTION 'Video not found';
  END IF;

  -- Prevent self-tipping
  IF v_sender_id = v_author_id THEN
    RAISE EXCEPTION 'Cannot tip yourself';
  END IF;

  -- Check sender balance
  SELECT balance INTO v_sender_balance
  FROM public.profiles
  WHERE id = v_sender_id;

  IF v_sender_balance IS NULL OR v_sender_balance < p_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct from sender
  UPDATE public.profiles
  SET balance = balance - p_amount
  WHERE id = v_sender_id;

  -- Add to author
  UPDATE public.profiles
  SET balance = COALESCE(balance, 0) + p_amount
  WHERE id = v_author_id;

  -- Record transaction for sender
  INSERT INTO public.transactions (user_id, amount, type, description)
  VALUES (v_sender_id, -p_amount, 'tip_sent', '打赏视频');

  -- Record transaction for author
  INSERT INTO public.transactions (user_id, amount, type, description)
  VALUES (v_author_id, p_amount, 'tip_received', '收到打赏');

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
