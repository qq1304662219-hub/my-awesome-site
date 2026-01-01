-- Combined Migration Script for AI Vision Platform
-- Run this in your Supabase SQL Editor to apply all recent updates.

-- ==========================================
-- 1. Wallet Module RPCs (Fix Race Conditions)
-- ==========================================

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

-- RPC: Create Withdrawal (Record Withdrawal + Deduct Balance)
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

-- ==========================================
-- 2. Requests Module (Bounty Tasks)
-- ==========================================

-- Create requests table
CREATE TABLE IF NOT EXISTS requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget NUMERIC NOT NULL CHECK (budget > 0),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed')),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE NOT NULL,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(request_id, video_id)
);

-- RLS for requests
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Requests are viewable by everyone" ON requests;
CREATE POLICY "Requests are viewable by everyone" 
  ON requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create requests" ON requests;
CREATE POLICY "Users can create requests" 
  ON requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own requests" ON requests;
CREATE POLICY "Users can update own requests" 
  ON requests FOR UPDATE USING (auth.uid() = user_id);

-- RLS for submissions
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Submissions viewable by request owner and submitter" ON submissions;
CREATE POLICY "Submissions viewable by request owner and submitter" 
  ON submissions FOR SELECT 
  USING (
    auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM requests WHERE id = request_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Users can create submissions" ON submissions;
CREATE POLICY "Users can create submissions" 
  ON submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RPC: Create Request (Deduct Balance + Insert Request)
CREATE OR REPLACE FUNCTION create_request(
  p_title TEXT,
  p_description TEXT,
  p_budget NUMERIC
) RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
  v_request_id UUID;
  v_current_balance NUMERIC;
BEGIN
  v_user_id := auth.uid();
  
  -- Check balance
  SELECT balance INTO v_current_balance FROM profiles WHERE id = v_user_id;
  
  IF v_current_balance < p_budget THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Deduct balance
  UPDATE profiles 
  SET balance = balance - p_budget 
  WHERE id = v_user_id;
  
  -- Insert request
  INSERT INTO requests (title, description, budget, user_id)
  VALUES (p_title, p_description, p_budget, v_user_id)
  RETURNING id INTO v_request_id;
  
  -- Record transaction
  INSERT INTO transactions (user_id, amount, type, description)
  VALUES (v_user_id, -p_budget, 'purchase', '发布悬赏任务: ' || p_title);
  
  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 3. Classroom Module (Courses)
-- ==========================================

-- Courses Table
CREATE TABLE IF NOT EXISTS courses (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  instructor TEXT NOT NULL,
  duration TEXT,
  level TEXT CHECK (level IN ('入门', '中级', '进阶', '实战')),
  rating NUMERIC(2, 1) DEFAULT 5.0,
  students_count INTEGER DEFAULT 0,
  image_url TEXT,
  price NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enrollments (User purchases/signups)
CREATE TABLE IF NOT EXISTS course_enrollments (
  id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id BIGINT REFERENCES courses(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- RLS Policies
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public courses are viewable by everyone" ON courses;
CREATE POLICY "Public courses are viewable by everyone" 
ON courses FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Users can view own enrollments" ON course_enrollments;
CREATE POLICY "Users can view own enrollments" 
ON course_enrollments FOR SELECT 
USING (auth.uid() = user_id);

-- Insert Mock Data (Only if empty)
INSERT INTO courses (title, description, instructor, duration, level, rating, students_count, image_url, price)
SELECT 'Midjourney 零基础入门', '从注册账号到精通提示词，带你一步步掌握最强大的 AI 绘画工具。', 'AI 艺术研究院', '2小时 30分钟', '入门', 4.9, 1205, 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop', 0
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Midjourney 零基础入门');

INSERT INTO courses (title, description, instructor, duration, level, rating, students_count, image_url, price)
SELECT 'Stable Diffusion 高级进阶', '深入理解 ControlNet、LoRA 训练与局部重绘，掌控 AI 绘画的每一个细节。', 'TechFlow', '4小时 15分钟', '进阶', 4.8, 850, 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=2070&auto=format&fit=crop', 199
WHERE NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Stable Diffusion 高级进阶');

-- RPC: Enroll Course (Deduct Balance + Insert Enrollment)
CREATE OR REPLACE FUNCTION enroll_course(
  p_course_id BIGINT
) RETURNS void AS $$
DECLARE
  v_user_id UUID;
  v_price NUMERIC;
  v_balance NUMERIC;
  v_title TEXT;
BEGIN
  v_user_id := auth.uid();
  
  -- Check if already enrolled
  IF EXISTS (SELECT 1 FROM course_enrollments WHERE user_id = v_user_id AND course_id = p_course_id) THEN
    RETURN; -- Already enrolled, do nothing
  END IF;

  -- Get course price and title
  SELECT price, title INTO v_price, v_title FROM courses WHERE id = p_course_id;
  
  -- If free, just enroll
  IF v_price <= 0 THEN
    INSERT INTO course_enrollments (user_id, course_id) VALUES (v_user_id, p_course_id);
    -- Update students count
    UPDATE courses SET students_count = students_count + 1 WHERE id = p_course_id;
    RETURN;
  END IF;

  -- Check balance
  SELECT balance INTO v_balance FROM profiles WHERE id = v_user_id;
  
  IF v_balance < v_price THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;
  
  -- Deduct balance
  UPDATE profiles 
  SET balance = balance - v_price 
  WHERE id = v_user_id;
  
  -- Record transaction
  INSERT INTO transactions (user_id, amount, type, description)
  VALUES (v_user_id, -v_price, 'purchase', '购买课程: ' || v_title);
  
  -- Enroll
  INSERT INTO course_enrollments (user_id, course_id) VALUES (v_user_id, p_course_id);
  
  -- Update students count
  UPDATE courses SET students_count = students_count + 1 WHERE id = p_course_id;
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- 4. General Fixes
-- ==========================================

-- Ensure get_my_role exists
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS text AS $$
  SELECT role FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;
