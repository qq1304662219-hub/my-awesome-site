-- Create Requests table
CREATE TABLE IF NOT EXISTS requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  budget DECIMAL(10, 2) NOT NULL CHECK (budget > 0),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'cancelled')),
  winner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID REFERENCES requests(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  video_id BIGINT REFERENCES videos(id) NOT NULL, -- Assuming videos.id is BIGINT based on previous files
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(request_id, video_id) -- Prevent duplicate submissions of same video to same request
);

-- Enable RLS
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Policies for Requests
DROP POLICY IF EXISTS "Requests are viewable by everyone" ON requests;
CREATE POLICY "Requests are viewable by everyone" ON requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own requests" ON requests;
CREATE POLICY "Users can insert their own requests" ON requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own requests" ON requests;
CREATE POLICY "Users can update their own requests" ON requests FOR UPDATE USING (auth.uid() = user_id);

-- Policies for Submissions
DROP POLICY IF EXISTS "Submissions are viewable by everyone" ON submissions;
CREATE POLICY "Submissions are viewable by everyone" ON submissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own submissions" ON submissions;
CREATE POLICY "Users can insert their own submissions" ON submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RPC: Create Request (Deduct balance + Insert Request)
CREATE OR REPLACE FUNCTION create_request(p_title TEXT, p_description TEXT, p_budget NUMERIC)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance NUMERIC;
  v_request_id UUID;
BEGIN
  -- Check balance
  SELECT COALESCE(balance, 0) INTO v_balance FROM profiles WHERE id = auth.uid();
  
  IF v_balance < p_budget THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct balance
  UPDATE profiles
  SET balance = balance - p_budget
  WHERE id = auth.uid();

  -- Create Request
  INSERT INTO requests (user_id, title, description, budget)
  VALUES (auth.uid(), p_title, p_description, p_budget)
  RETURNING id INTO v_request_id;

  -- Record Transaction
  INSERT INTO transactions (user_id, amount, type, description, status)
  VALUES (auth.uid(), -p_budget, 'request_create', '发布悬赏任务: ' || p_title, 'completed');

  RETURN v_request_id;
END;
$$;

-- RPC: Accept Submission (Pay Winner + Close Request)
CREATE OR REPLACE FUNCTION accept_submission(p_submission_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_request_id UUID;
  v_request_budget NUMERIC;
  v_request_owner UUID;
  v_submission_user UUID;
  v_request_status TEXT;
BEGIN
  -- Get Submission and Request details
  SELECT s.request_id, s.user_id, r.budget, r.user_id, r.status
  INTO v_request_id, v_submission_user, v_request_budget, v_request_owner, v_request_status
  FROM submissions s
  JOIN requests r ON s.request_id = r.id
  WHERE s.id = p_submission_id;

  -- Validation
  IF v_request_owner != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_request_status != 'open' THEN
    RAISE EXCEPTION 'Request is not open';
  END IF;

  -- Update Request Status
  UPDATE requests
  SET status = 'closed', winner_id = v_submission_user
  WHERE id = v_request_id;

  -- Update Submission Status
  UPDATE submissions
  SET status = 'accepted'
  WHERE id = p_submission_id;

  -- Pay Winner
  UPDATE profiles
  SET balance = COALESCE(balance, 0) + v_request_budget
  WHERE id = v_submission_user;

  -- Record Transaction for Winner
  INSERT INTO transactions (user_id, amount, type, description, status)
  VALUES (v_submission_user, v_request_budget, 'request_income', '悬赏任务中标奖励', 'completed');

  -- Create Notification for Winner
  INSERT INTO notifications (user_id, actor_id, type, resource_id, resource_type, content)
  VALUES (v_submission_user, auth.uid(), 'system', v_request_id::text, 'request', '您的投稿已被采纳，奖励已到账！');

END;
$$;
