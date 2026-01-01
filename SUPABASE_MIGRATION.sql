-- ============================================================================
-- AI Vision - Complete Supabase Migration
-- Run this script in your Supabase SQL Editor to set up the entire database.
-- ============================================================================

-- 1. Ensure Profiles Table & Columns
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at timestamptz,
  username text UNIQUE,
  full_name text,
  avatar_url text,
  website text,
  bio text,
  balance numeric DEFAULT 0,
  role text DEFAULT 'user' -- 'user', 'admin', 'super_admin'
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS balance numeric DEFAULT 0;

-- 2. Withdrawals Table & Policies
CREATE TABLE IF NOT EXISTS public.withdrawals (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  amount numeric NOT NULL,
  alipay_account text NOT NULL,
  status text DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert their own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can insert their own withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own withdrawals" ON public.withdrawals;
CREATE POLICY "Users can view their own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawals;
CREATE POLICY "Admins can view all withdrawals" ON public.withdrawals FOR SELECT USING (
  exists (select 1 from public.profiles where profiles.id = auth.uid() and (profiles.role = 'admin' or profiles.role = 'super_admin'))
);

DROP POLICY IF EXISTS "Admins can update withdrawals" ON public.withdrawals;
CREATE POLICY "Admins can update withdrawals" ON public.withdrawals FOR UPDATE USING (
  exists (select 1 from public.profiles where profiles.id = auth.uid() and (profiles.role = 'admin' or profiles.role = 'super_admin'))
);

-- 3. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL, -- 'recharge', 'purchase', 'income', 'withdrawal', 'refund'
  description text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);

-- 4. RPC: Create Withdrawal
CREATE OR REPLACE FUNCTION create_withdrawal(p_amount NUMERIC, p_alipay_account TEXT) RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_current_balance NUMERIC;
BEGIN
  v_user_id := auth.uid();
  SELECT balance INTO v_current_balance FROM profiles WHERE id = v_user_id;
  IF v_current_balance IS NULL OR v_current_balance < p_amount THEN RAISE EXCEPTION '余额不足'; END IF;
  UPDATE profiles SET balance = balance - p_amount WHERE id = v_user_id;
  INSERT INTO withdrawals (user_id, amount, alipay_account, status) VALUES (v_user_id, p_amount, p_alipay_account, 'pending');
  INSERT INTO transactions (user_id, amount, type, description) VALUES (v_user_id, -p_amount, 'withdrawal', '提现申请 (支付宝: ' || p_alipay_account || ')');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RPC: Reject Withdrawal & Refund
CREATE OR REPLACE FUNCTION reject_withdrawal(p_withdrawal_id UUID, p_reason TEXT) RETURNS void AS $$
DECLARE
  v_withdrawal RECORD;
BEGIN
  SELECT * INTO v_withdrawal FROM withdrawals WHERE id = p_withdrawal_id;
  IF v_withdrawal IS NULL THEN RAISE EXCEPTION 'Withdrawal not found'; END IF;
  IF v_withdrawal.status != 'pending' THEN RAISE EXCEPTION 'Withdrawal is not pending'; END IF;
  UPDATE withdrawals SET status = 'rejected' WHERE id = p_withdrawal_id;
  UPDATE profiles SET balance = balance + v_withdrawal.amount WHERE id = v_withdrawal.user_id;
  INSERT INTO transactions (user_id, amount, type, description) VALUES (v_withdrawal.user_id, v_withdrawal.amount, 'refund', '提现被拒绝，资金退回 (' || p_reason || ')');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: Handle Purchase (Atomic with Seller Credit)
CREATE OR REPLACE FUNCTION handle_purchase(
    p_user_id uuid,
    p_total_amount numeric,
    p_video_ids uuid[],
    p_prices numeric[],
    p_license_types text[]
) RETURNS uuid AS $$
DECLARE
    v_order_id uuid;
    v_current_balance numeric;
    v_video_owner_id uuid;
    v_video_title text;
    i int;
BEGIN
    SELECT balance INTO v_current_balance FROM public.profiles WHERE id = p_user_id;
    IF COALESCE(v_current_balance, 0) < p_total_amount THEN RAISE EXCEPTION '余额不足'; END IF;
    
    -- Deduct from buyer
    UPDATE public.profiles SET balance = v_current_balance - p_total_amount WHERE id = p_user_id;
    INSERT INTO public.transactions (user_id, amount, type, description) VALUES (p_user_id, -p_total_amount, 'purchase', '购买视频素材');
    
    -- Create order
    INSERT INTO public.orders (user_id, total_amount, status) VALUES (p_user_id, p_total_amount, 'completed') RETURNING id INTO v_order_id;
    
    -- Process items
    FOR i IN 1 .. array_length(p_video_ids, 1) LOOP
        INSERT INTO public.order_items (order_id, video_id, price, license_type) VALUES (v_order_id, p_video_ids[i], p_prices[i], p_license_types[i]);
        
        -- Credit Seller
        SELECT user_id, title INTO v_video_owner_id, v_video_title FROM public.videos WHERE id = p_video_ids[i];
        IF v_video_owner_id IS NOT NULL AND v_video_owner_id != p_user_id THEN
            UPDATE public.profiles SET balance = COALESCE(balance, 0) + p_prices[i] WHERE id = v_video_owner_id;
            INSERT INTO public.transactions (user_id, amount, type, description) VALUES (v_video_owner_id, p_prices[i], 'income', '出售视频: ' || COALESCE(v_video_title, 'Unknown'));
        END IF;
    END LOOP;
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Notify
NOTIFY pgrst, 'reload config';
