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
  UNIQUE(request_id, video_id) -- Prevent duplicate submissions of same video
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

-- RPC: Accept Submission
CREATE OR REPLACE FUNCTION accept_submission(
  p_submission_id UUID
) RETURNS VOID AS $$
DECLARE
  v_request_id UUID;
  v_request_owner UUID;
  v_submitter_id UUID;
  v_budget NUMERIC;
  v_request_status TEXT;
BEGIN
  -- Get submission details and lock request
  SELECT s.request_id, s.user_id, r.user_id, r.budget, r.status
  INTO v_request_id, v_submitter_id, v_request_owner, v_budget, v_request_status
  FROM submissions s
  JOIN requests r ON s.request_id = r.id
  WHERE s.id = p_submission_id
  FOR UPDATE OF r; -- Lock request to prevent double acceptance
  
  -- Validation
  IF v_request_owner != auth.uid() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;
  
  IF v_request_status != 'open' THEN
    RAISE EXCEPTION 'Request is already closed';
  END IF;
  
  -- Update request status
  UPDATE requests SET status = 'closed' WHERE id = v_request_id;
  
  -- Update submission status
  UPDATE submissions SET status = 'accepted' WHERE id = p_submission_id;
  
  -- Reject other submissions (optional, or just leave them pending)
  UPDATE submissions SET status = 'rejected' 
  WHERE request_id = v_request_id AND id != p_submission_id;
  
  -- Transfer funds to submitter
  UPDATE profiles 
  SET balance = balance + v_budget 
  WHERE id = v_submitter_id;
  
  -- Record transaction for submitter
  INSERT INTO transactions (user_id, amount, type, description)
  VALUES (v_submitter_id, v_budget, 'income', '悬赏任务奖励');
  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
