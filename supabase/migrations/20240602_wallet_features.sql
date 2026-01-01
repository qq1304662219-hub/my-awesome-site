-- Ensure balance column exists in profiles
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'balance') THEN
        ALTER TABLE profiles ADD COLUMN balance DECIMAL(10, 2) DEFAULT 0;
    END IF;
END $$;

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  type TEXT NOT NULL, -- 'recharge', 'withdrawal', 'income', 'purchase', 'tip_sent', 'tip_received'
  description TEXT,
  status TEXT DEFAULT 'completed', -- 'completed', 'pending', 'failed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own transactions" ON transactions;
CREATE POLICY "Users can view their own transactions" 
ON transactions FOR SELECT 
USING (auth.uid() = user_id);

-- Wallet Functions

-- Recharge Function
CREATE OR REPLACE FUNCTION handle_recharge(p_amount numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update user balance
  UPDATE profiles
  SET balance = COALESCE(balance, 0) + p_amount
  WHERE id = auth.uid();

  -- Record transaction
  INSERT INTO transactions (user_id, amount, type, description, status)
  VALUES (auth.uid(), p_amount, 'recharge', '账户充值', 'completed');
END;
$$;

-- Withdrawal Function
CREATE OR REPLACE FUNCTION create_withdrawal(p_amount numeric, p_alipay_account text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance numeric;
BEGIN
  -- Check balance
  SELECT COALESCE(balance, 0) INTO v_balance FROM profiles WHERE id = auth.uid();
  
  IF v_balance < p_amount THEN
    RAISE EXCEPTION '余额不足';
  END IF;

  -- Deduct balance
  UPDATE profiles
  SET balance = balance - p_amount
  WHERE id = auth.uid();

  -- Record transaction (pending withdrawal)
  INSERT INTO transactions (user_id, amount, type, description, status)
  VALUES (auth.uid(), p_amount, 'withdrawal', '提现至支付宝: ' || p_alipay_account, 'pending');
END;
$$;
