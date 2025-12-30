-- 1. Create requests table
CREATE TABLE IF NOT EXISTS public.requests (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  budget numeric NOT NULL CHECK (budget > 0),
  status text NOT NULL DEFAULT 'open', -- 'open', 'closed'
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS for requests
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;

-- Policies for requests
DROP POLICY IF EXISTS "Requests are viewable by everyone" ON public.requests;
CREATE POLICY "Requests are viewable by everyone" ON public.requests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own requests" ON public.requests;
CREATE POLICY "Users can insert their own requests" ON public.requests FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own requests" ON public.requests;
CREATE POLICY "Users can update their own requests" ON public.requests FOR UPDATE USING (auth.uid() = user_id);

-- 2. Create submissions table
CREATE TABLE IF NOT EXISTS public.submissions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id uuid REFERENCES public.requests(id) NOT NULL,
  video_id uuid REFERENCES public.videos(id) NOT NULL,
  user_id uuid REFERENCES public.profiles(id) NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  created_at timestamptz DEFAULT now(),
  UNIQUE(request_id, video_id) -- Prevent duplicate submissions of same video to same request
);

-- Enable RLS for submissions
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Policies for submissions
DROP POLICY IF EXISTS "Submissions are viewable by everyone" ON public.submissions;
CREATE POLICY "Submissions are viewable by everyone" ON public.submissions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own submissions" ON public.submissions;
CREATE POLICY "Users can insert their own submissions" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. RPC to create request (deduct balance and create request)
CREATE OR REPLACE FUNCTION public.create_request(
  p_title text,
  p_description text,
  p_budget numeric
) RETURNS uuid AS $$
DECLARE
  v_user_id uuid;
  v_balance numeric;
  v_request_id uuid;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check balance
  SELECT balance INTO v_balance FROM public.profiles WHERE id = v_user_id;
  IF v_balance IS NULL OR v_balance < p_budget THEN
    RAISE EXCEPTION 'Insufficient balance';
  END IF;

  -- Deduct balance
  UPDATE public.profiles SET balance = balance - p_budget WHERE id = v_user_id;

  -- Create request
  INSERT INTO public.requests (title, description, budget, user_id)
  VALUES (p_title, p_description, p_budget, v_user_id)
  RETURNING id INTO v_request_id;

  -- Record transaction
  INSERT INTO public.transactions (user_id, amount, type, description)
  VALUES (v_user_id, -p_budget, 'request_created', '发布悬赏任务: ' || p_title);

  RETURN v_request_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RPC to accept submission (transfer funds and close request)
CREATE OR REPLACE FUNCTION public.accept_submission(
  p_submission_id uuid
) RETURNS void AS $$
DECLARE
  v_user_id uuid;
  v_request_id uuid;
  v_request_owner_id uuid;
  v_submission_owner_id uuid;
  v_budget numeric;
  v_request_status text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Get submission info
  SELECT request_id, user_id INTO v_request_id, v_submission_owner_id
  FROM public.submissions
  WHERE id = p_submission_id;

  IF v_request_id IS NULL THEN
    RAISE EXCEPTION 'Submission not found';
  END IF;

  -- Get request info
  SELECT user_id, budget, status INTO v_request_owner_id, v_budget, v_request_status
  FROM public.requests
  WHERE id = v_request_id;

  -- Verify ownership
  IF v_request_owner_id != v_user_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  -- Verify status
  IF v_request_status != 'open' THEN
    RAISE EXCEPTION 'Request is already closed';
  END IF;

  -- Update submission status
  UPDATE public.submissions SET status = 'accepted' WHERE id = p_submission_id;
  
  -- Reject other submissions (optional, but good for clarity)
  UPDATE public.submissions SET status = 'rejected' WHERE request_id = v_request_id AND id != p_submission_id;

  -- Update request status
  UPDATE public.requests SET status = 'closed' WHERE id = v_request_id;

  -- Transfer funds to submission owner
  UPDATE public.profiles SET balance = COALESCE(balance, 0) + v_budget WHERE id = v_submission_owner_id;

  -- Record transaction for submission owner
  INSERT INTO public.transactions (user_id, amount, type, description)
  VALUES (v_submission_owner_id, v_budget, 'request_accepted', '悬赏任务中标奖励');

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
