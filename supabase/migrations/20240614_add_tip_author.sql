-- Migration to add/update tip_author RPC

-- This function handles the tipping process.
-- It:
-- 1. Checks if sender has enough balance.
-- 2. Deducts amount from sender.
-- 3. Adds amount to receiver (author).
-- 4. Records transactions for both parties.
-- 5. Sends a notification to the author.

CREATE OR REPLACE FUNCTION public.tip_author(p_author_id UUID, p_video_id UUID, p_amount DECIMAL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_balance DECIMAL;
  v_video_title TEXT;
BEGIN
  -- 0. Validate amount
  IF p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be positive';
  END IF;

  -- 1. Check sender balance
  SELECT balance INTO v_sender_balance FROM profiles WHERE id = auth.uid();
  
  IF v_sender_balance IS NULL OR v_sender_balance < p_amount THEN
    RAISE EXCEPTION '余额不足，请先充值';
  END IF;

  -- Get video title for description
  SELECT title INTO v_video_title FROM videos WHERE id = p_video_id;

  -- 2. Deduct from sender
  UPDATE profiles
  SET balance = balance - p_amount
  WHERE id = auth.uid();

  -- 3. Add to receiver
  UPDATE profiles
  SET balance = COALESCE(balance, 0) + p_amount
  WHERE id = p_author_id;

  -- 4. Record transactions
  -- Sender transaction
  INSERT INTO transactions (user_id, amount, type, description, status)
  VALUES (auth.uid(), -p_amount, 'tip_sent', '打赏视频: ' || COALESCE(v_video_title, 'Unknown'), 'completed');

  -- Receiver transaction
  INSERT INTO transactions (user_id, amount, type, description, status)
  VALUES (p_author_id, p_amount, 'tip_received', '收到打赏: ' || COALESCE(v_video_title, 'Unknown'), 'completed');

  -- 5. Notification
  INSERT INTO notifications (user_id, actor_id, type, resource_id, resource_type, content, is_read)
  VALUES (
    p_author_id, 
    auth.uid(), 
    'system', -- or 'tip' if supported
    p_video_id::text, 
    'video', 
    '您的视频收到了一笔打赏: ¥' || p_amount, 
    false
  );

END;
$$;
