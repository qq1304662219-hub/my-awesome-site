-- 1. Ensure withdrawals table exists
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  amount numeric NOT NULL,
  alipay_account text NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamptz DEFAULT now()
);

-- RLS for withdrawals
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can insert their own withdrawals"
ON public.withdrawals FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can view their own withdrawals"
ON public.withdrawals FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawals;
CREATE POLICY "Admins can view all withdrawals"
ON public.withdrawals FOR SELECT
USING (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid()
    and (profiles.role = 'admin' or profiles.role = 'super_admin')
  )
);

-- 2. Ensure create_withdrawal RPC exists
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
  
  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN
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
