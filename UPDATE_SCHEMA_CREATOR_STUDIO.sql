-- 1. 完善 videos 表字段
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS views bigint DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS downloads bigint DEFAULT 0;
ALTER TABLE public.videos ADD COLUMN IF NOT EXISTS price numeric DEFAULT 0;

-- 2. 确保 transactions 表存在
CREATE TABLE IF NOT EXISTS public.transactions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL, -- 'recharge', 'purchase', 'income', 'withdrawal'
  description text,
  created_at timestamptz DEFAULT now()
);

-- RLS for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
CREATE POLICY "Users can view their own transactions"
ON public.transactions FOR SELECT
USING (auth.uid() = user_id);

-- 3. 创建 withdrawals 表 (提现申请)
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

-- 4. 修复/补充 Profile 字段 (如有需要)
-- (Profile 已经有 balance, avatar_url 等)
