-- RPC: Handle Recharge (Add Balance + Record Transaction)
CREATE OR REPLACE FUNCTION handle_recharge(
  p_amount NUMERIC
) RETURNS void AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  
  -- Update balance
  UPDATE profiles 
  SET balance = COALESCE(balance, 0) + p_amount 
  WHERE id = v_user_id;
  
  -- Record transaction
  INSERT INTO transactions (user_id, amount, type, description)
  VALUES (v_user_id, p_amount, 'recharge', '充值 ¥' || p_amount);
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC: Create Withdrawal (Record Withdrawal + Optional Balance Freeze?)
-- Currently we just record it. Logic in frontend checked balance. 
-- Ideally we should deduct balance immediately or freeze it.
-- Let's deduct it immediately for simplicity and safety.
CREATE OR REPLACE FUNCTION create_withdrawal(
  p_amount NUMERIC,
  p_alipay_account TEXT
) RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_current_balance NUMERIC;
BEGIN
  v_user_id := auth.uid();
  
  -- Check balance
  SELECT balance INTO v_current_balance FROM profiles WHERE id = v_user_id;
  
  IF v_current_balance < p_amount THEN
    RAISE EXCEPTION '余额不足';
  END IF;
  
  -- Deduct balance
  UPDATE profiles 
  SET balance = balance - p_amount 
  WHERE id = v_user_id;
  
  -- Insert withdrawal record
  INSERT INTO withdrawals (user_id, amount, alipay_account, status)
  VALUES (v_user_id, p_amount, p_alipay_account, 'pending');
  
  -- Record transaction
  INSERT INTO transactions (user_id, amount, type, description)
  VALUES (v_user_id, -p_amount, 'withdrawal', '提现申请 (支付宝: ' || p_alipay_account || ')');
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
