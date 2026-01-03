-- Fix purchase error: column "title" of relation "notifications" does not exist
-- This script replaces the handle_purchase function with the correct version
-- 1. Uses 'content' instead of 'title' for notifications
-- 2. Includes seller credit logic (100% revenue)
-- 3. Creates transaction records for both buyer and seller

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
  v_video_owner_id uuid;
BEGIN
  -- 1. Check Balance
  SELECT balance INTO v_user_balance FROM profiles WHERE id = p_user_id;
  
  IF COALESCE(v_user_balance, 0) < p_total_amount THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- 2. Deduct Balance from Buyer
  UPDATE profiles 
  SET balance = balance - p_total_amount 
  WHERE id = p_user_id;

  -- 3. Create Order
  INSERT INTO orders (user_id, total_amount, status)
  VALUES (p_user_id, p_total_amount, 'completed')
  RETURNING id INTO v_order_id;

  -- 4. Create Transaction Record for Buyer
  INSERT INTO transactions (user_id, amount, type, description, status)
  VALUES (
    p_user_id, 
    -p_total_amount, 
    'purchase', 
    '购买素材', 
    'completed'
  );

  -- 5. Process Items
  FOR i IN 1..array_length(p_video_ids, 1) LOOP
    v_video_id := p_video_ids[i];
    v_price := p_prices[i];
    v_license_type := p_license_types[i];
    
    -- Get video details
    SELECT title, user_id INTO v_video_title, v_video_owner_id FROM videos WHERE id = v_video_id;

    -- Insert Order Item
    INSERT INTO order_items (order_id, video_id, price, license_type)
    VALUES (v_order_id, v_video_id, v_price, v_license_type);

    -- Notification for Buyer
    INSERT INTO notifications (user_id, type, content, is_read, resource_id, resource_type)
    VALUES (
      p_user_id, 
      'system', 
      '购买成功: ' || COALESCE(v_video_title, '未知视频'), 
      false,
      v_order_id::text,
      'order'
    );

    -- Credit Seller and Notify (if not self-purchase)
    IF v_video_owner_id IS NOT NULL AND v_video_owner_id != p_user_id THEN
      -- Credit Seller (100% revenue)
      UPDATE profiles 
      SET balance = COALESCE(balance, 0) + v_price 
      WHERE id = v_video_owner_id;

      -- Transaction for Seller
      INSERT INTO transactions (user_id, amount, type, description, status)
      VALUES (
        v_video_owner_id, 
        v_price, 
        'income', 
        '出售视频: ' || COALESCE(v_video_title, 'Unknown'), 
        'completed'
      );

      -- Notification for Seller
      INSERT INTO notifications (user_id, type, content, is_read, resource_id, resource_type)
      VALUES (
        v_video_owner_id, 
        'system', 
        '您的视频 "' || COALESCE(v_video_title, 'Unknown') || '" 已售出，获得收益 ¥' || v_price, 
        false,
        v_order_id::text,
        'order'
      );
    END IF;

  END LOOP;

  RETURN v_order_id;
END;
$$;
