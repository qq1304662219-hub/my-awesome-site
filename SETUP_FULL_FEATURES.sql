-- ==========================================
-- 0. 基础配置 (Basic Setup)
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 0. 基础配置 (Basic Setup)
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. 积分与余额系统 (Points & Balance)
-- ==========================================

-- 为 profiles 表添加余额字段
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS balance numeric DEFAULT 0;

-- 初始化已有用户的余额为 0
UPDATE public.profiles SET balance = 0 WHERE balance IS NULL;

-- 确保 Profiles RLS 存在
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can view own profile'
    ) THEN
        CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
    ) THEN
        CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;
    
    -- 允许公开读取基本信息 (可选，视需求而定，这里暂只允许自己)
    -- 如果需要显示作者信息，可能需要更宽泛的读取权限
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Public profiles are viewable by everyone'
    ) THEN
        CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
    END IF;
END
$$;

-- 创建交易记录表 (充值/消费)
CREATE TABLE IF NOT EXISTS public.transactions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    amount numeric NOT NULL, -- 正数表示充值，负数表示消费
    type text NOT NULL, -- 'recharge', 'purchase', 'refund', 'income'
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS: 用户只能查看自己的交易记录
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;
CREATE POLICY "Users can view own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);

-- ==========================================
-- 2. 购物车系统 (Shopping Cart)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.cart_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    video_id uuid REFERENCES public.videos(id) NOT NULL,
    license_type text DEFAULT 'personal', -- 'personal', 'commercial'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, video_id) -- 防止重复添加同一个视频
);

-- RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own cart" ON public.cart_items;
CREATE POLICY "Users can manage own cart" 
ON public.cart_items FOR ALL 
USING (auth.uid() = user_id);

-- ==========================================
-- 3. 订单与已购商品 (Orders & Library)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    total_amount numeric NOT NULL,
    status text DEFAULT 'completed', -- 'pending', 'completed', 'failed'
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id uuid REFERENCES public.orders(id) NOT NULL,
    video_id uuid REFERENCES public.videos(id) NOT NULL,
    price numeric NOT NULL,
    license_type text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON public.orders;
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own order items" ON public.order_items;
CREATE POLICY "Users can view own order items" ON public.order_items FOR SELECT 
USING ( EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()) );


-- ==========================================
-- 4. 客服工单系统 (Support Tickets)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.tickets (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) NOT NULL,
    subject text NOT NULL,
    message text NOT NULL,
    status text DEFAULT 'open', -- 'open', 'in_progress', 'closed'
    reply text, -- 管理员回复
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own tickets" ON public.tickets;
CREATE POLICY "Users can manage own tickets" 
ON public.tickets FOR ALL 
USING (auth.uid() = user_id);

-- ==========================================
-- 5. 辅助函数 (Helper Functions)
-- ==========================================

-- 安全地增加/减少余额
CREATE OR REPLACE FUNCTION handle_balance_update(
    p_user_id uuid,
    p_amount numeric,
    p_type text,
    p_description text
) RETURNS void AS $$
BEGIN
    -- 1. 插入交易记录
    INSERT INTO public.transactions (user_id, amount, type, description)
    VALUES (p_user_id, p_amount, p_type, p_description);

    -- 2. 更新用户余额
    UPDATE public.profiles
    SET balance = COALESCE(balance, 0) + p_amount
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 处理购买 (Handle Purchase)
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
    i int;
BEGIN
    -- 1. 检查余额
    SELECT balance INTO v_current_balance FROM public.profiles WHERE id = p_user_id;
    
    IF COALESCE(v_current_balance, 0) < p_total_amount THEN
        RAISE EXCEPTION '余额不足';
    END IF;

    -- 2. 扣除余额
    UPDATE public.profiles
    SET balance = v_current_balance - p_total_amount
    WHERE id = p_user_id;

    -- 3. 记录消费流水
    INSERT INTO public.transactions (user_id, amount, type, description)
    VALUES (p_user_id, -p_total_amount, 'purchase', '购买视频素材');

    -- 4. 创建订单
    INSERT INTO public.orders (user_id, total_amount, status)
    VALUES (p_user_id, p_total_amount, 'completed')
    RETURNING id INTO v_order_id;

    -- 5. 创建订单项
    FOR i IN 1 .. array_length(p_video_ids, 1) LOOP
        INSERT INTO public.order_items (order_id, video_id, price, license_type)
        VALUES (v_order_id, p_video_ids[i], p_prices[i], p_license_types[i]);
    END LOOP;

    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


-- 修复 handle_new_user 安全警告
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url',
    'user'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;


