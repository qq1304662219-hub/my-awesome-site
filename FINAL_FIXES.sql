-- 1. Ensure daily_video_stats table exists
CREATE TABLE IF NOT EXISTS public.daily_video_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id UUID REFERENCES public.videos(id) ON DELETE CASCADE,
    date DATE DEFAULT CURRENT_DATE,
    views INT DEFAULT 0,
    downloads INT DEFAULT 0,
    likes INT DEFAULT 0,
    UNIQUE(video_id, date)
);

ALTER TABLE public.daily_video_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read daily_video_stats"
    ON public.daily_video_stats FOR SELECT
    USING (true);

-- 2. Increment Views RPC
CREATE OR REPLACE FUNCTION increment_views(video_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Increment total views in videos table
    UPDATE videos
    SET views = COALESCE(views, 0) + 1
    WHERE id = video_id;

    -- Upsert daily stats
    INSERT INTO daily_video_stats (video_id, date, views)
    VALUES (video_id, CURRENT_DATE, 1)
    ON CONFLICT (video_id, date)
    DO UPDATE SET views = daily_video_stats.views + 1;
END;
$$;

-- 3. Increment Downloads RPC
CREATE OR REPLACE FUNCTION increment_downloads(video_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Increment total downloads in videos table
    UPDATE videos
    SET downloads = COALESCE(downloads, 0) + 1
    WHERE id = video_id;

    -- Upsert daily stats
    INSERT INTO daily_video_stats (video_id, date, downloads)
    VALUES (video_id, CURRENT_DATE, 1)
    ON CONFLICT (video_id, date)
    DO UPDATE SET downloads = daily_video_stats.downloads + 1;
END;
$$;

-- 4. Tip Author RPC
CREATE OR REPLACE FUNCTION tip_author(p_video_id UUID, p_amount DECIMAL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_author_id UUID;
    v_tipper_id UUID;
    v_current_balance DECIMAL;
BEGIN
    v_tipper_id := auth.uid();
    
    -- Get author id
    SELECT user_id INTO v_author_id FROM videos WHERE id = p_video_id;
    
    IF v_author_id IS NULL THEN
        RAISE EXCEPTION 'Video not found';
    END IF;

    IF v_tipper_id = v_author_id THEN
        RAISE EXCEPTION 'Cannot tip yourself';
    END IF;

    -- Check tipper balance
    SELECT balance INTO v_current_balance FROM profiles WHERE id = v_tipper_id;
    
    IF v_current_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient balance';
    END IF;

    -- Deduct from tipper
    UPDATE profiles 
    SET balance = balance - p_amount 
    WHERE id = v_tipper_id;

    -- Add to author
    UPDATE profiles 
    SET balance = balance + p_amount 
    WHERE id = v_author_id;

    -- Record transaction for tipper
    INSERT INTO transactions (user_id, amount, type, description, status)
    VALUES (v_tipper_id, -p_amount, 'tip_sent', 'Tip for video ' || p_video_id, 'completed');

    -- Record transaction for author
    INSERT INTO transactions (user_id, amount, type, description, status)
    VALUES (v_author_id, p_amount, 'tip_received', 'Tip received for video ' || p_video_id, 'completed');

    -- Notification for author
    INSERT INTO notifications (user_id, actor_id, type, resource_id, resource_type, content, is_read)
    VALUES (v_author_id, v_tipper_id, 'tip', p_video_id, 'video', '收到 ' || p_amount || ' A币打赏', false);

END;
$$;

-- 5. Reject Withdrawal RPC
CREATE OR REPLACE FUNCTION reject_withdrawal(p_withdrawal_id UUID, p_reason TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_amount DECIMAL;
    v_status TEXT;
BEGIN
    -- Get withdrawal info
    SELECT user_id, amount, status INTO v_user_id, v_amount, v_status 
    FROM withdrawals 
    WHERE id = p_withdrawal_id;

    IF v_status != 'pending' THEN
        RAISE EXCEPTION 'Withdrawal is not pending';
    END IF;

    -- Update withdrawal status
    UPDATE withdrawals 
    SET status = 'rejected', rejection_reason = p_reason
    WHERE id = p_withdrawal_id;

    -- Refund balance to user
    UPDATE profiles
    SET balance = balance + v_amount
    WHERE id = v_user_id;

    -- Record refund transaction
    INSERT INTO transactions (user_id, amount, type, description, status)
    VALUES (v_user_id, v_amount, 'refund', 'Withdrawal rejected: ' || p_reason, 'completed');

END;
$$;

-- 6. Get User Daily Stats RPC
CREATE OR REPLACE FUNCTION get_user_daily_stats(p_user_id UUID, p_days INT)
RETURNS TABLE (
    date TEXT,
    views BIGINT,
    downloads BIGINT,
    likes BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        to_char(d.date, 'YYYY-MM-DD') as date,
        SUM(d.views)::BIGINT as views,
        SUM(d.downloads)::BIGINT as downloads,
        SUM(d.likes)::BIGINT as likes
    FROM daily_video_stats d
    JOIN videos v ON d.video_id = v.id
    WHERE v.user_id = p_user_id
    AND d.date > CURRENT_DATE - p_days
    GROUP BY d.date
    ORDER BY d.date;
END;
$$;
