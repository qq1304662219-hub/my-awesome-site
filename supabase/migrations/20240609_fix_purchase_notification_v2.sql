CREATE OR REPLACE FUNCTION public.handle_purchase(
  p_user_id uuid,
  p_total_amount numeric,
  p_video_ids uuid[],
  p_prices numeric[],
  p_license_types text[]
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id uuid;
  v_user_balance numeric;
  i int;
  v_video_id uuid;
  v_price numeric;
  v_license_type text;
  v_video_title text;
BEGIN
  -- 1. Check Balance
  SELECT balance INTO v_user_balance FROM profiles WHERE id = p_user_id;
  
  IF v_user_balance < p_total_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- 2. Deduct Balance
  UPDATE profiles 
  SET balance = balance - p_total_amount 
  WHERE id = p_user_id;

  -- 3. Create Order
  INSERT INTO orders (user_id, total_amount, status)
  VALUES (p_user_id, p_total_amount, 'completed')
  RETURNING id INTO v_order_id;

  -- 4. Create Transaction Record
  INSERT INTO transactions (user_id, amount, type, description, status)
  VALUES (
    p_user_id, 
    -p_total_amount, 
    'purchase', 
    '购买素材', 
    'completed'
  );

  -- 5. Create Order Items and Notifications
  FOR i IN 1..array_length(p_video_ids, 1) LOOP
    v_video_id := p_video_ids[i];
    v_price := p_prices[i];
    v_license_type := p_license_types[i];
    
    -- Get video title for notification
    SELECT title INTO v_video_title FROM videos WHERE id = v_video_id;

    -- Insert Order Item
    INSERT INTO order_items (order_id, video_id, price, license_type)
    VALUES (v_order_id, v_video_id, v_price, v_license_type);

    -- Insert Notification (FIXED: use content instead of title)
    INSERT INTO notifications (user_id, type, content, is_read)
    VALUES (
      p_user_id, 
      'system', 
      '购买成功: ' || COALESCE(v_video_title, '未知视频'), 
      false
    );
  END LOOP;

  RETURN v_order_id;
END;
$$;
